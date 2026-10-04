// The only place coupon secrets are encrypted or decrypted. Fails closed when COUPON_SECRET_KEY_V1 is missing.
// Actions: admin_save (staff; encrypts then calls admin_save_coupon_group_v2), owner_reveal (fundraiser owner), admin_reveal (staff, audited).
// Never logs request bodies or plaintext.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { CouponCrypto, KeyMissingError, SECRET_FIELDS, type SecretField } from '../_shared/coupon-crypto.ts';
import { validateSecret, last4Of, type CredType, type PlainSecret } from '../_shared/coupon-validate.ts';
import { flushOwnerAlerts } from '../_shared/owner-alerts.ts';

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const S = z.string().max(200).optional();
const Item = z.object({
  id: z.string().uuid().optional(), value: z.number().positive().max(100000),
  type: z.enum(['code', 'gift_card', 'prepaid_link', 'prepaid_card']).default('code'),
  keep_secret: z.boolean().default(false),
  secret: z.object({ code: S, pin: S, number: S, cvv: S, name: S, zip: S }).default({}),
  redemption_url: z.string().max(1000).optional().nullable(), card_exp: z.string().max(5).optional().nullable(),
  value_expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), instructions: z.string().max(500).optional().nullable(),
  issued_brand: z.string().max(60).optional().nullable(), brand_reason: z.string().max(200).optional().nullable(),
});
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('admin_save'), donation_id: z.string().uuid(), brand: z.string().min(1).max(80), items: z.array(Item).min(1).max(50),
    topup: z.object({ amount: z.number().positive(), reason: z.string().max(300) }).optional().nullable() }),
  z.object({ action: z.literal('owner_reveal'), coupon_id: z.string().uuid() }),
  z.object({ action: z.literal('admin_reveal'), coupon_id: z.string().uuid() }),
  z.object({ action: z.literal('key_status') }),
]);

const vault = new CouponCrypto();
const clean = (s: PlainSecret) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, (v ?? '').trim()]).filter(([, v]) => v)) as PlainSecret;

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
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: 'Please check the coupon details.' }, 400);
  const p = parsed.data;
  const isStaff = async () => !!(await admin.rpc('is_admin_staff', { _uid: uid })).data;

  try {
    if (p.action === 'key_status') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      return json({ configured: !!vault.currentKid() });
    }

    if (p.action === 'admin_save') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      const { data: st } = await admin.from('admin_settings').select('allow_manual_prepaid').eq('id', 1).maybeSingle();
      const manual = !!st?.allow_manual_prepaid;
      const items = [];
      for (const [i, it] of p.items.entries()) {
        const s = clean(it.secret);
        const url = it.redemption_url?.trim() || null;
        const newCred = !it.keep_secret && (Object.keys(s).length > 0 || (it.type === 'prepaid_link' && url));
        if (!manual && (it.type === 'prepaid_card' || s.cvv) && !it.keep_secret)
          return json({ error: 'Manual prepaid card entry is turned off (PCI scope). Use “Prepaid card — hosted link” instead.' }, 403);
        let secret: Record<string, string> = {};
        let last4: string | null = null;
        if (newCred) {
          const err = validateSecret(it.type as CredType, s, { url, card_exp: it.card_exp });
          if (err) return json({ error: `Coupon ${i + 1}: ${err}` }, 400);
          if (it.type !== 'prepaid_link') {
            if (!vault.currentKid()) throw new KeyMissingError();
            for (const f of SECRET_FIELDS) if (s[f]) secret[f] = await vault.encrypt(f as SecretField, f === 'number' ? s[f]!.replace(/[\s-]/g, '') : s[f]!);
            last4 = last4Of(it.type as CredType, s);
          }
        }
        items.push({ id: it.id, value: Math.round(it.value * 100) / 100, type: it.type, keep_secret: it.keep_secret, secret, last4,
          redemption_url: newCred ? url : null, card_exp: it.type === 'prepaid_card' ? it.card_exp : null,
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
      const m = meta as Record<string, unknown>;
      let secrets = {};
      if (m.encrypted) {
        const { data: row } = await admin.from('coupons').select('secret_cipher').eq('id', p.coupon_id).single();
        secrets = await vault.decryptAll(row?.secret_cipher ?? null);
      }
      return json({ ...m, secrets });
    }

    if (p.action === 'admin_reveal') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      const { data: row } = await admin.from('coupons').select('id, code, redemption_url, secret_cipher, credential_type, card_exp, card_last4').eq('id', p.coupon_id).maybeSingle();
      if (!row) return json({ error: 'Coupon not found' }, 404);
      const secrets = await vault.decryptAll(row.secret_cipher);
      await admin.rpc('svc_admin_log', { _actor: uid, _action: 'coupon.reveal', _table: 'coupons', _record: row.id,
        _after: { type: row.credential_type ?? 'code', card: row.card_last4 ? `•••• ${row.card_last4}` : null, fields: Object.keys(secrets) } });
      return json({ code: row.code, redemption_url: row.redemption_url, type: row.credential_type ?? 'code', card_exp: row.card_exp, secrets });
    }
  } catch (e) {
    if (e instanceof KeyMissingError) return json({ error: 'Encryption key not configured. Ask an admin to add COUPON_SECRET_KEY_V1; nothing was saved.' }, 503);
    console.error('coupon-secrets failure', (e as Error).name);
    return json({ error: 'Could not process coupon secrets.' }, 500);
  }
  return json({ error: 'Unknown action' }, 400);
});
