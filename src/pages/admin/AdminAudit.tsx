import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { sb, rpc, fmtDate, downloadCsv, fetchAllChunks, cleanSearch } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';

const PAGE = 40;
type Entry = { id: string; created_at: string; actor_id: string | null; action: string; table_name: string | null; record_id: string | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null };

/** Where each kind of record opens in the portal. */
const AREAS: Record<string, { label: string; link?: (id: string) => string }> = {
  fundraisers: { label: 'Fundraisers', link: (id) => `/admin/fundraisers?id=${id}` },
  donations: { label: 'Donations', link: (id) => `/admin/donations?id=${id}` },
  card_donations: { label: 'Donated cards', link: (id) => `/admin/card-donations?id=${id}` },
  coupons: { label: 'Coupons' },
  coupon_sources: { label: 'Outside gifts' },
  contact_messages: { label: 'Contact messages', link: (id) => `/admin/contact?id=${id}` },
  admin_tasks: { label: 'Tasks', link: (id) => `/admin/tasks?id=${id}` },
  partner_inquiries: { label: 'Partner inquiries', link: (id) => `/admin/partners?id=${id}` },
  homepage_placements: { label: 'Homepage lineup', link: () => '/admin/homepage' },
  profiles: { label: 'Profiles' },
  conversations: { label: 'Messages' },
  recipient_verifications: { label: 'Verifications' },
  user_roles: { label: 'Team & access', link: () => '/admin/team' },
  admin_settings: { label: 'Settings', link: () => '/admin/settings' },
};
const NOISE = new Set(['updated_at', 'created_at']);

/** The fields that differ between the before and after copies, in a readable order. */
function changedFields(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter((k) => !NOISE.has(k));
  return keys.filter((k) => JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after?.[k] ?? null))
    .map((k) => ({ field: k, before: before?.[k] ?? null, after: after?.[k] ?? null }));
}
// Codes, PINs and secrets never leave the audited reveal: shown and exported as "(hidden)".
const SECRET = /(^|_)(code|pin|cvv|secret|token|password|cipher|card_number)(_|$)/i;
const isSecret = (field: string) => SECRET.test(field) && field !== 'code_hint';
const show = (v: unknown, field = '') => isSecret(field) && v != null && v !== '' ? '(hidden)' : v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);
const fieldLabel = (k: string) => k.replace(/_/g, ' ');

export default function AdminAudit() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('all');
  const [area, setArea] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<Entry | null>(null);
  const team = useQuery({ queryKey: ['adm-team'], queryFn: () => rpc<any[]>('admin_list_team') });
  const who = (u: string | null) => (u && (team.data?.find((t) => t.user_id === u)?.full_name || team.data?.find((t) => t.user_id === u)?.email)) || (u ? u.slice(0, 8) : 'System');
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(0); };

  const apply = (b: any) => {
    if (cleanSearch(action)) b = b.ilike('action', `%${cleanSearch(action)}%`);
    if (actor === 'system') b = b.is('actor_id', null); else if (actor !== 'all') b = b.eq('actor_id', actor);
    if (area !== 'all') b = b.eq('table_name', area);
    if (from) b = b.gte('created_at', new Date(from).toISOString());
    if (to) b = b.lt('created_at', new Date(new Date(to).getTime() + 86400000).toISOString());
    return b;
  };
  const q = useQuery({
    queryKey: ['adm-audit', page, action, actor, area, from, to],
    queryFn: async () => {
      const { data, error, count } = await apply(sb.from('admin_audit_log').select('*', { count: 'exact' })).order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as Entry[], total: count ?? 0 };
    },
  });

  const recordLink = (e: Entry) => (e.table_name && e.record_id ? AREAS[e.table_name]?.link?.(e.record_id) : undefined);
  const cols: Column<Entry>[] = [
    { key: 'created_at', header: 'When', cell: (r) => <span className="whitespace-nowrap text-xs">{fmtDate(r.created_at)}</span> },
    { key: 'actor', header: 'Who', cell: (r) => <span className="text-xs">{who(r.actor_id)}</span> },
    { key: 'action', header: 'Action', cell: (r) => <span className="text-xs capitalize">{r.action.replace(/[._]/g, ' ')}</span> },
    { key: 'changed', header: 'What changed', cell: (r) => { const c = changedFields(r.before, r.after); return <span className="line-clamp-1 max-w-[280px] text-xs text-muted-foreground">{c.length ? c.slice(0, 4).map((x) => fieldLabel(x.field)).join(', ') + (c.length > 4 ? ` and ${c.length - 4} more` : '') : r.before ? 'No field changes' : 'Created or recorded'}</span>; } },
    { key: 'record', header: 'Record', cell: (r) => { const link = recordLink(r); const text = `${AREAS[r.table_name ?? '']?.label ?? r.table_name ?? '—'} · ${r.record_id?.slice(0, 8) ?? ''}`; return link ? <Link to={link} onClick={(e) => e.stopPropagation()} className="text-xs text-primary underline-offset-4 hover:underline">{text}</Link> : <span className="text-xs text-muted-foreground">{text}</span>; } },
  ];

  const exportCsv = async () => {
    try {
      const rows = await fetchAllChunks((a, b) => apply(sb.from('admin_audit_log').select('*')).order('created_at', { ascending: false }).range(a, b), 10000) as Entry[];
      downloadCsv('audit-log', rows.map((r) => ({ when: r.created_at, who: who(r.actor_id), action: r.action, area: AREAS[r.table_name ?? '']?.label ?? r.table_name ?? '', record_id: r.record_id ?? '',
        changed: changedFields(r.before, r.after).map((c) => `${c.field}: ${show(c.before, c.field)} -> ${show(c.after, c.field)}`).join(' | ') })));
      toast({ title: `${rows.length} entries exported` });
    } catch (e) { toast({ title: 'Export failed', description: (e as Error).message, variant: 'destructive' }); }
  };

  const filtered = !!(cleanSearch(action) || actor !== 'all' || area !== 'all' || from || to);
  const changes = open ? changedFields(open.before, open.after) : [];
  return (
    <DashboardLayout>
      <PageHeader title="Audit log" description="Append-only record of every admin change. Entries cannot be edited or deleted."
        actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />CSV</Button>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input className="h-9 w-56" placeholder="Action, e.g. fundraiser.approve" aria-label="Filter by action" value={action} onChange={(e) => reset(setAction)(e.target.value)} />
        <Select value={actor} onValueChange={reset(setActor)}>
          <SelectTrigger className="h-9 w-48" aria-label="Who"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Everyone</SelectItem><SelectItem value="system">System</SelectItem>{(team.data ?? []).map((t) => <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.email}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={area} onValueChange={reset(setArea)}>
          <SelectTrigger className="h-9 w-48" aria-label="Area"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Every area</SelectItem>{Object.entries(AREAS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input className="h-9 w-40" type="date" aria-label="From date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} />
        <Input className="h-9 w-40" type="date" aria-label="To date" value={to} onChange={(e) => reset(setTo)(e.target.value)} />
        {filtered && <Button size="sm" variant="ghost" onClick={() => { setAction(''); setActor('all'); setArea('all'); setFrom(''); setTo(''); setPage(0); }}><X className="mr-1 h-4 w-4" />Clear</Button>}
      </div>
      <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} rowKey={(r) => r.id} onRowClick={(r) => setOpen(r)} empty="No admin changes match these filters." />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {open && <>
            <SheetHeader><SheetTitle className="text-left capitalize">{open.action.replace(/[._]/g, ' ')}</SheetTitle></SheetHeader>
            <p className="mt-1 text-xs text-muted-foreground">{who(open.actor_id)} · {fmtDate(open.created_at)} · {AREAS[open.table_name ?? '']?.label ?? open.table_name} {open.record_id}</p>
            {recordLink(open) && <Link className="mt-3 inline-block text-sm text-primary" to={recordLink(open)!}>Open this record</Link>}
            <h3 className="mt-5 text-sm font-medium">What changed</h3>
            {changes.length ? (
              <table className="mt-2 w-full table-fixed text-left text-xs">
                <thead><tr className="text-muted-foreground"><th className="w-1/4 pb-1 font-medium">Field</th><th className="pb-1 font-medium">Before</th><th className="pb-1 font-medium">After</th></tr></thead>
                <tbody className="divide-y divide-border">{changes.map((c) => <tr key={c.field} className="align-top"><td className="py-1.5 pr-2 capitalize">{fieldLabel(c.field)}</td><td className="break-words py-1.5 pr-2 text-muted-foreground line-through decoration-destructive/40">{show(c.before, c.field).slice(0, 400)}</td><td className="break-words py-1.5">{show(c.after, c.field).slice(0, 400)}</td></tr>)}</tbody>
              </table>
            ) : <p className="mt-1 text-sm text-muted-foreground">{open.before ? 'No fields changed (the action was recorded without a field change).' : 'This entry records an action, not an edit.'}</p>}
            <details className="mt-5"><summary className="cursor-pointer text-sm font-medium">Raw before and after</summary><div className="mt-4 grid gap-3 md:grid-cols-2">
              {(['before', 'after'] as const).map((k) => <div key={k}><p className="mb-1 text-xs font-medium capitalize">{k}</p><pre className="max-h-[60vh] overflow-auto rounded bg-muted p-2 text-[11px]">{open[k] ? JSON.stringify(open[k], null, 2) : '—'}</pre></div>)}
            </div></details>
          </>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
