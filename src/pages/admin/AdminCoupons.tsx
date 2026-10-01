import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, StatusBadge, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { sb, adminWrite, usd, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, RefreshCw, Sparkles } from 'lucide-react';

const STATUSES = ['available', 'reserved', 'claimed', 'redeemed', 'expired', 'pending_procurement', 'procurement_failed'];
const mask = (c: string | null) => (!c ? '—' : c.length <= 4 ? '••••' : `••••${c.slice(-4)}`);

// Coupons are financial records: they can be edited or expired, never deleted from the portal.
export default function AdminCoupons() {
  const { toast } = useToast();
  const { isAdmin } = useTeamRole();
  const [status, setStatus] = useState('all');
  const t = useAdminPaged({
    table: 'coupons', select: 'id,title,code,status,value,expected_value,store_name,expiry_date,donation_id,procurement_attempts,last_procurement_error,created_at',
    searchCols: ['title', 'store_name'], defaultSort: { key: 'created_at', dir: 'desc' }, filter: (b) => (status === 'all' ? b : b.eq('status', status)), deps: [status],
  });
  const counts = useQuery({
    queryKey: ['adm-coupon-counts'],
    queryFn: async () => {
      const out: Record<string, number> = {};
      await Promise.all(['available', 'pending_procurement', 'procurement_failed', 'redeemed'].map(async (s) => {
        const { count, error } = await sb.from('coupons').select('id', { count: 'exact', head: true }).eq('status', s);
        if (error) throw new Error(error.message);
        out[s] = count ?? 0;
      }));
      return out;
    },
  });
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const reload = () => { t.q.refetch(); counts.refetch(); };
  const toProcure = (counts.data?.pending_procurement ?? 0) + (counts.data?.procurement_failed ?? 0);

  const save = async () => {
    setSaving(true);
    try {
      await adminWrite('coupons', 'update', [editing.id], { title: editing.title, store_name: editing.store_name, value: editing.value, expiry_date: editing.expiry_date, status: editing.status, ...(editing.newCode ? { code: editing.newCode } : {}) });
      toast({ title: 'Coupon updated' }); setEditing(null); reload();
    } catch (e) { toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' }); }
    setSaving(false);
  };
  const retry = async (ids?: string[]) => {
    setRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke('procure-coupons', { body: ids ? { coupon_ids: ids } : { limit: 100 } });
      if (error) throw error;
      const d = data as any; if (d?.error) throw new Error(d.error);
      toast({ title: 'Procurement run complete', description: `Processed ${d?.processed ?? 0}, succeeded ${d?.success ?? 0}, failed ${d?.failed ?? 0}.` });
      reload();
    } catch (e) { toast({ title: 'Retry failed', description: (e as Error).message, variant: 'destructive' }); }
    setRetrying(false);
  };

  const cols: Column<any>[] = [
    { key: 'created_at', header: 'Created', sortable: true, cell: (r) => fmtDate(r.created_at) },
    { key: 'title', header: 'Coupon', sortable: true, cell: (r) => <div className="max-w-[260px]"><p className="truncate font-medium text-foreground">{r.title}</p><p className="text-xs text-muted-foreground">{r.store_name}</p></div> },
    { key: 'value', header: 'Value', align: 'right', sortable: true, cell: (r) => usd(r.value ?? r.expected_value) },
    { key: 'status', header: 'Status', sortable: true, cell: (r) => <div><StatusBadge value={r.status} />{r.status === 'procurement_failed' && r.last_procurement_error && <p className="mt-0.5 line-clamp-1 max-w-[200px] text-[11px] text-destructive">{r.last_procurement_error}</p>}</div> },
    { key: 'code', header: 'Code', cell: (r) => <span className="font-mono text-xs">{mask(r.code)}</span> },
    { key: 'procurement_attempts', header: 'Attempts', align: 'right', sortable: true, cell: (r) => r.procurement_attempts },
    ...(isAdmin ? [{ key: 'a', header: '', align: 'right' as const, cell: (r: any) => (r.status === 'pending_procurement' || r.status === 'procurement_failed')
      ? <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); retry([r.id]); }}><RefreshCw className="mr-1 h-3 w-3" />Retry</Button> : null }] : []),
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Coupons" description="Edit or expire coupons and retry procurement. Coupons are financial records and are never deleted."
        actions={isAdmin && <Button size="sm" onClick={() => retry()} disabled={retrying || toProcure === 0}><Sparkles className={`mr-1.5 h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />Auto-procure pending ({toProcure})</Button>} />
      <div className="mb-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4 tabular-nums">
        {['available', 'pending_procurement', 'procurement_failed', 'redeemed'].map((s) => (
          <button key={s} className="bg-background p-4 text-left hover:bg-muted/40" onClick={() => setStatus(s)}><p className="text-xs capitalize text-muted-foreground">{s.replace('_', ' ')}</p><p className="text-2xl font-semibold text-foreground">{counts.data ? (counts.data[s] ?? 0).toLocaleString() : '—'}</p></button>))}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search title or brand" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent></Select>
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={isAdmin ? (r) => setEditing({ ...r, newCode: '' }) : undefined} empty="No coupons match." />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit coupon</DialogTitle></DialogHeader>
          {editing && <div className="space-y-3">
            <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Brand</Label><Input value={editing.store_name} onChange={(e) => setEditing({ ...editing, store_name: e.target.value })} /></div>
              <div><Label>Value ($)</Label><Input type="number" step="0.01" value={editing.value ?? ''} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label><Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Expiry</Label><Input type="date" value={editing.expiry_date || ''} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value || null })} /></div>
            </div>
            <div><Label>Replace code / redemption URL</Label><Input value={editing.newCode} placeholder={`Current: ${mask(editing.code)} — leave blank to keep`} onChange={(e) => setEditing({ ...editing, newCode: e.target.value })} className="font-mono" /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
