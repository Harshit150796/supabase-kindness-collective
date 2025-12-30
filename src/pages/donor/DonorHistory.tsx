import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  region: string | null;
}

export default function DonorHistory() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', user!.id)
      .order('created_at', { ascending: false });

    setDonations(data || []);
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donation History</h1>
          <p className="text-muted-foreground">All your donations</p>
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
            {donations.map((donation) => (
              <Card key={donation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${donation.amount}
                        </h3>
                        {donation.is_anonymous && (
                          <Badge variant="secondary">Anonymous</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(donation.created_at), 'MMM d, yyyy')}
                        </span>
                        {donation.region && (
                          <span>{donation.region}</span>
                        )}
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mt-2">
                          "{donation.message}"
                        </p>
                      )}
                    </div>
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
