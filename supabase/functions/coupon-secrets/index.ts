// Coupon credential save and reveal. Codes/PINs/gift-card numbers are stored plainly in column-locked fields
// (no client SELECT grant); only the owner reveal RPC and this audited staff reveal can read them.
// Actions: admin_save (staff; calls admin_save_coupon_group_v2), owner_reveal (fundraiser owner), admin_reveal (staff, audited).
// Never logs request bodies or credential values.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { validateSecret, type CredType, type PlainSecret } from '../_shared/coupon-validate.ts';
import { flushOwnerAlerts } from '../_shared/owner-alerts.ts';
import { renderOutsideCouponEmail } from '../_shared/outside-coupon-email.ts';
import { NOTIFY_SENDER } from '../_shared/email-layout.ts';

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
  z.object({ action: z.literal('admin_add_outside'), fundraiser_id: z.string().uuid(), brand: z.string().max(80).optional().nullable(),
    value: z.number().positive().max(100000).optional().nullable(), stock_id: z.string().uuid().optional().nullable(),
    code: S.nullable(), pin: S.nullable(), redemption_url: z.string().max(1000).optional().nullable(),
    value_expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), instructions: z.string().max(500).optional().nullable(),
    source_label: z.string().max(120).optional().nullable(),
    donor: z.object({ name: z.string().max(120).optional().nullable(), email: z.string().email().max(254).optional().nullable(), user_id: z.string().uuid().optional().nullable(), anonymous: z.boolean().default(false) }).default({}),
    email_donor: z.boolean().default(true), email_organizer: z.boolean().default(true) }),
  z.object({ action: z.literal('resend_outside_confirmation'), source_id: z.string().uuid() }),
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
    if (p.action === 'admin_add_outside') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      const url = p.redemption_url?.trim() || null;
      if (!p.stock_id && url && !/^https:\/\//i.test(url)) return json({ error: 'The redemption link must start with https://' }, 400);
      const { data, error } = await admin.rpc('admin_add_outside_coupon', { _actor: uid, _fundraiser: p.fundraiser_id, _brand: p.brand ?? null, _value: p.value ?? null,
        _stock: p.stock_id ?? null, _code: p.code ?? null, _pin: p.pin ?? null, _url: url, _expiry: p.value_expires_on || null, _instructions: p.instructions ?? null,
        _source_label: p.source_label ?? null, _donor_name: p.donor.name ?? null, _donor_email: p.donor.email ?? null, _donor_user: p.donor.user_id ?? null, _anon: p.donor.anonymous });
      if (error) return json({ error: error.message }, 400);
      const r = data as { source_id: string; fundraiser_id: string };
      const owner = p.email_organizer ? await flushOwnerAlerts(admin, r.fundraiser_id) : { emailed: 0, notified: 0 };
      const donor = p.email_donor ? await sendOutsideConfirmation(admin, r.source_id, uid, false) : { sent: false };
      return json({ ...r, organizer_emailed: owner.emailed, donor_emailed: donor.sent, donor_error: (donor as { error?: string }).error });
    }

    if (p.action === 'resend_outside_confirmation') {
      if (!(await isStaff())) return json({ error: 'Staff access required' }, 403);
      const r = await sendOutsideConfirmation(admin, p.source_id, uid, true);
      if (!r.sent) return json({ error: r.error ?? 'Could not send' }, 400);
      return json(r);
    }
  } catch (e) {
    console.error('coupon-secrets failure', (e as Error).name);
    return json({ error: 'Could not process the coupon.' }, 500);
  }
  return json({ error: 'Unknown action' }, 400);
});

// Sends the donor confirmation once per source; `resend` lets staff deliberately send it again. Never includes codes.
// deno-lint-ignore no-explicit-any
async function sendOutsideConfirmation(admin: any, sourceId: string, actor: string, resend: boolean): Promise<{ sent: boolean; error?: string }> {
  const { data: s } = await admin.from('coupon_sources').select('id, fundraiser_id, donor_name, donor_email, confirmation_sent_at, confirmation_count').eq('id', sourceId).maybeSingle();
  if (!s) return { sent: false, error: 'Not found' };
  if (!s.donor_email) return { sent: false, error: 'This donor has no email address' };
  if (s.confirmation_sent_at && !resend) return { sent: false, error: 'Already sent' };
  // claim: only one concurrent sender wins
  let claim = admin.from('coupon_sources').update({ confirmation_sent_at: new Date().toISOString(), confirmation_count: (s.confirmation_count ?? 0) + 1 })
    .eq('id', sourceId).eq('confirmation_count', s.confirmation_count ?? 0);
  if (!resend) claim = claim.is('confirmation_sent_at', null);
  const { data: won } = await claim.select('id');
  if (!won?.length) return { sent: false, error: 'Already sent' };
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { sent: false, error: 'Email is not configured' };
  const { data: f } = await admin.from('fundraisers').select('title, unique_slug, id').eq('id', s.fundraiser_id).maybeSingle();
  const { data: c } = await admin.from('coupons').select('store_name, issued_brand').eq('source_id', sourceId).limit(1).maybeSingle();
  const mail = renderOutsideCouponEmail({ donorName: s.donor_name, fundraiserTitle: f?.title ?? 'a fundraiser', brand: c?.issued_brand || c?.store_name || 'coupon',
    fundraiserUrl: `https://coupondonation.com/f/${f?.unique_slug ?? f?.id ?? ''}` });
  const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [s.donor_email], ...mail }) });
  await admin.rpc('svc_admin_log', { _actor: actor, _action: resend ? 'coupon.outside_confirmation_resend' : 'coupon.outside_confirmation', _table: 'coupon_sources', _record: sourceId, _after: { ok: res.ok } });
  if (!res.ok) {
    if (!resend) await admin.from('coupon_sources').update({ confirmation_sent_at: null }).eq('id', sourceId);
    return { sent: false, error: 'The email provider refused the message' };
  }
  return { sent: true };
}
