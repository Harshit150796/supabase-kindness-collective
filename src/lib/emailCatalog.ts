/**
 * Every automatic email the site sends, for Admin > Emails > Automatic emails (founder request, Nov 15, 2026).
 * `sample` is the key admin-contact previews and tests (SAMPLE_EMAILS on the server); `switchKey` is its
 * on/off switch (email_automations); `countKey` is how it is counted (account_emails.kind).
 */
export type CatalogEmail = { sample: string; name: string; when: string; switchKey?: string; countKey?: string; optional?: boolean };
export type CatalogGroup = { title: string; note: string; emails: CatalogEmail[] };

export const EMAIL_CATALOG: CatalogGroup[] = [
  {
    title: 'To people who run a fundraiser',
    note: 'These help organizers share their own fundraiser. Donors are never named: an email says “a donor” and the amount.',
    emails: [
      { sample: 'fundraiser_live', name: 'You’re live', when: 'About 10 minutes after a fundraiser goes live. A short note with their link and a message to copy.', countKey: 'fundraiser_live' },
      { sample: 'organizer_gift_first', name: 'A gift came in', when: 'At once for the first gift, then at most one a day covering every new gift.', switchKey: 'organizer_gift', countKey: 'organizer_gift' },
      { sample: 'organizer_nudge', name: 'Two days, no gift yet', when: 'Two days after going live, if nobody has given. One message to send to one person.', switchKey: 'organizer_nudge', countKey: 'organizer_nudge', optional: true },
      { sample: 'organizer_week', name: 'First week', when: 'Seven days after going live. Suggests asking a church, school or group.', switchKey: 'organizer_week', countKey: 'organizer_week', optional: true },
      { sample: 'organizer_halfway', name: 'Halfway to the goal', when: 'When gifts pass half of the goal.', switchKey: 'organizer_halfway', countKey: 'organizer_halfway', optional: true },
      { sample: 'organizer_goal', name: 'Goal reached', when: 'When gifts reach the goal. Asks them to thank the people who gave.', switchKey: 'organizer_goal', countKey: 'organizer_goal' },
      { sample: 'organizer_quiet', name: 'Gone quiet', when: 'After three weeks live with no gift for ten days. Suggests posting an update.', switchKey: 'organizer_quiet', countKey: 'organizer_quiet', optional: true },
      { sample: 'coupon_ready', name: 'A card is ready', when: 'When the team adds a coupon or card to their fundraiser.' },
      { sample: 'card_reminder', name: 'Did your card work?', when: 'Seven days after they open a card, if it isn’t marked used. Sent once per card.' },
    ],
  },
  {
    title: 'To donors',
    note: 'One email at each step of a gift: confirmed, received, used.',
    emails: [
      { sample: 'donation_confirmation', name: 'Thank you (donation confirmed)', when: 'A few minutes after a donation is paid.', countKey: 'donation_confirmation' },
      { sample: 'donation_received', name: 'Your donation was received', when: 'When the organizer opens the card the donation became.' },
      { sample: 'donation_used', name: 'Your donation was used', when: 'When the organizer marks the card used.' },
      { sample: 'outside_gift', name: 'We received your gift', when: 'When the team adds a card someone gave outside checkout.' },
      { sample: 'update_notice', name: 'A fundraiser posted an update', when: 'When a fundraiser they gave to posts an update. Includes its first lines.' },
    ],
  },
  {
    title: 'Messages and account',
    note: 'Short notices. All are always on except the welcome, which has its own switch.',
    emails: [
      { sample: 'team_message_notice', name: 'New message from our team', when: 'Ten minutes after the team posts in an organizer’s inbox without emailing the message itself.' },
      { sample: 'message_notice', name: 'New message', when: 'When someone messages them on the site. The message itself stays on the site.' },
      { sample: 'team_invite', name: 'Invitation to co-organize', when: 'When an organizer invites someone to help run a fundraiser.' },
      { sample: 'contact_receipt', name: 'We got your message', when: 'When someone sends the contact form. Promises a reply within one working day.' },
      { sample: 'welcome', name: 'Welcome', when: 'An hour after someone opens an account, unless they started a fundraiser (they get “You’re live” instead). Once per account, only for accounts opened while it’s on.', switchKey: 'welcome', countKey: 'welcome' },
      { sample: 'sign_in_code', name: 'Verification code', when: 'When someone confirms their email address. Two lines of plain text with no links (emails with links to our site were landing in Spam).' },
      { sample: 'password_reset', name: 'Password reset', when: 'When someone asks to reset their password.' },
    ],
  },
];

export type AutomationState = {
  switches: Array<{ key: string; enabled: boolean; enabled_at: string | null }>;
  counts: Record<string, { sent: number; skipped: number; failed: number; last: string | null }>;
};
