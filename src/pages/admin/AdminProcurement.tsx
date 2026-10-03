import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { sb, rpc, usd, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Sparkles } from 'lucide-react';

interface Summary { store_name: string; value: number; in_stock: number; waiting: number; given: number; used: number; expired: number }
interface Usage { id: string; store_name: string; value: number; state: string; code_hint: string | null; expiry_date: string | null; batch_name: string | null; fundraiser_id: string | null; fundraiser_title: string | null; given_at: string | null; used_at: string | null; created_at: string; total_count: number }
const STATES: [string, string][] = [['all', 'All'], ['waiting', 'Waiting for a code'], ['in_stock', 'In stock'], ['given', 'Given, not used'], ['used', 'Used'], ['expired', 'Expired']];
const LABEL: Record<string, string> = { waiting: 'needs code', in_stock: 'in stock', given: 'given', used: 'used', expired: 'expired' };
const PAGE = 25;

/** What donations still need, what stock can cover, and whether each code has been used. */
export default function AdminProcurement() {
  const { toast } = useToast();
  const { canWrite: isAdmin } = useTeamRole();
  const sum = useQuery({ queryKey: ['adm-inv'], queryFn: () => rpc<Summary[]>('admin_inventory_summary') });
  const [state, setState] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const u = useQuery({
    queryKey: ['adm-usage', state, search, page],
    queryFn: () => rpc<Usage[]>('admin_code_usage', { _state: state, _search: search.trim() || null, _limit: PAGE, _offset: page * PAGE }),
  });
  const [busy, setBusy] = useState<string | null>(null);
  const reload = () => { sum.refetch(); u.refetch(); };
  const rows = sum.data ?? [];
  const tot = (k: keyof Summary) => rows.reduce((s, r) => s + Number(r[k]), 0);
  const val = (k: keyof Summary) => rows.reduce((s, r) => s + Number(r[k]) * Number(r.value ?? 0), 0);
  const needs = rows.filter((r) => Number(r.waiting) > 0);

  const fill = async (r: Summary) => {
    setBusy(`${r.store_name}-${r.value}`);
    try {
      const res = await rpc<{ fundraiser_id: string; coupon_ids: string[] }[]>('admin_fill_from_stock', { _brand: r.store_name, _value: r.value, _limit: 200 });
      const n = res.reduce((s, x) => s + x.coupon_ids.length, 0);
      let failed = 0;
      for (const x of res) {
        const { data, error } = await sb.functions.invoke('fundraiser-actions', { body: { action: 'notify_coupon_ready', fundraiser_id: x.fundraiser_id, coupon_ids: x.coupon_ids.slice(0, 50) } });
        if (error || !(data as any)?.sent) failed++;
      }
      toast({ title: n ? `Gave ${n} code(s) from stock` : 'Nothing filled', description: n ? `${res.length} organizer email(s)${failed ? `, ${failed} could not be sent` : ' sent'}.` : 'No matching unexpired stock.' });
      reload();
    } catch (e) { toast({ title: 'Fill failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(null);
  };
  const mark = async (r: Usage, used: boolean) => {
    setBusy(r.id);
    try { await rpc('admin_mark_coupon_used', { _id: r.id, _used: used }); toast({ title: used ? 'Marked as used' : 'Marked as not used' }); reload(); }
    catch (e) { toast({ title: 'Update failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(null);
  };
  const autoProcure = async () => {
    setBusy('auto');
    try {
      const { data, error } = await supabase.functions.invoke('procure-coupons', { body: { limit: 100 } });
      if (error) throw error; const d = data as any; if (d?.error) throw new Error(d.error);
      toast({ title: 'Vendor run complete', description: `Processed ${d?.processed ?? 0}, succeeded ${d?.success ?? 0}, failed ${d?.failed ?? 0}.` }); reload();
    } catch (e) { toast({ title: 'Vendor run failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(null);
  };

  const needCols: Column<Summary>[] = [
    { key: 'store_name', header: 'Brand', cell: (r) => <span className="font-medium text-foreground">{r.store_name}</span> },
    { key: 'value', header: 'Amount', align: 'right', cell: (r) => usd(r.value) },
    { key: 'waiting', header: 'Waiting', align: 'right', cell: (r) => r.waiting },
    { key: 'in_stock', header: 'In stock', align: 'right', cell: (r) => r.in_stock },
    { key: 'gap', header: 'Still to buy', align: 'right', cell: (r) => Math.max(0, Number(r.waiting) - Number(r.in_stock)) },
    ...(isAdmin ? [{ key: 'a', header: '', align: 'right' as const, cell: (r: Summary) => Number(r.in_stock) > 0
      ? <Button size="sm" disabled={!!busy} onClick={() => fill(r)}>{busy === `${r.store_name}-${r.value}` ? 'Filling…' : `Fill ${Math.min(Number(r.waiting), Number(r.in_stock))} from stock`}</Button>
      : <Link to="/admin/coupons" className="text-xs text-primary">Add codes</Link> }] : []),
  ];
  const useCols: Column<Usage>[] = [
    { key: 'store_name', header: 'Coupon', cell: (r) => <div><p className="font-medium text-foreground">{usd(r.value)} {r.store_name}</p><p className="font-mono text-xs text-muted-foreground">{r.code_hint ?? '—'}</p></div> },
    { key: 'state', header: 'Status', cell: (r) => <StatusBadge value={LABEL[r.state] ?? r.state} /> },
    { key: 'f', header: 'Fundraiser', cell: (r) => r.fundraiser_title ? <span className="line-clamp-1 max-w-[220px]">{r.fundraiser_title}</span> : <span className="text-muted-foreground">—</span> },
    { key: 'batch', header: 'Bundle', cell: (r) => <span className="text-xs text-muted-foreground">{r.batch_name ?? '—'}</span> },
    { key: 'given', header: 'Given', cell: (r) => r.given_at && r.state !== 'in_stock' && r.state !== 'waiting' ? fmtDate(r.given_at) : '—' },
    { key: 'used', header: 'Used', cell: (r) => r.used_at ? fmtDate(r.used_at) : '—' },
    ...(isAdmin ? [{ key: 'a', header: '', align: 'right' as const, cell: (r: Usage) => r.state === 'given'
      ? <Button size="sm" variant="outline" disabled={!!busy} onClick={() => mark(r, true)}>Mark used</Button>
      : r.state === 'used' && r.fundraiser_id ? <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => mark(r, false)}>Undo</Button> : null }] : []),
  ];
  const figures: [string, string, string][] = [
    ['In stock', tot('in_stock').toLocaleString(), usd(val('in_stock'))],
    ['Waiting for a code', tot('waiting').toLocaleString(), usd(val('waiting'))],
    ['Given, not used', tot('given').toLocaleString(), usd(val('given'))],
    ['Used', tot('used').toLocaleString(), usd(val('used'))],
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Procurement" description="See which donation coupons still need a code, fill them from your stock, and track whether each code has been used."
        actions={isAdmin && <Button size="sm" variant="outline" onClick={autoProcure} disabled={!!busy}><Sparkles className="mr-1.5 h-4 w-4" />Buy from vendor</Button>} />
      <div className="mb-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4 tabular-nums">
        {figures.map(([k, n, v]) => <div key={k} className="bg-background p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-semibold text-foreground">{sum.data ? n : '—'}</p><p className="text-xs text-muted-foreground">{sum.data ? v : ''}</p></div>)}
      </div>
      <h2 className="mb-2 text-sm font-medium text-foreground">Needed now</h2>
      <DataTable columns={needCols} rows={needs} total={needs.length} loading={sum.isLoading} error={sum.error ? (sum.error as Error).message : null} onRetry={() => sum.refetch()} page={0} pageSize={Math.max(needs.length, 1)} onPage={() => {}} rowKey={(r) => `${r.store_name}-${r.value}`} empty="All caught up — no donation coupons are waiting for a code." />
      <h2 className="mb-2 mt-8 text-sm font-medium text-foreground">Every code and where it went</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search brand, fundraiser or bundle" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div>
        <Select value={state} onValueChange={(v) => { setState(v); setPage(0); }}><SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger><SelectContent>{STATES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
      </div>
      <DataTable columns={useCols} rows={u.data} total={Number(u.data?.[0]?.total_count ?? 0)} loading={u.isLoading} error={u.error ? (u.error as Error).message : null} onRetry={() => u.refetch()} page={page} pageSize={PAGE} onPage={setPage} rowKey={(r) => r.id} empty="No coupons match." />
    </DashboardLayout>
  );
}
