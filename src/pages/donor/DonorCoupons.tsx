import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Clock, CheckCircle2, Hourglass } from 'lucide-react';
import { format } from 'date-fns';

interface CouponRow {
  id: string;
  store_name: string;
  value: number;
  status: string;
  created_at: string;
  claimed_at: string | null;
  redeemed_at: string | null;
  reserved_at: string | null;
}

const STATUS_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  pending_procurement: { label: 'Procuring', icon: Hourglass, tone: 'bg-amber-500/15 text-amber-700' },
  available: { label: 'Live in pool', icon: Gift, tone: 'bg-blue-500/15 text-blue-700' },
  reserved: { label: 'Claimed by family', icon: Clock, tone: 'bg-purple-500/15 text-purple-700' },
  claimed: { label: 'Claimed by family', icon: Clock, tone: 'bg-purple-500/15 text-purple-700' },
  redeemed: { label: 'Redeemed', icon: CheckCircle2, tone: 'bg-emerald-500/15 text-emerald-700' },
  expired: { label: 'Expired', icon: Hourglass, tone: 'bg-muted text-muted-foreground' },
};

export default function DonorCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('coupons')
      .select('id, store_name, value, status, created_at, claimed_at, redeemed_at, reserved_at')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });
    setCoupons((data as CouponRow[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const counts = coupons.reduce(
    (acc, c) => {
      if (c.status === 'redeemed') acc.redeemed += 1;
      else if (c.status === 'reserved' || c.status === 'claimed') acc.claimed += 1;
      else if (c.status === 'available') acc.live += 1;
      else if (c.status === 'pending_procurement') acc.procuring += 1;
      return acc;
    },
    { live: 0, claimed: 0, redeemed: 0, procuring: 0 }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Coupons</h1>
          <p className="text-muted-foreground">
            Every coupon your donations have funded — and what's happened to it.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { label: 'Being procured', value: counts.procuring, icon: Hourglass },
            { label: 'Live in pool', value: counts.live, icon: Gift },
            { label: 'Claimed by families', value: counts.claimed, icon: Clock },
            { label: 'Actually used', value: counts.redeemed, icon: CheckCircle2 },
          ] as const).map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading…</div>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No coupons yet</p>
              <p className="text-muted-foreground">Make a donation to fund coupons for verified families.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Coupon timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {coupons.map((c) => {
                  const meta = STATUS_META[c.status] ?? STATUS_META.available;
                  const Icon = meta.icon;
                  const eventDate = c.redeemed_at || c.reserved_at || c.created_at;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.tone}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            ${Number(c.value).toFixed(2)} {c.store_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(eventDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{meta.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
