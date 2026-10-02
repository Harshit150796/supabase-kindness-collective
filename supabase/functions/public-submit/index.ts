// Server-side write path for partner inquiries (anonymous, honeypot + per-IP rate limit)
// and testimonial submissions (signed-in, explicit consent, always pending review).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

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
const Body = z.discriminatedUnion('action', [Partner, Testimonial]);

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
