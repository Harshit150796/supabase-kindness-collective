// Server-side write path for partner inquiries (anonymous, honeypot + per-IP rate limit),
// contact form messages (anonymous, US-only, honeypot + fill time + per-IP and per-email limits,
// emailed to support@coupondonation.com) and testimonial submissions (signed-in, explicit consent,
// always pending review).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { NOTIFY_SENDER, type RenderedEmail } from '../_shared/email-layout.ts';
import {
  CONTACT_TOPIC_VALUES, MESSAGE_MAX, MESSAGE_MIN, MIN_FILL_MS, PER_EMAIL_PER_DAY, PER_IP_PER_HOUR, SUPPORT_EMAIL, US_REGIONS,
  cleanLine, cleanMessage, normalizeUsPhone, renderContactConfirmation, renderSupportEmail,
} from '../_shared/contact-message.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const clean = (s?: string | null) => (s ?? '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f]/g, ' ').trim();

const Partner = z.object({
  action: z.literal('partner'),
  website: z.string().max(200).optional(), // honeypot
  org_name: z.string().min(2).max(160), org_type: z.string().min(2).max(60),
  contact_name: z.string().min(2).max(120), email: z.string().email().max(255),
  city_state: z.string().max(120).optional().nullable(),
  families_count: z.number().int().min(0).max(100000).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});
const Testimonial = z.object({
  action: z.literal('testimonial'),
  quote: z.string().min(10).max(300), consent: z.literal(true),
  anonymous: z.boolean(), role: z.enum(['donor', 'recipient']),
});
const Contact = z.object({
  action: z.literal('contact'),
  website: z.string().max(200).optional(), // honeypot
  elapsed_ms: z.number().int().min(0).max(864_000_000).optional(),
  name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(255),
  phone: z.string().max(32).optional().nullable(),
  state: z.string().length(2), topic: z.enum(CONTACT_TOPIC_VALUES),
  message: z.string().trim().min(MESSAGE_MIN).max(MESSAGE_MAX),
  page: z.string().max(300).optional().nullable(),
});
const Consent = z.object({
  action: z.literal('consent'),
  email: z.string().trim().email().max(255),
  source: z.enum(['signup', 'contact', 'donate']),
  distinct_id: z.string().max(200).optional().nullable(),
});
const Unsubscribe = z.object({ action: z.literal('followup_unsubscribe'), token: z.string().uuid() });
const Body = z.discriminatedUnion('action', [Partner, Contact, Testimonial, Consent, Unsubscribe]);

async function sendEmail(to: string, replyTo: string, email: RenderedEmail): Promise<'sent' | 'failed' | 'skipped'> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return 'skipped';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: replyTo, to: [to], subject: email.subject, html: email.html, text: email.text }),
    });
    if (!r.ok) console.error('contact email failed', r.status, (await r.text()).slice(0, 300));
    return r.ok ? 'sent' : 'failed';
  } catch (e) {
    console.error('contact email error', e);
    return 'failed';
  }
}

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: 'Please check the form fields.', details: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  if (b.action === 'partner') {
    if (b.website) return json({ ok: true }); // honeypot: silently accept, store nothing
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const ipHash = await sha256(`partner:${ip}`);
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await admin.from('partner_rate_limits').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', hourAgo);
    if ((count ?? 0) >= 3) return json({ error: 'Too many submissions. Please try again in an hour.' }, 429);
    await admin.from('partner_rate_limits').insert({ ip_hash: ipHash });
    const { error } = await admin.from('partner_inquiries').insert({
      org_name: clean(b.org_name), org_type: clean(b.org_type), contact_name: clean(b.contact_name),
      email: b.email.trim().toLowerCase(), city_state: clean(b.city_state) || null,
      families_count: b.families_count ?? null, message: clean(b.message) || null,
    });
    if (error) return json({ error: 'Could not save your inquiry.' }, 500);
    return json({ ok: true });
  }

  if (b.action === 'contact') {
    // Honeypot filled or sent faster than a person could: accept quietly, store and send nothing.
    if (b.website || (b.elapsed_ms ?? MIN_FILL_MS) < MIN_FILL_MS) return json({ ok: true, confirmed: true });
    const name = cleanLine(b.name, 120);
    const email = b.email.trim().toLowerCase();
    const state = b.state.toUpperCase();
    const phone = normalizeUsPhone(b.phone);
    const message = cleanMessage(b.message);
    const fieldErrors: Record<string, string[]> = {};
    if (name.length < 2) fieldErrors.name = ['Enter your name.'];
    if (!US_REGIONS[state]) fieldErrors.state = ['Choose the US state you live in.'];
    if (phone === 'invalid') fieldErrors.phone = ['Enter a 10-digit US number, or leave it blank.'];
    if (message.length < MESSAGE_MIN) fieldErrors.message = ['Write a little more so we can help.'];
    if (Object.keys(fieldErrors).length) return json({ error: 'Please check the form fields.', details: fieldErrors }, 400);

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    const ipHash = await sha256(`contact:${ip}`);
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const dayAgo = new Date(Date.now() - 86400_000).toISOString();
    const [{ count: fromIp }, { count: fromEmail }] = await Promise.all([
      admin.from('contact_rate_limits').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', hourAgo),
      admin.from('contact_messages').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', dayAgo),
    ]);
    if ((fromIp ?? 0) >= PER_IP_PER_HOUR || (fromEmail ?? 0) >= PER_EMAIL_PER_DAY) {
      return json({ error: 'You have sent several messages already. Please try again later, or email support@coupondonation.com.' }, 429);
    }
    await admin.from('contact_rate_limits').insert({ ip_hash: ipHash });

    // A signed-in sender is linked to their account so the team can see who wrote.
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: who } = token ? await admin.auth.getUser(token).catch(() => ({ data: { user: null } })) : { data: { user: null } };
    const userId = who?.user?.id ?? null;
    const page = b.page && b.page.startsWith('/') ? cleanLine(b.page, 300) : null;

    const { data: row, error } = await admin.from('contact_messages').insert({
      name, email, phone, state, topic: b.topic, message, page, user_id: userId,
    }).select('id, created_at').single();
    if (error || !row) { console.error('contact insert failed', error); return json({ error: 'Your message could not be saved. Please try again, or email support@coupondonation.com.' }, 500); }

    const record = { id: row.id, name, email, phone, state, topic: b.topic, message, page, createdAt: row.created_at, signedIn: !!userId };
    const [toSupport, toSender] = await Promise.all([
      sendEmail(SUPPORT_EMAIL, email, renderSupportEmail(record)),
      sendEmail(email, SUPPORT_EMAIL, renderContactConfirmation(record)),
    ]);
    await admin.from('contact_messages').update({ support_email_status: toSupport, confirmation_email_status: toSender }).eq('id', row.id);
    return json({ ok: true, confirmed: toSender === 'sent' });
  }

  if (b.action === 'consent') {
    // Explicit tick only. A later opt-out is never overwritten by a new tick from a stale form.
    const email = b.email.toLowerCase();
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: who } = token ? await admin.auth.getUser(token).catch(() => ({ data: { user: null } })) : { data: { user: null } };
    const userId = who?.user?.email?.toLowerCase() === email ? who.user!.id : null;
    const { data: existing } = await admin.from('visitor_consents').select('id, user_id, posthog_distinct_id').eq('email', email).maybeSingle();
    const patch = {
      email, email_source: b.source, consent_status: 'opted_in', consent_time: new Date().toISOString(), opted_out_at: null,
      user_id: userId ?? existing?.user_id ?? null,
      posthog_distinct_id: userId ?? existing?.posthog_distinct_id ?? (b.distinct_id || null),
      updated_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await admin.from('visitor_consents').update(patch).eq('id', existing.id)
      : await admin.from('visitor_consents').insert(patch);
    if (error) { console.error('consent save failed', error.message); return json({ error: 'Could not save your choice.' }, 500); }
    return json({ ok: true });
  }

  if (b.action === 'followup_unsubscribe') {
    const { data: row } = await admin.from('visitor_consents').update({ consent_status: 'opted_out', opted_out_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('unsubscribe_token', b.token).select('email').maybeSingle();
    if (!row) return json({ success: false }, 404);
    return json({ success: true, email: row.email });
  }

  // Testimonial: signed-in only.
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: u } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  const user = u?.user;
  if (!user) return json({ error: 'Please sign in to share your experience.' }, 401);
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await admin.from('cms_testimonials').select('id', { count: 'exact', head: true }).eq('submitted_by', user.id).gte('created_at', dayAgo);
  if ((count ?? 0) >= 3) return json({ error: 'You have already shared a few notes today. Thank you!' }, 429);
  const { data: prof } = await admin.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
  const parts = clean(prof?.full_name).split(/\s+/).filter(Boolean);
  const name = b.anonymous || !parts.length ? 'Anonymous' : `${parts[0]}${parts[1] ? ` ${parts[parts.length - 1][0]}.` : ''}`;
  const { data: row, error } = await admin.from('cms_testimonials').insert({
    quote: clean(b.quote), name, role: b.role, role_label: b.role === 'donor' ? 'Donor' : 'Recipient',
    verified: false, is_published: false, status: 'pending', submitted_by: user.id,
    is_anonymous: b.anonymous, consent_at: new Date().toISOString(), submitter_role: b.role, display_order: 999,
  }).select('id').single();
  if (error) return json({ error: 'Could not save your note.' }, 500);
  await admin.rpc('admin_auto_task', { _key: `testimonial:${row.id}`, _title: `Review testimonial from ${name}`, _priority: 'low', _type: 'testimonial', _id: row.id, _link: '/admin/testimonials' });
  return json({ ok: true });
});
