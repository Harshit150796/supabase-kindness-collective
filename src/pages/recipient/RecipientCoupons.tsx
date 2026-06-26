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
import { Gift, Calendar, Search, DollarSign, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  title: string;
  code: string | null;
  store_name: string;
  description: string | null;
  value: number;
  expiry_date: string | null;
  status: string;
  reserved_by: string | null;
  redeemed_by: string | null;
}

export default function RecipientCoupons() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [available, setAvailable] = useState<Coupon[]>([]);
  const [mine, setMine] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Available pool — `code` is not exposed here; only revealed after claim via RPC.
    const { data: pool } = await supabase
      .from('coupons')
      .select('id, title, store_name, description, value, expiry_date, status, reserved_by, redeemed_by')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    // Coupons reserved or redeemed by me — fetch metadata, then resolve codes via secure RPC.
    const { data: ownClaimed } = await supabase
      .from('coupons')
      .select('id, title, store_name, description, value, expiry_date, status, reserved_by, redeemed_by')
      .or(`reserved_by.eq.${user.id},redeemed_by.eq.${user.id}`)
      .order('reserved_at', { ascending: false });

    const ownWithCodes: Coupon[] = await Promise.all(
      (ownClaimed || []).map(async (c) => {
        const { data: code } = await supabase.rpc('get_coupon_code', { _coupon_id: c.id });
        return { ...c, code: (code as string | null) ?? null };
      })
    );

    setAvailable(((pool || []) as Coupon[]).map((c) => ({ ...c, code: null })));
    setMine(ownWithCodes);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

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
        .eq('status', 'available'); // race-safe

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

  const renderCard = (coupon: Coupon, owned: boolean) => (
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
            <p className="text-xs text-muted-foreground mb-1">Your code</p>
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-base font-semibold text-foreground tracking-wider">
                {coupon.code}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyCode(coupon.code!, coupon.id)}
              >
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground">Claim coupons funded by donors. Mark them as used so donors see their impact.</p>
        </div>

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
            <TabsTrigger value="available">Available ({available.length})</TabsTrigger>
            <TabsTrigger value="mine">My Coupons ({mine.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : available.filter(filterFn).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No coupons available right now</p>
                  <p className="text-muted-foreground">New ones arrive as donors fund the pool.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {available.filter(filterFn).map((c) => renderCard(c, false))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-6">
            {mine.filter(filterFn).length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">You haven't claimed any coupons yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mine.filter(filterFn).map((c) => renderCard(c, true))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
