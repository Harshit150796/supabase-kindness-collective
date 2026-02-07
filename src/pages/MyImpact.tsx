import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { brandLogos, BrandInfo } from "@/data/brandLogos";
import { ImpactDonationModal } from "@/components/impact/ImpactDonationModal";
import {
  Heart,
  DollarSign,
  TrendingUp,
  Gift,
  Calendar,
  RefreshCw,
  Ticket,
  ChevronRight,
} from "lucide-react";

interface Donation {
  id: string;
  amount: number;
  created_at: string;
  stripe_fee: number | null;
  net_amount: number | null;
  brand_partner: string | null;
  status: string | null;
}

interface CouponCount {
  donation_id: string;
  count: number;
}

const getBrandInfo = (brandName: string | null): BrandInfo | null => {
  if (!brandName) return null;
  if (brandLogos[brandName]) return brandLogos[brandName];
  const key = Object.keys(brandLogos).find(
    (k) => k.toLowerCase() === brandName.toLowerCase()
  );
  return key ? brandLogos[key] : null;
};

const MyImpact = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [couponCounts, setCouponCounts] = useState<Record<string, number>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDonations = useCallback(async (showRefreshIndicator = false) => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    if (showRefreshIndicator) setRefreshing(true);

    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDonations(data);
      
      // Fetch coupon counts for all donations
      const donationIds = data.map((d) => d.id);
      if (donationIds.length > 0) {
        const { data: couponsData } = await supabase
          .from("coupons")
          .select("donation_id")
          .in("donation_id", donationIds);

        if (couponsData) {
          const counts: Record<string, number> = {};
          couponsData.forEach((c) => {
            if (c.donation_id) {
              counts[c.donation_id] = (counts[c.donation_id] || 0) + 1;
            }
          });
          setCouponCounts(counts);
        }
      }
    }
    setLoadingData(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setDonations([]);
    setLoadingData(true);

    if (user) {
      fetchDonations();
    }
  }, [user, fetchDonations]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchDonations(true);
      }
    };

    const handleFocus = () => {
      if (user) fetchDonations(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchDonations]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('my-impact-donations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `donor_id=eq.${user.id}`,
      }, (payload) => {
        setDonations(prev => [payload.new as Donation, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDonationClick = (donation: Donation) => {
    setSelectedDonation(donation);
    setModalOpen(true);
  };

  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalNetImpact = donations.reduce((sum, d) => sum + (d.net_amount || d.amount || 0), 0);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your impact</h1>
              <p className="text-muted-foreground mt-1">
                See the difference your donations are making
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchDonations(true)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total donated</p>
                    <p className="text-2xl font-bold text-foreground">${totalDonated.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gold/5 to-gold/10 border-gold/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net impact</p>
                    <p className="text-2xl font-bold text-foreground">${totalNetImpact.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/50 to-secondary/80 border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Donations made</p>
                    <p className="text-2xl font-bold text-foreground">{donations.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No donations yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Make your first donation to start making an impact in someone's life.
                  </p>
                  <Button onClick={() => navigate("/stories")} className="gap-2">
                    <Heart className="w-4 h-4" />
                    Find someone to help
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {donations.slice(0, 10).map((donation) => {
                    const brandInfo = getBrandInfo(donation.brand_partner);
                    const couponCount = couponCounts[donation.id] || 0;

                    return (
                      <div
                        key={donation.id}
                        onClick={() => handleDonationClick(donation)}
                        className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          {/* Brand Logo or Fallback */}
                          {brandInfo ? (
                            <div className="w-12 h-12 rounded-lg bg-white p-1.5 border shadow-sm flex items-center justify-center">
                              <img
                                src={brandInfo.logo}
                                alt={brandInfo.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `<div class="w-6 h-6 text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>`;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Heart className="w-6 h-6 text-primary" />
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-foreground">
                              {brandInfo?.name || donation.brand_partner || 'Donation made'}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(donation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Coupon Badge */}
                          {couponCount > 0 && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Ticket className="w-3 h-3" />
                              {couponCount} coupon{couponCount !== 1 ? 's' : ''}
                            </Badge>
                          )}

                          {/* Amount */}
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              ${donation.amount.toFixed(2)}
                            </p>
                            {donation.net_amount && (
                              <p className="text-xs text-muted-foreground">
                                ${donation.net_amount.toFixed(2)} net
                              </p>
                            )}
                          </div>

                          {/* Arrow indicator */}
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Donation Details Modal */}
      <ImpactDonationModal
        donation={selectedDonation}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default MyImpact;
