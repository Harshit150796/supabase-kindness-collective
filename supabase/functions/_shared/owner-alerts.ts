// Owner "You've received a coupon" alerts. One queue (coupon_owner_alerts, unique per coupon + credential version),
// flushed right after an admin save and again by the 5-minute dispatcher. One email per fundraiser per flush; never contains codes.
// deno-lint-ignore-file no-explicit-any
import { NOTIFY_SENDER } from './email-layout.ts';

const SITE = 'https://coupondonation.com';
const LOGO_URL = `${SITE}/favicon-192.png`;
const INK = '#13201a', BODY = '#4a5650', MUTED = '#86918b';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;

const LOGOS: Record<string, string> = {
  doordash: 'doordash.com.png', walmart: 'walmart.com.png', uber: 'ubereats.com.png', ubereats: 'ubereats.com.png', amazon: 'amazon.com.png', target: 'target.com.png',
  starbucks: 'starbucks.com.png', kroger: 'kroger.com.png', wholefoods: 'wholefoodsmarket.com.png', costco: 'costco.com.png', safeway: 'safeway.com.png',
  publix: 'publix.com.png', aldi: 'aldi.us.png', grubhub: 'grubhub.com.png', instacart: 'instacart.com.png', bestbuy: 'bestbuy.com.png', homedepot: 'homedepot.com.png',
  lowes: 'lowes.com.png', cvs: 'cvs.com.png', walgreens: 'walgreens.com.png', riteaid: 'riteaid.com.png', dunkin: 'dunkindonuts.com.png', chipotle: 'chipotle.com.png',
  panerabread: 'panerabread.com.png', subway: 'subway.com.png', mcdonalds: 'mcdonalds.com.png', wendys: 'wendys.com.png',
  visa: 'visa.png', mastercard: 'mastercard.png', americanexpress: 'amex.png', amex: 'amex.png',
};
export const brandLogoUrl = (brand: string) => {
  const f = LOGOS[brand.toLowerCase().replace(/[^a-z]/g, '')];
  return f ? `${SITE}/brands/${f}` : null;
};
export const typeLabel = (t?: string | null) => t === 'gift_card' ? 'gift card' : t === 'prepaid_card' || t === 'prepaid_link' ? 'prepaid card' : 'coupon';

export type AlertItem = { brand: string; value: number; type?: string | null };

export function renderOwnerCouponEmail(o: { fundraiserTitle: string; items: AlertItem[]; dashboardUrl: string; firstName?: string; test?: boolean }) {
  const one = o.items.length === 1 ? o.items[0] : null;
  const total = o.items.reduce((s, i) => s + Number(i.value), 0);
  const what = one ? `a ${usd(one.value)} ${one.brand} ${typeLabel(one.type)}` : `${o.items.length} coupons worth ${usd(total)}`;
  const subject = 'A donation arrived for your fundraiser';
  const detail = one ? `It arrived as a ${usd(one.value)} ${one.brand} card.` : `It arrived as ${o.items.length} cards totaling ${usd(total)}.`;
  const intro = `A donation to “${o.fundraiserTitle}” is ready. ${detail} Sign in to reveal ${one ? 'the details' : 'their details'} securely.`;
  const html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="light only"/><title>${esc(subject)}</title></head>
<body style="margin:0;background:#ffffff"><div style="display:none;max-height:0;overflow:hidden;opacity:0">A donation is ready in your fundraiser dashboard.</div><main style="max-width:560px;margin:0 auto;padding:28px 22px"><img src="${LOGO_URL}" width="32" height="32" alt="CouponDonation" style="display:block;width:32px;height:32px;margin-bottom:24px"><p style="font:15px/23px ${FONT};color:${INK}">Hi ${esc(o.firstName || 'there')},</p><p style="font:15px/23px ${FONT};color:${BODY}">${esc(intro)}</p><p style="font:15px/23px ${FONT}"><a href="${esc(o.dashboardUrl)}" style="color:${INK};text-decoration:underline">Open your fundraiser dashboard</a></p><p style="font:15px/23px ${FONT};color:${INK}">— The CouponDonation team</p><p style="font:12px/18px ${FONT};color:${MUTED}">Codes and card details are never included in email.${o.test ? ' This is a test message.' : ''}</p></main></body></html>`;
  const text = [`Hi ${o.firstName || 'there'},`, '', intro, '', `Open your fundraiser dashboard: ${o.dashboardUrl}`, '', '— The CouponDonation team', '', `Codes and card details are never included in email.${o.test ? ' This is a test message.' : ''}`].join('\n');
  return { subject, html, text };
}

/** Send every pending owner alert (optionally for one fundraiser). Claims rows first so each coupon+version notifies once. */
export async function flushOwnerAlerts(admin: any, fundraiserId?: string) {
  let q = admin.from('coupon_owner_alerts').select('id, coupon_id, fundraiser_id').is('sent_at', null).limit(200);
  if (fundraiserId) q = q.eq('fundraiser_id', fundraiserId);
  const { data: pend } = await q;
  const byF = new Map<string, any[]>();
  for (const a of pend ?? []) byF.set(a.fundraiser_id, [...(byF.get(a.fundraiser_id) ?? []), a]);
  const key = Deno.env.get('RESEND_API_KEY');
  let emailed = 0, notified = 0;
  for (const [fid, list] of byF) {
    const { data: claimed } = await admin.from('coupon_owner_alerts').update({ sent_at: new Date().toISOString() }).in('id', list.map((a) => a.id)).is('sent_at', null).select('id, coupon_id');
    if (!claimed?.length) continue;
    const { data: f } = await admin.from('fundraisers').select('id, title, user_id').eq('id', fid).maybeSingle();
    const { data: cs } = await admin.from('coupons').select('id, store_name, issued_brand, value, credential_type, reserved_by, has_credential, status')
      .in('id', claimed.map((c: any) => c.coupon_id));
    const items = (cs ?? []).filter((c: any) => f && c.has_credential && c.reserved_by === f.user_id && !['void', 'returned'].includes(c.status))
      .map((c: any) => ({ brand: c.issued_brand || c.store_name, value: Number(c.value ?? 0), type: c.credential_type }));
    if (!f || !items.length) continue;
    const { data: prof } = await admin.from('profiles').select('id, email, full_name').eq('user_id', f.user_id).maybeSingle();
    const mail = renderOwnerCouponEmail({ fundraiserTitle: f.title, items, dashboardUrl: `${SITE}/fundraiser/${f.id}#coupons`, firstName: prof?.full_name?.trim().split(/\s+/)[0] });
    if (prof?.id) { await admin.from('notifications').insert({ user_id: prof.id, title: mail.subject, message: `Open your fundraiser dashboard and tap Reveal in Coupons.` }); notified++; }
    if (prof?.email && key) {
      const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: NOTIFY_SENDER.from, reply_to: NOTIFY_SENDER.replyTo, to: [prof.email], ...mail }) });
      const t = await r.text();
      const ids = claimed.map((c: any) => c.id);
      if (r.ok) { await admin.from('coupon_owner_alerts').update({ resend_id: JSON.parse(t).id }).in('id', ids); emailed++; }
      else await admin.from('coupon_owner_alerts').update({ last_error: t.slice(0, 400) }).in('id', ids);
    }
  }
  return { emailed, notified };
}
