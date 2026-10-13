// A donor's saved cards, stored by Square (Cards on File). We keep only id, brand, last 4 and expiry.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { cardRow, ownsCard } from '../_shared/saved-card.ts';

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const base = () => ((Deno.env.get('SQUARE_ENVIRONMENT') || 'production').toLowerCase() === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com');
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('add'), sourceId: z.string().min(1).max(500), verificationToken: z.string().max(2000).optional() }),
  z.object({ action: z.literal('remove'), cardId: z.string().min(1).max(200), force: z.boolean().optional() }),
  z.object({ action: z.literal('set_monthly_card'), cardId: z.string().min(1).max(200), recurringId: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Please sign in.' }, 401);
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: u } = await db.auth.getUser(jwt);
  const user = u?.user;
  if (!user) return json({ error: 'Please sign in.' }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: 'Invalid request' }, 400);
  const body = parsed.data;
  const sq = { Authorization: `Bearer ${(Deno.env.get('SQUARE_ACCESS_TOKEN') ?? '').trim()}`, 'Square-Version': '2025-01-23', 'Content-Type': 'application/json' };

  const { data: mine } = await db.from('saved_cards').select('id, square_card_id, user_id, brand, last4, exp_month, exp_year, created_at').eq('user_id', user.id).order('created_at');
  const { data: gifts } = await db.from('recurring_donations').select('id, square_card_id, square_subscription_id, status, gift_cents, tip_cents, fee_cents').eq('user_id', user.id).in('status', ['active', 'paused', 'payment_problem', 'pending']);
  const list = () => json({
    cards: (mine ?? []).map((c) => ({ ...c, user_id: undefined, monthly: (gifts ?? []).some((g) => g.square_card_id === c.square_card_id) })),
    gifts: (gifts ?? []).filter((g) => g.square_subscription_id).map((g) => ({ id: g.id, card_id: g.square_card_id, status: g.status, total_cents: g.gift_cents + g.tip_cents + g.fee_cents })),
  });

  if (body.action === 'list') return list();

  if (body.action === 'add') {
    let { data: prof } = await db.from('donor_payment_profiles').select('square_customer_id').eq('user_id', user.id).maybeSingle();
    if (!prof) {
      const r = await fetch(`${base()}/v2/customers`, { method: 'POST', headers: sq, body: JSON.stringify({ idempotency_key: `cust-${user.id}`, email_address: user.email, reference_id: user.id }) });
      const d = await r.json();
      if (!r.ok || !d.customer?.id) { console.error('Square customer error', JSON.stringify(d.errors)); return json({ error: 'Could not save the card. Please try again.' }, 502); }
      await db.from('donor_payment_profiles').insert({ user_id: user.id, square_customer_id: d.customer.id });
      prof = { square_customer_id: d.customer.id };
    }
    const r = await fetch(`${base()}/v2/cards`, { method: 'POST', headers: sq, body: JSON.stringify({
      idempotency_key: crypto.randomUUID(), source_id: body.sourceId,
      ...(body.verificationToken ? { verification_token: body.verificationToken } : {}),
      card: { customer_id: prof.square_customer_id, reference_id: user.id },
    }) });
    const d = await r.json();
    if (!r.ok || !d.card?.id) { console.error('Square card error', JSON.stringify(d.errors)); return json({ error: d.errors?.[0]?.code === 'CARD_DECLINED' ? 'Your card was declined.' : 'Could not save the card. Please check the details.' }, 400); }
    await db.from('saved_cards').insert({ user_id: user.id, ...cardRow(d.card) });
    const { data: fresh } = await db.from('saved_cards').select('*').eq('user_id', user.id).order('created_at');
    return json({ ok: true, cards: (fresh ?? []).map((c) => ({ ...c, user_id: undefined })) });
  }

  if (!ownsCard(mine ?? [], user.id, body.cardId)) return json({ error: 'Card not found.' }, 404);

  if (body.action === 'remove') {
    const using = (gifts ?? []).filter((g) => g.square_card_id === body.cardId && g.status !== 'paused');
    if (using.length && !body.force) return json({ error: 'monthly_in_use', gifts: using.map((g) => g.id) }, 409);
    for (const g of using) {
      if (g.square_subscription_id) await fetch(`${base()}/v2/subscriptions/${g.square_subscription_id}/pause`, { method: 'POST', headers: sq, body: JSON.stringify({ pause_effective_date: new Date().toISOString().slice(0, 10) }) });
      await db.from('recurring_donations').update({ status: 'paused', paused_at: new Date().toISOString(), failure_reason: 'Card removed by donor' }).eq('id', g.id);
    }
    const r = await fetch(`${base()}/v2/cards/${encodeURIComponent(body.cardId)}/disable`, { method: 'POST', headers: sq });
    if (!r.ok && r.status !== 404) { console.error('Square disable failed', r.status); return json({ error: 'Could not remove the card right now.' }, 502); }
    await db.from('saved_cards').delete().eq('square_card_id', body.cardId).eq('user_id', user.id);
    return json({ ok: true });
  }

  // set_monthly_card
  const gift = (gifts ?? []).find((g) => g.id === body.recurringId);
  if (!gift?.square_subscription_id) return json({ error: 'Monthly gift not found.' }, 404);
  const r = await fetch(`${base()}/v2/subscriptions/${gift.square_subscription_id}`, { method: 'PUT', headers: sq, body: JSON.stringify({ subscription: { card_id: body.cardId } }) });
  if (!r.ok) { console.error('Square subscription update failed', r.status, await r.text()); return json({ error: 'Could not switch the card. Please try again.' }, 502); }
  await db.from('recurring_donations').update({ square_card_id: body.cardId }).eq('id', gift.id);
  return json({ ok: true });
});
