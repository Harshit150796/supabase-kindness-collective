import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Gift, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';

export default function DonorImpact() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    couponsReserved: 0,
    couponsRedeemed: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchImpact = useCallback(async (showRefreshIndicator = false) => {
    if (!user) return;

    if (showRefreshIndicator) setRefreshing(true);

    // Get donations by this donor
    const { data: donations } = await supabase
      .from('donations')
      .select('id, amount')
      .eq('donor_id', user.id);

    // Get coupon stats
    const { data: coupons } = await supabase
      .from('coupons')
      .select('status');

    const totalAmount = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    setStats({
      totalDonations: donations?.length || 0,
      totalAmount,
      couponsReserved: coupons?.filter(c => c.status === 'reserved').length || 0,
      couponsRedeemed: coupons?.filter(c => c.status === 'redeemed').length || 0
    });
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchImpact();
  }, [user, fetchImpact]);

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchImpact(true);
      }
    };

    const handleFocus = () => {
      if (user) fetchImpact(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchImpact]);

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('donor-impact-donations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `donor_id=eq.${user.id}`,
      }, (payload) => {
        const newDonation = payload.new as { amount: number };
        setStats(prev => ({
          ...prev,
          totalDonations: prev.totalDonations + 1,
          totalAmount: prev.totalAmount + Number(newDonation.amount)
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Impact</h1>
            <p className="text-muted-foreground">See how your donations are making a difference</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchImpact(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">${stats.totalAmount.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Donated</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gold/10 to-gold/5">
            <CardContent className="p-6 text-center">
              <Gift className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats.totalDonations}</p>
              <p className="text-sm text-muted-foreground">Donations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-light/10 to-emerald-light/5">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-emerald-light mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats.couponsRedeemed}</p>
              <p className="text-sm text-muted-foreground">Coupons Redeemed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5">
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats.couponsRedeemed}</p>
              <p className="text-sm text-muted-foreground">Lives Touched</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Impact Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Your impact timeline will appear here as more people use your donations.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
