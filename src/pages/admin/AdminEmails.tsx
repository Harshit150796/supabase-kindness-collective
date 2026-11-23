import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PenLine, Search, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { EmailStatus } from '@/components/admin/EmailStatus';
import { TOPICS, topicLabel, type EmailRow } from '@/lib/emailTopics';
import { CouponFollowups } from '@/components/admin/CouponFollowups';
import { AutomaticEmails } from '@/components/admin/emails/AutomaticEmails';
import { EmailComposer, type ComposerStart } from '@/components/admin/emails/EmailComposer';
import { EmailInbox, inboxKey, loadInbox } from '@/components/admin/emails/EmailInbox';
import { EmailViewer, splitSender } from '@/components/admin/emails/EmailViewer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rpc, fmtDate } from '@/lib/adminApi';

const PAGE = 25;
const CATEGORIES: Array<[string, string]> = [['not_outreach', 'Site and team emails'], ['site', 'Sent by the site'], ['team', 'Written by the team'], ['outreach', 'Church outreach'], ['all', 'Everything']];
const STATUSES: Array<[string, string]> = [['all', 'Any status'], ['opened', 'Opened'], ['not_opened', 'Delivered, not opened'], ['delivered', 'Delivered'], ['problem', 'Bounced or blocked'], ['pending', 'Not confirmed yet']];
const PERIODS: Array<[string, string]> = [['all', 'Any time'], ['1', 'Last 24 hours'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']];
type Totals = { sent: number; delivered: number; opened: number; tracked?: number; problem: number };
type Log = { rows: EmailRow[]; total: number; totals: Totals; synced_at: string | null; history_complete: boolean; oldest: string | null; open_tracking?: boolean | null };
const count = new Intl.NumberFormat('en-US');
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
/** "5:45 AM" today, "Nov 21" before. */
const when = (s: string) => { const d = new Date(s); return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d); };

/** Who a follow-up to this email goes to: the fundraiser's organizer, the account, or the bare address. */
function followUp(e: EmailRow): ComposerStart {
  const subject = e.subject ? (/^re:/i.test(e.subject) ? e.subject : `Re: ${e.subject}`).slice(0, 150) : '';
  if (e.category === 'team' && e.fundraiser) return { subject, to: { kind: 'fundraiser', fundraiserId: e.fundraiser.id, title: e.fundraiser.title, name: e.to?.name ?? null, email: e.to_email } };
  if (e.to?.user_id) return { subject, to: { kind: 'person', userId: e.to.user_id, name: e.to.name ?? null, email: e.to_email } };
  return { subject, to: { kind: 'address', email: e.to_email } };
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-baseline gap-2"><span className="text-2xl font-medium tabular-nums text-foreground">{value}</span>{note && <span className="text-xs text-muted-foreground">{note}</span>}</dd>
    </div>
  );
}

/**
 * Every email the site sent (receipts, coupon notices, reminders, sign-in codes, team messages, church outreach),
 * copied from Resend every five minutes with its delivery status. Since Nov 23, 2026 (founder request) clicking one
 * shows it exactly as it went out, from which address, with sign-in codes and one-time links hidden; "not opened"
 * shows only where opens were tracked. The team also writes emails here, follows up on any of them, answers
 * replies (Inbox), manages the automatic emails and follows coupons (Coupon follow-ups).
 */
export default function AdminEmails() {
  const { isStaff, canWrite } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'followups' ? 'followups' : params.get('view') === 'automatic' ? 'automatic' : params.get('view') === 'inbox' ? 'inbox' : 'all';
  const qc = useQueryClient();
  // How many replies are waiting, for the Inbox tab.
  const waiting = useQuery({ queryKey: [...inboxKey, 'open', 0], queryFn: () => loadInbox('open', 0), enabled: isStaff, refetchInterval: 60_000 });
  const [compose, setCompose] = useState<ComposerStart | null>(null);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [dq, setDq] = useState(search);
  const category = params.get('category') ?? 'not_outreach';
  const status = params.get('status') ?? 'all';
  const topic = params.get('topic') ?? 'all';
  const days = params.get('days') ?? 'all';
  const user = params.get('user');
  const fundraiser = params.get('fundraiser');
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [openId, setOpenId] = useState<string | null>(null);
  const set = (key: string, value: string | null) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); if (key !== 'page') p.delete('page'); return p; });
  useEffect(() => { const t = setTimeout(() => { setDq(search); if (search !== (params.get('q') ?? '')) set('q', search || null); }, 300); return () => clearTimeout(t); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = !!(dq || status !== 'all' || topic !== 'all' || days !== 'all' || category !== 'not_outreach' || user || fundraiser);
  const clear = () => { setSearch(''); setDq(''); setParams((p) => { for (const k of ['q', 'status', 'topic', 'days', 'category', 'user', 'fundraiser', 'page']) p.delete(k); return p; }); };

  const q = useQuery({
    queryKey: ['adm-emails', dq, category, status, topic, days, user, fundraiser, page], enabled: isStaff && view === 'all',
    queryFn: () => rpc<Log>('admin_email_log', {
      _search: dq, _category: topic === 'outreach' ? 'all' : category, _status: status, _topic: topic, _days: days === 'all' ? null : Number(days),
      _user: user, _fundraiser: fundraiser, _limit: PAGE, _offset: page * PAGE }),
    refetchInterval: 60_000,
  });
  const rows = useMemo(() => q.data?.rows ?? [], [q.data]);
  const t = q.data?.totals;
  const pct = (a?: number, b?: number) => (b ? `${Math.round(((a ?? 0) / b) * 100)}%` : undefined);
  const trackingOff = q.data?.open_tracking === false;
  const at = rows.findIndex((r) => r.id === openId);
  const open = at >= 0 ? rows[at] : null;

  const cols: Column<EmailRow>[] = [
    { key: 'to', header: 'To', className: 'hidden w-[30%] md:table-cell', cell: (r) => (
      <div className="max-w-[260px]"><p className="truncate font-medium text-foreground">{r.to?.name || r.to_email}</p>
        {r.to?.name && <p className="truncate text-xs text-muted-foreground">{r.to_email}</p>}</div>) },
    { key: 'subject', header: 'Email', cell: (r) => {
      const from = splitSender(r.from_email).address;
      return (
        <div className="max-w-[78vw] md:max-w-[420px]">
          {/* Phones: one column with who, what, status and when. */}
          <p className="truncate font-medium text-foreground md:hidden">{r.to?.name || r.to_email}</p>
          <p className="truncate text-foreground">{r.subject || '(no subject)'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {r.category === 'team' ? `Written by ${r.sent_by?.name || 'the team'}` : topicLabel(r.topic)}{from ? ` · from ${from}` : ''}
          </p>
          <p className="mt-1 flex items-center gap-2 md:hidden"><EmailStatus row={r} /><span className="text-xs text-muted-foreground">{when(r.sent_at)}</span></p>
        </div>);
    } },
    { key: 'status', header: 'Status', className: 'hidden md:table-cell', cell: (r) => <EmailStatus row={r} /> },
    { key: 'sent_at', header: 'Sent', align: 'right', className: 'hidden md:table-cell', cell: (r) => <span className="whitespace-nowrap text-muted-foreground" title={fmtDate(r.sent_at)}>{when(r.sent_at)}</span> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Emails" description="Every email the site has sent, as it went out, and what happened to it. Answer replies, write to anyone, and manage the automatic emails."
        actions={isStaff && canWrite ? <Button onClick={() => setCompose({})}><PenLine className="mr-1.5 h-4 w-4" aria-hidden="true" />Write an email</Button> : undefined} />
      {!isStaff ? <p className="text-sm text-muted-foreground">Staff access is required to see emails.</p> : <>
        <Tabs className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0" value={view} onValueChange={(v) => setParams((p) => { if (v === 'all') p.delete('view'); else p.set('view', v); p.delete('page'); p.delete('stage'); return p; })}>
          <TabsList><TabsTrigger value="all">Sent</TabsTrigger><TabsTrigger value="inbox">Inbox{waiting.data?.open ? ` (${waiting.data.open})` : ''}</TabsTrigger><TabsTrigger value="automatic">Automatic emails</TabsTrigger><TabsTrigger value="followups">Coupon follow-ups</TabsTrigger></TabsList>
        </Tabs>
        {view === 'followups' ? <CouponFollowups /> : view === 'automatic' ? <AutomaticEmails canWrite={canWrite} /> : view === 'inbox' ? <EmailInbox canWrite={canWrite} onReply={setCompose} /> : <>
          {t && <dl className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Stat label="Sent" value={count.format(t.sent)} />
            <Stat label="Delivered" value={count.format(t.delivered)} note={pct(t.delivered, t.sent)} />
            <Stat label="Opened" value={t.tracked ? count.format(t.opened) : '—'} note={t.tracked ? `${pct(t.opened, t.tracked)} of tracked` : 'Not tracked'} />
            <Stat label="Bounced or blocked" value={count.format(t.problem)} note={pct(t.problem, t.sent)} />
          </dl>}
          {trackingOff && (
            <p className="mb-4 rounded-lg bg-verify/10 px-4 py-3 text-sm text-foreground">
              <span className="font-medium">Opens aren’t being tracked right now.</span> Open tracking is off in Resend for coupondonation.com, so emails sent since then show as Delivered, not “not opened”. Opens seen before stay as they were.
            </p>
          )}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-80"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input className="h-9 pl-8" aria-label="Search emails" placeholder="Search address, sender or subject" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Select value={topic} onValueChange={(v) => set('topic', v === 'all' ? null : v)}><SelectTrigger className="h-9 w-full sm:w-48" aria-label="Topic"><SelectValue /></SelectTrigger>
              <SelectContent>{TOPICS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={(v) => set('status', v === 'all' ? null : v)}><SelectTrigger className="h-9 w-[calc(50%-0.25rem)] sm:w-48" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
            <Select value={days} onValueChange={(v) => set('days', v === 'all' ? null : v)}><SelectTrigger className="h-9 w-[calc(50%-0.25rem)] sm:w-40" aria-label="When"><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
            {topic !== 'outreach' && <Select value={category} onValueChange={(v) => set('category', v)}><SelectTrigger className="h-9 w-full sm:w-48" aria-label="Sender"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>}
            {filtered && <Button size="sm" variant="ghost" onClick={clear}><X className="mr-1 h-4 w-4" aria-hidden="true" />Clear</Button>}
          </div>
          <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
            page={page} pageSize={PAGE} onPage={(p) => set('page', String(p))} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)}
            rowClassName={(r) => (r.id === openId ? 'bg-muted/60' : undefined)} empty="No emails match this view." />
          {q.data && <p className="mt-3 text-xs text-muted-foreground">
            {q.data.synced_at ? `Updated ${fmtDate(q.data.synced_at)} from Resend.` : 'Waiting for the first update from our email service.'}
            {q.data.oldest && ` Emails since ${fmtDate(q.data.oldest)}${q.data.history_complete ? '' : '; older history is still loading'}.`}
            {' '}Click an email to see it as it went out. Sign-in codes and one-time links are always hidden.</p>}
        </>}
      </>}

      <EmailViewer email={open} onClose={() => setOpenId(null)}
        onPrev={at > 0 ? () => setOpenId(rows[at - 1].id) : null}
        onNext={at >= 0 && at < rows.length - 1 ? () => setOpenId(rows[at + 1].id) : null}
        onFollowUp={canWrite && open && open.category !== 'outreach' && open.topic !== 'alerts' ? (e) => { setCompose(followUp(e)); setOpenId(null); } : null} />
      <EmailComposer open={!!compose} onOpenChange={(o) => !o && setCompose(null)} start={compose} onSent={() => { q.refetch(); qc.invalidateQueries({ queryKey: inboxKey }); }} />
    </DashboardLayout>
  );
}
