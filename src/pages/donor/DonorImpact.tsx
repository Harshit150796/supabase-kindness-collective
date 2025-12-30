import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Gift, TrendingUp, DollarSign } from 'lucide-react';

export default function DonorImpact() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    couponsReserved: 0,
    couponsRedeemed: 0
  });

  useEffect(() => {
    if (user) fetchImpact();
  }, [user]);

  const fetchImpact = async () => {
    // Get donations by this donor
    const { data: donations } = await supabase
      .from('donations')
      .select('id, amount')
      .eq('donor_id', user!.id);

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
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Impact</h1>
          <p className="text-muted-foreground">See how your donations are making a difference</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">${stats.totalAmount}</p>
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
