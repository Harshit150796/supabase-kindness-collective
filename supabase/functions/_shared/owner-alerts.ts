// Owner "You've received a coupon" alerts. One queue (coupon_owner_alerts, unique per coupon + credential version),
// flushed right after an admin save and again by the 5-minute dispatcher. One email per fundraiser per flush; never contains codes.
// deno-lint-ignore-file no-explicit-any
import { NOTIFY_SENDER } from './email-layout.ts';

const SITE = 'https://coupondonation.com';
const LOGO_URL = `${SITE}/favicon-192.png`;
const GREEN = '#2e7d32', BLUE = '#1565c0', INK = '#13201a', BODY = '#4a5650', MUTED = '#86918b', SOFT = '#f1f6f1', LINE = '#e3e9e4';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
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

export function renderOwnerCouponEmail(o: { fundraiserTitle: string; items: AlertItem[]; dashboardUrl: string; sample?: boolean }) {
  const one = o.items.length === 1 ? o.items[0] : null;
  const total = o.items.reduce((s, i) => s + Number(i.value), 0);
  const what = one ? `a ${usd(one.value)} ${one.brand} ${typeLabel(one.type)}` : `${o.items.length} coupons worth ${usd(total)}`;
  const tag = o.sample ? '[SAMPLE] ' : '';
  const subject = `${tag}You’ve received ${what} from a donor`;
  const intro = `A donation to “${o.fundraiserTitle}” has arrived as ${what}. Open your dashboard and tap Reveal to see ${one ? 'it' : 'them'}.`;
  const rows = o.items.map((i) => {
    const logo = brandLogoUrl(i.brand);
    return `<tr><td style="padding:0 0 10px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${SOFT};border-radius:14px;"><tr>
      <td width="56" style="padding:16px 0 16px 18px;">${logo ? `<img src="${logo}" width="36" height="36" alt="${esc(i.brand)}" style="display:block;width:36px;height:36px;border:0;border-radius:8px;background:#ffffff;"/>` : ''}</td>
      <td style="padding:16px 8px;font-family:${FONT};font-size:15px;font-weight:600;color:${INK};">${esc(i.brand)} ${typeLabel(i.type)}</td>
      <td align="right" style="padding:16px 18px 16px 0;font-family:${SERIF};font-size:26px;color:${INK};">${usd(i.value)}</td>
    </tr></table></td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="light only"/><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;"><div style="display:none;max-height:0;overflow:hidden;">${esc(intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
${o.sample ? `<tr><td style="padding:12px 24px 0 24px;font-family:${FONT};font-size:12px;font-weight:700;color:${BLUE};">SAMPLE EMAIL · sample data, not a real coupon</td></tr>` : ''}
<tr><td style="padding:28px 24px 8px 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
  <td style="padding-right:10px;"><img src="${LOGO_URL}" width="40" height="40" alt="CouponDonation" style="display:block;width:40px;height:40px;border:0;"/></td>
  <td style="font-family:${FONT};font-size:19px;font-weight:700;"><span style="color:${GREEN};">Coupon</span><span style="color:${BLUE};">Donation</span></td></tr></table></td></tr>
<tr><td style="padding:22px 24px 6px 24px;">
  <h1 style="margin:0 0 12px 0;font-family:${SERIF};font-weight:400;font-size:34px;line-height:40px;color:${INK};">You’ve received ${one ? 'a coupon' : 'coupons'}</h1>
  <p style="margin:0 0 20px 0;font-family:${FONT};font-size:16px;line-height:25px;color:${BODY};">${esc(intro)}</p></td></tr>
<tr><td style="padding:0 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>
<tr><td style="padding:12px 24px 0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:999px;background-color:${GREEN};">
  <a href="${esc(o.dashboardUrl)}" style="display:inline-block;padding:12px 24px;font-family:${FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Open my dashboard</a></td></tr></table></td></tr>
<tr><td style="padding:22px 24px 34px 24px;"><div style="border-top:1px solid ${LINE};height:1px;font-size:0;">&nbsp;</div>
  <p style="margin:16px 0 0 0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">For your safety, codes and card details are never sent by email. They appear only after you sign in and tap Reveal. CouponDonation will never ask you to share them.</p></td></tr>
</table></td></tr></table></body></html>`;
  const text = [o.sample ? 'SAMPLE EMAIL - sample data\n' : '', subject, '', intro, '', ...o.items.map((i) => `- ${usd(i.value)} ${i.brand} ${typeLabel(i.type)}`), '',
    `Open my dashboard: ${o.dashboardUrl}`, '', 'Codes and card details are never sent by email.'].join('\n');
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
    const { data: prof } = await admin.from('profiles').select('id, email').eq('user_id', f.user_id).maybeSingle();
    const mail = renderOwnerCouponEmail({ fundraiserTitle: f.title, items, dashboardUrl: `${SITE}/fundraiser/${f.id}#coupons` });
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
