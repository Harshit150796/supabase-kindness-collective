import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Gift, Search, Pencil, RefreshCw, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  title: string;
  code: string | null;
  status: string;
  value: number;
  store_name: string;
  expiry_date: string | null;
  donation_id: string | null;
  procurement_attempts: number;
  last_procurement_error: string | null;
  created_at: string;
}

type CouponStatus = 'available' | 'claimed' | 'reserved' | 'redeemed' | 'expired' | 'pending_procurement' | 'procurement_failed';
const STATUSES: CouponStatus[] = ['available', 'reserved', 'redeemed', 'expired', 'pending_procurement', 'procurement_failed'];

export default function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [retryingAll, setRetryingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('coupons')
      .select('id, title, code, status, value, store_name, expiry_date, donation_id, procurement_attempts, last_procurement_error, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    setCoupons((data || []) as Coupon[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = coupons.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.store_name.toLowerCase().includes(q) ||
      (c.code || '').toLowerCase().includes(q)
    );
  });

  const counts = coupons.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from('coupons')
      .update({
        title: editing.title,
        store_name: editing.store_name,
        value: editing.value,
        expiry_date: editing.expiry_date,
        status: editing.status as CouponStatus,
        code: editing.code,
      })
      .eq('id', editing.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Coupon updated' });
      setEditing(null);
      await load();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from('coupons').delete().eq('id', deleting.id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Coupon deleted' });
      await load();
    }
    setDeleting(null);
  };

  const handleRetry = async (couponIds?: string[]) => {
    setRetryingAll(!couponIds);
    try {
      const { data, error } = await supabase.functions.invoke('procure-coupons', {
        body: couponIds ? { coupon_ids: couponIds } : { limit: 100 },
      });
      if (error) throw error;
      const d = data as { processed?: number; success?: number; failed?: number; error?: string };
      if (d?.error) throw new Error(d.error);
      toast({
        title: 'Procurement run complete',
        description: `Processed ${d?.processed ?? 0}, succeeded ${d?.success ?? 0}, failed ${d?.failed ?? 0}.`,
      });
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Retry failed';
      toast({ title: 'Retry failed', description: msg, variant: 'destructive' });
    } finally {
      setRetryingAll(false);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      available: 'default',
      reserved: 'secondary',
      redeemed: 'outline',
      expired: 'destructive',
      pending_procurement: 'secondary',
      procurement_failed: 'destructive',
    };
    return <Badge variant={map[s] || 'default'}>{s.replace('_', ' ')}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coupon Management</h1>
            <p className="text-muted-foreground">Edit, retry procurement, or remove coupons on the platform.</p>
          </div>
          <Button
            onClick={() => handleRetry()}
            disabled={retryingAll || (counts.pending_procurement || 0) + (counts.procurement_failed || 0) === 0}
            className="gap-2"
          >
            <Sparkles className={`w-4 h-4 ${retryingAll ? 'animate-spin' : ''}`} />
            Auto-procure pending ({(counts.pending_procurement || 0) + (counts.procurement_failed || 0)})
          </Button>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          {(['available', 'pending_procurement', 'procurement_failed', 'redeemed'] as const).map((s) => (
            <Card key={s}>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">{s.replace('_', ' ')}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{counts[s] || 0}</div></CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search title, brand, or code…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No coupons found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{c.title}</p>
                        {statusBadge(c.status)}
                        <Badge variant="outline">${c.value}</Badge>
                        <span className="text-xs text-muted-foreground">{c.store_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {c.code || <span className="italic">no code yet</span>}
                      </p>
                      {c.status === 'procurement_failed' && c.last_procurement_error && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {c.last_procurement_error}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(c.created_at), 'MMM d, yyyy')}
                        {c.procurement_attempts > 0 && ` · ${c.procurement_attempts} attempt(s)`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(c.status === 'pending_procurement' || c.status === 'procurement_failed') && (
                        <Button size="sm" variant="outline" onClick={() => handleRetry([c.id])} className="gap-1">
                          <RefreshCw className="w-3 h-3" /> Retry
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ ...c })}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(c)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit coupon</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Brand</Label>
                  <Input value={editing.store_name} onChange={(e) => setEditing({ ...editing, store_name: e.target.value })} />
                </div>
                <div>
                  <Label>Value ($)</Label>
                  <Input type="number" step="0.01" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expiry</Label>
                  <Input type="date" value={editing.expiry_date || ''} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value || null })} />
                </div>
              </div>
              <div>
                <Label>Code / redemption URL</Label>
                <Input value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} className="font-mono" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If the coupon was already claimed or redeemed, delete it only if you know what you're doing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
