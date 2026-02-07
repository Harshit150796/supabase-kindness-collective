import { useEffect, useState } from 'react';
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
    (k) => k.toLowerCase() === brandName.toLowerCase()
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (donation && open) {
      fetchCoupons();
    }
  }, [donation, open]);

  const fetchCoupons = async () => {
    if (!donation) return;
    setLoading(true);
    const { data } = await supabase
      .from('coupons')
      .select('id, code, value, status, store_name, created_at')
      .eq('donation_id', donation.id)
      .order('created_at', { ascending: true });

    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  if (!donation) return null;

  const brandInfo = getBrandInfo(donation.brand_partner);

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
          {/* Brand Logo */}
          <div className="flex flex-col items-center gap-3">
            {brandInfo ? (
              <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-sm border flex items-center justify-center">
                <img
                  src={brandInfo.logo}
                  alt={brandInfo.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
            )}
            <DialogTitle className="text-xl">
              {brandInfo?.name || donation.brand_partner || 'Donation Details'}
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
          ) : (
            <>
              {/* Coupons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {coupons.map((coupon) => {
                  const statusConfig = getStatusConfig(coupon.status);
                  const StatusIcon = statusConfig.icon;
                  const couponBrandInfo = getBrandInfo(coupon.store_name);

                  return (
                    <div
                      key={coupon.id}
                      className={`border rounded-lg p-3 border-l-4 ${statusConfig.borderColor} ${statusConfig.bgColor}`}
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
                      <div className={`flex items-center gap-1 mt-2 ${statusConfig.textColor}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">
                          {statusConfig.label}
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
