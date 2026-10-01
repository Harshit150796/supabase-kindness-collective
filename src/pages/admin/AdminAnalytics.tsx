import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { rpc, usd, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--verify))', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))', 'hsl(var(--ink))'];
const RANGES = [['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['0', 'All time']] as const;

export default function AdminAnalytics() {
  const [days, setDays] = useState('30');
  const q = useQuery({ queryKey: ['adm-analytics', days], queryFn: () => rpc<any>('admin_analytics', { _days: Number(days) }) });
  const d = q.data;
  const conv = d?.coupons_total ? Math.round((d.coupons_redeemed / d.coupons_total) * 100) : 0;

  return (
    <DashboardLayout>
      <PageHeader title="Analytics" description="Calculated on the server from live records; totals count completed donations only."
        actions={<div className="flex gap-1">{RANGES.map(([v, l]) => <Button key={v} size="sm" variant={days === v ? 'default' : 'outline'} onClick={() => setDays(v)}>{l}</Button>)}</div>} />
      {q.error ? (
        <div className="rounded-lg border border-border py-12 text-center"><AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" /><p className="text-sm">Couldn't load analytics.</p><p className="mb-3 text-xs text-muted-foreground">{(q.error as Error).message}</p><Button size="sm" variant="outline" onClick={() => q.refetch()}>Try again</Button></div>
      ) : (
        <div className="space-y-6 tabular-nums">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[['Total users', d?.users_total?.toLocaleString(), `${d?.users_in_range ?? 0} new in range`], ['Raised (completed)', d && usd(d.raised_in_range), `${d?.donations_in_range ?? 0} donations`],
              ['Coupons created', d?.coupons_total?.toLocaleString(), 'All time'], ['Redemption rate', d && `${conv}%`, `${d?.coupons_redeemed ?? 0} redeemed`]].map(([k, v, s]) => (
              <div key={k} className="bg-background p-4"><p className="text-xs text-muted-foreground">{k}</p>{q.isLoading ? <Skeleton className="mt-1 h-7 w-24" /> : <p className="text-2xl font-semibold text-foreground">{v}</p>}<p className="text-xs text-muted-foreground">{s}</p></div>))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Signups" loading={q.isLoading} empty={!d?.signups?.length}>
              <AreaChart data={d?.signups}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="d" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Area dataKey="n" name="Signups" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" /></AreaChart>
            </Panel>
            <Panel title="Completed donations ($)" loading={q.isLoading} empty={!d?.donations?.length}>
              <BarChart data={d?.donations}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => usd(v)} /><Bar dataKey="amount" name="Raised" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} /></BarChart>
            </Panel>
            <Panel title="Roles" loading={q.isLoading} empty={!d?.roles?.length}>
              <PieChart><Pie data={d?.roles} dataKey="value" nameKey="name" outerRadius={90}>{(d?.roles ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </Panel>
            <Panel title="Coupon status" loading={q.isLoading} empty={!d?.coupon_status?.length}>
              <PieChart><Pie data={d?.coupon_status} dataKey="value" nameKey="name" outerRadius={90}>{(d?.coupon_status ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
            </Panel>
            <Panel title="Top retailers (completed allocations)" loading={q.isLoading} empty={!d?.brands?.length}>
              <BarChart data={d?.brands} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" width={100} fontSize={11} /><Tooltip formatter={(v: number) => usd(v)} /><Bar dataKey="amount" fill="hsl(var(--verify))" radius={[0, 3, 3, 0]} /></BarChart>
            </Panel>
            <div className="rounded-lg border border-border p-4"><p className="mb-2 text-sm font-medium">Newest accounts</p>
              {q.isLoading ? <Skeleton className="h-40 w-full" /> : <ul className="divide-y divide-border text-sm">{(d?.recent_users ?? []).map((u: any) => <li key={u.email} className="flex justify-between gap-2 py-1.5"><span className="truncate">{u.full_name || u.email}</span><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(u.created_at)}</span></li>)}</ul>}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Panel({ title, loading, empty, children }: { title: string; loading: boolean; empty: boolean; children: React.ReactElement }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="h-64">{loading ? <Skeleton className="h-full w-full" /> : empty ? <p className="pt-24 text-center text-sm text-muted-foreground">No data in this range.</p> : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}</div>
    </div>
  );
}
