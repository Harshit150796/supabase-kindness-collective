import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, User, CheckCircle, Gift, Calendar, DollarSign, Store } from 'lucide-react';
import { format } from 'date-fns';
import { brandLogos, BrandInfo } from '@/data/brandLogos';

interface Donation {
  id: string;
  amount: number;
  brand_partner: string | null;
  created_at: string;
  net_amount: number | null;
  status: string | null;
}

interface Coupon {
  id: string;
  title: string;
  store_name: string;
  value: number | null;
  code: string;
  status: 'available' | 'reserved' | 'redeemed' | 'expired' | 'pending';
  created_at: string;
  redeemed_by: string | null;
  reserved_by: string | null;
}

interface DonationBrand {
  id: string;
  brand_name: string;
  allocation_percent: number;
  allocated_amount: number;
}

interface DonationCouponsModalProps {
  donation: Donation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending' },
  available: { icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Available' },
  reserved: { icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Reserved' },
  redeemed: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Redeemed' },
  expired: { icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Expired' },
};

// Helper to get brand info
const getBrandInfo = (brandName: string): BrandInfo | null => {
  if (brandLogos[brandName]) return brandLogos[brandName];
  const key = Object.keys(brandLogos).find(
    k => k.toLowerCase() === brandName.toLowerCase() ||
         k.toLowerCase().replace(/\s+/g, '') === brandName.toLowerCase().replace(/\s+/g, '')
  );
  return key ? brandLogos[key] : null;
};

export function DonationCouponsModal({ donation, open, onOpenChange }: DonationCouponsModalProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [brandAllocations, setBrandAllocations] = useState<DonationBrand[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (donation && open) {
      fetchData();
    }
  }, [donation, open]);

  const fetchData = async () => {
    if (!donation) return;
    setLoading(true);

    // Fetch coupons and brand allocations in parallel
    const [couponsRes, brandsRes] = await Promise.all([
      supabase
        .from('coupons')
        .select('*')
        .eq('donation_id', donation.id)
        .order('store_name', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('donation_brands')
        .select('*')
        .eq('donation_id', donation.id)
        .order('allocated_amount', { ascending: false }),
    ]);

    setCoupons((couponsRes.data as Coupon[]) || []);
    setBrandAllocations((brandsRes.data as DonationBrand[]) || []);
    setLoading(false);
  };

  // Group coupons by brand
  const couponsByBrand = useMemo(() => {
    const grouped: Record<string, Coupon[]> = {};
    for (const coupon of coupons) {
      const brand = coupon.store_name || 'Unknown';
      if (!grouped[brand]) grouped[brand] = [];
      grouped[brand].push(coupon);
    }
    return grouped;
  }, [coupons]);

  // Check if multi-brand donation
  const isMultiBrand = brandAllocations.length > 1 || Object.keys(couponsByBrand).length > 1;

  if (!donation) return null;

  const summary = coupons.reduce(
    (acc, coupon) => {
      acc[coupon.status] = (acc[coupon.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Parse brand names for display (handle comma-separated legacy format)
  const brandNames = donation.brand_partner?.split(',').map(b => b.trim()) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Donation Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Donation Info */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold">${donation.amount.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Brand{brandNames.length > 1 ? 's' : ''}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {brandNames.length <= 2 ? (
                    brandNames.map((name, i) => {
                      const info = getBrandInfo(name);
                      return (
                        <span key={i} className="inline-flex items-center gap-1">
                          {info && (
                            <div className="w-4 h-4 rounded bg-white p-0.5">
                              <img src={info.logo} alt={name} className="w-full h-full object-contain" />
                            </div>
                          )}
                          <span className="font-semibold text-sm">{name}</span>
                          {i < brandNames.length - 1 && <span className="text-muted-foreground">,</span>}
                        </span>
                      );
                    })
                  ) : (
                    <span className="font-semibold">{brandNames.length} brands</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold">{format(new Date(donation.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Net Impact</p>
                <p className="font-semibold text-emerald-600">
                  ${(donation.net_amount || donation.amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Brand Allocation Breakdown (for multi-brand) */}
          {brandAllocations.length > 1 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 text-sm">Brand Allocation</h3>
                <div className="space-y-2">
                  {brandAllocations.map((alloc) => {
                    const info = getBrandInfo(alloc.brand_name);
                    return (
                      <div key={alloc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          {info ? (
                            <div className="w-6 h-6 rounded bg-white p-0.5 flex items-center justify-center">
                              <img src={info.logo} alt={alloc.brand_name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <Store className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">{alloc.brand_name}</span>
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-semibold">${alloc.allocated_amount.toFixed(2)}</span>
                          <span className="text-muted-foreground ml-2">({alloc.allocation_percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Coupons Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Coupons Created
              {coupons.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {coupons.length}
                </Badge>
              )}
            </h3>

            {loading ? (
              <div className="text-center py-6 text-muted-foreground">Loading coupons...</div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No coupons linked to this donation</p>
                <p className="text-xs mt-1">Coupons may be created after processing</p>
              </div>
            ) : isMultiBrand ? (
              // Multi-brand: Group coupons by brand
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-4">
                  {Object.entries(couponsByBrand).map(([brand, brandCoupons]) => {
                    const info = getBrandInfo(brand);
                    return (
                      <div key={brand}>
                        {/* Brand Header */}
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background py-1">
                          {info ? (
                            <div className="w-5 h-5 rounded bg-white p-0.5">
                              <img src={info.logo} alt={brand} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <Store className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">{brand}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {brandCoupons.length}
                          </Badge>
                        </div>
                        {/* Coupons for this brand */}
                        <div className="space-y-2 pl-7">
                          {brandCoupons.map((coupon) => {
                            const config = statusConfig[coupon.status] || statusConfig.available;
                            const StatusIcon = config.icon;
                            return (
                              <div
                                key={coupon.id}
                                className="flex items-center justify-between p-2 rounded-lg border bg-card"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-full ${config.bg}`}>
                                    <StatusIcon className={`w-3 h-3 ${config.color}`} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">${coupon.value?.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{coupon.code}</p>
                                  </div>
                                </div>
                                <Badge
                                  variant={coupon.status === 'redeemed' ? 'secondary' : 'outline'}
                                  className={`text-xs ${config.color}`}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              // Single brand: Flat list
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {coupons.map((coupon) => {
                    const config = statusConfig[coupon.status] || statusConfig.available;
                    const StatusIcon = config.icon;

                    return (
                      <div
                        key={coupon.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${config.bg}`}>
                            <StatusIcon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div>
                            <p className="font-medium">
                              ${coupon.value?.toFixed(2)} {coupon.store_name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {coupon.code}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={coupon.status === 'redeemed' ? 'secondary' : 'outline'}
                          className={config.color}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Summary */}
          {coupons.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.entries(summary).map(([status, count]) => {
                  const config = statusConfig[status as keyof typeof statusConfig];
                  if (!config) return null;
                  return (
                    <span key={status} className={`${config.color}`}>
                      {count} {config.label.toLowerCase()}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
