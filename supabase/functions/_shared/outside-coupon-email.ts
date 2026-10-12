// Donor confirmation for a coupon added by staff from an outside source (not a site checkout).
// Never contains codes, PINs, amounts or links other than the public fundraiser page.
import { SUPPORT_LINE, shell } from './email-layout.ts';

export function renderOutsideCouponEmail(o: { donorName?: string | null; fundraiserTitle: string; fundraiserUrl: string; brand: string; test?: boolean }) {
  const first = o.donorName?.trim().split(/\s+/)[0] || 'there';
  const subject = 'Your gift to a fundraiser was received';
  const intro = `Thank you. Your ${o.brand} gift for “${o.fundraiserTitle}” was received and passed to the organizer. They will see it in their fundraiser dashboard.`;
  const html = shell({ preheader: 'Your gift reached the fundraiser organizer.', greeting: `Hi ${first}`, status: 'Gift received', headline: 'Your gift was received',
    paragraphs: [intro, 'The details stay private to the organizer and are never sent by email.'],
    link: { label: 'View the fundraiser', url: o.fundraiserUrl }, footer: o.test ? 'This is a test message.' : undefined, sample: o.test });
  const text = [`Hi ${first},`, '', intro, '', `View the fundraiser: ${o.fundraiserUrl}`, '', '— The CouponDonation team', '', SUPPORT_LINE].join('\n');
  return { subject, html, text };
}
