/** Personal proof-of-impact emails. Never contains spendable credentials. */
import { shell, escapeHtml, SUPPORT_LINE, type RenderedEmail, type TimelineStep } from './email-layout.ts';

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
  const total = o.items.reduce((sum, i) => sum + Number(i.value), 0);
  const one = o.items.length === 1 ? o.items[0] : null;
  // No names in emails (founder decision, Nov 15, 2026): "the organizer of <fundraiser>", never a person's name.
  const what = one ? `${usd(one.value)} ${shown(one)}` : `${o.items.length} cards (${usd(total)} in total)`;
  // No amount, store or product word in the subject (delivery rule); the first line carries them.
  const subject = o.kind === 'received' ? 'Your donation was received' : 'Your donation was used';
  const who = `The organizer of “${o.fundraiserTitle}”`;
  const intro = o.kind === 'received'
    ? `${who} received what your donation became: ${one ? 'a ' : ''}${what}. We’ll tell you when ${one ? 'it is' : 'they are'} marked used.`
    : o.kind === 'used'
    ? `${who} used the ${what} your donation became.`
    : `${who} received the ${what} your donation became, and has already used ${one ? 'it' : 'them'}.`;
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
  const html = shell({
    preheader: intro, greeting: `Hi ${o.donorFirstName || 'there'}`, headline: subject,
    paragraphs: [intro, ...disclosures, ...(topup ? [topup] : []), ...usedDetails],
    valueCard: { label: 'Donation impact', value: usd(total), details: [o.fundraiserTitle, `${o.items.length} ${o.items.length === 1 ? 'item' : 'items'} tracked`] },
    timeline, link: { label: 'See your donation’s journey', url: o.impactUrl },
    secondaryLink: o.kind === 'used' ? { label: 'Thank the organizer', url: o.thankUrl } : undefined,
    footer: `We never email codes or card details. Retailers do not tell us what was purchased; any use details were shared by the organizer.${o.sample ? ' This is a test message.' : ''}<br><a href="${escapeHtml(o.stopUrl)}" style="color:#6f7b74;text-decoration:underline;">Stop impact emails</a>`, sample: o.sample,
  });
  const timelineText = timeline.map((s) => `${s.complete ? '●' : '○'} ${s.label}${s.detail ? ` · ${s.detail}` : ''}`);
  const text = [
    `Hi ${o.donorFirstName || 'there'},`, '', intro, '', `${usd(total)} · ${o.fundraiserTitle}`, '', ...timelineText, '', ...disclosures, topup, ...usedDetails, '',
    `See your donation’s journey: ${o.impactUrl}`, '', '— The CouponDonation team', '',
    `We never email codes or card details.${o.sample ? ' This is a test message.' : ''}`, SUPPORT_LINE, `Stop impact emails: ${o.stopUrl}`,
  ].filter((line) => line !== '').join('\n');
  return { subject, html, text, headers: { 'List-Unsubscribe': `<${o.stopUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } };
}

/** Follow-up to the giver of an outside coupon (a company gift, a donated card, a gift handed over):
 *  when the family received it, and when they used it. Never contains the code. */
export function renderOutsideGiftEmail(o: {
  kind: 'received' | 'used'; brand: string; value: number; fundraiserTitle: string; fundraiserUrl: string | null; organizer: string;
  at: string; category?: string | null; firstName?: string | null;
}): RenderedEmail {
  const used = o.kind === 'used';
  const what = `${usd(o.value)} ${o.brand} card`;
  const subject = used ? 'Your gift was used' : 'Your gift was received';
  const who = `The organizer of “${o.fundraiserTitle}”`;
  const intro = used
    ? `${who} used the ${what} you gave, on ${etTime(o.at)}.${o.category ? ` It went toward ${o.category.toLowerCase()}.` : ''} Thank you.`
    : `${who} opened the ${what} you gave, on ${etTime(o.at)}. It’s ready for them to use.`;
  const html = shell({
    preheader: used ? 'Your gift was used.' : 'Your gift was received.', greeting: `Hi ${o.firstName || 'there'}`, headline: subject, paragraphs: [intro],
    valueCard: { label: 'Fundraiser', value: o.fundraiserTitle, details: [what] },
    timeline: [{ label: 'Gift added', complete: true }, { label: 'Received by the organizer', complete: true }, { label: 'Used', complete: used }],
    link: o.fundraiserUrl ? { label: 'See the fundraiser', url: o.fundraiserUrl } : undefined,
    footer: "Codes and card details are never included in email. Don't want these updates? Reply to this email and we'll stop them.",
  });
  const text = [`Hi ${o.firstName || 'there'},`, '', intro, ...(o.fundraiserUrl ? ['', `See the fundraiser: ${o.fundraiserUrl}`] : []), '', '— The CouponDonation team', '',
    "Don't want these updates? Reply to this email and we'll stop them.", SUPPORT_LINE].join('\n');
  return { subject, html, text };
}

export function renderUseReminderEmail(o: { brand: string; fundraiserTitle: string; dashboardUrl: string; firstName?: string | null; sample?: boolean }) {
  const paragraphs = [
    `You opened your ${o.brand} card for “${o.fundraiserTitle}” a week ago. Did it work at the store?`,
    'If you’ve used it, tap “Mark used”. The person who gave is told their gift was used. You can add a short note for them. That part is optional and never affects your help.',
  ];
  const closing = 'If anything went wrong with the card, reply and we’ll fix it.';
  const only = `This is the only reminder for this card.${o.sample ? ' This is a test message.' : ''}`;
  const subject = 'Did your card work?';
  const html = shell({ preheader: 'If you’ve used it, mark it used. The person who gave is told.', greeting: `Hi ${o.firstName || 'there'}`, headline: subject, paragraphs, closing: [closing],
    link: { label: 'Mark it used', url: o.dashboardUrl }, footer: only, sample: o.sample });
  const text = [`Hi ${o.firstName || 'there'},`, '', ...paragraphs.flatMap((p) => [p, '']), closing, '', `Mark it used: ${o.dashboardUrl}`, '', '— The CouponDonation team', '', only, SUPPORT_LINE].join('\n');
  return { subject, html, text };
}
