import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { sb, usd, fmtDate, downloadCsv, fetchAllChunks } from '@/lib/adminApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Download, Search, ExternalLink } from 'lucide-react';

const PAGE = 25;
const clean = (s: string) => s.trim().replace(/[%,()]/g, '');

// Read-only financial records. Refunds and charges stay in the Stripe and Square dashboards.
export default function AdminDonations() {
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState({ status: 'completed', provider: 'all', from: '', to: '', min: '', max: '', retailer: '', fundraiser: 'all', q: '' });
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });
  useEffect(() => { const t = setTimeout(() => { setDq(f.q); setPage(0); }, 300); return () => clearTimeout(t); }, [f.q]);
  const set = (k: string, v: string) => { setF((p) => ({ ...p, [k]: v })); setPage(0); };

  const { data: frs } = useQuery({ queryKey: ['adm-fr-lite'], queryFn: async () => (await sb.from('fundraisers').select('id,title').order('title').limit(500)).data ?? [] });

  const apply = (b: any) => {
    if (f.status !== 'all') b = f.status === 'completed' ? b.in('status', ['completed', 'succeeded']) : b.eq('status', f.status);
    if (f.provider !== 'all') b = b.eq('payment_provider', f.provider);
    if (f.from) b = b.gte('created_at', new Date(f.from).toISOString());
    if (f.to) b = b.lt('created_at', new Date(new Date(f.to).getTime() + 86400000).toISOString());
    if (f.min) b = b.gte('amount', Number(f.min));
    if (f.max) b = b.lte('amount', Number(f.max));
    if (f.retailer.trim()) b = b.ilike('brand_partner', `%${clean(f.retailer)}%`);
    if (f.fundraiser === 'none') b = b.is('fundraiser_id', null); else if (f.fundraiser !== 'all') b = b.eq('fundraiser_id', f.fundraiser);
    if (clean(dq)) b = b.or(`donor_name.ilike.%${clean(dq)}%,donor_email.ilike.%${clean(dq)}%`);
    return b;
  };
  const COLS_SEL = 'id,amount,net_amount,status,donor_name,donor_email,is_anonymous,brand_partner,payment_provider,fundraiser_id,created_at,fundraisers(title)';

  const q = useQuery({
    queryKey: ['adm-don', f, dq, page, sort],
    queryFn: async () => {
      const { data, error, count } = await apply(sb.from('donations').select(COLS_SEL, { count: 'exact' })).order(sort.key, { ascending: sort.dir === 'asc' }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
  });

  const cols: Column<any>[] = [
    { key: 'created_at', header: 'Date', sortable: true, cell: (r) => fmtDate(r.created_at) },
    { key: 'donor', header: 'Donor', cell: (r) => <div><p className="text-foreground">{r.donor_name || 'Guest'}{r.is_anonymous && <span className="ml-1 text-xs text-muted-foreground">(anonymous publicly)</span>}</p><p className="text-xs text-muted-foreground">{r.donor_email}</p></div> },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, cell: (r) => <span className="font-medium">{usd(r.amount)}</span> },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <StatusBadge value={r.status} /> },
    { key: 'brand_partner', header: 'Retailers', cell: (r) => <span className="line-clamp-1 max-w-[180px] text-xs">{r.brand_partner || '—'}</span> },
    { key: 'fundraiser', header: 'Fundraiser', cell: (r) => <span className="line-clamp-1 max-w-[200px] text-xs">{r.fundraisers?.title ?? 'General fund'}</span> },
    { key: 'payment_provider', header: 'Provider', sortable: true, cell: (r) => <span className="capitalize">{r.payment_provider ?? 'stripe'}</span> },
  ];

  const exportCsv = async () => {
    const rows = await fetchAllChunks((a, b) => apply(sb.from('donations').select('id,created_at,amount,net_amount,status,donor_name,is_anonymous,brand_partner,payment_provider,fundraiser_id')).order('created_at', { ascending: false }).range(a, b));
    downloadCsv('donations', rows);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Donations" description="Read-only financial records. Refunds and charges are handled in the Stripe and Square dashboards."
        actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />CSV</Button>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <div className="relative sm:col-span-2"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Donor name or email" value={f.q} onChange={(e) => set('q', e.target.value)} /></div>
        <Select value={f.status} onValueChange={(v) => set('status', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{['all', 'completed', 'pending', 'failed', 'refunded', 'expired'].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s}</SelectItem>)}</SelectContent></Select>
        <Select value={f.provider} onValueChange={(v) => set('provider', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All providers</SelectItem><SelectItem value="stripe">Stripe</SelectItem><SelectItem value="square">Square</SelectItem></SelectContent></Select>
        <Select value={f.fundraiser} onValueChange={(v) => set('fundraiser', v)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All fundraisers</SelectItem><SelectItem value="none">General fund</SelectItem>{(frs ?? []).map((x: any) => <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>)}</SelectContent></Select>
        <Input className="h-9" placeholder="Retailer" value={f.retailer} onChange={(e) => set('retailer', e.target.value)} />
        <Input className="h-9" type="date" value={f.from} onChange={(e) => set('from', e.target.value)} aria-label="From date" />
        <Input className="h-9" type="date" value={f.to} onChange={(e) => set('to', e.target.value)} aria-label="To date" />
        <Input className="h-9" type="number" placeholder="Min $" value={f.min} onChange={(e) => set('min', e.target.value)} />
        <Input className="h-9" type="number" placeholder="Max $" value={f.max} onChange={(e) => set('max', e.target.value)} />
      </div>
      <DataTable columns={cols} rows={q.data?.rows} total={q.data?.total} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} onRetry={() => q.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} sort={sort} onSort={(k) => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }))}
        rowKey={(r) => r.id} onRowClick={(r) => setParams((p) => { p.set('id', r.id); return p; })} empty="No donations match these filters." />
      <DonationDrawer id={params.get('id')} onClose={() => setParams((p) => { p.delete('id'); return p; })} />
    </DashboardLayout>
  );
}

function DonationDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const d = useQuery({
    queryKey: ['adm-don-detail', id], enabled: !!id,
    queryFn: async () => {
      const [don, brands, coupons] = await Promise.all([
        sb.from('donations').select('*, fundraisers(title, unique_slug)').eq('id', id).single(),
        sb.from('donation_brands').select('id,brand_name,allocation_percent,allocated_amount').eq('donation_id', id),
        sb.from('coupons').select('id,store_name,value,expected_value,status,created_at,redeemed_at').eq('donation_id', id).order('created_at'),
      ]);
      if (don.error) throw don.error;
      return { don: don.data, brands: brands.data ?? [], coupons: coupons.data ?? [] };
    },
  });
  const x = d.data?.don;
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {!x ? <p className="p-6 text-sm text-muted-foreground">{d.error ? (d.error as Error).message : 'Loading…'}</p> : (
          <div className="space-y-5 tabular-nums">
            <SheetHeader><SheetTitle className="text-left font-serif text-2xl font-normal">{usd(x.amount)} donation</SheetTitle></SheetHeader>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[['Status', <StatusBadge key="s" value={x.status} />], ['Date', fmtDate(x.created_at)], ['Donor', x.donor_name || 'Guest'], ['Email', x.donor_email || '—'],
                ['Shown publicly as', x.is_anonymous ? 'Anonymous' : 'Name'], ['Provider', x.payment_provider ?? 'stripe'], ['Net', usd(x.net_amount)], ['Fee', usd(x.stripe_fee)],
                ['Fundraiser', x.fundraisers?.title ?? 'General fund'], ['Message', x.message || '—']].map(([k, v]) => (
                <div key={k as string}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></div>))}
            </dl>
            {x.receipt_url && <a className="inline-flex items-center gap-1 text-sm text-primary" href={x.receipt_url} target="_blank" rel="noreferrer">Provider receipt <ExternalLink className="h-3 w-3" /></a>}
            <div><p className="mb-1 text-sm font-medium">Retailer split</p>
              {d.data!.brands.length ? <ul className="divide-y divide-border text-sm">{d.data!.brands.map((b: any) => <li key={b.id} className="flex justify-between py-1.5"><span>{b.brand_name} · {b.allocation_percent}%</span><span>{usd(b.allocated_amount)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">{x.brand_partner || 'No split recorded.'}</p>}</div>
            <div><p className="mb-1 text-sm font-medium">Coupon trail</p>
              {d.data!.coupons.length ? <ul className="divide-y divide-border text-sm">{d.data!.coupons.map((c: any) => <li key={c.id} className="flex justify-between py-1.5"><span>{c.store_name} · {usd(c.value ?? c.expected_value)}</span><StatusBadge value={c.status} /></li>)}</ul> : <p className="text-sm text-muted-foreground">No coupons linked to this donation.</p>}</div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
