import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, DollarSign, Calendar, CreditCard, Receipt, ExternalLink, ChevronDown, ChevronUp, RefreshCw, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { DonationCouponsModal } from '@/components/donor/DonationCouponsModal';

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  region: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_method: string | null;
  stripe_fee: number | null;
  net_amount: number | null;
  currency: string | null;
  receipt_url: string | null;
  brand_partner: string | null;
  status: string | null;
  coupon_count?: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  completed: { label: 'Completed', variant: 'default' },
  refunded: { label: 'Refunded', variant: 'destructive' },
  partially_refunded: { label: 'Partial Refund', variant: 'outline' },
  failed: { label: 'Failed', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
};

export default function DonorHistory() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHistory = useCallback(async (showRefreshIndicator = false) => {
    if (!user) return;
    
    if (showRefreshIndicator) setRefreshing(true);

    // Fetch donations with coupon counts
    const { data: donationsData } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });

    if (donationsData) {
      // Fetch coupon counts for each donation
      const donationIds = donationsData.map(d => d.id);
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('donation_id')
        .in('donation_id', donationIds);

      // Count coupons per donation
      const couponCounts: Record<string, number> = {};
      couponsData?.forEach(c => {
        if (c.donation_id) {
          couponCounts[c.donation_id] = (couponCounts[c.donation_id] || 0) + 1;
        }
      });

      // Merge coupon counts into donations
      const donationsWithCounts = donationsData.map(d => ({
        ...d,
        coupon_count: couponCounts[d.id] || 0,
      }));

      setDonations(donationsWithCounts);
    } else {
      setDonations([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchHistory();
  }, [user, fetchHistory]);

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchHistory(true);
      }
    };

    const handleFocus = () => {
      if (user) fetchHistory(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchHistory]);

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('donor-history-donations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `donor_id=eq.${user.id}`,
      }, (payload) => {
        setDonations(prev => [payload.new as Donation, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'donations',
        filter: `donor_id=eq.${user.id}`,
      }, (payload) => {
        setDonations(prev => prev.map(d => 
          d.id === payload.new.id ? payload.new as Donation : d
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const openCouponsModal = (donation: Donation) => {
    setSelectedDonation(donation);
    setModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Donation History</h1>
            <p className="text-muted-foreground">All your donations with full transaction details</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchHistory(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : donations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No donations yet</p>
              <p className="text-muted-foreground">Start donating to help others!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => {
              const isExpanded = expandedId === donation.id;
              const status = statusConfig[donation.status || 'completed'] || statusConfig.completed;

              return (
                <Card key={donation.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        {/* Header Row */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-foreground flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${donation.amount.toFixed(2)}
                            <span className="text-xs text-muted-foreground uppercase ml-1">
                              {donation.currency || 'USD'}
                            </span>
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {donation.is_anonymous && (
                            <Badge variant="secondary">Anonymous</Badge>
                          )}
                          {(donation.coupon_count ?? 0) > 0 && (
                            <Badge variant="outline" className="text-primary border-primary">
                              <Ticket className="w-3 h-3 mr-1" />
                              {donation.coupon_count} coupons
                            </Badge>
                          )}
                        </div>

                        {/* Meta Row */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(donation.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                          {donation.payment_method && (
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {donation.payment_method}
                            </span>
                          )}
                          {donation.brand_partner && (
                            <span className="text-primary font-medium">{donation.brand_partner}</span>
                          )}
                        </div>

                        {/* Fee Breakdown */}
                        {donation.stripe_fee !== null && donation.net_amount !== null && (
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Fee: <span className="text-foreground">${donation.stripe_fee.toFixed(2)}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Net: <span className="text-emerald-600 font-medium">${donation.net_amount.toFixed(2)}</span>
                            </span>
                          </div>
                        )}

                        {donation.message && (
                          <p className="text-sm text-muted-foreground italic">
                            "{donation.message}"
                          </p>
                        )}

                        {/* Expandable Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                            {donation.stripe_session_id && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">Session ID:</span>{' '}
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">{donation.stripe_session_id}</code>
                              </p>
                            )}
                            {donation.stripe_payment_intent_id && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">Payment ID:</span>{' '}
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">{donation.stripe_payment_intent_id}</code>
                              </p>
                            )}
                            {donation.region && (
                              <p className="text-muted-foreground">
                                <span className="font-medium text-foreground">Region:</span> {donation.region}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openCouponsModal(donation)}
                          className="gap-1"
                        >
                          <Ticket className="w-4 h-4" />
                          View Coupons
                        </Button>
                        {donation.receipt_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={donation.receipt_url} target="_blank" rel="noopener noreferrer">
                              <Receipt className="w-4 h-4 mr-1" />
                              Receipt
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleExpand(donation.id, e)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              More
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Donation Coupons Modal */}
        <DonationCouponsModal
          donation={selectedDonation}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </div>
    </DashboardLayout>
  );
}
