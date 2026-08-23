import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart, Gift, DollarSign, Ticket, ArrowRight, Clock,
  Megaphone, ShieldCheck, AlertCircle, RefreshCw, Wallet,
} from 'lucide-react';
import { format } from 'date-fns';

interface DonationRow {
  id: string;
  amount: number;
  created_at: string;
  status: string | null;
  brand_partner: string | null;
}

interface CouponRow {
  id: string;
  store_name: string;
  value: number | null;
  status: string;
  expiry_date: string | null;
}

const couponStatusLabel: Record<string, string> = {
  available: 'Ready to use',
  reserved: 'Reserved',
  claimed: 'Claimed',
  redeemed: 'Redeemed',
  expired: 'Expired',
  pending_procurement: 'Preparing',
  procurement_failed: 'Needs attention',
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [fundraisersCount, setFundraisersCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  // Clear local state on user change so nothing leaks between accounts
  useEffect(() => {
    setDonations([]);
    setCoupons([]);
    setFundraisersCount(0);
    setVerificationStatus(null);
    setLoading(true);
  }, [user?.id]);

  const fetchAll = useCallback(async (showRefresh = false) => {
    if (!user) return;
    if (showRefresh) setRefreshing(true);

    const [donationsRes, couponsRes, fundraisersRes, verificationRes] = await Promise.all([
      supabase
        .from('donations')
        .select('id, amount, created_at, status, brand_partner')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('coupons')
        .select('id, store_name, value, status, expiry_date')
        .or(`reserved_by.eq.${user.id},redeemed_by.eq.${user.id}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('fundraisers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('recipient_verifications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    setDonations(donationsRes.data ?? []);
    setCoupons(couponsRes.data ?? []);
    setFundraisersCount(fundraisersRes.count ?? 0);
    setVerificationStatus(verificationRes.data?.status ?? null);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  const completed = donations.filter(d => d.status === 'completed' || !d.status);
  const totalGiven = completed.reduce((sum, d) => sum + Number(d.amount), 0);
  const activeCoupons = coupons.filter(c => ['available', 'reserved', 'claimed'].includes(c.status));
  const walletValue = activeCoupons.reduce((sum, c) => sum + Number(c.value ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1">
              Give support or ask for it — both live in this one account.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Primary actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => navigate('/dashboard/donate')}
          >
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Give support</p>
                  <p className="text-sm text-muted-foreground">Fund retail vouchers for a family</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-colors hover:border-gold/50"
            onClick={() => navigate('/apply')}
          >
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Ask for support</p>
                  <p className="text-sm text-muted-foreground">Start a request for groceries</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Verification nudge */}
        {!verificationStatus && (
          <Card className="border-gold bg-gold/5">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Verify to receive vouchers</p>
                  <p className="text-sm text-muted-foreground">
                    Only needed if you want to receive — giving works right away.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard/verification')} className="sm:shrink-0">
                Start verification
              </Button>
            </CardContent>
          </Card>
        )}
        {verificationStatus === 'pending' && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-foreground">
                Your verification is being reviewed. We'll notify you when it's approved.
              </p>
            </CardContent>
          </Card>
        )}
        {verificationStatus === 'approved' && (
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="w-4 h-4" />
            Verified to receive vouchers
          </div>
        )}

        {/* Two surfaces */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Giving */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Your giving
              </CardTitle>
              <button
                onClick={() => navigate('/dashboard/giving')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-foreground">${totalGiven.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total given</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-foreground">{completed.length}</p>
                  <p className="text-xs text-muted-foreground">Donations made</p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : donations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    You haven't given yet. Every $5 becomes a restricted retail voucher for a
                    verified family.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard/donate')}>
                    Make your first donation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {donations.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-foreground">${Number(d.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(d.created_at), 'MMM d, yyyy')}
                          {d.brand_partner && ` • ${d.brand_partner}`}
                        </p>
                      </div>
                      <Badge variant={d.status === 'completed' || !d.status ? 'default' : 'secondary'}>
                        {d.status || 'completed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voucher wallet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold" />
                Your voucher wallet
              </CardTitle>
              <button
                onClick={() => navigate('/dashboard/wallet')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-foreground">{activeCoupons.length}</p>
                  <p className="text-xs text-muted-foreground">Active vouchers</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-foreground">${walletValue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Available value</p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : coupons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No vouchers yet. Browse what's available from our US retail partners.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard/wallet')}>
                    Browse vouchers
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {coupons.slice(0, 4).map((c) => (
                    <div key={c.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                          <Ticket className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {c.store_name}
                            {c.value ? ` • $${Number(c.value).toFixed(0)}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.expiry_date
                              ? `Expires ${format(new Date(c.expiry_date), 'MMM d, yyyy')}`
                              : 'No expiry'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={c.status === 'redeemed' ? 'secondary' : 'default'}>
                        {couponStatusLabel[c.status] ?? c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requests */}
        <Card className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => navigate('/my-fundraisers')}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Your requests</p>
                <p className="text-sm text-muted-foreground">
                  {fundraisersCount > 0
                    ? `${fundraisersCount} request${fundraisersCount === 1 ? '' : 's'} created`
                    : 'No requests yet'}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
