import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { sb, fmtDate } from '@/lib/adminApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PAGE = 30;

export default function AdminNotifications() {
  const { user } = useAuth();
  const { isAdmin } = useTeamRole();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  const q = useQuery({
    queryKey: ['adm-notifs', page],
    queryFn: async () => {
      const { data, error, count } = await sb.from('admin_notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      const ids = (data ?? []).map((n: any) => n.id);
      const { data: reads } = ids.length ? await sb.from('admin_notification_reads').select('notification_id').eq('user_id', user!.id).in('notification_id', ids) : { data: [] };
      const r = new Set((reads ?? []).map((x: any) => x.notification_id));
      return { rows: (data ?? []).map((n: any) => ({ ...n, unread: !r.has(n.id) })), total: count ?? 0 };
    },
  });
  const emails = useQuery({
    queryKey: ['adm-email-events'], enabled: isAdmin,
    queryFn: async () => (await sb.from('admin_email_events').select('id,kind,source_id,created_at,sent_at,resend_id,last_error').order('created_at', { ascending: false }).limit(20)).data ?? [],
  });

  const markAll = async () => {
    const ids = (q.data?.rows ?? []).filter((n: any) => n.unread).map((n: any) => n.id);
    if (ids.length) await sb.from('admin_notification_reads').upsert(ids.map((id: string) => ({ notification_id: id, user_id: user!.id })), { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
    qc.invalidateQueries({ queryKey: ['adm-notifs'] }); qc.invalidateQueries({ queryKey: ['admin-notifs-bell'] });
  };

  const cols: Column<any>[] = [
    { key: 'title', header: 'Event', cell: (r) => <span className={cn(r.unread ? 'font-medium text-foreground' : 'text-muted-foreground')}>{r.unread && <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />}{r.title}</span> },
    { key: 'kind', header: 'Type', cell: (r) => <span className="text-xs capitalize">{r.kind}</span> },
    { key: 'created_at', header: 'When', cell: (r) => fmtDate(r.created_at) },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Notifications" description="New fundraisers, donations, reports and applications. Email recipients are managed in Settings."
        actions={<Button size="sm" variant="outline" onClick={markAll}>Mark page read</Button>} />
      <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} rowKey={(r) => r.id} onRowClick={async (r) => {
          await sb.from('admin_notification_reads').upsert({ notification_id: r.id, user_id: user!.id }, { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
          qc.invalidateQueries({ queryKey: ['admin-notifs-bell'] });
          if (r.link) navigate(r.link);
        }} empty="No notifications yet." />
      {isAdmin && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-medium">Email delivery log</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-background text-sm">
            {!(emails.data ?? []).length && <li className="p-4 text-center text-muted-foreground">No notification emails recorded yet.</li>}
            {(emails.data ?? []).map((e: any) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                <span className="capitalize">{e.kind} · <span className="text-xs text-muted-foreground">{fmtDate(e.created_at)}</span></span>
                <span className="text-xs">{e.sent_at ? `Sent ${fmtDate(e.sent_at)}` : e.last_error ? <span className="text-destructive">Retrying: {e.last_error.slice(0, 80)}</span> : 'Queued'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
}
