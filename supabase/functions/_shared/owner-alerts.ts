// Owner "You've received a coupon" alerts. One queue (coupon_owner_alerts, unique per coupon + credential version),
// flushed right after an admin save and again by the 5-minute dispatcher. One email per fundraiser per flush; never contains codes.
// deno-lint-ignore-file no-explicit-any
import { NOTIFY_SENDER, SUPPORT_LINE, shell } from './email-layout.ts';

const SITE = 'https://coupondonation.com';
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

const cardWord = (t?: string | null) => (typeLabel(t) === 'coupon' ? 'coupon' : 'card');

/** "Your $25 Walmart card is ready" (rewritten Nov 15, 2026). The subject is the news; the code never leaves the site. */
export function renderOwnerCouponEmail(o: { fundraiserTitle: string; items: AlertItem[]; dashboardUrl: string; firstName?: string; test?: boolean }) {
  const one = o.items.length === 1 ? o.items[0] : null;
  const total = o.items.reduce((s, i) => s + Number(i.value), 0);
  const what = one ? `${usd(one.value)} ${one.brand} ${cardWord(one.type)}` : '';
  // The subject carries no amount or store name (it would read like gift-card spam); the first line does.
  const subject = one ? `Your ${cardWord(one.type)} is ready to open` : `Your ${o.items.length} cards are ready to open`;
  const paragraphs = [
    one ? `Your ${what} from “${o.fundraiserTitle}” is ready.` : `${o.items.length} cards worth ${usd(total)} from “${o.fundraiserTitle}” are ready.`,
    `Sign in to open ${one ? 'it' : 'them'}. Card details are shown only to you, never by email.`,
    `After you use ${one ? 'it' : 'a card'}, tap “Mark used” so the person who gave knows.`,
  ];
  const label = one ? 'Open your card' : 'Open your cards';
  const html = shell({ preheader: paragraphs[0], greeting: `Hi ${o.firstName || 'there'}`, headline: one ? `Your ${cardWord(one.type)} is ready` : 'Your cards are ready', paragraphs,
    link: { label, url: o.dashboardUrl }, footer: `Codes and card details are available only after you sign in. They are never included in email.${o.test ? ' This is a test message.' : ''}`, sample: o.test });
  const text = [`Hi ${o.firstName || 'there'},`, '', ...paragraphs.flatMap((p) => [p, '']), `${label}: ${o.dashboardUrl}`, '', '— The CouponDonation team', '', `Codes and card details are never included in email.${o.test ? ' This is a test message.' : ''}`, SUPPORT_LINE].join('\n');
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
