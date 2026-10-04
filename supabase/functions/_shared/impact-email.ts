/** Personal proof-of-impact emails. Never contains spendable credentials. */
const LOGO_URL = 'https://coupondonation.com/favicon-192.png';
const INK = '#13201a';
const BODY = '#4a5650';
const MUTED = '#86918b';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export interface ImpactItem {
  brand: string; value: number; issuedBrand?: string | null; brandReason?: string | null; type?: string | null;
  createdAt: string; receivedAt?: string | null; usedAt?: string | null;
  category?: string | null; note?: string | null; hasReceipt?: boolean;
}
export interface ImpactEmailInput {
  kind: 'received' | 'used' | 'combined';
  fundraiserTitle: string; organizer: string; donorFirstName?: string | null; donatedAt: string;
  items: ImpactItem[]; topups?: { amount: number; reason: string }[]; impactUrl: string; thankUrl: string; stopUrl: string; sample?: boolean;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
export const etTime = (iso: string) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
}).format(new Date(iso));
const kindOf = (t?: string | null) => t === 'gift_card' ? 'card' : t === 'prepaid_link' ? 'prepaid card' : 'card';
const shown = (i: ImpactItem) => `${i.issuedBrand || i.brand} ${kindOf(i.type)}`;
const swapped = (i: ImpactItem) => !!i.issuedBrand && i.issuedBrand.toLowerCase() !== i.brand.toLowerCase();

export function renderImpactEmail(o: ImpactEmailInput) {
  const anyUsed = o.items.some((i) => i.usedAt);
  const eventTime = (anyUsed ? o.items.find((i) => i.usedAt)?.usedAt : o.items.find((i) => i.receivedAt)?.receivedAt) ?? new Date().toISOString();
  const subject = o.kind === 'received'
    ? `Your donation to “${o.fundraiserTitle}” was received`
    : `An update on your donation to “${o.fundraiserTitle}”`;
  const detail = o.items.length === 1
    ? `It arrived as a ${usd(o.items[0].value)} ${shown(o.items[0])}.`
    : `It arrived as ${o.items.length} cards with a total value of ${usd(o.items.reduce((sum, i) => sum + Number(i.value), 0))}.`;
  const intro = o.kind === 'received'
    ? `${o.organizer} received what your donation created for “${o.fundraiserTitle}”. ${detail}`
    : o.kind === 'used'
    ? `${o.organizer} shared an update about what your donation created for “${o.fundraiserTitle}”.`
    : `${o.organizer} received what your donation created for “${o.fundraiserTitle}” and has already shared that it was used. ${detail}`;
  const disclosures = o.items.filter(swapped).map((i) => `You selected ${i.brand}; it was issued as a ${shown(i)}${i.brandReason ? ` because ${i.brandReason.replace(/^because\s+/i, '').replace(/\.$/, '')}` : ''}.`);
  const topup = (o.topups ?? []).length ? `CouponDonation added ${(o.topups ?? []).map((t) => `${usd(t.amount)} (${t.reason})`).join(' and ')} beyond the original donation.` : '';
  const usedDetails = o.items.filter((i) => i.usedAt && (i.category || i.note)).map((i) => [i.category ? `Used for: ${i.category}` : '', i.note ? `Note: “${i.note}”` : ''].filter(Boolean).join('<br>'));
  const timeline = [
    `Donated · ${etTime(o.donatedAt)}`,
    `Received · ${etTime(o.items.find((i) => i.receivedAt)?.receivedAt ?? eventTime)}`,
    anyUsed ? `Used · ${etTime(o.items.find((i) => i.usedAt)?.usedAt ?? eventTime)}` : '',
  ].filter(Boolean);
  const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head><body style="margin:0;background:#ffffff"><div style="display:none;max-height:0;overflow:hidden;opacity:0">There is an update about your donation.</div><main style="max-width:560px;margin:0 auto;padding:28px 22px"><img src="${LOGO_URL}" width="32" height="32" alt="CouponDonation" style="display:block;width:32px;height:32px;margin-bottom:24px"><p style="font:15px/23px ${FONT};color:${INK}">Hi ${esc(o.donorFirstName || 'there')},</p><p style="font:15px/23px ${FONT};color:${BODY}">${esc(intro)}</p>${timeline.map((line) => `<p style="margin:3px 0;font:14px/21px ${FONT};color:${INK}">${esc(line)}</p>`).join('')}${disclosures.concat(topup ? [topup] : []).map((line) => `<p style="font:14px/21px ${FONT};color:${BODY}">${esc(line)}</p>`).join('')}${usedDetails.map((line) => `<p style="font:14px/21px ${FONT};color:${BODY}">${line}</p>`).join('')}<p style="font:15px/23px ${FONT}"><a href="${esc(o.impactUrl)}" style="color:${INK};text-decoration:underline">View your donation update</a></p><p style="font:15px/23px ${FONT};color:${INK}">— The CouponDonation team</p><p style="font:12px/18px ${FONT};color:${MUTED}">We never email codes or card details. Retailers do not tell us what was purchased; any use details were shared by the organizer.${o.sample ? ' This is a test message.' : ''}<br><a href="${esc(o.stopUrl)}" style="color:${MUTED};text-decoration:underline">Stop impact emails</a></p></main></body></html>`;
  const text = [
    `Hi ${o.donorFirstName || 'there'},`, '', intro, '', ...timeline, '', ...disclosures, topup, ...usedDetails.map((x) => x.replace(/<br>/g, '\n')), '',
    `View your donation update: ${o.impactUrl}`, '', '— The CouponDonation team', '',
    `We never email codes or card details.${o.sample ? ' This is a test message.' : ''}`, `Stop impact emails: ${o.stopUrl}`,
  ].filter((line) => line !== '').join('\n');
  return { subject, html, text };
}

export function renderUseReminderEmail(o: { brand: string; fundraiserTitle: string; dashboardUrl: string; firstName?: string | null; sample?: boolean }) {
  const intro = `A ${o.brand} card for “${o.fundraiserTitle}” was revealed seven days ago. If you used it, you may mark it used; adding a note or receipt is optional and never affects your help.`;
  const subject = 'A quick note about your fundraiser';
  const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head><body style="margin:0;background:#ffffff"><div style="display:none;max-height:0;overflow:hidden;opacity:0">A quick note from CouponDonation.</div><main style="max-width:560px;margin:0 auto;padding:28px 22px"><img src="${LOGO_URL}" width="32" height="32" alt="CouponDonation" style="display:block;width:32px;height:32px;margin-bottom:24px"><p style="font:15px/23px ${FONT};color:${INK}">Hi ${esc(o.firstName || 'there')},</p><p style="font:15px/23px ${FONT};color:${BODY}">${esc(intro)}</p><p style="font:15px/23px ${FONT}"><a href="${esc(o.dashboardUrl)}" style="color:${INK};text-decoration:underline">Open your fundraiser dashboard</a></p><p style="font:15px/23px ${FONT};color:${INK}">— The CouponDonation team</p><p style="font:12px/18px ${FONT};color:${MUTED}">This is the only reminder we’ll send for this card.${o.sample ? ' This is a test message.' : ''}</p></main></body></html>`;
  const text = [`Hi ${o.firstName || 'there'},`, '', intro, '', `Open your fundraiser dashboard: ${o.dashboardUrl}`, '', '— The CouponDonation team', '', `This is the only reminder we'll send for this card.${o.sample ? ' This is a test message.' : ''}`].join('\n');
  return { subject, html, text };
}