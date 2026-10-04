// Proof-of-impact donor emails + one owner reminder per coupon. Called only by admin-dispatch (Vault secret).
// Never writes payment/coupon creation paths; reads donations, marks donor_impact_events.
// ONE email per donation per run: all pending events of a donation are grouped; received+used combine.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { renderImpactEmail, renderUseReminderEmail, type ImpactItem } from '../_shared/impact-email.ts';
import { NOTIFY_SENDER } from '../_shared/email-layout.ts';
import { flushOwnerAlerts, renderOwnerCouponEmail } from '../_shared/owner-alerts.ts';

const SUPA = Deno.env.get('SUPABASE_URL')!;
const SITE = 'https://coupondonation.com';
const SAMPLE_TO = 'connect.coupondonation@gmail.com';
const TOKEN_DAYS = 30;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const newToken = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

import { planEmails, type Ev } from '../_shared/impact-plan.ts';
type Impact = { donation_id: string; created_at: string; fundraiser_title: string; fundraiser_slug: string | null; organizer: string | null;
  brands?: { brand: string; allocated: number; issued: number; topup: number; topup_reasons: { amount: number; reason: string }[] }[];
  coupons: { id: string; store_name: string; issued_brand?: string; brand_change_reason?: string | null; credential_type?: string | null; value: number; created_at: string; revealed_at: string | null; used_at: string | null; used_category: string | null; used_note: string | null; receipt_count: number }[] };

async function sendResend(key: string, to: string, mail: { subject: string; html: string; text: string }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [to], ...mail }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`[${r.status}] ${t}`);
  return JSON.parse(t).id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(SUPA, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: ok } = await admin.rpc('dispatch_secret_ok', { _s: req.headers.get('x-dispatch-secret') });
  if (!ok) return json({ error: 'Unauthorized' }, 401);
  const key = Deno.env.get('RESEND_API_KEY');
  const body = await req.json().catch(() => ({}));

  // Delivery status lookup for a Resend id.
  if (typeof body?.status_id === 'string' && /^[0-9a-f-]{36}$/.test(body.status_id)) {
    const r = await fetch(`https://api.resend.com/emails/${body.status_id}`, { headers: { Authorization: `Bearer ${key}` } });
    const j = await r.json();
    return json({ id: j.id, to: j.to, subject: j.subject, last_event: j.last_event });
  }

  // SAMPLE emails: clearly labelled sample data, only ever to the founder's inbox.
  if (body?.sample) {
    if (!key) return json({ error: 'Missing Resend key' }, 400);
    const now = Date.now(), h = 3600_000;
    const base = { fundraiserTitle: 'Help Our Family With Groceries This Month', organizer: 'Maria G.', donatedAt: new Date(now - 26 * h).toISOString(),
      impactUrl: `${SITE}/impact/sample`, thankUrl: `${SITE}/impact/sample#thanks`, stopUrl: `${SITE}/impact/sample`, sample: true };
    if (body.sample === 'v2') {
      const r1 = await sendResend(key, SAMPLE_TO, renderOwnerCouponEmail({ fundraiserTitle: base.fundraiserTitle, sample: true, dashboardUrl: `${SITE}/my-fundraisers`,
        items: [{ brand: 'DoorDash', value: 20, type: 'code' }] }));
      const r2 = await sendResend(key, SAMPLE_TO, renderImpactEmail({ ...base, kind: 'received', items: [
        { brand: 'DoorDash', issuedBrand: 'Visa', type: 'prepaid_link', brandReason: 'DoorDash gift cards were out of stock this week, so we sent a Visa prepaid card that works there and anywhere else',
          value: 20, createdAt: new Date(now - 25 * h).toISOString(), receivedAt: new Date(now - 5 * 60_000).toISOString() }] }));
      return json({ sample: 'v2', to: SAMPLE_TO, owner_alert_id: r1, gift_arrived_id: r2 });
    }
    const r1 = await sendResend(key, SAMPLE_TO, renderImpactEmail({ ...base, kind: 'received', items: [
      { brand: 'DoorDash', value: 20, createdAt: new Date(now - 25 * h).toISOString(), receivedAt: new Date(now - 5 * 60_000).toISOString() }] }));
    const r2 = await sendResend(key, SAMPLE_TO, renderImpactEmail({ ...base, kind: 'used', items: [
      { brand: 'DoorDash', value: 20, createdAt: new Date(now - 25 * h).toISOString(), receivedAt: new Date(now - 4 * h).toISOString(), usedAt: new Date(now - 10 * 60_000).toISOString(),
        category: 'Meals', note: 'Dinner for the kids after a long week. Thank you so much.', hasReceipt: true }] }));
    return json({ sample: true, to: SAMPLE_TO, received_id: r1, used_id: r2 });
  }

  const report: Record<string, unknown> = {};
  const dry = !!body?.dry_run;

  // 1) Donor impact emails.
  const { data: pend } = await admin.from('donor_impact_events').select('id, donation_id, coupon_id, kind, created_at').is('emailed_at', null).order('created_at').limit(500);
  const plan = planEmails((pend ?? []) as Ev[], Date.now());
  if (dry) return json({ dry_run: true, emails: plan.map((p) => ({ donation_id: p.donation_id, kind: p.kind, coupons: p.events.map((e) => e.coupon_id) })) });
  let sent = 0, skipped = 0, failed = 0;
  for (const p of plan) {
    const ids = p.events.map((e) => e.id);
    const mark = (patch: Record<string, unknown>) => admin.from('donor_impact_events').update(patch).in('id', ids);
    const { data: d } = await admin.from('donations').select('donor_email, donor_id').eq('id', p.donation_id).maybeSingle();
    let email = d?.donor_email ?? null;
    if (!email && d?.donor_id) email = (await admin.from('profiles').select('email').eq('user_id', d.donor_id).maybeSingle()).data?.email ?? null;
    if (!email) { await mark({ emailed_at: new Date().toISOString(), skipped_reason: 'no_email' }); skipped++; continue; }
    const { data: opt } = await admin.from('impact_email_optouts').select('email').eq('email', email.toLowerCase()).maybeSingle();
    if (opt) { await mark({ emailed_at: new Date().toISOString(), skipped_reason: 'impact_optout' }); skipped++; continue; }
    if (!key) { report.error = 'Missing Resend key'; break; }
    const { data: impact } = await admin.rpc('_donation_impact', { _donation_id: p.donation_id });
    const imp = impact as Impact | null;
    if (!imp) { await mark({ emailed_at: new Date().toISOString(), skipped_reason: 'donation_not_completed' }); skipped++; continue; }
    const couponIds = new Set(p.events.map((e) => e.coupon_id));
    const items: ImpactItem[] = imp.coupons.filter((c) => couponIds.has(c.id)).map((c) => ({
      brand: c.store_name, issuedBrand: c.issued_brand, brandReason: c.brand_change_reason, type: c.credential_type, value: Number(c.value), createdAt: c.created_at, receivedAt: c.revealed_at, usedAt: c.used_at,
      category: c.used_category, note: c.used_note, hasReceipt: Number(c.receipt_count) > 0 }));
    if (!items.length) { await mark({ emailed_at: new Date().toISOString(), skipped_reason: 'no_live_coupons' }); skipped++; continue; }
    const token = newToken();
    await admin.from('donation_impact_tokens').insert({ donation_id: p.donation_id, token_hash: await sha256(token), expires_at: new Date(Date.now() + TOKEN_DAYS * 86400_000).toISOString() });
    const impactUrl = `${SITE}/impact/${token}`;
    const mail = renderImpactEmail({
      kind: p.kind, fundraiserTitle: imp.fundraiser_title, topups: (imp.brands ?? []).flatMap((b) => b.topup_reasons ?? []), organizer: imp.organizer || 'The organizer', donatedAt: imp.created_at, items,
      impactUrl, thankUrl: `${impactUrl}#thanks`, stopUrl: `${SUPA}/functions/v1/impact-actions?stop=${token}`,
    });
    try {
      const id = await sendResend(key, email, mail);
      await mark({ emailed_at: new Date().toISOString(), resend_id: id, last_error: null }); sent++;
    } catch (e) { await mark({ last_error: String(e).slice(0, 500) }); failed++; }
  }
  report.impact = { planned: plan.length, sent, skipped, failed };

  // 2) One gentle reminder per coupon: revealed 7+ days ago, not used.
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: due } = await admin.from('coupons').select('id, store_name, donation_id, revealed_by').lte('revealed_at', weekAgo).is('used_at', null).is('reveal_reminder_sent_at', null).not('status', 'in', '(void,returned)').limit(100);
  let reminded = 0;
  for (const c of due ?? []) {
    const { data: claimed } = await admin.from('coupons').update({ reveal_reminder_sent_at: new Date().toISOString() }).eq('id', c.id).is('reveal_reminder_sent_at', null).select('id');
    if (!claimed?.length) continue;
    const { data: dn } = await admin.from('donations').select('fundraiser_id, fundraisers(title, user_id)').eq('id', c.donation_id).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const fr = (dn as any)?.fundraisers; if (!fr) continue;
    const { data: prof } = await admin.from('profiles').select('id, email').eq('user_id', fr.user_id).maybeSingle();
    if (prof) await admin.from('notifications').insert({ user_id: prof.id, title: `Did you use your ${c.store_name} coupon?`, message: `If you used your ${c.store_name} coupon, tap Used — your donor would love to know. It's optional.` });
    const { data: pref } = await admin.from('messaging_preferences').select('email_notifications').eq('user_id', fr.user_id).maybeSingle();
    if (prof?.email && key && pref?.email_notifications !== false) {
      try { await sendResend(key, prof.email, renderUseReminderEmail({ brand: c.store_name, fundraiserTitle: fr.title, dashboardUrl: `${SITE}/fundraiser/${dn!.fundraiser_id}#coupons` })); } catch (e) { console.error('reminder failed', c.id, String(e)); }
    }
    reminded++;
  }
  report.reminders = reminded;

  // 3) Owner "you've received a coupon" alerts left in the queue (normally sent right after the admin save).
  report.owner_alerts = await flushOwnerAlerts(admin);
  return json(report);
});
