import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { rpc, adminWrite, usd, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface Group { store_name: string; value: number; n: number; oldest: string }

export default function AdminProcurement() {
  const { toast } = useToast();
  const { isAdmin } = useTeamRole();
  const g = useQuery({ queryKey: ['adm-proc'], queryFn: () => rpc<Group[]>('admin_procurement_groups') });
  const batches = useAdminPaged({ table: 'coupon_procurement_batches', searchCols: ['brand_name', 'vendor'], defaultSort: { key: 'created_at', dir: 'desc' }, pageSize: 10 });
  const [active, setActive] = useState<Group | null>(null);
  const [codesText, setCodesText] = useState('');
  const [vendor, setVendor] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const groups = g.data ?? [];
  const totalPending = groups.reduce((s, x) => s + Number(x.n), 0);
  const totalValue = groups.reduce((s, x) => s + Number(x.n) * Number(x.value), 0);

  const upload = async () => {
    if (!active) return;
    const codes = codesText.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);
    if (!codes.length) { toast({ title: 'No codes', description: 'Paste at least one code.', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const attached = await rpc<number>('attach_procured_codes', { _brand: active.store_name, _value: active.value, _codes: codes });
      await adminWrite('coupon_procurement_batches', 'insert', null, { brand_name: active.store_name, coupon_value: active.value, total_count: attached, total_cost: totalCost ? Number(totalCost) : null, vendor: vendor || null });
      toast({ title: `Attached ${attached} code(s)`, description: `${active.store_name} ${usd(active.value)} coupons are now live for recipients.` });
      setCodesText(''); setVendor(''); setTotalCost(''); setActive(null);
      g.refetch(); batches.q.refetch();
    } catch (e) { toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const cols: Column<Group>[] = [
    { key: 'store_name', header: 'Brand', cell: (r) => <span className="font-medium text-foreground">{r.store_name}</span> },
    { key: 'value', header: 'Value', align: 'right', cell: (r) => usd(r.value) },
    { key: 'n', header: 'Codes needed', align: 'right', cell: (r) => Number(r.n).toLocaleString() },
    { key: 'oldest', header: 'Oldest', cell: (r) => fmtDate(r.oldest) },
    ...(isAdmin ? [{ key: 'a', header: '', align: 'right' as const, cell: (r: Group) => <Button size="sm" onClick={() => setActive(r)}><Upload className="mr-1.5 h-3.5 w-3.5" />Upload codes</Button> }] : []),
  ];
  const bcols: Column<any>[] = [
    { key: 'created_at', header: 'Date', sortable: true, cell: (r) => fmtDate(r.created_at) },
    { key: 'brand_name', header: 'Brand', sortable: true, cell: (r) => r.brand_name },
    { key: 'coupon_value', header: 'Value', align: 'right', cell: (r) => usd(r.coupon_value) },
    { key: 'total_count', header: 'Codes', align: 'right', sortable: true, cell: (r) => r.total_count },
    { key: 'total_cost', header: 'Cost', align: 'right', cell: (r) => (r.total_cost == null ? '—' : usd(r.total_cost)) },
    { key: 'vendor', header: 'Vendor', cell: (r) => r.vendor || '—' },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Procurement" description="Upload real gift-card codes bought from vendors. Codes attach first-in, first-out to the oldest pending coupons for each brand and value." />
      <div className="mb-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 tabular-nums">
        {[['Pending slots', totalPending.toLocaleString()], ['Value owed', usd(totalValue)], ['Brands', new Set(groups.map((x) => x.store_name)).size]].map(([k, v]) => (
          <div key={k as string} className="bg-background p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-2xl font-semibold text-foreground">{v}</p></div>))}
      </div>
      <DataTable columns={cols} rows={groups} total={groups.length} loading={g.isLoading} error={g.error ? (g.error as Error).message : null} onRetry={() => g.refetch()} page={0} pageSize={Math.max(groups.length, 1)} onPage={() => {}} rowKey={(r) => `${r.store_name}-${r.value}`} empty="All caught up — no coupons need procurement." />
      <h2 className="mb-2 mt-8 text-sm font-medium text-foreground">Upload history</h2>
      <DataTable columns={bcols} {...batches.tableProps} rowKey={(r: any) => r.id} empty="No uploads yet." />

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Upload {active?.store_name} {usd(active?.value)} codes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Codes (one per line, or comma-separated)</Label>
              <Textarea rows={8} placeholder={'WMRT-AAAA-1111\nWMRT-BBBB-2222'} value={codesText} onChange={(e) => setCodesText(e.target.value)} className="mt-2 font-mono text-sm" />
              <p className="mt-1 text-xs text-muted-foreground">Up to {active?.n} will be attached. Extras are ignored.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Vendor (optional)</Label><Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Tango / Tremendous / Direct" /></div>
              <div><Label>Total cost (optional)</Label><Input type="number" step="0.01" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} /></div>
            </div>
            <Button onClick={upload} disabled={submitting} className="w-full">{submitting ? 'Uploading…' : 'Attach to pending coupons'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
