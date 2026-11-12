import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { sb, rpc, usd, fmtDate } from '@/lib/adminApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowRight } from 'lucide-react';
import { FundraiserThumb } from '@/components/admin/fundraisers/FundraiserThumb';
import { FundraiserCounts, FundraiserRow, ago, usdWhole } from '@/components/admin/fundraisers/fundraiserList';
import { cityState, needLabel } from '@/lib/helpNeeds';

const count = async (table: string, column: string, value: string) => {
  const { count: n, error } = await sb.from(table).select('id', { count: 'exact', head: true }).eq(column, value);
  if (error) throw error;
  return n ?? 0;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const personal = params.get('scope') !== 'team';
  const profile = useQuery({ queryKey: ['adm-my-profile', user?.id], enabled: !!user, queryFn: async () => { const { data, error } = await sb.from('profiles').select('full_name').eq('user_id', user?.id).maybeSingle(); if (error) throw error; return data; } });
  const firstName = profile.data?.full_name?.trim().split(' ')[0] || 'there';
  const k = useQuery({ queryKey: ['adm-kpis'], queryFn: () => rpc<any>('admin_overview_kpis'), refetchInterval: 60_000 });
  const feed = useQuery({ queryKey: ['adm-feed'], queryFn: async () => (await sb.from('admin_notifications').select('id,title,link,created_at').order('created_at', { ascending: false }).limit(12)).data ?? [] });
  const tasks = useQuery({ queryKey: ['adm-attn', user?.id, personal], enabled: !!user, queryFn: async () => {
    let query = sb.from('admin_tasks').select('id,title,priority,due_date,linked_type', { count: 'exact' }).neq('status', 'done');
    if (personal) query = query.eq('assignee_id', user?.id);
    const { data, error, count } = await query.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).range(0, 7);
    if (error) throw error; return { rows: data ?? [], total: count ?? 0 };
  } });
  const d = k.data;
  // Everything across the portal that someone should look at, one number each (founder request, Nov 12, 2026).
  const waiting = useQuery({ queryKey: ['adm-dash-waiting', user?.id], enabled: !!user, refetchInterval: 60_000, queryFn: async () => {
    const [fr, contact, cards, monthly, stock] = await Promise.all([
      rpc<FundraiserCounts>('admin_fundraiser_counts').catch(() => null),
      count('contact_messages', 'status', 'new').catch(() => 0),
      count('card_donations', 'status', 'pending').catch(() => 0),
      rpc<Array<{ total_count: number }>>('admin_recurring_list', { _status: 'payment_problem', _limit: 1, _offset: 0 }).then((r) => Number(r?.[0]?.total_count ?? 0)).catch(() => 0),
      rpc<Array<{ waiting: number; in_stock: number }>>('admin_inventory_summary').then((r) => (r ?? []).reduce((n, x) => n + Math.max(0, Number(x.waiting) - Number(x.in_stock)), 0)).catch(() => 0),
    ]);
    return { fr, contact, cards, monthly, stock };
  } });
  const review = useQuery({ queryKey: ['adm-dash-review', user?.id], enabled: !!user, queryFn: () => rpc<FundraiserRow[]>('admin_fundraiser_list', { _view: 'review', _sort: 'created', _dir: 'asc', _limit: 6 }) });
  const w = waiting.data;

  const tiles = [
    ['Raised today', usd(d?.raised_today), '/admin/donations'], ['Raised · 7 days', usd(d?.raised_week), '/admin/donations'],
    ['Raised · 30 days', usd(d?.raised_month), '/admin/donations'], ['Donations · 30 days', d?.donations_month, '/admin/donations'],
    ['Active fundraisers', d?.active_fundraisers, '/admin/fundraisers?status=active'], ['Pending approval', d?.pending_fundraisers, '/admin/fundraisers?status=pending'],
    ['Open reports', d?.open_reports, '/admin/moderation'], ['Open tasks', d?.open_tasks, '/admin/tasks'],
  ] as const;

  const attention = [
    d?.pending_fundraisers ? { label: `${d.pending_fundraisers} fundraiser${d.pending_fundraisers === 1 ? '' : 's'} waiting for review`, to: '/admin/fundraisers?view=review' } : null,
    w?.fr?.waiting ? { label: `${w.fr.waiting} coupon${w.fr.waiting === 1 ? '' : 's'} to send to families`, to: '/admin/fundraisers?view=coupons&sort=waiting&dir=desc' } : null,
    w?.stock ? { label: `${w.stock} coupon code${w.stock === 1 ? '' : 's'} to buy (not enough in stock)`, to: '/admin/procurement' } : null,
    w?.cards ? { label: `${w.cards} donated card${w.cards === 1 ? '' : 's'} to check`, to: '/admin/card-donations' } : null,
    w?.contact ? { label: `${w.contact} new contact message${w.contact === 1 ? '' : 's'}`, to: '/admin/contact' } : null,
    d?.open_reports ? { label: `${d.open_reports} open report${d.open_reports === 1 ? '' : 's'}`, to: '/admin/moderation' } : null,
    d?.pending_verifications ? { label: `${d.pending_verifications} verification${d.pending_verifications === 1 ? '' : 's'} to review`, to: '/admin/verifications' } : null,
    w?.monthly ? { label: `${w.monthly} monthly gift${w.monthly === 1 ? '' : 's'} with a payment problem`, to: '/admin/monthly?status=payment_problem' } : null,
    w?.fr?.views?.no_photo ? { label: `${w.fr.views.no_photo} open fundraiser${w.fr.views.no_photo === 1 ? '' : 's'} without a photo`, to: '/admin/fundraisers?view=no_photo' } : null,
    d?.overdue_tasks ? { label: `${d.overdue_tasks} overdue task${d.overdue_tasks === 1 ? '' : 's'}`, to: '/admin/tasks' } : null,
  ].filter(Boolean) as { label: string; to: string }[];

  return (
    <DashboardLayout>
      <PageHeader title={`Hello, ${firstName}`} actions={<div className="flex gap-1"><Button size="sm" variant={personal ? 'default' : 'outline'} onClick={() => setParams({ scope: 'mine' })}>My work</Button><Button size="sm" variant={!personal ? 'default' : 'outline'} onClick={() => setParams({ scope: 'team' })}>Team overview</Button></div>} />
      {k.error && <p className="mb-4 rounded-md bg-destructive/5 p-3 text-sm text-destructive">Couldn't load figures: {(k.error as Error).message} <Button size="sm" variant="link" onClick={() => k.refetch()}>Retry</Button></p>}
      <div className="grid grid-cols-2 gap-3 tabular-nums md:grid-cols-4">
        {tiles.map(([l, v, to]) => (
          <Link key={l} to={to} className="rounded-lg bg-background p-4 transition-colors hover:bg-muted/40">
            <p className="text-xs text-muted-foreground">{l}</p>
            {k.isLoading ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-1 text-2xl font-semibold text-foreground">{v ?? 0}</p>}
          </Link>
        ))}
      </div>

      <section className="mt-6" aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="mb-2 text-sm font-medium">Needs attention</h2>
        {waiting.isLoading && k.isLoading ? <Skeleton className="h-16 w-full" /> : !attention.length ? <p className="rounded-lg bg-primary/5 p-3 text-sm text-foreground">Nothing waiting. All clear.</p> : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((a) => <li key={a.label}><Link to={a.to} className="flex items-center justify-between gap-2 rounded-lg border border-verify/30 bg-verify/5 px-3 py-2.5 text-sm text-foreground hover:border-verify">{a.label}<ArrowRight className="h-3.5 w-3.5 shrink-0 text-verify" /></Link></li>)}
          </ul>
        )}
      </section>

      {!!review.data?.length && (
        <section className="mt-6" aria-labelledby="review-heading">
          <div className="mb-2 flex items-baseline justify-between"><h2 id="review-heading" className="text-sm font-medium">Waiting for review, oldest first</h2><Link to="/admin/fundraisers?view=review" className="text-xs text-primary">See all {review.data[0]?.total_count ?? ''}</Link></div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {review.data.map((f) => (
              <li key={f.id}><Link to={`/admin/fundraisers?view=review&id=${f.id}`} className="flex gap-3 rounded-lg border border-border bg-background p-2.5 hover:border-primary/50">
                <FundraiserThumb url={f.photo_url} need={f.help_categories[0] ?? f.category} size={64} rounded="rounded-md" />
                <div className="min-w-0 text-sm">
                  <p className="line-clamp-2 font-medium leading-snug text-foreground">{f.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{[f.organizer_name, cityState(f.city, f.state_code)].filter(Boolean).join(' · ')}</p>
                  <p className="text-xs text-muted-foreground">{needLabel(f.help_categories[0] ?? f.category)} · goal {usdWhole(f.monthly_goal)} · sent {ago(f.created_at)}</p>
                </div>
              </Link></li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
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
        <section className="">
          <p className="mb-3 text-sm font-medium">{personal ? 'Tasks assigned to you' : 'Open tasks'}</p>
          {!tasks.data?.rows.length ? <p className="text-sm text-muted-foreground">No open tasks{personal ? ' assigned to you' : ''}.</p> : (
            <ul className="divide-y divide-border text-sm">
              {(tasks.data?.rows ?? []).map((t: any) => <li key={t.id}><Link to={`/admin/tasks?id=${t.id}`} className="block py-2 hover:text-primary"><span className="mr-1.5 text-xs capitalize text-destructive">{t.priority}</span>{t.title}</Link></li>)}
            </ul>
          )}
          {tasks.error && <Button size="sm" variant="outline" onClick={() => tasks.refetch()}>Retry tasks</Button>}
          <Button size="sm" variant="link" asChild><Link to={`/admin/tasks?scope=${personal ? 'mine' : 'open'}`}>View {tasks.data?.total ?? 0} {personal ? 'assigned' : 'open'} tasks</Link></Button>
        </section>
      </div>

      <section className="mt-6">
        <p className="mb-3 text-sm font-medium">Recent activity</p>
        {!feed.data?.length ? <p className="text-sm text-muted-foreground">Activity appears here as fundraisers, donations, reports and applications come in.</p> : (
          <ul className="divide-y divide-border text-sm">{feed.data.map((n: any) => <li key={n.id} className="flex justify-between gap-3 py-2"><Link to={n.link ?? '/admin'} className="hover:text-primary">{n.title}</Link><span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.created_at)}</span></li>)}</ul>
        )}
      </section>
    </DashboardLayout>
  );
}
