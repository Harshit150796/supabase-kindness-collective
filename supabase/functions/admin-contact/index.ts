// The CouponDonation team contacting a fundraiser's organizer from the admin portal (founder request,
// Nov 2026). One action, "send": posts the message in the fundraiser's team thread (the organizer's
// /messages inbox) and/or emails it from support@coupondonation.com. Staff and admins only; every send is
// rate-limited, written to the audit log, and emails go into email_log with their text.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requestUser, UUID_RE, teamRpc } from '../_shared/auth.ts';
import { overLimit, HOUR } from '../_shared/rate-limit.ts';
import { checkTeamMessage, renderTeamEmail, SITE, TEAM_INBOX_ID, TEAM_SENDER } from '../_shared/team-contact.ts';

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
  if (body.action !== 'send') return fail('Unknown action');

  try {
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
