import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Check, User, CheckCircle, Gift, Calendar, DollarSign, Store } from 'lucide-react';
import { format } from 'date-fns';

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

export function DonationCouponsModal({ donation, open, onOpenChange }: DonationCouponsModalProps) {
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
      .select('*')
      .eq('donation_id', donation.id)
      .order('created_at', { ascending: true });

    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  if (!donation) return null;

  const summary = coupons.reduce(
    (acc, coupon) => {
      acc[coupon.status] = (acc[coupon.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                <p className="text-xs text-muted-foreground">Brand</p>
                <p className="font-semibold">{donation.brand_partner || 'General'}</p>
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
            ) : (
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
