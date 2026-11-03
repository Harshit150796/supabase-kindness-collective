import { Badge } from '@/components/ui/badge';

export type EmailRow = {
  id: string; sent_at: string; to_email: string; to: { user_id: string; name?: string | null; email?: string | null } | null; from_email: string | null;
  subject: string | null; category: 'site' | 'team' | 'outreach'; last_event: string | null; fundraiser: { id: string; title: string } | null;
  sent_by: { name?: string | null; email?: string | null } | null; body: string | null;
};

/** Resend's last event for an email, in plain words. */
const LABEL: Record<string, string> = {
  delivered: 'Delivered', opened: 'Opened', clicked: 'Link clicked', bounced: 'Bounced', complained: 'Marked as spam', suppressed: 'Not sent (blocked address)',
  failed: 'Failed', canceled: 'Canceled', delivery_delayed: 'Delayed', sent: 'Sent', queued: 'Queued', scheduled: 'Scheduled',
};
const PROBLEM = new Set(['bounced', 'complained', 'suppressed', 'failed', 'canceled']);

export function EmailStatus({ row }: { row: Pick<EmailRow, 'last_event'> }) {
  const e = row.last_event ?? 'sent';
  return <Badge variant={PROBLEM.has(e) ? 'destructive' : ['delivered', 'opened', 'clicked'].includes(e) ? 'default' : 'secondary'}>{LABEL[e] ?? e}</Badge>;
}
