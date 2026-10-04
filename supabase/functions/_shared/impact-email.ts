/**
 * Proof-of-impact donor emails ("Your gift arrived" / "Your coupon was used").
 * Email-safe: tables, inline styles, light-only, plain-text alternative.
 * Never contains a coupon code, never attaches receipts, and names the recipient
 * only by the public display name ("First L.") and fundraiser title.
 */
const LOGO_URL = 'https://coupondonation.com/favicon-192.png';
const SITE = 'https://coupondonation.com';
const GREEN = '#2e7d32';
const BLUE = '#1565c0';
const INK = '#13201a';
const BODY = '#4a5650';
const MUTED = '#86918b';
const SOFT = '#f1f6f1';
const LINE = '#e3e9e4';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export interface ImpactItem {
  brand: string; value: number; issuedBrand?: string | null; brandReason?: string | null; type?: string | null;
  createdAt: string; receivedAt?: string | null; usedAt?: string | null;
  category?: string | null; note?: string | null; hasReceipt?: boolean;
}
export interface ImpactEmailInput {
  kind: 'received' | 'used' | 'combined';
  fundraiserTitle: string; organizer: string; donatedAt: string;
  items: ImpactItem[]; topups?: { amount: number; reason: string }[]; impactUrl: string; thankUrl: string; stopUrl: string; sample?: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
export const etTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) + ' ET';
const etDay = (iso: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }).format(new Date(iso));

function step(label: string, when: string | null | undefined, done: boolean, last = false) {
  const dot = done ? GREEN : '#c9d3cc';
  return `<tr>
    <td width="22" valign="top" style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="12" height="12" style="width:12px;height:12px;border-radius:6px;background-color:${dot};font-size:0;line-height:0;">&nbsp;</td></tr></table>
      ${last ? '' : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="12" align="center"><div style="width:2px;height:22px;background-color:${done ? GREEN : LINE};margin:0 auto;"></div></td></tr></table>`}
    </td>
    <td valign="top" style="padding:0 0 10px 6px;font-family:${FONT};font-size:14px;line-height:14px;color:${done ? INK : MUTED};">
      <strong style="font-weight:600;">${esc(label)}</strong>${when ? `<span style="color:${MUTED};font-weight:400;">&nbsp;&nbsp;${esc(when)}</span>` : ''}
    </td></tr>`;
}

const kindOf = (t?: string | null) => t === 'gift_card' ? 'gift card' : t === 'prepaid_card' || t === 'prepaid_link' ? 'prepaid card' : 'coupon';
const shown = (i: ImpactItem) => `${i.issuedBrand || i.brand} ${kindOf(i.type)}`;
const swapped = (i: ImpactItem) => !!i.issuedBrand && i.issuedBrand.toLowerCase() !== i.brand.toLowerCase();
const disclosure = (i: ImpactItem) => `You chose ${i.brand}; it was issued as a ${shown(i)}${i.brandReason ? ` because ${i.brandReason.replace(/^because\s+/i, '').replace(/\.$/, '')}` : ''}.`;

function card(i: ImpactItem, title: string, donatedAt: string) {
  const usedLine = i.usedAt ? etDay(i.usedAt) : 'pending';
  const proof = i.usedAt && (i.category || i.note)
    ? `<tr><td style="padding:14px 0 0 0;font-family:${FONT};font-size:14px;line-height:21px;color:${BODY};">
        ${i.category ? `<strong style="color:${INK};font-weight:600;">Used for ${esc(i.category.toLowerCase())}</strong><br/>` : ''}
        ${i.note ? `<span style="font-family:${SERIF};font-style:italic;font-size:16px;line-height:24px;color:${INK};">&ldquo;${esc(i.note)}&rdquo;</span>` : ''}
      </td></tr>` : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${SOFT};border-radius:14px;margin:0 0 14px 0;">
    <tr><td style="padding:20px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family:${SERIF};font-size:30px;line-height:34px;color:${INK};">${usd(i.value)}</td>
          <td align="right" style="font-family:${FONT};font-size:15px;font-weight:600;color:${INK};">${esc(shown(i))}</td>
        </tr>
        <tr><td colspan="2" style="padding:4px 0 16px 0;font-family:${FONT};font-size:13px;color:${MUTED};">For &ldquo;${esc(title)}&rdquo;</td></tr>
        ${swapped(i) ? `<tr><td colspan="2" style="padding:0 0 14px 0;font-family:${FONT};font-size:14px;line-height:21px;color:${BODY};">${esc(disclosure(i))}</td></tr>` : ''}
        <tr><td colspan="2"><table role="presentation" cellpadding="0" cellspacing="0" border="0">
          ${step('Donated', etDay(donatedAt), true)}
          ${step('Coupon created', etDay(i.createdAt), true)}
          ${step('Received', i.receivedAt ? etDay(i.receivedAt) : null, !!i.receivedAt)}
          ${step('Used', usedLine, !!i.usedAt, true)}
        </table></td></tr>
        ${proof}
      </table>
    </td></tr></table>`;
}

function button(label: string, href: string, primary: boolean) {
  return `<td style="padding:0 8px 8px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="border-radius:999px;background-color:${primary ? GREEN : '#ffffff'};border:1px solid ${primary ? GREEN : LINE};">
      <a href="${esc(href)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:600;color:${primary ? '#ffffff' : INK};text-decoration:none;">${esc(label)}</a>
    </td></tr></table></td>`;
}

export function renderImpactEmail(o: ImpactEmailInput) {
  const anyUsed = o.items.some((i) => i.usedAt);
  const anyReceipt = o.items.some((i) => i.hasReceipt);
  const first = o.items[0];
  const what = o.items.length === 1 ? `${usd(first.value)} ${shown(first)}` : `${o.items.length} coupons`;
  const topupLine = (o.topups ?? []).length ? `CouponDonation added ${(o.topups ?? []).map((t) => `${usd(t.amount)} (${t.reason})`).join(' and ')} on top of your gift.` : '';
  const moment = anyUsed ? o.items.find((i) => i.usedAt)!.usedAt! : (o.items.find((i) => i.receivedAt)?.receivedAt ?? new Date().toISOString());
  const tag = o.sample ? '[SAMPLE] ' : '';
  const heading = o.kind === 'received' ? 'Your gift arrived' : o.kind === 'used' ? 'Your coupon was used' : 'Your gift arrived, and it’s been used';
  const subject = `${tag}${o.kind === 'used' ? `Your ${what} was used` : `Your ${what} arrived`} · ${o.fundraiserTitle}`;
  const intro = o.kind === 'received'
    ? `${o.organizer} opened the ${what} your donation created for “${o.fundraiserTitle}”. It’s in their hands now, ready to spend.`
    : o.kind === 'used'
    ? `${o.organizer} marked the ${what} from your gift as used. Here’s what they chose to share.`
    : `${o.organizer} received the ${what} your donation created for “${o.fundraiserTitle}”, and has already marked it used.`;
  const momentLabel = anyUsed ? 'Used' : 'Delivered';

  const html = `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="light only"/><meta name="supported-color-schemes" content="light only"/>
<title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff;">${esc(intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
  ${o.sample ? `<tr><td style="padding:12px 24px 0 24px;font-family:${FONT};font-size:12px;font-weight:700;color:${BLUE};">SAMPLE EMAIL · sample data, not a real donation</td></tr>` : ''}
  <tr><td style="padding:28px 24px 8px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:10px;"><img src="${LOGO_URL}" width="40" height="40" alt="CouponDonation" style="display:block;width:40px;height:40px;border:0;"/></td>
      <td style="font-family:${FONT};font-size:19px;font-weight:700;"><span style="color:${GREEN};">Coupon</span><span style="color:${BLUE};">Donation</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:22px 24px 6px 24px;">
    <p style="margin:0 0 6px 0;font-family:${FONT};font-size:13px;color:${GREEN};font-weight:600;">${momentLabel} &middot; ${esc(etTime(moment))}</p>
    <h1 style="margin:0 0 12px 0;font-family:${SERIF};font-weight:400;font-size:36px;line-height:42px;color:${INK};">${esc(heading)}</h1>
    <p style="margin:0 0 22px 0;font-family:${FONT};font-size:16px;line-height:25px;color:${BODY};">${esc(intro)}</p>
  </td></tr>
  <tr><td style="padding:0 24px;">${o.items.map((i) => card(i, o.fundraiserTitle, o.donatedAt)).join('')}</td></tr>
  ${topupLine ? `<tr><td style="padding:0 24px 8px 24px;font-family:${FONT};font-size:14px;line-height:21px;color:${BODY};">${esc(topupLine)}</td></tr>` : ''}
  <tr><td style="padding:10px 24px 0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    ${button(anyReceipt ? 'View receipt' : 'See your impact', o.impactUrl, true)}
    ${button('Send a thank-you', o.thankUrl, false)}
  </tr></table></td></tr>
  <tr><td style="padding:18px 24px 0 24px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">
    Retailers don’t share what a coupon buys, so anything beyond “received” comes from the recipient, only if they choose to share it. We never email coupon codes or card details.
  </td></tr>
  <tr><td style="padding:26px 24px 34px 24px;">
    <div style="border-top:1px solid ${LINE};height:1px;line-height:1px;font-size:0;">&nbsp;</div>
    <p style="margin:16px 0 6px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">You’re getting this because you donated to a fundraiser on CouponDonation. This link to your impact page is private to you and expires in 30 days.</p>
    <p style="margin:0;font-family:${FONT};font-size:12px;line-height:19px;color:${MUTED};">
      <a href="${esc(o.stopUrl)}" style="color:${MUTED};text-decoration:underline;">Stop impact emails</a> &nbsp;&middot;&nbsp;
      <a href="${SITE}" style="color:${MUTED};text-decoration:underline;">coupondonation.com</a> &nbsp;&middot;&nbsp;
      <a href="mailto:connect@coupondonation.com" style="color:${MUTED};text-decoration:underline;">connect@coupondonation.com</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    o.sample ? 'SAMPLE EMAIL - sample data, not a real donation\n' : '',
    heading, `${momentLabel}: ${etTime(moment)}`, '', intro, '',
    ...o.items.map((i) => [
      `${usd(i.value)} ${shown(i)} - "${o.fundraiserTitle}"`, swapped(i) ? `  ${disclosure(i)}` : '',
      `  Donated ${etDay(o.donatedAt)} > Coupon created ${etDay(i.createdAt)} > Received ${i.receivedAt ? etDay(i.receivedAt) : 'pending'} > Used ${i.usedAt ? etDay(i.usedAt) : 'pending'}`,
      i.category ? `  Used for ${i.category.toLowerCase()}` : '', i.note ? `  "${i.note}"` : '',
    ].filter(Boolean).join('\n')),
    topupLine, '', `${anyReceipt ? 'View receipt' : 'See your impact'}: ${o.impactUrl}`, `Send a thank-you: ${o.thankUrl}`, '',
    'We never email coupon codes or card details.', `Stop impact emails: ${o.stopUrl}`,
  ].join('\n');
  return { subject, html, text };
}

export function renderUseReminderEmail(o: { brand: string; fundraiserTitle: string; dashboardUrl: string }) {
  const intro = `If you used your ${o.brand} coupon, tap Used — your donor would love to know. Adding a note or receipt is optional, and skipping it never affects your help.`;
  const html = `<div style="font-family:${FONT};max-width:560px;color:${INK};padding:24px">
    <p style="margin:0 0 4px 0;font-size:19px;font-weight:700;"><span style="color:${GREEN};">Coupon</span><span style="color:${BLUE};">Donation</span></p>
    <h1 style="font-family:${SERIF};font-weight:400;font-size:28px;margin:18px 0 10px">A gentle note about “${esc(o.fundraiserTitle)}”</h1>
    <p style="font-size:15px;line-height:23px;color:${BODY}">${esc(intro)}</p>
    <p><a href="${esc(o.dashboardUrl)}" style="display:inline-block;background:${GREEN};color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Open my coupons</a></p>
    <p style="font-size:12px;color:${MUTED}">This is the only reminder we’ll send for this coupon.</p></div>`;
  return { subject: `Did you use your ${o.brand} coupon?`, html, text: `${intro}\n\nOpen my coupons: ${o.dashboardUrl}\n\nThis is the only reminder we'll send for this coupon.` };
}
