/** Personal proof-of-impact emails. Never contains spendable credentials. */
import { shell, escapeHtml, type RenderedEmail, type TimelineStep } from './email-layout.ts';

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

const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
export const etTime = (iso: string) => new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
}).format(new Date(iso));
const kindOf = (t?: string | null) => t === 'gift_card' ? 'card' : t === 'prepaid_link' ? 'prepaid card' : 'card';
const shown = (i: ImpactItem) => `${i.issuedBrand || i.brand} ${kindOf(i.type)}`;
const swapped = (i: ImpactItem) => !!i.issuedBrand && i.issuedBrand.toLowerCase() !== i.brand.toLowerCase();

export function renderImpactEmail(o: ImpactEmailInput): RenderedEmail {
  const anyUsed = o.items.some((i) => i.usedAt);
  const eventTime = (anyUsed ? o.items.find((i) => i.usedAt)?.usedAt : o.items.find((i) => i.receivedAt)?.receivedAt) ?? new Date().toISOString();
  const subject = o.kind === 'received'
    ? 'Your donation reached the organizer'
    : 'Your donation made an impact';
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
  const usedDetails = o.items.filter((i) => i.usedAt && (i.category || i.note)).flatMap((i) => [i.category ? `Used for: ${i.category}` : '', i.note ? `Organizer note: “${i.note}”` : '']).filter(Boolean);
  const createdAt = o.items[0]?.createdAt ?? o.donatedAt;
  const receivedAt = o.items.find((i) => i.receivedAt)?.receivedAt;
  const usedAt = o.items.find((i) => i.usedAt)?.usedAt;
  const timeline: TimelineStep[] = [
    { label: 'Donated', detail: etTime(o.donatedAt), complete: true },
    { label: 'Coupon created', detail: etTime(createdAt), complete: true },
    { label: 'Received', detail: receivedAt ? etTime(receivedAt) : undefined, complete: !!receivedAt },
    { label: 'Used', detail: usedAt ? etTime(usedAt) : undefined, complete: !!usedAt },
  ];
  const total = o.items.reduce((sum, i) => sum + Number(i.value), 0);
  const html = shell({
    preheader: 'There is an update about your donation.', greeting: `Hi ${o.donorFirstName || 'there'}`,
    status: o.kind === 'received' ? 'Donation received' : o.kind === 'used' ? 'Donation used' : 'Donation update',
    headline: o.kind === 'received' ? 'Your donation reached the organizer' : 'Your donation made an impact',
    paragraphs: [intro, ...disclosures, ...(topup ? [topup] : []), ...usedDetails],
    valueCard: { label: 'Donation impact', value: usd(total), details: [o.fundraiserTitle, `${o.items.length} ${o.items.length === 1 ? 'item' : 'items'} tracked`] },
    timeline, link: { label: 'View your donation update', url: o.impactUrl },
    secondaryLink: o.kind === 'used' ? { label: 'Thank the organizer', url: o.thankUrl } : undefined,
    footer: `We never email codes or card details. Retailers do not tell us what was purchased; any use details were shared by the organizer.${o.sample ? ' This is a test message.' : ''}<br><a href="${escapeHtml(o.stopUrl)}" style="color:#6f7b74;text-decoration:underline;">Stop impact emails</a>`, sample: o.sample,
  });
  const timelineText = timeline.map((s) => `${s.complete ? '●' : '○'} ${s.label}${s.detail ? ` · ${s.detail}` : ''}`);
  const text = [
    `Hi ${o.donorFirstName || 'there'},`, '', intro, '', `${usd(total)} · ${o.fundraiserTitle}`, '', ...timelineText, '', ...disclosures, topup, ...usedDetails, '',
    `View your donation update: ${o.impactUrl}`, '', '— The CouponDonation team', '',
    `We never email codes or card details.${o.sample ? ' This is a test message.' : ''}`, `Stop impact emails: ${o.stopUrl}`,
  ].filter((line) => line !== '').join('\n');
  return { subject, html, text, headers: { 'List-Unsubscribe': `<${o.stopUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
}

export function renderUseReminderEmail(o: { brand: string; fundraiserTitle: string; dashboardUrl: string; firstName?: string | null; sample?: boolean }) {
  const intro = `A ${o.brand} card for “${o.fundraiserTitle}” was revealed seven days ago. If you used it, you may mark it used; adding a note or receipt is optional and never affects your help.`;
  const subject = 'A quick note about your fundraiser';
  const html = shell({ preheader: 'A quick note from CouponDonation.', greeting: `Hi ${o.firstName || 'there'}`, status: 'Organizer reminder', headline: 'A quick check-in', paragraphs: [intro], valueCard: { label: 'Fundraiser', value: o.fundraiserTitle, details: [o.brand] }, link: { label: 'Open your fundraiser dashboard', url: o.dashboardUrl }, footer: `This is the only reminder we’ll send for this card.${o.sample ? ' This is a test message.' : ''}`, sample: o.sample });
  const text = [`Hi ${o.firstName || 'there'},`, '', intro, '', `Open your fundraiser dashboard: ${o.dashboardUrl}`, '', '— The CouponDonation team', '', `This is the only reminder we'll send for this card.${o.sample ? ' This is a test message.' : ''}`].join('\n');
  return { subject, html, text };
}