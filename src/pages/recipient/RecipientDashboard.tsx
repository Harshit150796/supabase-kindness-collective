import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Gift, CreditCard, Trophy, Clock, ArrowRight, AlertCircle } from 'lucide-react';

interface LoyaltyCard {
  card_number: string;
  points_balance: number;
  total_savings: number;
  coupons_redeemed: number;
}

interface Verification {
  status: 'pending' | 'approved' | 'rejected';
}

export default function RecipientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [cardResult, verificationResult] = await Promise.all([
      supabase.from('loyalty_cards').select('*').eq('user_id', user!.id).maybeSingle(),
      supabase.from('recipient_verifications').select('status').eq('user_id', user!.id).maybeSingle()
    ]);

    if (cardResult.data) setLoyaltyCard(cardResult.data);
    if (verificationResult.data) setVerification(verificationResult.data);
    setLoading(false);
  };

  const isVerified = verification?.status === 'approved';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
          <p className="text-muted-foreground">Your dashboard for coupons and savings</p>
        </div>

        {/* Verification Banner */}
        {!verification && (
          <Card className="border-gold bg-gold/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-medium text-foreground">Complete Your Verification</p>
                  <p className="text-sm text-muted-foreground">Get verified to access coupons</p>
                </div>
              </div>
              <Button onClick={() => navigate('/recipient/verification')}>
                Start Verification
              </Button>
            </CardContent>
          </Card>
        )}

        {verification?.status === 'pending' && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Verification In Progress</p>
                <p className="text-sm text-muted-foreground">We're reviewing your application. This usually takes 2-3 business days.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Points Balance</CardTitle>
              <Trophy className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{loyaltyCard?.points_balance || 0}</div>
              <p className="text-xs text-muted-foreground">Loyalty points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings</CardTitle>
              <CreditCard className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${loyaltyCard?.total_savings || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Coupons Redeemed</CardTitle>
              <Gift className="w-4 h-4 text-emerald-light" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{loyaltyCard?.coupons_redeemed || 0}</div>
              <p className="text-xs text-muted-foreground">Total redeemed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={isVerified ? 'default' : 'secondary'}>
                {verification?.status || 'Not Verified'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Card Preview */}
        {loyaltyCard && (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-sm opacity-80">Digital Loyalty Card</p>
                  <p className="text-2xl font-bold">CouponDonation</p>
                </div>
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm opacity-80">Card Number</p>
                <p className="text-xl font-mono tracking-wider">{loyaltyCard.card_number}</p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div>
                  <p className="text-sm opacity-80">Points</p>
                  <p className="text-lg font-bold">{loyaltyCard.points_balance}</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate('/recipient/loyalty-card')}
                >
                  View Full Card
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {isVerified && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/recipient/coupons')}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Browse Coupons</p>
                    <p className="text-sm text-muted-foreground">Find and redeem available coupons</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate('/recipient/history')}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Redemption History</p>
                    <p className="text-sm text-muted-foreground">View your past redemptions</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
