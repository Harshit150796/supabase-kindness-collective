import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { brandLogos, BrandInfo } from '@/data/brandLogos';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  User,
  Gift,
  Ticket,
  Check,
  Store,
} from 'lucide-react';

interface Donation {
  id: string;
  amount: number;
  created_at: string;
  stripe_fee: number | null;
  net_amount: number | null;
  brand_partner: string | null;
  status: string | null;
}

interface Coupon {
  id: string;
  code: string;
  value: number | null;
  status: 'available' | 'reserved' | 'redeemed' | 'expired';
  store_name: string;
  created_at: string;
}

interface DonationBrand {
  id: string;
  brand_name: string;
  allocation_percent: number;
  allocated_amount: number;
}

interface ImpactDonationModalProps {
  donation: Donation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getBrandInfo = (brandName: string | null): BrandInfo | null => {
  if (!brandName) return null;
  // Try exact match first
  if (brandLogos[brandName]) return brandLogos[brandName];
  // Try case-insensitive match
  const key = Object.keys(brandLogos).find(
    (k) => k.toLowerCase() === brandName.toLowerCase() ||
           k.toLowerCase().replace(/\s+/g, '') === brandName.toLowerCase().replace(/\s+/g, '')
  );
  return key ? brandLogos[key] : null;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'available':
      return {
        label: 'Available',
        icon: Check,
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-600',
        borderColor: 'border-l-emerald-500',
      };
    case 'reserved':
      return {
        label: 'Reserved',
        icon: User,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600',
        borderColor: 'border-l-blue-500',
      };
    case 'redeemed':
      return {
        label: 'Redeemed',
        icon: CheckCircle,
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
        borderColor: 'border-l-muted-foreground',
      };
    case 'expired':
      return {
        label: 'Expired',
        icon: Clock,
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-l-destructive',
      };
    default:
      return {
        label: 'Pending',
        icon: Clock,
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-600',
        borderColor: 'border-l-amber-500',
      };
  }
};

export function ImpactDonationModal({
  donation,
  open,
  onOpenChange,
}: ImpactDonationModalProps) {
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
        .select('id, value, status, store_name, created_at')
        .eq('donation_id', donation.id)
        .order('store_name', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('donation_brands')
        .select('id, brand_name, allocation_percent, allocated_amount')
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

  // Parse brand names for display (handle comma-separated legacy format)
  const brandNames = donation.brand_partner?.split(',').map(b => b.trim()) || [];
  const primaryBrandInfo = getBrandInfo(brandNames[0] || null);

  // Count coupons by status
  const statusCounts = coupons.reduce(
    (acc, coupon) => {
      acc[coupon.status] = (acc[coupon.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4 border-b">
          {/* Brand Logo(s) */}
          <div className="flex flex-col items-center gap-3">
            {isMultiBrand ? (
              // Multi-brand: Show multiple logos
              <div className="flex items-center gap-2">
                {brandNames.slice(0, 4).map((name, i) => {
                  const info = getBrandInfo(name);
                  return info ? (
                    <div key={i} className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-sm border flex items-center justify-center">
                      <img
                        src={info.logo}
                        alt={info.name}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div key={i} className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Store className="w-6 h-6 text-muted-foreground" />
                    </div>
                  );
                })}
                {brandNames.length > 4 && (
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">+{brandNames.length - 4}</span>
                  </div>
                )}
              </div>
            ) : primaryBrandInfo ? (
              <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-sm border flex items-center justify-center">
                <img
                  src={primaryBrandInfo.logo}
                  alt={primaryBrandInfo.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
            )}
            <DialogTitle className="text-xl">
              {isMultiBrand 
                ? `${brandNames.length} Brand Donation`
                : primaryBrandInfo?.name || donation.brand_partner || 'Donation Details'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Donation Details */}
        <div className="space-y-3 py-4 border-b">
          <div className="flex items-center gap-3 text-foreground">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="font-medium">${donation.amount.toFixed(2)} donated</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span>{new Date(donation.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          {donation.net_amount && (
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <span>${donation.net_amount.toFixed(2)} reached recipients</span>
            </div>
          )}
        </div>

        {/* Brand Allocation Breakdown (for multi-brand) */}
        {brandAllocations.length > 1 && (
          <div className="py-4 border-b">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Brand Allocation</h3>
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
        )}

        {/* Coupons Section */}
        <div className="py-4">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Coupons Created ({coupons.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-muted-foreground">
                Coupons being created...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a few moments
              </p>
            </div>
          ) : isMultiBrand ? (
            // Multi-brand: Group coupons by brand
            <>
              <div className="space-y-4 mb-4">
                {Object.entries(couponsByBrand).map(([brand, brandCoupons]) => {
                  const info = getBrandInfo(brand);
                  return (
                    <div key={brand}>
                      {/* Brand Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {info ? (
                          <div className="w-5 h-5 rounded bg-white p-0.5">
                            <img src={info.logo} alt={brand} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <Store className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{brand}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {brandCoupons.length} coupon{brandCoupons.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {/* Coupons for this brand */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {brandCoupons.map((coupon) => {
                          const statusConf = getStatusConfig(coupon.status);
                          const StatusIcon = statusConf.icon;
                          return (
                            <div
                              key={coupon.id}
                              className={`border rounded-lg p-2 border-l-4 ${statusConf.borderColor} ${statusConf.bgColor}`}
                            >
                              <p className="font-bold text-foreground text-sm">
                                ${coupon.value?.toFixed(2) || '0.00'}
                              </p>
                              <div className={`flex items-center gap-1 mt-1 ${statusConf.textColor}`}>
                                <StatusIcon className="w-3 h-3" />
                                <span className="text-xs">{statusConf.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                {coupon.code}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Summary: </span>
                {Object.entries(statusCounts).map(([status, count], index) => (
                  <span key={status}>
                    {index > 0 && ' • '}
                    {count} {status}
                  </span>
                ))}
              </div>
            </>
          ) : (
            // Single brand: Original grid layout
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {coupons.map((coupon) => {
                  const statusConf = getStatusConfig(coupon.status);
                  const StatusIcon = statusConf.icon;
                  const couponBrandInfo = getBrandInfo(coupon.store_name);

                  return (
                    <div
                      key={coupon.id}
                      className={`border rounded-lg p-3 border-l-4 ${statusConf.borderColor} ${statusConf.bgColor}`}
                    >
                      {/* Mini brand logo */}
                      <div className="flex items-center gap-2 mb-2">
                        {couponBrandInfo ? (
                          <div className="w-6 h-6 rounded bg-white p-0.5 flex items-center justify-center">
                            <img
                              src={couponBrandInfo.logo}
                              alt={couponBrandInfo.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <Gift className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {coupon.store_name}
                        </span>
                      </div>

                      {/* Value */}
                      <p className="font-bold text-foreground text-lg">
                        ${coupon.value?.toFixed(2) || '0.00'}
                      </p>

                      {/* Status Badge */}
                      <div className={`flex items-center gap-1 mt-2 ${statusConf.textColor}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {statusConf.label}
                        </span>
                      </div>

                      {/* Code */}
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {coupon.code}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Summary: </span>
                {Object.entries(statusCounts).map(([status, count], index) => (
                  <span key={status}>
                    {index > 0 && ' • '}
                    {count} {status}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
