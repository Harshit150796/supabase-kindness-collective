// Every automatic email with sample data, for the previews and "send me a test" in Admin > Emails.
// Sample names, titles and amounts only: nothing here reads the database.
import { renderNoticeEmail, renderOtpEmail, renderPasswordResetEmail, type RenderedEmail } from './email-layout.ts';
import { renderDonationConfirmation, renderFundraiserLive } from './account-emails.ts';
import { renderOrganizerGift, renderOrganizerGoal, renderOrganizerHalfway, renderOrganizerNudge, renderOrganizerQuiet, renderOrganizerWeek } from './organizer-emails.ts';
import { renderOwnerCouponEmail } from './owner-alerts.ts';
import { renderImpactEmail, renderUseReminderEmail } from './impact-email.ts';
import { renderOutsideCouponEmail } from './outside-coupon-email.ts';
import { renderContactConfirmation } from './contact-message.ts';

const SITE = 'https://coupondonation.com';
const ID = '11111111-2222-4333-8444-555555555555';
const base = { firstName: 'Maria', title: 'Groceries for our family', slug: 'sample', id: ID, stores: ['Walmart', 'Kroger'], beneficiary: 'family', test: true };
const stop = { stopUrl: `${SITE}/unsubscribe` };
const numbers = { raised: 250, goal: 500, givers: 6 };
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const impact = { fundraiserTitle: base.title, organizer: 'The organizer', donorFirstName: 'Sam', donatedAt: hoursAgo(50), impactUrl: `${SITE}/impact/sample`, thankUrl: `${SITE}/impact/sample#thanks`, stopUrl: `${SITE}/impact/sample`, sample: true };

export const SAMPLE_EMAILS: Record<string, () => RenderedEmail> = {
  fundraiser_live: () => renderFundraiserLive(base),
  organizer_gift: () => renderOrganizerGift({ ...base, ...numbers, raised: 115, amount: 40, count: 1, first: false }),
  organizer_gift_first: () => renderOrganizerGift({ ...base, ...numbers, raised: 25, givers: 1, amount: 25, count: 1, first: true }),
  organizer_nudge: () => renderOrganizerNudge({ ...base, ...stop }),
  organizer_week: () => renderOrganizerWeek({ ...base, ...stop, raised: 75, goal: 500, givers: 3 }),
  organizer_halfway: () => renderOrganizerHalfway({ ...base, ...stop, ...numbers }),
  organizer_goal: () => renderOrganizerGoal({ ...base, raised: 500, goal: 500, givers: 11 }),
  organizer_quiet: () => renderOrganizerQuiet({ ...base, ...stop }),
  coupon_ready: () => renderOwnerCouponEmail({ fundraiserTitle: base.title, items: [{ brand: 'Walmart', value: 25, type: 'gift_card' }], dashboardUrl: `${SITE}/fundraiser/${ID}#coupons`, firstName: 'Maria', test: true }),
  card_reminder: () => renderUseReminderEmail({ brand: 'Walmart', fundraiserTitle: base.title, dashboardUrl: `${SITE}/fundraiser/${ID}#coupons`, firstName: 'Maria', sample: true }),
  donation_confirmation: () => renderDonationConfirmation({ firstName: 'Sam', amount: 25, at: hoursAgo(0), donationId: ID, fundraiserTitle: base.title, fundraiserUrl: 'https://share.coupondonation.com/f/sample', link: { label: 'Follow your donation', url: `${SITE}/impact/sample` }, test: true }),
  donation_received: () => renderImpactEmail({ ...impact, kind: 'received', items: [{ brand: 'Walmart', value: 25, type: 'gift_card', createdAt: hoursAgo(30), receivedAt: hoursAgo(1) }] }),
  donation_used: () => renderImpactEmail({ ...impact, kind: 'used', items: [{ brand: 'Walmart', value: 25, type: 'gift_card', createdAt: hoursAgo(30), receivedAt: hoursAgo(20), usedAt: hoursAgo(1), category: 'Groceries', note: 'Thank you. This covered the week.' }] }),
  outside_gift: () => renderOutsideCouponEmail({ donorName: 'Sam', fundraiserTitle: base.title, fundraiserUrl: `${SITE}/f/sample`, brand: 'Target', test: true }),
  message_notice: () => renderNoticeEmail({ subject: `New message about “${base.title}”`, heading: 'You have a new message', intro: `Someone sent you a message about “${base.title}”. For your safety, the message is only shown on the site.`, ctaLabel: 'Open messages', ctaUrl: `${SITE}/messages`, footerNote: 'You can turn account notification emails off in Settings.', firstName: 'Maria' }),
  team_message_notice: () => renderNoticeEmail({ subject: 'New message from the CouponDonation team', heading: 'A message from our team', intro: `We sent you a message about your fundraiser “${base.title}”. Open your messages to read it and reply.`, ctaLabel: 'Open messages', ctaUrl: `${SITE}/messages`, footerNote: 'You can turn account notification emails off in Settings.', firstName: 'Maria' }),
  update_notice: () => renderNoticeEmail({ subject: `“${base.title}” posted an update`, heading: 'A new update', intro: `“${base.title}”, a fundraiser you gave to, posted an update.`, quote: '“Thank you: We did our first big shop on Saturday. Thank you all.”', ctaLabel: 'Read the update', ctaUrl: `${SITE}/f/sample`, footerNote: 'You can turn account notification emails off in Settings.', firstName: 'Sam' }),
  team_invite: () => renderNoticeEmail({ subject: `You’re invited to co-organize “${base.title}”`, heading: 'Join a fundraiser team', intro: `You’ve been invited to co-organize “${base.title}” on CouponDonation. Sign in with this email address to accept.`, quote: 'Don’t know this fundraiser? Ignore this email and nothing happens.', ctaLabel: 'Accept the invitation', ctaUrl: `${SITE}/team/accept` }),
  contact_receipt: () => renderContactConfirmation({ name: 'Sam Parker', topic: 'donation', state: 'NY', createdAt: hoursAgo(0) } as Parameters<typeof renderContactConfirmation>[0]),
  sign_in_code: () => renderOtpEmail({ code: '000000', expiresInMinutes: 10 }),
  password_reset: () => renderPasswordResetEmail({ resetUrl: `${SITE}/reset-password`, expiresInMinutes: 60 }),
};

export function sampleEmail(key: string): RenderedEmail | null {
  const make = SAMPLE_EMAILS[key];
  return make ? make() : null;
}
