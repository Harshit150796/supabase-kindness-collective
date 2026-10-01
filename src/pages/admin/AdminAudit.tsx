import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { sb, rpc, fmtDate } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const PAGE = 40;

export default function AdminAudit() {
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [open, setOpen] = useState<any>(null);
  const team = useQuery({ queryKey: ['adm-team'], queryFn: () => rpc<any[]>('admin_list_team') });
  const who = (u: string) => team.data?.find((t) => t.user_id === u)?.email ?? (u ? u.slice(0, 8) : 'system');
  const q = useQuery({
    queryKey: ['adm-audit', page, action],
    queryFn: async () => {
      let b = sb.from('admin_audit_log').select('*', { count: 'exact' });
      if (action.trim()) b = b.ilike('action', `%${action.trim().replace(/[%,()]/g, '')}%`);
      const { data, error, count } = await b.order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });
  const cols: Column<any>[] = [
    { key: 'created_at', header: 'When', cell: (r) => fmtDate(r.created_at) },
    { key: 'actor', header: 'Who', cell: (r) => <span className="text-xs">{who(r.actor_id)}</span> },
    { key: 'action', header: 'Action', cell: (r) => <code className="text-xs">{r.action}</code> },
    { key: 'record', header: 'Record', cell: (r) => <span className="text-xs text-muted-foreground">{r.table_name} · {r.record_id?.slice(0, 8)}</span> },
  ];
  return (
    <DashboardLayout>
      <PageHeader title="Audit log" description="Append-only record of every admin change. Entries cannot be edited or deleted." />
      <Input className="mb-3 h-9 max-w-xs" placeholder="Filter by action, e.g. fundraiser" value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} />
      <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} rowKey={(r) => r.id} onRowClick={setOpen} empty="No admin changes recorded yet." />
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {open && <><SheetHeader><SheetTitle className="text-left">{open.action}</SheetTitle></SheetHeader>
            <p className="mt-1 text-xs text-muted-foreground">{who(open.actor_id)} · {fmtDate(open.created_at)} · {open.table_name} {open.record_id}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(['before', 'after'] as const).map((k) => <div key={k}><p className="mb-1 text-xs font-medium capitalize">{k}</p><pre className="max-h-[60vh] overflow-auto rounded bg-muted p-2 text-[11px]">{open[k] ? JSON.stringify(open[k], null, 2) : '—'}</pre></div>)}
            </div></>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
