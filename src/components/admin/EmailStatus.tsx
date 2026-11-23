import { cn } from '@/lib/utils';
import type { EmailRow } from '@/lib/emailTopics';
export type { EmailRow } from '@/lib/emailTopics';

/** Resend's last event for an email, in plain words. */
const LABEL: Record<string, string> = {
  delivered: 'Delivered, not opened', opened: 'Opened', clicked: 'Opened, link clicked', bounced: 'Bounced', complained: 'Marked as spam', suppressed: 'Not sent (blocked address)',
  failed: 'Failed', canceled: 'Canceled', delivery_delayed: 'Delayed', sent: 'Sent', queued: 'Queued', scheduled: 'Scheduled',
};
export const PROBLEM = new Set(['bounced', 'complained', 'suppressed', 'failed', 'canceled']);

/** Open tracking was switched on for site emails at this time (Resend, Nov 4, 2026). */
export const OPENS_TRACKED_SINCE = '2026-11-04T16:40:00Z';
/** The last site email seen opened before Resend's open tracking went off (Nov 2026); for rows without opens_tracked. */
export const OPENS_TRACKED_UNTIL = '2026-11-20T18:52:00Z';

type StatusRow = Pick<EmailRow, 'last_event'> & Partial<Pick<EmailRow, 'sent_at' | 'category' | 'opens_tracked'>>;

/** Whether "not opened" means anything for this email: only where opens were tracked when it went out. */
export function opensTracked(row: StatusRow) {
  if (typeof row.opens_tracked === 'boolean') return row.opens_tracked;
  return row.category !== 'outreach' && !!row.sent_at && row.sent_at >= OPENS_TRACKED_SINCE && row.sent_at <= OPENS_TRACKED_UNTIL;
}

export function emailStatusLabel(row: StatusRow, short?: boolean) {
  const e = row.last_event ?? 'sent';
  return (short || !opensTracked(row)) && e === 'delivered' ? 'Delivered' : LABEL[e] ?? e;
}

const TONE = (e: string) => PROBLEM.has(e) ? 'bg-destructive/10 text-destructive'
  : ['opened', 'clicked'].includes(e) ? 'bg-primary/10 text-primary'
  : e === 'delivered' ? 'bg-muted text-foreground'
  : 'bg-verify/10 text-verify';

export function EmailStatus({ row, short, className }: { row: StatusRow; short?: boolean; className?: string }) {
  const e = row.last_event ?? 'sent';
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium', TONE(e), className)}>{emailStatusLabel(row, short)}</span>;
}
