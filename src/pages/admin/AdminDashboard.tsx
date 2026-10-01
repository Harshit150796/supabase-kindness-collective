import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { sb, rpc, usd, fmtDate } from '@/lib/adminApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const k = useQuery({ queryKey: ['adm-kpis'], queryFn: () => rpc<any>('admin_overview_kpis'), refetchInterval: 60_000 });
  const feed = useQuery({ queryKey: ['adm-feed'], queryFn: async () => (await sb.from('admin_notifications').select('id,title,link,created_at').order('created_at', { ascending: false }).limit(12)).data ?? [] });
  const tasks = useQuery({ queryKey: ['adm-attn'], queryFn: async () => (await sb.from('admin_tasks').select('id,title,priority,due_date,linked_type').neq('status', 'done').in('priority', ['urgent', 'high']).order('created_at', { ascending: false }).limit(8)).data ?? [] });
  const d = k.data;

  const tiles = [
    ['Raised today', usd(d?.raised_today), '/admin/donations'], ['Raised · 7 days', usd(d?.raised_week), '/admin/donations'],
    ['Raised · 30 days', usd(d?.raised_month), '/admin/donations'], ['Donations · 30 days', d?.donations_month, '/admin/donations'],
    ['Active fundraisers', d?.active_fundraisers, '/admin/fundraisers?status=active'], ['Pending approval', d?.pending_fundraisers, '/admin/fundraisers?status=pending'],
    ['Open reports', d?.open_reports, '/admin/moderation'], ['Open tasks', d?.open_tasks, '/admin/tasks'],
  ] as const;

  const attention = [
    d?.pending_fundraisers ? { label: `${d.pending_fundraisers} fundraiser(s) awaiting approval`, to: '/admin/fundraisers?status=pending' } : null,
    d?.open_reports ? { label: `${d.open_reports} open content report(s)`, to: '/admin/moderation' } : null,
    d?.pending_verifications ? { label: `${d.pending_verifications} verification(s) to review`, to: '/admin/verifications' } : null,
    d?.overdue_tasks ? { label: `${d.overdue_tasks} overdue task(s)`, to: '/admin/tasks' } : null,
  ].filter(Boolean) as { label: string; to: string }[];

  return (
    <DashboardLayout>
      <PageHeader title="Overview" description="Live figures from completed donations. Refreshes every minute." />
      {k.error && <p className="mb-4 rounded-md bg-destructive/5 p-3 text-sm text-destructive">Couldn't load figures: {(k.error as Error).message} <Button size="sm" variant="link" onClick={() => k.refetch()}>Retry</Button></p>}
      <div className="grid grid-cols-2 gap-3 tabular-nums md:grid-cols-4">
        {tiles.map(([l, v, to]) => (
          <Link key={l} to={to} className="rounded-lg bg-background p-4 transition-colors hover:bg-muted/40">
            <p className="text-xs text-muted-foreground">{l}</p>
            {k.isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 text-2xl font-semibold text-foreground">{v ?? 0}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg bg-background p-4 lg:col-span-2">
          <p className="mb-3 text-sm font-medium">Raised per day · last 30 days</p>
          <div className="h-56">
            {k.isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d?.trend ?? []} margin={{ left: 0, right: 8, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="d" tickFormatter={(v) => v.slice(5)} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} width={48} />
                  <Tooltip formatter={(v: number) => usd(v)} />
                  <Area dataKey="raised" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className="rounded-lg bg-background p-4">
          <p className="mb-3 text-sm font-medium">Needs attention</p>
          {!attention.length && !tasks.data?.length ? <p className="text-sm text-muted-foreground">Nothing waiting. All clear.</p> : (
            <ul className="divide-y divide-border text-sm">
              {attention.map((a) => <li key={a.label}><Link to={a.to} className="flex items-center justify-between py-2 hover:text-primary">{a.label}<ArrowRight className="h-3.5 w-3.5" /></Link></li>)}
              {(tasks.data ?? []).map((t: any) => <li key={t.id}><Link to={`/admin/tasks`} className="block py-2 hover:text-primary"><span className="mr-1.5 text-xs capitalize text-destructive">{t.priority}</span>{t.title}</Link></li>)}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg bg-background p-4">
        <p className="mb-3 text-sm font-medium">Recent activity</p>
        {!feed.data?.length ? <p className="text-sm text-muted-foreground">Activity appears here as fundraisers, donations, reports and applications come in.</p> : (
          <ul className="divide-y divide-border text-sm">{feed.data.map((n: any) => <li key={n.id} className="flex justify-between gap-3 py-2"><Link to={n.link ?? '/admin'} className="hover:text-primary">{n.title}</Link><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.created_at)}</span></li>)}</ul>
        )}
      </section>
    </DashboardLayout>
  );
}
