import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gift, Search, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  title: string;
  code: string;
  status: string;
  value: number;
  category_id: string | null;
  partner_id: string | null;
  created_at: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('id, title, code, status, value, category_id, partner_id, created_at')
      .order('created_at', { ascending: false });

    setCoupons(data || []);
    setLoading(false);
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.title.toLowerCase().includes(search.toLowerCase()) ||
    coupon.code.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'reserved': return 'secondary';
      case 'redeemed': return 'outline';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Coupon Management</h1>
          <p className="text-muted-foreground">View all coupons on the platform</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredCoupons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No coupons found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{coupon.title}</p>
                        <Badge variant={getStatusVariant(coupon.status)}>
                          {coupon.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Value: ${coupon.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(coupon.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">{coupon.code}</p>
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
