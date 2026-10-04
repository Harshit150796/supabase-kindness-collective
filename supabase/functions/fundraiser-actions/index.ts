// Server-only write path for comments, updates, team invites/accepts and conversation blocking.
// Every user-written text goes through _shared/moderation.ts before it is stored.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { moderate, maskedExcerpt, BLOCKED_EXPLANATION } from '../_shared/moderation.ts';
import { renderNoticeEmail, NOTIFY_SENDER } from '../_shared/email-layout.ts';
import { flushOwnerAlerts } from '../_shared/owner-alerts.ts';

const SITE = 'https://coupondonation.com';
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('comment'), fundraiser_id: z.string().uuid(), body: z.string().min(1).max(1000) }),
  z.object({ action: z.literal('update'), fundraiser_id: z.string().uuid(), title: z.string().min(1).max(140), body: z.string().min(1).max(5000), image_url: z.string().url().max(1000).optional().nullable(), notify_donors: z.boolean().default(false) }),
  z.object({ action: z.literal('invite'), fundraiser_id: z.string().uuid(), email: z.string().email().max(255) }),
  z.object({ action: z.literal('resend_invite'), team_id: z.string().uuid() }),
  z.object({ action: z.literal('accept'), token: z.string().min(20).max(200) }),
  z.object({ action: z.literal('block'), conversation_id: z.string().uuid(), blocked: z.boolean() }),
  z.object({ action: z.literal('admin_notify_rejection'), fundraiser_id: z.string().uuid(), reason: z.string().min(1).max(1000) }),
  z.object({ action: z.literal('notify_coupon_ready'), fundraiser_id: z.string().uuid(), coupon_ids: z.array(z.string().uuid()).min(1).max(50) }),
]);

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendEmail(to: string, email: { subject: string; html: string; text: string }) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [to], ...email }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Please sign in.' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ error: 'Please sign in.' }, 401);
  const uid = u.user.id;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const msg = f.email ? 'Please enter a valid email address.' : f.title ? 'Title must be 1–140 characters.' : f.body ? 'Text is empty or too long.' : 'Please check your input.';
    return json({ error: msg }, 400);
  }
  const p = parsed.data;
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();

  const logBlocked = (fid: string | null, context: string, rules: string[], raw: string) =>
    admin.from('blocked_attempts').insert({ sender_id: uid, fundraiser_id: fid, context, matched_rules: rules, masked_excerpt: maskedExcerpt(raw) });

  const overLimit = async (table: 'fundraiser_comments' | 'fundraiser_updates', col: string, cap: number) => {
    const { count: c1 } = await admin.from(table).select('id', { count: 'exact', head: true }).eq(col, uid).gte('created_at', hourAgo);
    const { count: c2 } = await admin.from('blocked_attempts').select('id', { count: 'exact', head: true }).eq('sender_id', uid).gte('created_at', hourAgo);
    return (c1 ?? 0) + (c2 ?? 0) >= cap || (c2 ?? 0) >= 10;
  };

  if (p.action === 'admin_notify_rejection') {
    // Role re-checked server-side; status must already be rejected via the audited admin RPC.
    const { data: staff } = await admin.rpc('is_admin_staff', { _uid: uid });
    if (!staff) return json({ error: 'Staff access required' }, 403);
    const { data: f } = await admin.from('fundraisers').select('title, status, user_id').eq('id', p.fundraiser_id).maybeSingle();
    if (!f || f.status !== 'rejected') return json({ error: 'Fundraiser is not rejected' }, 409);
    const { data: prof } = await admin.from('profiles').select('email, full_name').eq('user_id', f.user_id).maybeSingle();
    if (!prof?.email) return json({ sent: false, reason: 'no organizer email' });
    const sent = await sendEmail(prof.email, renderNoticeEmail({
      subject: `An update about your fundraiser “${f.title}”`,
      heading: 'An update about your fundraiser',
      intro: `We reviewed “${f.title}” and need a change before it can be published. Our note: ${p.reason}`,
      ctaLabel: 'Review your fundraiser', ctaUrl: `${SITE}/my-fundraisers`,
      footerNote: 'Reply to this email if you have questions.', firstName: prof.full_name?.trim().split(/\s+/)[0],
    }));
    return json({ sent });
  }

  if (p.action === 'notify_coupon_ready') {
    // Same queue as the coupon editor: one alert per coupon + credential version, so repeats never re-notify.
    const { data: staff } = await admin.rpc('is_admin_staff', { _uid: uid });
    if (!staff) return json({ error: 'Staff access required' }, 403);
    const { data: n, error } = await admin.rpc('svc_enqueue_owner_alerts', { _fundraiser_id: p.fundraiser_id, _ids: p.coupon_ids });
    if (error) return json({ error: 'Could not queue the alert' }, 400);
    const r = await flushOwnerAlerts(admin, p.fundraiser_id);
    return json({ sent: r.emailed > 0, queued: n, ...r });
  }

  if (p.action === 'comment') {
    const { data: ok } = await admin.rpc('has_completed_donation', { _fid: p.fundraiser_id, _uid: uid });
    if (!ok) return json({ error: 'Words of support are open to people who have donated to this fundraiser.' }, 403);
    if (await overLimit('fundraiser_comments', 'user_id', 10)) return json({ error: 'Please try again later.' }, 429);
    const m = moderate(p.body);
    if (m.blocked) { await logBlocked(p.fundraiser_id, 'comment', m.blockRules, p.body); return json({ blocked: true, error: BLOCKED_EXPLANATION }, 422); }
    if (!m.text) return json({ error: 'Comment is empty.' }, 400);
    const { data: prof } = await admin.from('profiles').select('full_name').eq('user_id', uid).maybeSingle();
    const { data: dn } = await admin.rpc('short_display_name', { _name: prof?.full_name ?? '' });
    const { data, error } = await admin.from('fundraiser_comments').insert({ fundraiser_id: p.fundraiser_id, user_id: uid, display_name: (dn as string) || 'Supporter', body: m.text }).select().single();
    if (error) return json({ error: 'Could not post' }, 500);
    return json({ comment: data, redacted: m.redactRules.length > 0 });
  }

  if (p.action === 'update') {
    const { data: team } = await admin.rpc('is_fundraiser_team', { _fid: p.fundraiser_id, _uid: uid });
    if (!team) return json({ error: 'Only the fundraiser team can post updates.' }, 403);
    if (await overLimit('fundraiser_updates', 'author_id', 10)) return json({ error: 'Please try again later.' }, 429);
    const mt = moderate(p.title), mb = moderate(p.body);
    if (mt.blocked || mb.blocked) { await logBlocked(p.fundraiser_id, 'update', [...mt.blockRules, ...mb.blockRules], p.body); return json({ blocked: true, error: BLOCKED_EXPLANATION }, 422); }
    const { data, error } = await admin.from('fundraiser_updates').insert({ fundraiser_id: p.fundraiser_id, author_id: uid, title: mt.text, body: mb.text, image_url: p.image_url ?? null, notify_donors: p.notify_donors }).select().single();
    if (error) return json({ error: 'Could not post update' }, 500);
    if (p.notify_donors) {
      const { data: donors } = await admin.from('donations').select('donor_id').eq('fundraiser_id', p.fundraiser_id).in('status', ['completed', 'succeeded']).not('donor_id', 'is', null);
      const ids = Array.from(new Set((donors ?? []).map((d) => d.donor_id as string))).filter((x) => x !== uid);
      if (ids.length) await admin.from('notification_queue').insert(ids.map((r) => ({ recipient_user_id: r, kind: 'update', ref_id: data.id, fundraiser_id: p.fundraiser_id, scheduled_for: new Date().toISOString() })));
    }
    return json({ update: data });
  }

  if (p.action === 'invite') {
    const { data: org } = await admin.rpc('is_fundraiser_organizer', { _fid: p.fundraiser_id, _uid: uid });
    if (!org) return json({ error: 'Only the organizer can invite.' }, 403);
    const email = p.email.toLowerCase().trim();
    const { count } = await admin.from('fundraiser_team').select('id', { count: 'exact', head: true }).eq('fundraiser_id', p.fundraiser_id).neq('status', 'revoked');
    if ((count ?? 0) >= 10) return json({ error: 'A team can have up to 10 people.' }, 400);
    const { data: dup } = await admin.from('fundraiser_team').select('id').eq('fundraiser_id', p.fundraiser_id).eq('invite_email', email).neq('status', 'revoked').maybeSingle();
    if (dup) return json({ error: 'That person is already invited.' }, 409);
    const raw = crypto.randomUUID() + crypto.randomUUID();
    const { error } = await admin.from('fundraiser_team').insert({ fundraiser_id: p.fundraiser_id, invite_email: email, role: 'co_organizer', status: 'pending', invited_by: uid, invite_token_hash: await sha256(raw) });
    if (error) return json({ error: 'Could not invite' }, 500);
    const { data: fr } = await admin.from('fundraisers').select('title').eq('id', p.fundraiser_id).single();
    const sent = await sendEmail(email, renderNoticeEmail({
      subject: `You’re invited to help with “${fr?.title}”`, heading: 'Join a fundraiser team',
      intro: `You've been invited to co-organize "${fr?.title}" on CouponDonation. Sign in with this email address to accept.`,
      ctaLabel: 'Accept invitation', ctaUrl: `${SITE}/team/accept?token=${raw}`,
    }));
    return json({ invited: true, email_sent: sent });
  }

  if (p.action === 'resend_invite') {
    const { data: row } = await admin.from('fundraiser_team').select('id, fundraiser_id, invite_email, status, role').eq('id', p.team_id).maybeSingle();
    if (!row || row.role !== 'co_organizer') return json({ error: 'Invitation not found.' }, 404);
    const { data: org } = await admin.rpc('is_fundraiser_organizer', { _fid: row.fundraiser_id, _uid: uid });
    if (!org) return json({ error: 'Only the organizer can resend invites.' }, 403);
    if (row.status !== 'pending' || !row.invite_email) return json({ error: 'Only pending invitations can be resent.' }, 409);
    const raw = crypto.randomUUID() + crypto.randomUUID();
    await admin.from('fundraiser_team').update({ invite_token_hash: await sha256(raw) }).eq('id', row.id);
    const { data: fr } = await admin.from('fundraisers').select('title').eq('id', row.fundraiser_id).single();
    const sent = await sendEmail(row.invite_email, renderNoticeEmail({
      subject: `A reminder about “${fr?.title}”`, heading: 'Join a fundraiser team',
      intro: `You've been invited to co-organize "${fr?.title}" on CouponDonation. Sign in with this email address to accept.`,
      ctaLabel: 'Accept invitation', ctaUrl: `${SITE}/team/accept?token=${raw}`,
    }));
    return json({ resent: true, email_sent: sent });
  }

  if (p.action === 'accept') {
    const { data: row } = await admin.from('fundraiser_team').select('id, invite_email, status, fundraiser_id').eq('invite_token_hash', await sha256(p.token)).maybeSingle();
    if (!row || row.status !== 'pending') return json({ error: 'This invitation is no longer valid.' }, 404);
    if ((u.user.email ?? '').toLowerCase() !== (row.invite_email ?? '').toLowerCase()) return json({ error: `Please sign in as ${row.invite_email} to accept.` }, 403);
    await admin.from('fundraiser_team').update({ user_id: uid, status: 'accepted', invite_token_hash: null }).eq('id', row.id);
    return json({ accepted: true, fundraiser_id: row.fundraiser_id });
  }

  // block / unblock
  const { data: conv } = await admin.from('conversations').select('id, fundraiser_id').eq('id', p.conversation_id).maybeSingle();
  if (!conv) return json({ error: 'Not found' }, 404);
  const { data: team } = await admin.rpc('is_fundraiser_team', { _fid: conv.fundraiser_id, _uid: uid });
  if (!team) return json({ error: 'Not found' }, 404);
  await admin.from('conversations').update({ status: p.blocked ? 'blocked' : 'open', blocked_by: p.blocked ? uid : null }).eq('id', conv.id);
  return json({ ok: true });
});
