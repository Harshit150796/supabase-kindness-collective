// Cancel, pause or resume a monthly gift. Donors act on their own gifts; admins on any (audited).
// Clients can't write recurring_donations; ownership and staff access are checked here.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const Body = z.object({ action: z.enum(['cancel', 'pause', 'resume']), id: z.string().uuid() });
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
  const { action, id } = parsed.data;
  const { data: row } = await admin.from('recurring_donations').select('id, user_id, square_subscription_id, status').eq('id', id).maybeSingle();
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: u.user.id, _role: 'admin' });
  if (!row || (row.user_id !== u.user.id && !isAdmin)) return json({ error: 'Not found' }, 404);
  if (row.status === 'canceled') return json({ ok: true });

  if (row.square_subscription_id) {
    const today = new Date().toISOString().slice(0, 10);
    const path = action === 'cancel' ? 'cancel' : action === 'pause' ? 'pause' : 'resume';
    const payload = action === 'pause' ? { pause_effective_date: today } : action === 'resume' ? { resume_effective_date: today } : {};
    const res = await fetch(`${base()}/v2/subscriptions/${row.square_subscription_id}/${path}`, {
      method: 'POST', headers: { Authorization: `Bearer ${(Deno.env.get('SQUARE_ACCESS_TOKEN') ?? '').trim()}`, 'Square-Version': '2025-01-23', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { console.error(`Square ${action} failed`, res.status, await res.text()); return json({ error: `Could not ${action} right now. Please try again.` }, 502); }
  } else if (action !== 'cancel') {
    return json({ error: 'This gift has not started in Square yet.' }, 409);
  }
  const now = new Date().toISOString();
  const patch = action === 'cancel' ? { status: 'canceled', canceled_at: now }
    : action === 'pause' ? { status: 'paused', paused_at: now } : { status: 'active', paused_at: null };
  await admin.from('recurring_donations').update(patch).eq('id', row.id);
  if (isAdmin && row.user_id !== u.user.id) {
    await admin.from('admin_audit_log').insert({ admin_id: u.user.id, action: `monthly_gift_${action}`, target_type: 'recurring_donation', target_id: row.id, details: { previous_status: row.status } });
  }
  return json({ ok: true });
});
