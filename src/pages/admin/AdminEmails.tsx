import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { EmailStatus, type EmailRow } from '@/components/admin/EmailStatus';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { rpc, fmtDate } from '@/lib/adminApi';

const PAGE = 25;
const CATEGORIES: Array<[string, string]> = [['not_outreach', 'Site and team emails'], ['site', 'Sent by the site'], ['team', 'Written by the team'], ['outreach', 'Church outreach'], ['all', 'Everything']];
const STATUSES: Array<[string, string]> = [['all', 'Any status'], ['delivered', 'Delivered'], ['opened', 'Opened'], ['problem', 'Bounced or blocked'], ['pending', 'Not confirmed yet']];

/**
 * Every email the site sent (receipts, donation and coupon notices, sign-in codes, team messages …),
 * copied from Resend every few minutes with its delivery status. Only team-written emails keep their text.
 */
export default function AdminEmails() {
  const { isStaff } = useTeamRole();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [dq, setDq] = useState(search);
  const category = params.get('category') ?? 'not_outreach';
  const status = params.get('status') ?? 'all';
  const user = params.get('user');
  const fundraiser = params.get('fundraiser');
  const page = Math.max(0, Number(params.get('page')) || 0);
  const [open, setOpen] = useState<EmailRow | null>(null);
  const set = (key: string, value: string | null) => setParams((p) => { if (value) p.set(key, value); else p.delete(key); if (key !== 'page') p.delete('page'); return p; });
  useEffect(() => { const t = setTimeout(() => { setDq(search); if (search !== (params.get('q') ?? '')) set('q', search || null); }, 300); return () => clearTimeout(t); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = useQuery({
    queryKey: ['adm-emails', dq, category, status, user, fundraiser, page], enabled: isStaff,
    queryFn: () => rpc<{ rows: EmailRow[]; total: number; synced_at: string | null; history_complete: boolean; oldest: string | null }>('admin_email_log', {
      _search: dq, _category: category, _status: status, _user: user, _fundraiser: fundraiser, _limit: PAGE, _offset: page * PAGE }),
    refetchInterval: 60_000,
  });

  const cols: Column<EmailRow>[] = [
    { key: 'sent_at', header: 'Sent', cell: (r) => <span className="whitespace-nowrap">{fmtDate(r.sent_at)}</span> },
    { key: 'to', header: 'To', cell: (r) => <div className="max-w-[240px]"><p className="truncate font-medium">{r.to?.name || r.to_email}</p>{r.to?.name && <p className="truncate text-xs text-muted-foreground">{r.to_email}</p>}</div> },
    { key: 'subject', header: 'Subject', cell: (r) => <div className="max-w-[360px]"><p className="truncate">{r.subject || '(no subject)'}</p><p className="truncate text-xs text-muted-foreground">{r.category === 'team' ? `Written by ${r.sent_by?.name || 'the team'}${r.fundraiser ? ` · ${r.fundraiser.title}` : ''}` : r.category === 'outreach' ? 'Church outreach' : 'Sent by the site'}</p></div> },
    { key: 'status', header: 'Status', cell: (r) => <EmailStatus row={r} /> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Emails" description="Every email the site has sent, with whether it arrived. Updated from our email service every 5 minutes." />
      {!isStaff ? <p className="text-sm text-muted-foreground">Staff access is required to see emails.</p> : <>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="h-9 pl-8" aria-label="Search emails" placeholder="Email address or subject" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={category} onValueChange={(v) => set('category', v)}><SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={(v) => set('status', v)}><SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
          {(user || fundraiser) && <Button size="sm" variant="ghost" onClick={() => setParams((p) => { p.delete('user'); p.delete('fundraiser'); p.delete('page'); return p; })}>Show everyone</Button>}
        </div>
        <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
          page={page} pageSize={PAGE} onPage={(p) => set('page', String(p))} rowKey={(r) => r.id} onRowClick={(r) => setOpen(r)} empty="No emails match this view." />
        {q.data && <p className="mt-3 text-xs text-muted-foreground">
          {q.data.synced_at ? `Last updated ${fmtDate(q.data.synced_at)}.` : 'Waiting for the first update from our email service.'}
          {q.data.oldest && ` Showing emails since ${fmtDate(q.data.oldest)}${q.data.history_complete ? '' : '; older history is still loading'}.`}
          {' '}Only emails the team writes keep their text; the rest show their subject, so sign-in codes and links are never stored here.</p>}
      </>}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <>
            <SheetHeader><SheetTitle className="break-words text-left">{open.subject || '(no subject)'}</SheetTitle><SheetDescription>{fmtDate(open.sent_at)}</SheetDescription></SheetHeader>
            <dl className="mt-4 grid grid-cols-[6rem_minmax(0,1fr)] gap-2 text-sm">
              <dt className="text-muted-foreground">To</dt><dd className="break-words">{open.to?.name ? `${open.to.name} · ` : ''}{open.to_email}</dd>
              <dt className="text-muted-foreground">From</dt><dd className="break-words">{open.from_email || '—'}</dd>
              <dt className="text-muted-foreground">Status</dt><dd><EmailStatus row={open} /></dd>
              {open.sent_by?.name && <><dt className="text-muted-foreground">Written by</dt><dd>{open.sent_by.name}</dd></>}
              {open.fundraiser && <><dt className="text-muted-foreground">Fundraiser</dt><dd><Link className="text-primary" to={`/admin/fundraisers?id=${open.fundraiser.id}&tab=contact`}>{open.fundraiser.title}</Link></dd></>}
            </dl>
            {open.body ? <p className="mt-4 whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-sm">{open.body}</p>
              : <p className="mt-4 text-sm text-muted-foreground">The text of automatic emails isn't stored. They follow the site's standard templates.</p>}
            {open.to?.user_id && <Button size="sm" variant="outline" className="mt-4" asChild><Link to={`/admin/emails?user=${open.to.user_id}`} onClick={() => setOpen(null)}>All emails to this person</Link></Button>}
          </>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
