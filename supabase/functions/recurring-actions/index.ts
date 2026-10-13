// Donor cancels their own monthly gift. Clients can't write recurring_donations; this checks ownership.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const Body = z.object({ action: z.literal('cancel'), id: z.string().uuid() });
const base = () => ((Deno.env.get('SQUARE_ENVIRONMENT') || 'production').toLowerCase() === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Please sign in.' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: 'Please sign in.' }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: 'Invalid request' }, 400);
  const { data: row } = await admin.from('recurring_donations').select('id, user_id, square_subscription_id, status').eq('id', parsed.data.id).maybeSingle();
  if (!row || row.user_id !== u.user.id) return json({ error: 'Not found' }, 404);
  if (row.status === 'canceled') return json({ ok: true });
  if (row.square_subscription_id) {
    const res = await fetch(`${base()}/v2/subscriptions/${row.square_subscription_id}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${(Deno.env.get('SQUARE_ACCESS_TOKEN') ?? '').trim()}`, 'Square-Version': '2025-01-23', 'Content-Type': 'application/json' },
    });
    if (!res.ok) { console.error('Square cancel failed', res.status); return json({ error: 'Could not cancel right now. Please try again.' }, 502); }
  }
  await admin.from('recurring_donations').update({ status: 'canceled', canceled_at: new Date().toISOString() }).eq('id', row.id);
  return json({ ok: true });
});
