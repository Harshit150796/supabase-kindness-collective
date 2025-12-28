import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Trophy, Gift, DollarSign } from 'lucide-react';

interface LoyaltyCard {
  card_number: string;
  points_balance: number;
  total_savings: number;
  coupons_redeemed: number;
}

export default function RecipientLoyaltyCard() {
  const { user } = useAuth();
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCard();
  }, [user]);

  const fetchCard = async () => {
    const { data } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setCard(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loyalty Card</h1>
          <p className="text-muted-foreground">Your digital loyalty card and rewards</p>
        </div>

        {card ? (
          <>
            {/* Digital Card */}
            <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground overflow-hidden max-w-md">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <p className="text-sm opacity-80">Digital Loyalty Card</p>
                    <p className="text-2xl font-bold">CouponDonation</p>
                  </div>
                  <CreditCard className="w-10 h-10 opacity-80" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm opacity-80">Card Number</p>
                  <p className="text-2xl font-mono tracking-widest">{card.card_number}</p>
                </div>
                <div className="mt-6 flex justify-between">
                  <div>
                    <p className="text-sm opacity-80">Points</p>
                    <p className="text-xl font-bold">{card.points_balance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">Member</p>
                    <p className="text-xl font-bold">{user?.email?.split('@')[0]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Points Balance</CardTitle>
                  <Trophy className="w-4 h-4 text-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{card.points_balance}</div>
                  <p className="text-xs text-muted-foreground">Available to redeem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings</CardTitle>
                  <DollarSign className="w-4 h-4 text-emerald-light" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">${card.total_savings}</div>
                  <p className="text-xs text-muted-foreground">Lifetime savings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Coupons Used</CardTitle>
                  <Gift className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{card.coupons_redeemed}</div>
                  <p className="text-xs text-muted-foreground">Successfully redeemed</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No loyalty card yet</p>
              <p className="text-muted-foreground">Complete verification to get your card</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}