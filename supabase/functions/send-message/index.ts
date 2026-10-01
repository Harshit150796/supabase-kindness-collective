import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { moderate, maskedExcerpt, BLOCKED_EXPLANATION } from '../_shared/moderation.ts';

const MAX_LEN = 2000;
const MAX_NEW_CONVERSATIONS_PER_HOUR = 5;
const MAX_MESSAGES_PER_HOUR = 30;

const Body = z.object({
  fundraiser_id: z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
  body: z.string().min(1).max(MAX_LEN),
}).refine((b) => b.fundraiser_id || b.conversation_id, 'fundraiser_id or conversation_id required');

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Please sign in to send messages.' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: 'Please sign in to send messages.' }, 401);
  const uid = userData.user.id;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const { body } = parsed.data;

  // Resolve conversation
  let conversationId = parsed.data.conversation_id;
  let fundraiserId = parsed.data.fundraiser_id;
  let isTeam = false;

  if (conversationId) {
    const { data: conv } = await admin.from('conversations').select('id, fundraiser_id, supporter_id, status').eq('id', conversationId).maybeSingle();
    if (!conv) return json({ error: 'Conversation not found' }, 404);
    fundraiserId = conv.fundraiser_id;
    const { data: team } = await admin.rpc('is_fundraiser_team', { _fid: conv.fundraiser_id, _uid: uid });
    isTeam = !!team;
    if (conv.supporter_id !== uid && !isTeam) return json({ error: 'Conversation not found' }, 404);
    if (conv.status === 'blocked') return json({ error: 'This conversation has been closed.' }, 403);
  }

  const { data: fr } = await admin.from('fundraisers').select('id, user_id, status, allow_messages').eq('id', fundraiserId!).maybeSingle();
  if (!fr || !['active', 'pending'].includes(fr.status ?? '')) return json({ error: 'Fundraiser not found' }, 404);

  if (!conversationId) {
    const { data: team } = await admin.rpc('is_fundraiser_team', { _fid: fr.id, _uid: uid });
    if (team) return json({ error: 'Organizers reply from their inbox.' }, 400);
    if (!fr.allow_messages) return json({ error: 'This organizer is not accepting messages.' }, 403);
  }

  // Rate limits
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: msgCount } = await admin.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', uid).gte('created_at', hourAgo);
  if ((msgCount ?? 0) >= MAX_MESSAGES_PER_HOUR) return json({ error: 'You’re sending messages too quickly. Please try again later.' }, 429);

  // Safety
  const result = moderate(body);
  if (result.blocked) {
    await admin.from('blocked_attempts').insert({
      sender_id: uid, fundraiser_id: fr.id, conversation_id: conversationId ?? null,
      context: 'message', matched_rules: result.blockRules, masked_excerpt: maskedExcerpt(body),
    });
    return json({ blocked: true, error: BLOCKED_EXPLANATION }, 422);
  }
  if (!result.text) return json({ error: 'Message is empty.' }, 400);

  if (!conversationId) {
    const { data: existing } = await admin.from('conversations').select('id, status').eq('fundraiser_id', fr.id).eq('supporter_id', uid).maybeSingle();
    if (existing) {
      if (existing.status === 'blocked') return json({ error: 'This conversation has been closed.' }, 403);
      conversationId = existing.id;
    } else {
      const { count: convCount } = await admin.from('conversations').select('id', { count: 'exact', head: true }).eq('supporter_id', uid).gte('created_at', hourAgo);
      if ((convCount ?? 0) >= MAX_NEW_CONVERSATIONS_PER_HOUR) return json({ error: 'You’ve started too many conversations. Please try again later.' }, 429);
      const { data: created, error } = await admin.from('conversations').insert({ fundraiser_id: fr.id, supporter_id: uid }).select('id').single();
      if (error) return json({ error: 'Could not start conversation' }, 500);
      conversationId = created.id;
    }
  }

  const { data: msg, error: msgErr } = await admin.from('messages').insert({
    conversation_id: conversationId, sender_id: uid, body: result.text,
    flags: result.redactRules, status: result.redactRules.length ? 'redacted' : 'delivered',
  }).select('id, conversation_id, sender_id, body, flags, status, created_at').single();
  if (msgErr) return json({ error: 'Could not send message' }, 500);

  await admin.from('conversations').update({ last_message_at: msg.created_at }).eq('id', conversationId);
  await admin.from('conversation_reads').upsert({ conversation_id: conversationId, user_id: uid, last_read_at: msg.created_at });

  // Queue throttled email notifications for the other side(s)
  const { data: conv } = await admin.from('conversations').select('supporter_id').eq('id', conversationId).single();
  let recipients: string[] = [];
  if (conv!.supporter_id === uid) {
    const { data: team } = await admin.from('fundraiser_team').select('user_id').eq('fundraiser_id', fr.id).eq('status', 'accepted');
    recipients = Array.from(new Set([fr.user_id, ...(team ?? []).map((t) => t.user_id)])).filter((x): x is string => !!x && x !== uid);
  } else {
    recipients = [conv!.supporter_id];
  }
  if (recipients.length) {
    const scheduled = new Date(Date.now() + 10 * 60_000).toISOString();
    for (const r of recipients) {
      // one pending notification per recipient+conversation; push its time back on new activity
      const { data: pending } = await admin.from('notification_queue').select('id').eq('recipient_user_id', r).eq('ref_id', conversationId).is('sent_at', null).maybeSingle();
      if (pending) await admin.from('notification_queue').update({ scheduled_for: scheduled }).eq('id', pending.id);
      else await admin.from('notification_queue').insert({ recipient_user_id: r, kind: 'message', ref_id: conversationId, fundraiser_id: fr.id, scheduled_for: scheduled });
    }
  }

  return json({ message: msg, redacted: result.redactRules.length > 0 });
});
