import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Gift, DollarSign, TrendingUp, Heart, ArrowRight, Users } from 'lucide-react';

interface DonorStats {
  totalDonated: number;
  donationsCount: number;
  peopleHelped: number;
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DonorStats>({
    totalDonated: 0,
    donationsCount: 0,
    peopleHelped: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    // Get donations by this donor
    const { data: donations } = await supabase
      .from('donations')
      .select('id, amount')
      .eq('donor_id', user!.id);

    // Get redemption history count (approximation for people helped)
    const { count: redemptionsCount } = await supabase
      .from('redemption_history')
      .select('id', { count: 'exact' });

    const totalAmount = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

    setStats({
      totalDonated: totalAmount,
      donationsCount: donations?.length || 0,
      peopleHelped: redemptionsCount || 0
    });
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donor Dashboard</h1>
          <p className="text-muted-foreground">Track your impact and contributions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${stats.totalDonated}</div>
              <p className="text-xs text-muted-foreground">Lifetime contributions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Donations Made</CardTitle>
              <Gift className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.donationsCount}</div>
              <p className="text-xs text-muted-foreground">Total donations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">People Helped</CardTitle>
              <Users className="w-4 h-4 text-emerald-light" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.peopleHelped}</div>
              <p className="text-xs text-muted-foreground">Recipients reached</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/donor/donate')}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Make a Donation</p>
                  <p className="text-sm text-muted-foreground">Support someone in need</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/donor/impact')}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">View Your Impact</p>
                  <p className="text-sm text-muted-foreground">See how you've helped</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
