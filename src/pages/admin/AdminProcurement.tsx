import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Package, Upload, AlertCircle } from 'lucide-react';

interface PendingGroup {
  store_name: string;
  value: number;
  count: number;
  oldest: string;
}

export default function AdminProcurement() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<PendingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<PendingGroup | null>(null);
  const [codesText, setCodesText] = useState('');
  const [vendor, setVendor] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Pull all pending coupons and group client-side (small dataset)
    const { data } = await supabase
      .from('coupons')
      .select('store_name, value, created_at')
      .eq('status', 'pending_procurement')
      .order('created_at', { ascending: true });

    const map = new Map<string, PendingGroup>();
    (data || []).forEach((c: { store_name: string; value: number; created_at: string }) => {
      const key = `${c.store_name}__${c.value}`;
      const g = map.get(key);
      if (g) {
        g.count += 1;
      } else {
        map.set(key, { store_name: c.store_name, value: Number(c.value), count: 1, oldest: c.created_at });
      }
    });
    setGroups(Array.from(map.values()).sort((a, b) => b.count - a.count));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPending = groups.reduce((s, g) => s + g.count, 0);
  const totalValue = groups.reduce((s, g) => s + g.count * g.value, 0);

  const handleUpload = async () => {
    if (!activeGroup) return;
    const codes = codesText
      .split(/[\s,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      toast({ title: 'No codes', description: 'Paste at least one code.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: attached, error } = await supabase.rpc('attach_procured_codes', {
        _brand: activeGroup.store_name,
        _value: activeGroup.value,
        _codes: codes,
      });
      if (error) throw error;

      // Record the batch (audit trail)
      await supabase.from('coupon_procurement_batches').insert({
        brand_name: activeGroup.store_name,
        coupon_value: activeGroup.value,
        total_count: attached as number,
        total_cost: totalCost ? Number(totalCost) : null,
        vendor: vendor || null,
      });

      toast({
        title: `Attached ${attached} code(s)`,
        description: `${activeGroup.store_name} $${activeGroup.value} coupons are now live for recipients. Donors will be notified.`,
      });
      setCodesText('');
      setVendor('');
      setTotalCost('');
      setActiveGroup(null);
      await load();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coupon Procurement</h1>
          <p className="text-muted-foreground">
            Upload real gift card codes purchased from vendors. Codes are matched FIFO to the
            oldest pending coupons for each brand and value.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Slots</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalPending}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Value Owed</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">${totalValue.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Brands</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{new Set(groups.map(g => g.store_name)).size}</div></CardContent>
          </Card>
        </div>

        {totalPending > 0 && (
          <div className="flex gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-foreground">
              Donors have funded these coupons but recipients can't claim them until you upload real
              gift card codes purchased from a vendor (Tango, Tremendous, or direct).
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading…</div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">All caught up</p>
              <p className="text-muted-foreground">No pending coupons need procurement right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <Card key={`${g.store_name}-${g.value}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{g.store_name}</CardTitle>
                    <Badge variant="secondary">${g.value}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{g.count}</span>
                    <span className="text-sm text-muted-foreground">codes needed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Oldest: {new Date(g.oldest).toLocaleDateString()}
                  </p>
                  <Dialog
                    open={activeGroup?.store_name === g.store_name && activeGroup?.value === g.value}
                    onOpenChange={(open) => setActiveGroup(open ? g : null)}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2">
                        <Upload className="w-4 h-4" /> Upload Codes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>
                          Upload {g.store_name} ${g.value} codes
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Codes (one per line, or comma-separated)</Label>
                          <Textarea
                            rows={8}
                            placeholder={`WMRT-AAAA-1111\nWMRT-BBBB-2222\n…`}
                            value={codesText}
                            onChange={(e) => setCodesText(e.target.value)}
                            className="font-mono text-sm mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Up to {g.count} will be attached to oldest pending coupons. Extras are ignored.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Vendor (optional)</Label>
                            <Input
                              placeholder="Tango / Tremendous / Direct"
                              value={vendor}
                              onChange={(e) => setVendor(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Total cost (optional)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={totalCost}
                              onChange={(e) => setTotalCost(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button onClick={handleUpload} disabled={submitting} className="w-full">
                          {submitting ? 'Uploading…' : 'Attach to pending coupons'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
