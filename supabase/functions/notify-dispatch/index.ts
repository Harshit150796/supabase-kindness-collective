// Sends due, throttled notification emails from notification_queue (one per recipient+thread).
// Safe to call publicly: it only delivers items already due; respects opt-outs.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { renderNoticeEmail, NOTIFY_SENDER } from '../_shared/email-layout.ts';

const SITE = 'https://coupondonation.com';
const SUPA = Deno.env.get('SUPABASE_URL')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(SUPA, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // Only the scheduled dispatcher may trigger sends (secret lives in Supabase Vault).
  const { data: ok } = await admin.rpc('dispatch_secret_ok', { _s: req.headers.get('x-dispatch-secret') });
  if (!ok) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const key = Deno.env.get('RESEND_API_KEY');
  const { data: due } = await admin.from('notification_queue').select('*').is('sent_at', null).lte('scheduled_for', new Date().toISOString()).limit(50);
  let sent = 0, skipped = 0;
  for (const n of due ?? []) {
    const mark = () => admin.from('notification_queue').update({ sent_at: new Date().toISOString() }).eq('id', n.id);
    const { data: pref } = await admin.from('messaging_preferences').select('email_notifications').eq('user_id', n.recipient_user_id).maybeSingle();
    const { data: prof } = await admin.from('profiles').select('email, full_name').eq('user_id', n.recipient_user_id).maybeSingle();
    const email = prof?.email;
    if (!email || pref?.email_notifications === false || !key) { await mark(); skipped++; continue; }
    const { data: fr } = await admin.from('fundraisers').select('title, unique_slug').eq('id', n.fundraiser_id).maybeSingle();
    const isTeam = n.kind === 'team_message';
    const isMsg = n.kind === 'message' || isTeam;
    const mail = renderNoticeEmail({
      subject: isTeam ? 'A message from the CouponDonation team' : isMsg ? 'A new message is waiting' : 'A fundraiser posted an update',
      heading: isTeam ? 'The CouponDonation team sent you a message' : isMsg ? 'You have a new message' : 'A fundraiser you support posted an update',
      intro: isTeam ? `We sent you a message about your fundraiser "${fr?.title ?? ''}". Open your messages on CouponDonation to read it and reply.`
        : isMsg ? 'Someone sent you a message on CouponDonation. For your safety, the message is only shown on the site.' : `The organizer of "${fr?.title}" shared a new update.`,
      ctaLabel: isMsg ? 'Open messages' : 'Read the update',
      ctaUrl: isMsg ? `${SITE}/messages?c=${n.ref_id}` : `${SITE}/f/${fr?.unique_slug ?? ''}`,
      footerNote: 'You can turn account notification emails off in Settings.',
      firstName: prof.full_name?.trim().split(/\s+/)[0],
    });
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [email], ...mail }),
    });
    if (r.ok) { await mark(); sent++; } else console.error('resend failed', n.id, r.status, await r.text());
  }
  return new Response(JSON.stringify({ due: due?.length ?? 0, sent, skipped }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
