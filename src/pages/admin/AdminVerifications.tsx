import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Verification {
  id: string;
  user_id: string;
  verification_type: string | null;
  status: string | null;
  documents_url: string | null;
  notes: string | null;
  submitted_at: string | null;
}

export default function AdminVerifications() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    const { data } = await supabase
      .from('recipient_verifications')
      .select('*')
      .order('submitted_at', { ascending: false });

    setVerifications(data || []);
    setLoading(false);
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('recipient_verifications')
      .update({
        status,
        notes: reviewNotes[id] || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Verification ${status}` });
      fetchVerifications();
    }
  };

  const pendingVerifications = verifications.filter(v => v.status === 'pending');
  const processedVerifications = verifications.filter(v => v.status !== 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verification Requests</h1>
          <p className="text-muted-foreground">Review and approve recipient verifications</p>
        </div>

        {/* Pending Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            Pending ({pendingVerifications.length})
          </h2>

          {pendingVerifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending verifications</p>
              </CardContent>
            </Card>
          ) : (
            pendingVerifications.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">User ID: {v.user_id.slice(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {v.verification_type || 'Standard'}
                      </p>
                      {v.submitted_at && (
                        <p className="text-xs text-muted-foreground">
                          Submitted: {format(new Date(v.submitted_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>

                  <Textarea
                    placeholder="Add review notes (optional)..."
                    value={reviewNotes[v.id] || ''}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [v.id]: e.target.value })}
                    rows={2}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReview(v.id, 'approved')}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReview(v.id, 'rejected')}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Processed Section */}
        {processedVerifications.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Processed</h2>
            {processedVerifications.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">User ID: {v.user_id.slice(0, 8)}...</p>
                      {v.notes && <p className="text-sm text-muted-foreground">Notes: {v.notes}</p>}
                    </div>
                    <Badge variant={v.status === 'approved' ? 'default' : 'destructive'}>
                      {v.status}
                    </Badge>
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