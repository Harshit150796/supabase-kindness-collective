import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gift, TrendingUp, DollarSign } from 'lucide-react';

interface Analytics {
  totalUsers: number;
  totalDonors: number;
  totalRecipients: number;
  totalCoupons: number;
  claimedCoupons: number;
  usedCoupons: number;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalDonors: 0,
    totalRecipients: 0,
    totalCoupons: 0,
    claimedCoupons: 0,
    usedCoupons: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const [usersResult, couponsResult] = await Promise.all([
      supabase.from('profiles').select('role'),
      supabase.from('coupons').select('status')
    ]);

    const users = usersResult.data || [];
    const coupons = couponsResult.data || [];

    setAnalytics({
      totalUsers: users.length,
      totalDonors: users.filter(u => u.role === 'donor').length,
      totalRecipients: users.filter(u => u.role === 'recipient').length,
      totalCoupons: coupons.length,
      claimedCoupons: coupons.filter(c => c.status === 'claimed').length,
      usedCoupons: coupons.filter(c => c.status === 'used').length
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground">Overview of platform performance</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalDonors} donors, {analytics.totalRecipients} recipients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle>
              <Gift className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.totalCoupons}</div>
              <p className="text-xs text-muted-foreground">Donated coupons</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Claimed Coupons</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-light" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.claimedCoupons}</div>
              <p className="text-xs text-muted-foreground">By recipients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Used Coupons</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{analytics.usedCoupons}</div>
              <p className="text-xs text-muted-foreground">Redeemed successfully</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {analytics.totalCoupons > 0 
                  ? Math.round((analytics.usedCoupons / analytics.totalCoupons) * 100) 
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Coupons used vs donated</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}