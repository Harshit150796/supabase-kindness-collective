// The CouponDonation team contacting a fundraiser's organizer from the admin portal (founder request,
// Nov 2026). One action, "send": posts the message in the fundraiser's team thread (the organizer's
// /messages inbox) and/or emails it from support@coupondonation.com. Staff and admins only; every send is
// rate-limited, written to the audit log, and emails go into email_log with their text.
// Since Nov 15, 2026 (Admin > Emails): "send" can also email one person directly (an account or an address,
// no fundraiser), and the team can see, preview, test and switch the automatic emails
// ("automations", "set_automation", "preview", "test").
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requestUser, UUID_RE, teamRpc } from '../_shared/auth.ts';
import { overLimit, HOUR } from '../_shared/rate-limit.ts';
import { checkTeamMessage, renderTeamEmail, SITE, TEAM_INBOX_ID, TEAM_SENDER } from '../_shared/team-contact.ts';
import { sampleEmail } from '../_shared/email-catalog.ts';
import { NOTIFY_SENDER } from '../_shared/email-layout.ts';

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i;
const AUTOMATION_KEYS = ['organizer_gift', 'organizer_nudge', 'organizer_week', 'organizer_halfway', 'organizer_goal', 'organizer_quiet'];

async function resend(key: string, payload: Record<string, unknown>): Promise<{ ok: boolean; id: string | null; raw: string; status: number }> {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const raw = await r.text();
  let id: string | null = null;
  if (r.ok) { try { id = (JSON.parse(raw) as { id?: string }).id ?? null; } catch { id = null; } }
  return { ok: r.ok, id, raw, status: r.status };
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail('Method not allowed', 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const user = await requestUser(req, admin);
  if (!user) return fail('Please sign in first.', 401);
  if (!(await teamRpc(req, 'is_admin_staff', { _uid: user.id }))) return fail('Staff access required', 403);
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action ?? '');

  try {
    // ---- Automatic emails: what is on, and how many went out ----
    if (action === 'automations') {
      const { data: rows } = await admin.from('email_automations').select('key, enabled, enabled_at, updated_at');
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data: sent } = await admin.from('account_emails').select('kind, status, sent_at').gte('claimed_at', since).limit(10000);
      const counts: Record<string, { sent: number; skipped: number; failed: number; last: string | null }> = {};
      for (const m of (sent ?? []) as { kind: string; status: string; sent_at: string | null }[]) {
        const c = counts[m.kind] ??= { sent: 0, skipped: 0, failed: 0, last: null };
        if (m.status === 'sent') { c.sent++; if (m.sent_at && (!c.last || m.sent_at > c.last)) c.last = m.sent_at; }
        else if (m.status === 'skipped') c.skipped++;
        else if (m.status === 'failed') c.failed++;
      }
      return json({ ok: true, switches: rows ?? [], counts });
    }
    if (action === 'set_automation') {
      const key = String(body.key ?? '');
      if (!AUTOMATION_KEYS.includes(key) || typeof body.enabled !== 'boolean') return fail('Unknown email.');
      const { data: before } = await admin.from('email_automations').select('enabled').eq('key', key).maybeSingle();
      // Turning one on starts fresh: nothing that happened while it was off is emailed late.
      const patch = { enabled: body.enabled, updated_at: new Date().toISOString(), updated_by: user.id, ...(body.enabled && !before?.enabled ? { enabled_at: new Date().toISOString() } : {}) };
      const { error } = await admin.from('email_automations').upsert({ key, ...patch }, { onConflict: 'key' });
      if (error) { console.error('set_automation', error); return fail('Could not save. Please try again.', 500); }
      await admin.from('admin_audit_log').insert({ actor_id: user.id, action: 'email.automation', table_name: 'email_automations', before: { key, enabled: before?.enabled ?? null }, after: { key, enabled: body.enabled } });
      return json({ ok: true });
    }
    if (action === 'preview' || action === 'test') {
      const mail = sampleEmail(String(body.key ?? ''));
      if (!mail) return fail('Unknown email.');
      if (action === 'preview') return json({ ok: true, subject: mail.subject, html: mail.html, text: mail.text });
      const to = (user.email ?? '').trim();
      const key = Deno.env.get('RESEND_API_KEY');
      if (!to) return fail('Your account has no email address.');
      if (!key) return fail('Email sending is not set up.');
      if (await overLimit(admin, 'admin-contact-test', user.id, 30, HOUR)) return fail('Too many test emails in an hour. Please wait a little.', 429);
      const r = await resend(key, { from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [to], subject: `[Test] ${mail.subject}`, html: mail.html, text: mail.text });
      if (!r.ok) { console.error('test email', r.status, r.raw); return fail('The test could not be sent. Please try again.', 502); }
      return json({ ok: true, to });
    }
    if (action !== 'send') return fail('Unknown action');

    // ---- An email to one person (no fundraiser): an account, or any address ----
    if (!body.fundraiser_id) {
      const uid = String(body.user_id ?? '');
      const typed = String(body.to_email ?? '').trim().toLowerCase();
      if (!UUID_RE.test(uid) && !EMAIL_RE.test(typed)) return fail('Choose who to write to.');
      const m = checkTeamMessage(body.subject, body.body, true);
      if (!m.ok) return fail(m.error);
      if (await overLimit(admin, 'admin-contact', user.id, 60, HOUR)) return fail('Too many messages in an hour. Please wait a little.', 429);
      const { data: person } = UUID_RE.test(uid) ? await admin.from('profiles').select('user_id, email, full_name').eq('user_id', uid).maybeSingle() : { data: null };
      const to = (person?.email ?? typed).trim().toLowerCase();
      if (!EMAIL_RE.test(to)) return fail('That person has no email address on file.');
      const key = Deno.env.get('RESEND_API_KEY');
      if (!key) return fail('Email sending is not set up.');
      const mail = renderTeamEmail({ subject: m.value.subject, body: m.value.body, name: person?.full_name, replyUrl: null });
      const r = await resend(key, { from: TEAM_SENDER.from, reply_to: TEAM_SENDER.replyTo, to: [to], subject: mail.subject, html: mail.html, text: mail.text });
      if (!r.ok) { console.error('team email', r.status, r.raw); return fail('The email could not be sent. Please try again.', 502); }
      await admin.from('email_log').insert({ resend_id: r.id, to_email: to, to_user_id: person?.user_id ?? null, from_email: TEAM_SENDER.from,
        subject: mail.subject, category: 'team', last_event: 'sent', sent_by: user.id, body: m.value.body });
      await admin.from('admin_audit_log').insert({ actor_id: user.id, action: 'person.contact', table_name: 'profiles', record_id: person?.user_id ?? null,
        after: { email: true, emailed: true, subject: m.value.subject, to: person?.user_id ? null : to } });
      return json({ ok: true, emailed: true, to });
    }

    const fid = String(body.fundraiser_id ?? '');
    if (!UUID_RE.test(fid)) return fail('Choose a fundraiser.');
    const inbox = body.post_inbox !== false;
    const email = body.send_email === true;
    if (!inbox && !email) return fail('Choose the inbox, email or both.');
    const m = checkTeamMessage(body.subject, body.body, email);
    if (!m.ok) return fail(m.error);
    if (await overLimit(admin, 'admin-contact', user.id, 60, HOUR)) return fail('Too many messages in an hour. Please wait a little.', 429);

    const { data: fr } = await admin.from('fundraisers').select('id, title, user_id').eq('id', fid).maybeSingle();
    if (!fr) return fail('Fundraiser not found', 404);
    const { data: owner } = await admin.from('profiles').select('email, full_name').eq('user_id', fr.user_id).maybeSingle();

    // 1) The inbox: one team thread per fundraiser.
    let conversationId: string | null = null;
    let messageId: string | null = null;
    if (inbox) {
      const { data: existing } = await admin.from('conversations').select('id, status').eq('fundraiser_id', fid).eq('kind', 'team').maybeSingle();
      if (existing) {
        conversationId = existing.id;
        if (existing.status !== 'open') await admin.from('conversations').update({ status: 'open' }).eq('id', existing.id);
      } else {
        const { data: created, error } = await admin.from('conversations')
          .insert({ fundraiser_id: fid, supporter_id: TEAM_INBOX_ID, kind: 'team' }).select('id').single();
        if (error) {
          // Two staff starting the thread at once: use the one that won.
          const { data: again } = await admin.from('conversations').select('id').eq('fundraiser_id', fid).eq('kind', 'team').maybeSingle();
          if (!again) { console.error('team thread', error); return fail('Could not start the conversation. Please try again.', 500); }
          conversationId = again.id;
        } else conversationId = created.id;
      }
      const { data: msg, error: msgErr } = await admin.from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, body: m.value.body, flags: [], status: 'delivered' })
        .select('id, created_at').single();
      if (msgErr) { console.error('team message', msgErr); return fail('Could not send the message. Please try again.', 500); }
      messageId = msg.id;
      await admin.from('conversations').update({ last_message_at: msg.created_at }).eq('id', conversationId);
      // Without an email copy, the organizer gets the usual "new message" notice (throttled, respects their setting).
      if (!email) {
        const scheduled = new Date(Date.now() + 10 * 60_000).toISOString();
        const { data: pending } = await admin.from('notification_queue').select('id').eq('recipient_user_id', fr.user_id).eq('ref_id', conversationId).is('sent_at', null).maybeSingle();
        if (pending) await admin.from('notification_queue').update({ scheduled_for: scheduled }).eq('id', pending.id);
        else await admin.from('notification_queue').insert({ recipient_user_id: fr.user_id, kind: 'team_message', ref_id: conversationId, fundraiser_id: fid, scheduled_for: scheduled });
      }
    }

    // 2) The email copy, from support@ so replies reach a person.
    let emailed = false;
    let emailError: string | undefined;
    if (email) {
      const to = (owner?.email ?? '').trim();
      const key = Deno.env.get('RESEND_API_KEY');
      if (!to) emailError = 'The organizer has no email address on file.';
      else if (!key) emailError = 'Email sending is not set up.';
      else {
        const mail = renderTeamEmail({ subject: m.value.subject, body: m.value.body, name: owner?.full_name, fundraiserTitle: fr.title,
          replyUrl: conversationId ? `${SITE}/messages?c=${conversationId}` : null });
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: TEAM_SENDER.from, reply_to: TEAM_SENDER.replyTo, to: [to], subject: mail.subject, html: mail.html, text: mail.text }),
        });
        const t = await r.text();
        if (!r.ok) { console.error('team email', r.status, t); emailError = 'The email could not be sent. Please try again.'; }
        else {
          emailed = true;
          const resendId = (JSON.parse(t) as { id?: string }).id ?? null;
          await admin.from('email_log').insert({ resend_id: resendId, to_email: to.toLowerCase(), to_user_id: fr.user_id, from_email: TEAM_SENDER.from,
            subject: mail.subject, category: 'team', last_event: 'sent', fundraiser_id: fid, conversation_id: conversationId, sent_by: user.id, body: m.value.body });
          // The email already carries the message; don't send the "new message" notice too.
          if (conversationId) await admin.from('notification_queue').delete().eq('recipient_user_id', fr.user_id).eq('ref_id', conversationId).is('sent_at', null);
        }
      }
    }

    await admin.from('admin_audit_log').insert({ actor_id: user.id, action: 'organizer.contact', table_name: 'fundraisers', record_id: fid,
      after: { inbox, email, emailed, subject: m.value.subject || null, conversation_id: conversationId, message_id: messageId } });
    if (!messageId && !emailed) return fail(emailError ?? 'Nothing was sent.', 502);
    return json({ ok: true, conversation_id: conversationId, message_id: messageId, emailed, email_error: emailError });
  } catch (e) {
    console.error('admin-contact', e);
    return fail('Something went wrong. Please try again.', 500);
  }
});
