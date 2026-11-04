import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { EmailStatus } from '@/components/admin/EmailStatus';
import { TOPICS, topicLabel, type EmailRow } from '@/lib/emailTopics';
import { CouponFollowups } from '@/components/admin/CouponFollowups';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rpc, fmtDate } from '@/lib/adminApi';

const PAGE = 25;
const CATEGORIES: Array<[string, string]> = [['not_outreach', 'Site and team emails'], ['site', 'Sent by the site'], ['team', 'Written by the team'], ['outreach', 'Church outreach'], ['all', 'Everything']];
const STATUSES: Array<[string, string]> = [['all', 'Any status'], ['opened', 'Opened'], ['not_opened', 'Delivered, not opened'], ['delivered', 'Delivered'], ['problem', 'Bounced or blocked'], ['pending', 'Not confirmed yet']];
const PERIODS: Array<[string, string]> = [['all', 'Any time'], ['1', 'Last 24 hours'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']];
type Log = { rows: EmailRow[]; total: number; totals: { sent: number; delivered: number; opened: number; problem: number }; synced_at: string | null; history_complete: boolean; oldest: string | null; opens_since: string | null };

/** Sent, delivered, opened, clicked or bounced, with when we saw each. */
function Timeline({ e, opensSince }: { e: EmailRow; opensSince: string | null }) {
  const problem = e.last_event && ['bounced', 'complained', 'suppressed', 'failed', 'canceled'].includes(e.last_event);
  const steps: Array<{ label: string; at: string | null | undefined; done: boolean; bad?: boolean }> = [
    { label: 'Sent', at: e.sent_at, done: true },
    ...(problem ? [{ label: e.last_event === 'complained' ? 'Marked as spam' : e.last_event === 'suppressed' ? 'Blocked (address bounced before)' : 'Bounced', at: e.problem_at, done: true, bad: true }]
      : [{ label: 'Delivered', at: e.delivered_at, done: !!e.delivered_at }, { label: 'Opened', at: e.opened_at, done: !!e.opened_at }, ...(e.clicked_at ? [{ label: 'Link clicked', at: e.clicked_at, done: true }] : [])]),
  ];
  const tracked = opensSince && new Date(e.sent_at) >= new Date(opensSince);
  return (
    <div className="mt-4">
      <ol className="space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            {s.done ? <Check className={`h-4 w-4 ${s.bad ? 'text-destructive' : 'text-primary'}`} aria-hidden="true" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />}
            <span className={s.done ? '' : 'text-muted-foreground'}>{s.label}</span>
            <span className="ml-auto text-xs text-muted-foreground">{s.done && s.at ? fmtDate(s.at) : s.done ? '' : 'Not yet'}</span>
          </li>
        ))}
      </ol>
      {!problem && !e.opened_at && <p className="mt-2 text-xs text-muted-foreground">{tracked || e.category === 'outreach'
        ? e.category === 'outreach' ? 'Opens are not tracked for church outreach.' : 'Not opened yet. Some mail apps hide opens, so “not opened” isn’t always certain.'
        : 'Sent before open tracking started, so we can’t tell if it was opened.'}</p>}
    </div>
  );
}

/**
 * Every email the site sent (receipts, coupon notices, reminders, sign-in codes, team messages …), copied
 * from Resend every few minutes with its delivery status, plus the coupon follow-ups view. Only
 * team-written emails keep their text.
 */
export default function AdminEmails() {
  const { isStaff } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'followups' ? 'followups' : 'all';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [dq, setDq] = useState(search);
  const category = params.get('category') ?? 'not_outreach';
  const status = params.get('status') ?? 'all';
  const topic = params.get('topic') ?? 'all';
  const days = params.get('days') ?? 'all';
  const user = params.get('user');
  const fundraiser = params.get('fundraiser');
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [open, setOpen] = useState<EmailRow | null>(null);
  const set = (key: string, value: string | null) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); if (key !== 'page') p.delete('page'); return p; });
  useEffect(() => { const t = setTimeout(() => { setDq(search); if (search !== (params.get('q') ?? '')) set('q', search || null); }, 300); return () => clearTimeout(t); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = useQuery({
    queryKey: ['adm-emails', dq, category, status, topic, days, user, fundraiser, page], enabled: isStaff && view === 'all',
    queryFn: () => rpc<Log>('admin_email_log', {
      _search: dq, _category: topic === 'outreach' ? 'all' : category, _status: status, _topic: topic, _days: days === 'all' ? null : Number(days),
      _user: user, _fundraiser: fundraiser, _limit: PAGE, _offset: page * PAGE }),
    refetchInterval: 60_000,
  });
  const t = q.data?.totals;
  const pct = (a?: number, b?: number) => (b ? `${Math.round(((a ?? 0) / b) * 100)}%` : '—');

  const cols: Column<EmailRow>[] = [
    { key: 'sent_at', header: 'Sent', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.sent_at)}</span> },
    { key: 'to', header: 'To', cell: (r) => <div className="max-w-[230px]"><p className="truncate font-medium">{r.to?.name || r.to_email}</p>{r.to?.name && <p className="truncate text-xs text-muted-foreground">{r.to_email}</p>}</div> },
    { key: 'subject', header: 'Subject', cell: (r) => <div className="max-w-[360px]"><p className="truncate">{r.subject || '(no subject)'}</p><p className="truncate text-xs text-muted-foreground">{r.category === 'team' ? `Written by ${r.sent_by?.name || 'the team'}${r.fundraiser ? ` · ${r.fundraiser.title}` : ''}` : topicLabel(r.topic)}</p></div> },
    { key: 'status', header: 'Status', cell: (r) => <div><EmailStatus row={r} />{r.opened_at && <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(r.opened_at)}</p>}</div> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Emails" description="Every email the site has sent: who got it, what it was about, and whether it was delivered and opened. Updated every 5 minutes." />
      {!isStaff ? <p className="text-sm text-muted-foreground">Staff access is required to see emails.</p> : <>
        <Tabs value={view} onValueChange={(v) => setParams((p) => { if (v === 'followups') p.set('view', 'followups'); else p.delete('view'); p.delete('page'); p.delete('stage'); return p; })} className="mb-4">
          <TabsList><TabsTrigger value="all">All emails</TabsTrigger><TabsTrigger value="followups">Coupon follow-ups</TabsTrigger></TabsList>
        </Tabs>
        {view === 'followups' ? <CouponFollowups /> : <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input className="h-9 pl-8" aria-label="Search emails" placeholder="Email address or subject" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Select value={topic} onValueChange={(v) => set('topic', v === 'all' ? null : v)}><SelectTrigger className="h-9 w-52" aria-label="Topic"><SelectValue /></SelectTrigger>
              <SelectContent>{TOPICS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={(v) => set('status', v === 'all' ? null : v)}><SelectTrigger className="h-9 w-52" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
            <Select value={days} onValueChange={(v) => set('days', v === 'all' ? null : v)}><SelectTrigger className="h-9 w-40" aria-label="When"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
            {topic !== 'outreach' && <Select value={category} onValueChange={(v) => set('category', v)}><SelectTrigger className="h-9 w-48" aria-label="Sender"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>}
            {(user || fundraiser) && <Button size="sm" variant="ghost" onClick={() => setParams((p) => { p.delete('user'); p.delete('fundraiser'); p.delete('page'); return p; })}>Show everyone</Button>}
          </div>
          {t && <dl className="mb-4 grid max-w-2xl grid-cols-4 gap-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Sent</dt><dd className="text-lg font-medium tabular-nums">{t.sent.toLocaleString()}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Delivered</dt><dd className="text-lg font-medium tabular-nums">{t.delivered.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{pct(t.delivered, t.sent)}</span></dd></div>
            <div><dt className="text-xs text-muted-foreground">Opened</dt><dd className="text-lg font-medium tabular-nums">{t.opened.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{pct(t.opened, t.delivered)}</span></dd></div>
            <div><dt className="text-xs text-muted-foreground">Bounced or blocked</dt><dd className="text-lg font-medium tabular-nums">{t.problem.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{pct(t.problem, t.sent)}</span></dd></div>
          </dl>}
          <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
            page={page} pageSize={PAGE} onPage={(p) => set('page', String(p))} rowKey={(r) => r.id} onRowClick={(r) => setOpen(r)} empty="No emails match this view." />
          {q.data && <p className="mt-3 text-xs text-muted-foreground">
            {q.data.synced_at ? `Last updated ${fmtDate(q.data.synced_at)}.` : 'Waiting for the first update from our email service.'}
            {q.data.oldest && ` Showing emails since ${fmtDate(q.data.oldest)}${q.data.history_complete ? '' : '; older history is still loading'}.`}
            {' '}Opens are tracked for site emails sent from November 4, 2026; some mail apps hide them. Only emails the team writes keep their text, so sign-in codes and links are never stored here.</p>}
        </>}
      </>}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <>
            <SheetHeader><SheetTitle className="break-words text-left">{open.subject || '(no subject)'}</SheetTitle><SheetDescription>{topicLabel(open.topic)}</SheetDescription></SheetHeader>
            <dl className="mt-4 grid grid-cols-[6rem_minmax(0,1fr)] gap-2 text-sm">
              <dt className="text-muted-foreground">To</dt><dd className="break-words">{open.to?.name ? `${open.to.name} · ` : ''}{open.to_email}</dd>
              <dt className="text-muted-foreground">From</dt><dd className="break-words">{open.from_email || '—'}</dd>
              <dt className="text-muted-foreground">Status</dt><dd><EmailStatus row={open} /></dd>
              {open.sent_by?.name && <><dt className="text-muted-foreground">Written by</dt><dd>{open.sent_by.name}</dd></>}
              {open.fundraiser && <><dt className="text-muted-foreground">Fundraiser</dt><dd><Link className="text-primary" to={`/admin/fundraisers?id=${open.fundraiser.id}&tab=contact`}>{open.fundraiser.title}</Link></dd></>}
            </dl>
            <Timeline e={open} opensSince={q.data?.opens_since ?? '2026-11-04T16:40:00Z'} />
            {open.body ? <p className="mt-4 whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-sm">{open.body}</p>
              : <p className="mt-4 text-sm text-muted-foreground">The text of automatic emails isn't stored. They follow the site's standard templates.</p>}
            {open.to?.user_id && <Button size="sm" variant="outline" className="mt-4" asChild><Link to={`/admin/emails?user=${open.to.user_id}`} onClick={() => setOpen(null)}>All emails to this person</Link></Button>}
          </>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
