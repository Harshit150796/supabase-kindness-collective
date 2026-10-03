import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader, useTeamRole } from '@/components/admin/AdminLayout';
import { DataTable, Column } from '@/components/admin/DataTable';
import { useAdminPaged } from '@/hooks/useAdminPaged';
import { sb, rpc, usd, fmtDate } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search } from 'lucide-react';

const mask = (hint: string | null) => hint ?? '—';
interface Summary { store_name: string; value: number; in_stock: number; waiting: number; given: number; used: number; expired: number; returned: number }

/** Coupon code library: codes bought in advance, kept "in stock" until given to a fundraiser. */
export default function AdminCoupons() {
  const { toast } = useToast();
  const { canWrite: isAdmin } = useTeamRole();
  const [batch, setBatch] = useState('all');
  const [view, setView] = useState<'in_stock' | 'returned'>('in_stock');
  const [returnedRow, setReturnedRow] = useState<any | null>(null);
  const sum = useQuery({ queryKey: ['adm-inv'], queryFn: () => rpc<Summary[]>('admin_inventory_summary') });
  const bundles = useQuery({
    queryKey: ['adm-bundles'],
    queryFn: async () => {
      const { data, error } = await sb.from('coupon_procurement_batches').select('id,name,brand_name,coupon_value,total_count,vendor,created_at').order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      return data as any[];
    },
  });
  const t = useAdminPaged({
    table: 'coupons', select: 'id,store_name,value,code_hint,expiry_date,batch_id,created_at,returned_at,returned_from_fundraiser_id,void_reason',
    searchCols: ['store_name'], defaultSort: { key: 'created_at', dir: 'desc' },
    filter: (b) => { let x = b.eq('status', view).is('donation_id', null); if (batch !== 'all') x = x.eq('batch_id', batch); return x; }, deps: [batch, view],
  });
  const reload = () => { t.q.refetch(); sum.refetch(); bundles.refetch(); };
  const bundleName = (id: string | null) => bundles.data?.find((b) => b.id === id)?.name ?? '—';

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ brand: '', value: '', codes: '', url: '', expiry: '', name: '', vendor: '', cost: '' });
  const [editing, setEditing] = useState<any | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const codeCount = form.codes.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).length;

  const add = async () => {
    setBusy(true);
    try {
      const r = await rpc<any>('admin_add_stock_codes', {
        _brand: form.brand, _value: Number(form.value), _codes: form.codes.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean),
        _url: form.url || null, _expiry: form.expiry || null, _batch: { name: form.name, vendor: form.vendor, total_cost: form.cost },
      });
      toast({ title: `Added ${r.added} code(s) to stock`, description: r.duplicates ? `${r.duplicates} duplicate code(s) skipped.` : undefined });
      setAdding(false); setForm({ brand: '', value: '', codes: '', url: '', expiry: '', name: '', vendor: '', cost: '' }); reload();
    } catch (e) { toast({ title: 'Could not add codes', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };
  const saveEdit = async () => {
    setBusy(true);
    try {
      const patch: Record<string, unknown> = { value: Number(editing.value), expiry_date: editing.expiry_date ?? '' };
      if (editing.newCode?.trim()) patch.code = editing.newCode.trim();
      if (editing.redemption_url !== undefined && editing.redemption_url !== null) patch.redemption_url = editing.redemption_url;
      await rpc('admin_edit_stock_code', { _id: editing.id, _patch: patch });
      toast({ title: 'Code updated' }); setEditing(null); setRevealed({}); reload();
    } catch (e) { toast({ title: 'Save failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };
  const returnedAction = async (action: 'restock' | 'void') => {
    const msg = action === 'restock'
      ? 'Before returning this code to stock, check the gift card balance with the retailer — the organizer may already have seen or used it. Return it to stock?'
      : 'Void this code? It will never be given out again. The record is kept.';
    if (!confirm(msg)) return;
    setBusy(true);
    try { await rpc('admin_returned_code_action', { _id: returnedRow.id, _action: action }); toast({ title: action === 'restock' ? 'Returned to stock' : 'Code voided' }); setReturnedRow(null); reload(); }
    catch (e) { toast({ title: 'Action failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };
  const remove = async () => {
    if (!confirm('Void this unused code? It is removed from stock but the record is kept.')) return;
    setBusy(true);
    try { await rpc('admin_delete_stock_code', { _id: editing.id }); toast({ title: 'Code voided' }); setEditing(null); reload(); }
    catch (e) { toast({ title: 'Remove failed', description: (e as Error).message, variant: 'destructive' }); }
    setBusy(false);
  };
  const reveal = async (id: string) => {
    try { const c = await rpc<string>('admin_reveal_code', { _id: id }); setRevealed((r) => ({ ...r, [id]: c })); }
    catch (e) { toast({ title: 'Could not show code', description: (e as Error).message, variant: 'destructive' }); }
  };

  const stock = (sum.data ?? []).filter((s) => Number(s.in_stock) > 0);
  const cols: Column<any>[] = [
    { key: 'created_at', header: 'Added', sortable: true, cell: (r) => fmtDate(r.created_at) },
    { key: 'store_name', header: 'Brand', sortable: true, cell: (r) => <span className="font-medium text-foreground">{r.store_name}</span> },
    { key: 'value', header: 'Amount', align: 'right', sortable: true, cell: (r) => usd(r.value) },
    { key: 'code', header: 'Code', cell: (r) => <span className="flex items-center gap-2 font-mono text-xs">{revealed[r.id] ?? mask(r.code_hint)}
      {isAdmin && !revealed[r.id] && <button className="font-sans text-primary" onClick={(e) => { e.stopPropagation(); reveal(r.id); }}>Show</button>}</span> },
    { key: 'expiry_date', header: 'Expires', sortable: true, cell: (r) => r.expiry_date ?? '—' },
    { key: 'batch_id', header: 'Bundle', cell: (r) => <span className="text-xs text-muted-foreground">{bundleName(r.batch_id)}</span> },
    ...(view === 'returned' ? [{ key: 'returned_at', header: 'Returned', sortable: true, cell: (r: any) => <span className="text-xs">{r.returned_at ? fmtDate(r.returned_at) : '—'} · {r.void_reason ?? ''}</span> } as Column<any>] : []),
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Coupons" description="Your code library. Add codes of any brand and amount in bundles; they stay in stock until given to a fundraiser. Track usage on the Procurement page."
        actions={isAdmin && <Button size="sm" onClick={() => setAdding(true)}><Plus className="mr-1.5 h-4 w-4" />Add codes</Button>} />

      <h2 className="mb-2 text-sm font-medium text-foreground">In stock by brand and amount</h2>
      <div className="mb-6 overflow-hidden rounded-lg border border-border">
        {sum.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          : sum.error ? <p className="p-4 text-sm text-destructive">{(sum.error as Error).message} <button className="ml-2 text-primary" onClick={() => sum.refetch()}>Retry</button></p>
          : !stock.length ? <p className="p-4 text-sm text-muted-foreground">No codes in stock yet. Use Add codes to build your library.</p>
          : <table className="w-full text-sm tabular-nums"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="p-2 text-left">Brand</th><th className="p-2 text-right">Amount</th><th className="p-2 text-right">In stock</th><th className="p-2 text-right">Stock value</th><th className="p-2 text-right">Donations waiting</th></tr></thead>
            <tbody>{stock.map((s) => <tr key={s.store_name + s.value} className="border-t border-border"><td className="p-2">{s.store_name}</td><td className="p-2 text-right">{usd(s.value)}</td><td className="p-2 text-right">{s.in_stock}</td><td className="p-2 text-right">{usd(Number(s.in_stock) * Number(s.value))}</td><td className="p-2 text-right">{s.waiting}</td></tr>)}</tbody></table>}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="h-9 pl-8" placeholder="Search brand" value={t.search} onChange={(e) => t.setSearch(e.target.value)} /></div>
        <Select value={view} onValueChange={(v) => setView(v as 'in_stock' | 'returned')}><SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="in_stock">In stock</SelectItem><SelectItem value="returned">Returned</SelectItem></SelectContent></Select>
        <Select value={batch} onValueChange={setBatch}><SelectTrigger className="h-9 w-64"><SelectValue placeholder="All bundles" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All bundles</SelectItem>{(bundles.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name ?? `${b.brand_name} ${usd(b.coupon_value)}`} ({b.total_count})</SelectItem>)}</SelectContent></Select>
      </div>
      <DataTable columns={cols} {...t.tableProps} rowKey={(r: any) => r.id} onRowClick={isAdmin ? (r) => (view === 'returned' ? setReturnedRow(r) : setEditing({ ...r, newCode: '' })) : undefined} empty={view === 'returned' ? 'No returned codes.' : 'No codes in stock.'} />
      {view === 'returned' && <p className="mt-2 text-xs text-muted-foreground">Returned codes were taken back from a fundraiser coupon. They are never given out automatically.</p>}

      <Dialog open={!!returnedRow} onOpenChange={(o) => !o && setReturnedRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Returned {returnedRow?.store_name} code {returnedRow && usd(returnedRow.value)}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Code {mask(returnedRow?.code_hint ?? null)} was returned {returnedRow?.returned_at ? fmtDate(returnedRow.returned_at) : ''} ({returnedRow?.void_reason ?? 'removed'}). The organizer may have seen it, so verify the card balance before reusing it.</p>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => returnedAction('void')}>Void</Button>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setReturnedRow(null)}>Cancel</Button><Button disabled={busy} onClick={() => returnedAction('restock')}>Return to stock</Button></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Add codes to stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Brand</Label><Input value={form.brand} placeholder="DoorDash" onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div><Label>Amount per code ($)</Label><Input type="number" min={1} max={500} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            </div>
            <div><Label>Codes (one per line or comma-separated)</Label><Textarea rows={6} className="font-mono text-sm" value={form.codes} onChange={(e) => setForm({ ...form, codes: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">{codeCount} code(s)</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Redemption link (optional)</Label><Input value={form.url} placeholder="https://…" onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
              <div><Label>Expiry (optional)</Label><Input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></div>
            </div>
            <div><Label>Bundle name (optional)</Label><Input value={form.name} placeholder="DoorDash $20 — Oct batch" onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Vendor (optional)</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              <div><Label>Total cost (optional)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={add} disabled={busy || !form.brand.trim() || !Number(form.value) || !codeCount}>{busy ? 'Adding…' : `Add ${codeCount || ''} to stock`}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editing?.store_name} stock code</DialogTitle></DialogHeader>
          {editing && <div className="space-y-3">
            <div><Label>Replace code</Label><Input className="font-mono" value={editing.newCode} placeholder={`Current: ${mask(editing.code_hint)} — leave blank to keep`} onChange={(e) => setEditing({ ...editing, newCode: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount ($)</Label><Input type="number" step="0.01" value={editing.value ?? ''} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
              <div><Label>Expiry</Label><Input type="date" value={editing.expiry_date || ''} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value || null })} /></div>
            </div>
            <div><Label>Redemption link</Label><Input value={editing.redemption_url ?? ''} placeholder="Leave blank to keep the current link" onChange={(e) => setEditing({ ...editing, redemption_url: e.target.value })} /></div>
          </div>}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" className="text-destructive" onClick={remove} disabled={busy}>Void code</Button>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
