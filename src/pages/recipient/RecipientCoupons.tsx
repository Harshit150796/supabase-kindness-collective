import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Gift, Calendar, Search, DollarSign, Copy, Check, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  title: string;
  code: string | null;
  redemption_url?: string | null;
  store_name: string;
  description: string | null;
  value: number;
  expiry_date: string | null;
  status: string;
  reserved_by: string | null;
  redeemed_by: string | null;
  created_at?: string;
}

export default function RecipientCoupons() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [available, setAvailable] = useState<Coupon[]>([]);
  const [pending, setPending] = useState<Coupon[]>([]);
  const [mine, setMine] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [poolRes, pendingRes, ownRes] = await Promise.all([
      supabase
        .from('coupons')
        .select('id, title, store_name, description, value, expiry_date, status, reserved_by, redeemed_by, created_at')
        .eq('status', 'available')
        .order('created_at', { ascending: false }),
      supabase
        .from('coupons')
        .select('id, title, store_name, description, value, expiry_date, status, reserved_by, redeemed_by, created_at')
        .in('status', ['pending_procurement', 'procurement_failed'])
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('coupons')
        .select('id, title, store_name, description, value, expiry_date, status, reserved_by, redeemed_by, redemption_url')
        .or(`reserved_by.eq.${user.id},redeemed_by.eq.${user.id}`)
        .order('reserved_at', { ascending: false }),
    ]);

    const ownWithCodes: Coupon[] = await Promise.all(
      (ownRes.data || []).map(async (c) => {
        const { data: code } = await supabase.rpc('get_coupon_code', { _coupon_id: c.id });
        return { ...c, code: (code as string | null) ?? null };
      })
    );

    setAvailable(((poolRes.data || []) as Coupon[]).map((c) => ({ ...c, code: null })));
    setPending(((pendingRes.data || []) as Coupon[]).map((c) => ({ ...c, code: null })));
    setMine(ownWithCodes);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // Realtime: refresh when any coupon changes status (coming soon → available)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('coupons-recipient')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        () => { fetchCoupons(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCoupons]);

  const handleClaim = async (couponId: string) => {
    if (!user) return;
    setBusy(couponId);
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          status: 'reserved',
          reserved_by: user.id,
          reserved_at: new Date().toISOString(),
        })
        .eq('id', couponId)
        .eq('status', 'available');
      if (error) throw error;
      toast({ title: 'Claimed!', description: 'Your coupon code is in My Coupons.' });
      await fetchCoupons();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not claim coupon';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const handleConfirmRedeemed = async (couponId: string) => {
    setBusy(couponId);
    try {
      const { error } = await supabase.rpc('confirm_coupon_redemption', { _coupon_id: couponId });
      if (error) throw error;
      toast({ title: 'Marked as redeemed', description: 'The donor will be notified — thank you!' });
      await fetchCoupons();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not mark as redeemed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const filterFn = (c: Coupon) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.store_name.toLowerCase().includes(search.toLowerCase());

  const renderPendingCard = (coupon: Coupon) => (
    <Card key={coupon.id} className="border-dashed opacity-90">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{coupon.title}</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
            <Clock className="w-3 h-3" /> Coming soon
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span>${coupon.value} from {coupon.store_name}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Funded by a donor — code will appear here automatically once purchased.
        </p>
      </CardContent>
    </Card>
  );

  const renderCard = (coupon: Coupon, owned: boolean) => {
    const isUrl = typeof coupon.code === 'string' && /^https?:\/\//i.test(coupon.code);
    return (
      <Card key={coupon.id} className="hover:border-primary/30 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{coupon.title}</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />{coupon.value}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {coupon.description && (
            <p className="text-sm text-muted-foreground">{coupon.description}</p>
          )}
          {coupon.expiry_date && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />Expires {format(new Date(coupon.expiry_date), 'MMM d, yyyy')}
            </Badge>
          )}

          {owned && coupon.code && (
            <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {isUrl ? 'Your redemption link' : 'Your code'}
              </p>
              <div className="flex items-center justify-between gap-2">
                {isUrl ? (
                  <a
                    href={coupon.code}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm font-semibold text-primary underline underline-offset-2 truncate"
                  >
                    Open gift card <ExternalLink className="inline w-3 h-3 ml-1" />
                  </a>
                ) : (
                  <code className="font-mono text-base font-semibold text-foreground tracking-wider truncate">
                    {coupon.code}
                  </code>
                )}
                <Button size="sm" variant="ghost" onClick={() => copyCode(coupon.code!, coupon.id)}>
                  {copied === coupon.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {owned ? (
            coupon.status === 'redeemed' ? (
              <Badge className="w-full justify-center py-2" variant="default">Redeemed — thank you!</Badge>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleConfirmRedeemed(coupon.id)}
                disabled={busy === coupon.id}
              >
                {busy === coupon.id ? 'Saving…' : "I used this coupon"}
              </Button>
            )
          ) : (
            <Button
              className="w-full"
              onClick={() => handleClaim(coupon.id)}
              disabled={busy === coupon.id}
            >
              {busy === coupon.id ? 'Claiming…' : 'Claim Coupon'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const pendingFiltered = pending.filter(filterFn);
  const availableFiltered = available.filter(filterFn);
  const mineFiltered = mine.filter(filterFn);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground">Claim coupons funded by donors. Mark them as used so donors see their impact.</p>
        </div>

        {pendingFiltered.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-foreground">
              <strong>{pendingFiltered.length}</strong> new coupon{pendingFiltered.length === 1 ? '' : 's'} being prepared — they'll appear below automatically.
            </p>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand or title…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Available ({availableFiltered.length})</TabsTrigger>
            <TabsTrigger value="coming">Coming Soon ({pendingFiltered.length})</TabsTrigger>
            <TabsTrigger value="mine">My Coupons ({mineFiltered.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : availableFiltered.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No coupons available right now</p>
                  <p className="text-muted-foreground">New ones arrive as donors fund the pool.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFiltered.map((c) => renderCard(c, false))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="coming" className="mt-6">
            {pendingFiltered.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No coupons in the pipeline</p>
                  <p className="text-muted-foreground">When donors fund coupons, they'll show up here first.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingFiltered.map(renderPendingCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-6">
            {mineFiltered.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">You haven't claimed any coupons yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mineFiltered.map((c) => renderCard(c, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
