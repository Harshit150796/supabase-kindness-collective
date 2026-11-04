import { Badge } from '@/components/ui/badge';
import type { EmailRow } from '@/lib/emailTopics';
export type { EmailRow } from '@/lib/emailTopics';

/** Resend's last event for an email, in plain words. */
const LABEL: Record<string, string> = {
  delivered: 'Delivered, not opened', opened: 'Opened', clicked: 'Opened, link clicked', bounced: 'Bounced', complained: 'Marked as spam', suppressed: 'Not sent (blocked address)',
  failed: 'Failed', canceled: 'Canceled', delivery_delayed: 'Delayed', sent: 'Sent', queued: 'Queued', scheduled: 'Scheduled',
};
const PROBLEM = new Set(['bounced', 'complained', 'suppressed', 'failed', 'canceled']);

/** Open tracking was switched on for site emails at this time (Resend, Nov 4, 2026). */
export const OPENS_TRACKED_SINCE = '2026-11-04T16:40:00Z';

export function EmailStatus({ row, short }: { row: Pick<EmailRow, 'last_event'> & Partial<Pick<EmailRow, 'sent_at' | 'category'>>; short?: boolean }) {
  const e = row.last_event ?? 'sent';
  // "Not opened" only means something where opens are tracked.
  const untracked = row.category === 'outreach' || (!!row.sent_at && row.sent_at < OPENS_TRACKED_SINCE);
  const label = (short || untracked) && e === 'delivered' ? 'Delivered' : LABEL[e] ?? e;
  return <Badge className="whitespace-nowrap" variant={PROBLEM.has(e) ? 'destructive' : ['opened', 'clicked'].includes(e) ? 'default' : 'secondary'}>{label}</Badge>;
}
