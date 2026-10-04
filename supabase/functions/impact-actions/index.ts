// Proof-of-impact server actions: mark used (moderated note), private receipt upload,
// short-lived receipt URLs, guest impact view by hashed token, one-click impact-email opt-out,
// and one polite receipt request per coupon (through send-message, so moderation/rate limits/blocks apply).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { moderate, maskedExcerpt, BLOCKED_EXPLANATION } from '../_shared/moderation.ts';
import { inspectImage } from '../_shared/image-meta.ts';

const SUPA = Deno.env.get('SUPABASE_URL')!;
const BUCKET = 'coupon-receipts';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPTS = 3;
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const CATEGORIES = ['Groceries', 'Meals', 'Baby supplies', 'Household', 'Transportation', 'Health', 'Other'] as const;
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('mark_used'), coupon_id: z.string().uuid(), category: z.enum(CATEGORIES).nullable().optional(), note: z.string().max(140).nullable().optional() }),
  z.object({ action: z.literal('upload_receipt'), coupon_id: z.string().uuid(), data_base64: z.string().min(10).max(7_500_000), width: z.number().int().positive().max(4000).optional(), height: z.number().int().positive().max(4000).optional() }),
  z.object({ action: z.literal('receipt_urls'), coupon_id: z.string().uuid(), token: z.string().min(20).max(200).optional() }),
  z.object({ action: z.literal('guest_view'), token: z.string().min(20).max(200) }),
  z.object({ action: z.literal('ask_receipt'), coupon_id: z.string().uuid() }),
]);

export async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const b64ToBytes = (s: string) => Uint8Array.from(atob(s.replace(/^data:[^,]+,/, '')), (c) => c.charCodeAt(0));
const maskEmail = (e: string | null) => { if (!e) return null; const [u, d] = e.split('@'); return `${u.slice(0, 1)}${'•'.repeat(Math.max(1, u.length - 1))}@${d}`; };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(SUPA, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // One-click "Stop impact emails" (GET link in every impact email).
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('stop')) {
    const did = (await admin.rpc('_impact_token_donation', { _hash: await sha256(url.searchParams.get('stop')!) })).data as string | null;
    let ok = false;
    if (did) {
      const { data: d } = await admin.from('donations').select('donor_email, donor_id').eq('id', did).maybeSingle();
      let email = d?.donor_email ?? null;
      if (!email && d?.donor_id) email = (await admin.from('profiles').select('email').eq('user_id', d.donor_id).maybeSingle()).data?.email ?? null;
      if (email) { await admin.from('impact_email_optouts').upsert({ email: email.toLowerCase() }, { onConflict: 'email', ignoreDuplicates: true }); ok = true; }
    }
    const msg = ok ? 'You won’t receive impact emails from CouponDonation any more. Your impact page still works.' : 'This link has expired. Email connect@coupondonation.com and we’ll stop impact emails for you.';
    return new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Impact emails</title><body style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:520px;margin:64px auto;padding:0 20px;color:#13201a"><p style="font-weight:700"><span style="color:#2e7d32">Coupon</span><span style="color:#1565c0">Donation</span></p><h1 style="font-family:Georgia,serif;font-weight:400">${ok ? 'Impact emails stopped' : 'Link expired'}</h1><p>${msg}</p></body>`, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: 'Please check your input.' }, 400);
  const p = parsed.data;

  const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const { data: u } = bearer ? await admin.auth.getUser(bearer) : { data: { user: null } };
  const uid = u?.user?.id ?? null;

  const tokenDonation = async (t?: string) => t ? ((await admin.rpc('_impact_token_donation', { _hash: await sha256(t) })).data as string | null) : null;

  if (p.action === 'guest_view') {
    const did = await tokenDonation(p.token);
    if (!did) return json({ error: 'This link has expired or is not valid.' }, 404);
    const { data: impact } = await admin.rpc('_donation_impact', { _donation_id: did });
    const { data: d } = await admin.from('donations').select('donor_email').eq('id', did).maybeSingle();
    return json({ impact, email_hint: maskEmail(d?.donor_email ?? null) });
  }

  if (p.action === 'receipt_urls') {
    const { data: c } = await admin.from('coupons').select('id, donation_id').eq('id', p.coupon_id).maybeSingle();
    if (!c) return json({ error: 'Not found' }, 404);
    let allowed = false, isStaff = false;
    if (p.token) allowed = (await tokenDonation(p.token)) === c.donation_id;
    if (!allowed && uid) {
      allowed = !!(await admin.rpc('can_view_coupon_receipts', { _coupon_id: c.id, _uid: uid })).data;
      isStaff = !!(await admin.rpc('is_admin_staff', { _uid: uid })).data;
    }
    if (!allowed) return json({ error: 'Not allowed' }, 403);
    let q = admin.from('coupon_receipts').select('id, storage_path, hidden_at, created_at').eq('coupon_id', c.id).order('created_at');
    if (!isStaff) q = q.is('hidden_at', null);
    const { data: rows } = await q;
    const out = [];
    for (const r of rows ?? []) {
      const { data: s } = await admin.storage.from(BUCKET).createSignedUrl(r.storage_path, 300);
      if (s?.signedUrl) out.push({ id: r.id, url: s.signedUrl, hidden: !!r.hidden_at, created_at: r.created_at });
    }
    return json({ receipts: out, expires_in: 300 });
  }

  if (!uid) return json({ error: 'Please sign in.' }, 401);

  if (p.action === 'mark_used') {
    let note = p.note?.trim() || null;
    if (note) {
      const m = moderate(note);
      if (m.blocked) {
        await admin.from('blocked_attempts').insert({ sender_id: uid, fundraiser_id: null, context: 'coupon_note', matched_rules: m.blockRules, masked_excerpt: maskedExcerpt(note) });
        return json({ blocked: true, error: BLOCKED_EXPLANATION }, 422);
      }
      note = m.text.slice(0, 140) || null;
    }
    const { data, error } = await admin.rpc('_owner_mark_coupon_used', { _uid: uid, _coupon_id: p.coupon_id, _category: p.category ?? null, _note: note });
    if (error) return json({ error: error.message === 'Reveal the code first' ? error.message : 'Not allowed' }, 403);
    return json(data);
  }

  if (p.action === 'upload_receipt') {
    const { data: c } = await admin.from('coupons').select('id, donation_id, used_at, revealed_at, status, donations!inner(fundraiser_id, fundraisers!inner(user_id))').eq('id', p.coupon_id).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const owner = (c as any)?.donations?.fundraisers?.user_id;
    if (!c || owner !== uid) return json({ error: 'Not allowed' }, 403);
    if (!c.used_at) return json({ error: 'Mark the coupon as used first.' }, 400);
    const { count } = await admin.from('coupon_receipts').select('id', { count: 'exact', head: true }).eq('coupon_id', c.id);
    if ((count ?? 0) >= MAX_RECEIPTS) return json({ error: `Up to ${MAX_RECEIPTS} receipts per coupon.` }, 400);
    let bytes: Uint8Array;
    try { bytes = b64ToBytes(p.data_base64); } catch { return json({ error: 'Could not read the image.' }, 400); }
    if (bytes.length > MAX_BYTES) return json({ error: 'Image is too large (5 MB max).' }, 400);
    const meta = inspectImage(bytes);
    if (!meta.type) return json({ error: 'Only JPEG, PNG or WebP images are accepted.' }, 400);
    if (meta.metadata.length) return json({ error: 'This image still contains hidden photo data. Please re-select it so we can clean it.', metadata: meta.metadata }, 400);
    // deno-lint-ignore no-explicit-any
    const fid = (c as any).donations.fundraiser_id;
    const path = `${fid}/${c.id}/${crypto.randomUUID()}.${meta.type === 'jpeg' ? 'jpg' : meta.type}`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: `image/${meta.type}`, upsert: false });
    if (upErr) return json({ error: 'Upload failed. Please try again.' }, 500);
    const { data: row } = await admin.from('coupon_receipts').insert({ coupon_id: c.id, uploaded_by: uid, storage_path: path, width: p.width ?? null, height: p.height ?? null, bytes: bytes.length }).select('id').single();
    await admin.from('admin_audit_log').insert({ actor_id: uid, action: 'receipt_uploaded', table_name: 'coupon_receipts', record_id: row?.id ?? null, after: { coupon_id: c.id, bytes: bytes.length } });
    await admin.from('donor_impact_events').upsert({ donation_id: c.donation_id, coupon_id: c.id, kind: 'used' }, { onConflict: 'coupon_id,kind', ignoreDuplicates: true });
    return json({ ok: true, id: row?.id });
  }

  if (p.action === 'ask_receipt') {
    const { data: c } = await admin.from('coupons').select('id, donation_id, store_name, value, expected_value, revealed_at, status').eq('id', p.coupon_id).maybeSingle();
    if (!c?.donation_id) return json({ error: 'Not found' }, 404);
    if (!(await admin.rpc('_is_donation_donor', { _donation_id: c.donation_id, _uid: uid })).data) return json({ error: 'Not allowed' }, 403);
    if (!c.revealed_at) return json({ error: 'You can ask once the coupon has been received.' }, 400);
    const { data: d } = await admin.from('donations').select('fundraiser_id').eq('id', c.donation_id).single();
    const { error: dup } = await admin.from('receipt_requests').insert({ coupon_id: c.id, donation_id: c.donation_id, requested_by: uid });
    if (dup) return json({ error: 'You’ve already asked about this coupon. The recipient can choose whether to share.' }, 409);
    const amount = Number(c.value ?? c.expected_value ?? 0);
    const body = `Hi! I’m the donor behind your $${amount} ${c.store_name} coupon. If you’re comfortable, I’d love to see a receipt — please cover any personal details first. No pressure at all; it’s completely optional.`;
    const r = await fetch(`${SUPA}/functions/v1/send-message`, {
      method: 'POST', headers: { Authorization: `Bearer ${bearer}`, apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fundraiser_id: d!.fundraiser_id, body, ref_coupon_id: c.id, ref_donation_id: c.donation_id }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) { await admin.from('receipt_requests').delete().eq('coupon_id', c.id); return json({ error: out?.error ?? 'Could not send the request.' }, r.status); }
    await admin.from('receipt_requests').update({ conversation_id: out?.message?.conversation_id ?? null }).eq('coupon_id', c.id);
    return json({ ok: true, conversation_id: out?.message?.conversation_id });
  }
  return json({ error: 'Unknown action' }, 400);
});
