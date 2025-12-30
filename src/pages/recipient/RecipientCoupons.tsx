import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, Calendar, Search, Tag, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  title: string;
  code: string;
  description: string | null;
  value: number;
  discount_percent: number | null;
  expiry_date: string | null;
  category_id: string | null;
}

export default function RecipientCoupons() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('id, title, code, description, value, discount_percent, expiry_date, category_id')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    setCoupons(data || []);
    setLoading(false);
  };

  const handleClaim = async (couponId: string) => {
    setClaiming(couponId);
    try {
      // Update coupon status to reserved
      const { error } = await supabase
        .from('coupons')
        .update({ 
          status: 'reserved',
          reserved_by: user!.id,
          reserved_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (error) throw error;

      toast({ title: 'Success!', description: 'Coupon reserved successfully.' });
      fetchCoupons();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setClaiming(null);
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.title.toLowerCase().includes(search.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Available Coupons</h1>
          <p className="text-muted-foreground">Browse and claim coupons from generous donors</p>
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
              <p className="text-lg font-medium text-foreground">No coupons available</p>
              <p className="text-muted-foreground">Check back later for new donations!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{coupon.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {coupon.value}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {coupon.description && (
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {coupon.discount_percent && (
                      <Badge variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {coupon.discount_percent}% off
                      </Badge>
                    )}
                    {coupon.expiry_date && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Expires {format(new Date(coupon.expiry_date), 'MMM d')}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleClaim(coupon.id)}
                    disabled={claiming === coupon.id}
                  >
                    {claiming === coupon.id ? 'Reserving...' : 'Reserve Coupon'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
