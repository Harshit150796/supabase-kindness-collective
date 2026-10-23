// Called by the PostHog workflow's webhook step BEFORE the email step (on error: abort).
// Returns 204 only for a real, unused request created by followup-dispatch for this exact recipient and text.
// Also accepts { action: 'stop', nonce, email } after bounces/complaints, to switch that person off.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { contentHash } from '../_shared/followup-rules.ts';
import { isSuppressed, suppress } from '../_shared/suppression.ts';

const Body = z.object({
  action: z.enum(['check', 'stop']).default('check'),
  nonce: z.string().regex(/^[0-9a-f]{64}$/),
  email: z.string().email().max(320),
  subject: z.string().max(300).optional(),
  body: z.string().max(5000).optional(),
});
const res = (s: number, b?: unknown) => new Response(b ? JSON.stringify(b) : null, { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return res(405, { error: 'POST only' });
  let input: z.infer<typeof Body>;
  try { const p = Body.safeParse(await req.json()); if (!p.success) return res(400, { error: 'bad request' }); input = p.data; }
  catch { return res(400, { error: 'bad request' }); }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (input.action === 'stop') {
    const { data: n } = await db.from('followup_nonces').select('send_id, email').eq('nonce', input.nonce).not('used_at', 'is', null).maybeSingle();
    if (!n || n.email.toLowerCase() !== input.email.toLowerCase()) return res(403, { error: 'unknown' });
    const { data: s } = await db.from('followup_sends').select('consent_id').eq('id', n.send_id).single();
    await suppress(db, n.email, 'bounce_or_complaint');
    return res(204);
  }

  if (input.subject === undefined || input.body === undefined) return res(400, { error: 'subject and body required' });
  const hash = await contentHash(input.email, input.subject, input.body);
  const { data: sendId, error } = await db.rpc('followup_use_nonce', { _nonce: input.nonce, _email: input.email, _hash: hash });
  if (error) { console.error('guard rpc failed', error.message); return res(500, { error: 'check failed' }); }
  if (!sendId) return res(403, { error: 'not allowed' });

  const { data: s } = await db.from('followup_sends').select('id, status, consent_id').eq('id', sendId).single();
  const { data: c } = await db.from('visitor_consents').select('consent_status, opted_out_at').eq('id', s!.consent_id).single();
  if (s?.status !== 'queued' || c?.opted_out_at || c?.consent_status !== 'opted_in' || await isSuppressed(db, input.email)) {
    await db.from('followup_sends').update({ status: 'skipped', reason: 'stopped at final check', updated_at: new Date().toISOString() }).eq('id', sendId);
    return res(403, { error: 'not allowed' });
  }
  const now = new Date().toISOString();
  await db.from('followup_sends').update({ status: 'sent', sent_at: now, provider_receipt: `posthog-guard-passed ${now}`, updated_at: now }).eq('id', sendId);
  await db.from('visitor_consents').update({ last_emailed_at: now }).eq('id', s.consent_id);
  return res(204);
});
