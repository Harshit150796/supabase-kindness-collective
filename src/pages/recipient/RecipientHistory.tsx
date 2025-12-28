import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Store, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface ClaimWithCoupon {
  id: string;
  claimed_at: string;
  used_at: string | null;
  coupons: {
    title: string;
    store_name: string;
    code: string;
    discount_value: string | null;
  };
}

export default function RecipientHistory() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimWithCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (profile) {
      const { data } = await supabase
        .from('coupon_claims')
        .select(`
          id,
          claimed_at,
          used_at,
          coupons (
            title,
            store_name,
            code,
            discount_value
          )
        `)
        .eq('recipient_id', profile.id)
        .order('claimed_at', { ascending: false });

      setClaims((data as any) || []);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Redemption History</h1>
          <p className="text-muted-foreground">Your claimed and used coupons</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : claims.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No history yet</p>
              <p className="text-muted-foreground">Claim some coupons to see them here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <Card key={claim.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-foreground">{claim.coupons.title}</h3>
                        <Badge variant={claim.used_at ? 'secondary' : 'default'}>
                          {claim.used_at ? 'Used' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        {claim.coupons.store_name}
                      </p>
                      <p className="text-sm font-mono text-muted-foreground">
                        Code: {claim.coupons.code}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Claimed: {format(new Date(claim.claimed_at), 'MMM d, yyyy')}</span>
                        {claim.used_at && (
                          <span>Used: {format(new Date(claim.used_at), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    {claim.coupons.discount_value && (
                      <Badge variant="outline">{claim.coupons.discount_value}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}