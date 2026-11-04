import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, Clock, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { rpc, fmtDate } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

type Mail = { id: string; last_event: string | null; opened_at: string | null; to_email: string; subject: string | null } | null;
type Step = { at: string | null; email: Mail; skipped?: string | null; error?: string | null } | null;
type Row = {
  id: string; brand: string; value: number; created_at: string; stage: 'waiting' | 'revealed' | 'reminder_due' | 'used';
  fundraiser: { id: string; title: string }; organizer: { name?: string | null; email?: string | null } | null;
  from: { kind: 'donation' | 'company' | 'outside'; name: string; email: string | null } | null;
  organizer_told: Step; revealed_at: string | null; used_at: string | null; used_category: string | null;
  donor_told_received: Step; donor_told_used: Step;
  reminder: { sent_at: string | null; email: Mail; due_at: string | null };
};

const STAGES: Array<[string, string]> = [['all', 'All'], ['waiting', 'Not opened yet'], ['revealed', 'Opened, not used'], ['reminder_due', 'Reminder due'], ['used', 'Used']];
const PAGE = 20;
const usd = (n: number) => `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`;
const SKIP: Record<string, string> = { no_email: 'no email on file', impact_optout: 'they opted out', coupon_not_live: 'coupon no longer active', no_fundraiser: 'fundraiser missing', donation_not_completed: 'donation not completed', no_live_coupons: 'coupon no longer active' };

/** One step of a coupon's journey: done (with when and the email's status), waiting, or skipped. */
function StepCell({ label, done, at, mail, note, waiting, who = 'email' }: { label: string; done: boolean; at?: string | null; mail?: Mail; note?: string | null; waiting?: string | null; who?: string }) {
  const opened = mail?.last_event === 'opened' || mail?.last_event === 'clicked';
  const problem = !!mail?.last_event && ['bounced', 'complained', 'suppressed', 'failed'].includes(mail.last_event);
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs font-medium">
        {done ? <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> : note ? <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> : waiting ? <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> : <Circle className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />}
        {label}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {done && at ? fmtDate(at) : note ? note : waiting ?? 'Not yet'}
        {mail && <span className={cn('ml-1', problem ? 'text-destructive' : opened ? 'text-primary' : '')}>· {who} {problem ? 'bounced' : opened ? 'opened' : mail.last_event === 'delivered' ? 'delivered' : 'sent'}</span>}
      </p>
    </div>
  );
}

/** Every coupon that went to a family: did they get the email, open the coupon, get the reminder, use it, and was the giver told. */
export function CouponFollowups() {
  const [params, setParams] = useSearchParams();
  const stage = params.get('stage') ?? 'all';
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: ['adm-coupon-followups', stage, search, page],
    queryFn: () => rpc<{ rows: Row[]; total: number; counts: Record<string, number> }>('admin_coupon_followups', { _status: stage, _search: search, _limit: PAGE, _offset: page * PAGE }),
    refetchInterval: 60_000,
  });
  const counts = q.data?.counts ?? {};
  const countOf = (k: string) => k === 'all' ? Object.values(counts).reduce((a, b) => a + b, 0) : k === 'revealed' ? (counts.revealed ?? 0) + (counts.reminder_due ?? 0) : counts[k] ?? 0;
  const set = (k: string, v: string | null) => setParams((p) => { if (v) p.set(k, v); else p.delete(k); if (k !== 'page') p.delete('page'); return p; });
  const pages = Math.max(1, Math.ceil((q.data?.total ?? 0) / PAGE));

  return (
    <div>
      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">Each coupon sent to a family and what happened next: the email telling them it arrived, when they opened it, the reminder 7 days later if they hadn't marked it used, and the updates to whoever gave it.</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input className="h-9 pl-8" aria-label="Search coupons" placeholder="Fundraiser or store" value={search} onChange={(e) => { setSearch(e.target.value); set('page', null); }} /></div>
        <div role="group" aria-label="Filter by step" className="flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {STAGES.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={stage === k} onClick={() => set('stage', k === 'all' ? null : k)}
              className={cn('inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors', stage === k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {l}<span className="tabular-nums opacity-70">{q.data ? countOf(k) : ''}</span></button>
          ))}
        </div>
      </div>
      {q.isLoading ? <p className="py-8 text-sm text-muted-foreground">Loading…</p> : q.error ? <p className="py-8 text-sm text-destructive">{(q.error as Error).message}</p>
        : !q.data?.rows.length ? <p className="py-8 text-sm text-muted-foreground">No coupons in this view.</p> : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {q.data.rows.map((r) => {
            const giver = r.from?.kind === 'company' ? 'CouponDonation' : r.from?.name ?? 'Donor';
            const received = r.donor_told_received, used = r.donor_told_used;
            return (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{usd(r.value)} {r.brand} <span className="font-normal text-muted-foreground">for</span> <Link className="text-primary underline-offset-4 hover:underline" to={`/admin/fundraisers?id=${r.fundraiser.id}&tab=coupons`}>{r.fundraiser.title}</Link></p>
                  <p className="text-xs text-muted-foreground">Given by {giver}{r.from?.kind === 'company' ? ' (company)' : ''} · added {fmtDate(r.created_at)} · family: {r.organizer?.name || r.organizer?.email || '—'}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <StepCell label="Family emailed" done={!!r.organizer_told?.at} at={r.organizer_told?.at} mail={r.organizer_told?.email} note={r.organizer_told?.error ? 'email failed' : null} />
                  <StepCell label="Family opened it" done={!!r.revealed_at} at={r.revealed_at} waiting={r.revealed_at ? null : 'Waiting'} />
                  <StepCell label="Reminder (day 7)" done={!!r.reminder.sent_at} at={r.reminder.sent_at} mail={r.reminder.email}
                    note={!r.reminder.sent_at && r.used_at ? 'Not needed, used' : null}
                    waiting={!r.reminder.sent_at && r.reminder.due_at ? (new Date(r.reminder.due_at) <= new Date() ? 'Due now, sends within 5 minutes' : `Due ${fmtDate(r.reminder.due_at)}`) : !r.revealed_at ? 'After they open it' : null} />
                  <StepCell label="Giver told it arrived" done={!!received?.at} at={received?.at} mail={received?.email}
                    note={received?.skipped ? `Skipped: ${SKIP[received.skipped] ?? received.skipped}` : received?.error ? 'Email failed, retrying' : null}
                    waiting={r.revealed_at ? (received ? 'Sending' : 'Within 5 minutes') : 'After they open it'} />
                  <StepCell label={r.used_at ? `Used${r.used_category ? ` · ${r.used_category}` : ''}` : 'Marked used'} done={!!r.used_at} at={r.used_at}
                    mail={used?.email} who="giver email" note={used?.skipped ? `Giver not told: ${SKIP[used.skipped] ?? used.skipped}` : null} waiting={r.used_at ? null : 'Not yet'} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {pages > 1 && <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => set('page', String(page - 1))}>Previous</Button>
        <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
        <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => set('page', String(page + 1))}>Next</Button>
      </div>}
    </div>
  );
}
