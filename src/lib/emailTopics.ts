// Shapes and labels for the admin email log (admin_email_log, email_topic() in the database).

export type EmailRow = {
  id: string; sent_at: string; to_email: string; to: { user_id: string; name?: string | null; email?: string | null } | null; from_email: string | null;
  subject: string | null; category: 'site' | 'team' | 'outreach'; topic?: string | null; last_event: string | null; fundraiser: { id: string; title: string } | null;
  sent_by: { name?: string | null; email?: string | null } | null; body: string | null;
  delivered_at?: string | null; opened_at?: string | null; clicked_at?: string | null; problem_at?: string | null;
};

/** What each email is about (email_topic() in the database). */
export const TOPICS: Array<[string, string]> = [
  ['all', 'All topics'], ['family', 'Coupons to families'], ['donor', 'Donor receipts and updates'], ['fundraiser', 'Fundraiser updates'],
  ['account', 'Sign-in and account'], ['messages', 'Message notices'], ['team', 'Written by the team'], ['alerts', 'Alerts to the team'],
  ['outreach', 'Church outreach'], ['other', 'Other'],
];
export const topicLabel = (t?: string | null) => TOPICS.find(([k]) => k === t)?.[1] ?? 'Other';

