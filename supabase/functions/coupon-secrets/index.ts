// Coupon credential save and reveal. Codes/PINs/gift-card numbers are stored plainly in column-locked fields
// (no client SELECT grant); only the owner reveal RPC and this audited staff reveal can read them.
// Actions: admin_save (staff; calls admin_save_coupon_group_v2), owner_reveal (fundraiser owner), admin_reveal (staff, audited).
// Never logs request bodies or credential values.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { validateSecret, type CredType, type PlainSecret } from '../_shared/coupon-validate.ts';
import { flushOwnerAlerts } from '../_shared/owner-alerts.ts';

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const S = z.string().max(200).optional();
const Item = z.object({
  id: z.string().uuid().optional(), value: z.number().positive().max(100000),
  type: z.enum(['code', 'gift_card', 'prepaid_link']).default('code'),
  keep_secret: z.boolean().default(false),
  secret: z.object({ code: S, pin: S, number: S }).strict().default({}),
  redemption_url: z.string().max(1000).optional().nullable(),
  value_expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), instructions: z.string().max(500).optional().nullable(),
  issued_brand: z.string().max(60).optional().nullable(), brand_reason: z.string().max(200).optional().nullable(),
}).strict();
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('admin_save'), donation_id: z.string().uuid(), brand: z.string().min(1).max(80), items: z.array(Item).min(1).max(50),
    topup: z.object({ amount: z.number().positive(), reason: z.string().max(300) }).optional().nullable() }),
  z.object({ action: z.literal('owner_reveal'), coupon_id: z.string().uuid() }),
  z.object({ action: z.literal('admin_reveal'), coupon_id: z.string().uuid() }),
]);

const clean = (s: PlainSecret) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, (v ?? '').trim()]).filter(([, v]) => v)) as PlainSecret;
const secretsOf = (type: string | null, code: string | null, pin: string | null) =>
  type === 'gift_card' ? { number: code ?? undefined, pin: pin ?? undefined } : { code: code ?? undefined, pin: pin ?? undefined };
const PREPAID_REFUSED = 'Prepaid card numbers and CVVs are not accepted. Use “Prepaid card — hosted link”.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Please sign in.' }, 401);
  const URL_ = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return json({ error: 'Please sign in.' }, 401);
  const uid = u.user.id;
  const raw = await req.json().catch(() => ({}));
  if (JSON.stringify(raw?.items ?? []).match(/"(cvv|card_exp|name|zip)"|"prepaid_card"/)) return json({ error: PREPAID_REFUSED }, 400);
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: 'Please check the coupon details.' }, 400);
  const p = parsed.data;
  const isStaff = async () => !!(await admin.rpc('is_admin_staff', { _uid: uid })).data;

  try {
    if (p.action === 'admin_save') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      const items = [];
      for (const [i, it] of p.items.entries()) {
        const s = clean(it.secret);
        const url = it.redemption_url?.trim() || null;
        const newCred = !it.keep_secret && (Object.keys(s).length > 0 || (it.type === 'prepaid_link' && !!url));
        if (newCred) {
          const err = validateSecret(it.type as CredType, s, { url });
          if (err) return json({ error: `Coupon ${i + 1}: ${err}` }, 400);
        }
        items.push({ id: it.id, value: Math.round(it.value * 100) / 100, type: it.type, keep_secret: it.keep_secret, secret: newCred ? s : {},
          redemption_url: newCred ? url : null,
          value_expires_on: it.value_expires_on || null, instructions: it.instructions?.trim() || null,
          issued_brand: it.issued_brand?.trim() || null, brand_reason: it.brand_reason?.trim() || null });
      }
      const { data, error } = await admin.rpc('admin_save_coupon_group_v2', { _actor: uid, _donation_id: p.donation_id, _brand: p.brand, _items: items, _topup: p.topup ?? null });
      if (error) return json({ error: error.message }, 400);
      const r = data as { changed: string[]; fundraiser_id: string };
      const sent = r.changed?.length ? await flushOwnerAlerts(admin, r.fundraiser_id) : { emailed: 0, notified: 0 };
      return json({ ...r, ...sent });
    }

    if (p.action === 'owner_reveal') {
      // Permission, first-reveal record, reveal log and donor email queue all happen in the owner RPC under the caller's identity.
      const userClient = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
      const { data: meta, error } = await userClient.rpc('owner_reveal_coupon', { _coupon_id: p.coupon_id });
      if (error) return json({ error: error.message }, 403);
      const m = meta as Record<string, string | null>;
      return json({ ...m, secrets: secretsOf(m.type, m.code, m.pin) });
    }

    if (p.action === 'admin_reveal') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      const { data: row } = await admin.from('coupons').select('id, code, code_pin, redemption_url, credential_type, card_last4').eq('id', p.coupon_id).maybeSingle();
      if (!row) return json({ error: 'Coupon not found' }, 404);
      await admin.rpc('svc_admin_log', { _actor: uid, _action: 'coupon.reveal', _table: 'coupons', _record: row.id,
        _after: { type: row.credential_type ?? 'code', credential: row.card_last4 ? `•••• ${row.card_last4}` : null } });
      return json({ code: row.code, redemption_url: row.redemption_url, type: row.credential_type ?? 'code', secrets: secretsOf(row.credential_type, row.code, row.code_pin) });
    }
  } catch (e) {
    console.error('coupon-secrets failure', (e as Error).name);
    return json({ error: 'Could not process the coupon.' }, 500);
  }
  return json({ error: 'Unknown action' }, 400);
});
