// Fast path for the donation confirmation email, called by the success page with its checkout
// reference. The server looks the donation up itself; nothing from the URL (amount, name) is used.
// Exactly once is shared with the 5-minute dispatcher through claim_account_email.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { processAccountEmail } from '../_shared/account-emails.ts';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const Body = z.object({ ref: z.string().regex(/^[A-Za-z0-9_\-]{8,255}$/) });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: 'Invalid reference' }, 400);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const ref = parsed.data.ref;
  const { data: d } = await admin.from('donations').select('id')
    .or(`stripe_session_id.eq.${ref},stripe_payment_intent_id.eq.${ref}`).in('status', ['completed', 'succeeded']).limit(1).maybeSingle();
  // Not completed yet (or unknown): do nothing; the dispatcher will confirm it later.
  if (!d) return json({ ok: true, result: 'not_ready' });
  const result = await processAccountEmail(admin, Deno.env.get('RESEND_API_KEY'), 'donation_confirmation', d.id, 'fast-path');
  return json({ ok: true, result: result === 'sent' || result === 'not_due' ? 'done' : 'pending' });
});
