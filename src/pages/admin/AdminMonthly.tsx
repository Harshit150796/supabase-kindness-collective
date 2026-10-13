import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { rpc, sb, usd, fmtDate, downloadCsv } from '@/lib/adminApi';
import { fetchRpcPages } from '@/lib/adminWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import { Download, Search } from 'lucide-react';

const PAGE = 25;
const STATUSES = [['', 'All'], ['active', 'Active'], ['pending', 'Waiting for first payment'], ['payment_problem', 'Payment problem'], ['paused', 'Paused'], ['canceled', 'Cancelled']] as const;
const label = (s: string) => STATUSES.find(([k]) => k === s)?.[1] ?? s;
const monthly = (r: any) => (r.gift_cents + r.tip_cents + r.fee_cents) / 100;

// Every monthly gift, its next charge and history. Actions go through recurring-actions (audited).
export default function AdminMonthly() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);

  const args = (limit: number, offset: number) => ({ _search: dq.trim() || null, _status: status || null, _limit: limit, _offset: offset });
  const query = useQuery({ queryKey: ['adm-monthly', dq, status, page], queryFn: () => rpc<any[]>('admin_recurring_list', args(PAGE, page * PAGE)) });
  const rows = query.data ?? [];
  const charges = useQuery({
    queryKey: ['adm-monthly-charges', sel?.id], enabled: !!sel,
    queryFn: async () => (await sb.from('recurring_charges').select('*').eq('recurring_id', sel.id).order('charged_at', { ascending: false })).data ?? [],
  });

  const act = async (action: 'pause' | 'resume' | 'cancel') => {
    if (action === 'cancel' && !window.confirm('Cancel this monthly gift? Square will stop charging the card.')) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('recurring-actions', { body: { action, id: sel.id } });
    setBusy(false);
    if (error || data?.error) { toast({ title: data?.error ?? 'Action failed', variant: 'destructive' }); return; }
    toast({ title: `Monthly gift ${action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'resumed'}` });
    setSel(null); query.refetch();
  };

  const cols: Column<any>[] = [
    { key: 'donor', header: 'Donor', cell: (r) => <div><p className="font-medium text-foreground">{r.donor_name || 'Guest donor'}</p><p className="text-xs text-muted-foreground">{r.donor_email ?? '—'}</p></div> },
    { key: 'amount', header: 'Each month', align: 'right', cell: (r) => <span className="font-medium tabular-nums">{usd(monthly(r))}</span> },
    { key: 'to', header: 'Going to', cell: (r) => <span className="text-sm">{r.fundraiser_title || r.brand_name || 'General fund'}</span> },
    { key: 'status', header: 'Status', cell: (r) => <span className={r.status === 'payment_problem' ? 'text-destructive' : ''}>{label(r.status)}</span> },
    { key: 'next', header: 'Next charge', cell: (r) => r.status === 'active' ? fmtDate(r.next_charge_on) : '—' },
    { key: 'count', header: 'Charges', align: 'right', cell: (r) => r.charges_count },
    { key: 'total', header: 'Total given', align: 'right', cell: (r) => usd(r.total_charged_cents / 100) },
  ];

  const exportCsv = async () => {
    try {
      const all = await fetchRpcPages<any>((offset, limit) => rpc('admin_recurring_list', args(limit, offset)));
      downloadCsv('monthly-gifts', all.map(({ total_count, ...r }) => ({ ...r, monthly_total: monthly(r) })));
    } catch (e) { toast({ title: 'Export failed', description: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Monthly gifts" description="Donors who give the same amount every month. Square charges their saved card automatically; each charge becomes a normal donation."
        actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" />CSV</Button>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search name, email or retailer" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {STATUSES.map(([k, l]) => <Button key={k} size="sm" variant={status === k ? 'default' : 'outline'} onClick={() => { setStatus(k); setPage(0); }}>{l}</Button>)}
      </div>
      <DataTable columns={cols} rows={rows} total={Number(rows[0]?.total_count ?? 0)} loading={query.isLoading} error={query.error ? (query.error as Error).message : null} onRetry={() => query.refetch()}
        page={page} pageSize={PAGE} onPage={setPage} onRowClick={setSel} rowKey={(r) => r.id} empty="No monthly gifts yet." />
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && <>
            <SheetHeader><SheetTitle>{sel.donor_name || sel.donor_email || 'Guest donor'}</SheetTitle></SheetHeader>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Each month</dt><dd className="tabular-nums">{usd(monthly(sel))} ({usd(sel.gift_cents / 100)} to families)</dd>
              <dt className="text-muted-foreground">Retailers</dt><dd>{sel.brand_name ?? '—'}</dd>
              <dt className="text-muted-foreground">Status</dt><dd>{label(sel.status)}{sel.failure_reason ? ` — ${sel.failure_reason}` : ''}</dd>
              <dt className="text-muted-foreground">Started</dt><dd>{fmtDate(sel.created_at)}</dd>
              <dt className="text-muted-foreground">Last charge</dt><dd>{fmtDate(sel.last_charge_at)}</dd>
              <dt className="text-muted-foreground">Next charge</dt><dd>{fmtDate(sel.next_charge_on)}</dd>
              <dt className="text-muted-foreground">Account</dt><dd>{sel.user_id ? 'Linked' : 'Guest (links when they sign up)'}</dd>
            </dl>
            <h3 className="mt-6 font-medium">Charges</h3>
            <ul className="mt-2 divide-y text-sm">
              {(charges.data ?? []).map((c: any) => <li key={c.id} className="flex justify-between py-2"><span>{fmtDate(c.charged_at)}</span><span className="tabular-nums">{usd(c.amount_cents / 100)}</span></li>)}
              {charges.data?.length === 0 && <li className="py-2 text-muted-foreground">No charges yet.</li>}
            </ul>
            {sel.status !== 'canceled' && <div className="mt-6 flex gap-2">
              {sel.status === 'paused' ? <Button size="sm" variant="outline" disabled={busy} onClick={() => act('resume')}>Resume</Button>
                : sel.status === 'active' && <Button size="sm" variant="outline" disabled={busy} onClick={() => act('pause')}>Pause</Button>}
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => act('cancel')}>Cancel gift</Button>
            </div>}
          </>}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
