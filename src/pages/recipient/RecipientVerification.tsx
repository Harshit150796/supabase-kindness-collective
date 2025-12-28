import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, Clock, XCircle, Upload } from 'lucide-react';

const verificationTypes = [
  { value: 'income', label: 'Income-Based Assistance' },
  { value: 'disability', label: 'Disability Support' },
  { value: 'senior', label: 'Senior Citizen' },
  { value: 'student', label: 'Student' },
  { value: 'veteran', label: 'Veteran' },
  { value: 'other', label: 'Other Assistance Program' }
];

export default function RecipientVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationType, setVerificationType] = useState('');

  useEffect(() => {
    if (user) fetchVerification();
  }, [user]);

  const fetchVerification = async () => {
    const { data } = await supabase
      .from('recipient_verifications')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    setVerification(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!verificationType) {
      toast({ title: 'Error', description: 'Please select a verification type', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('recipient_verifications').insert({
        user_id: user!.id,
        verification_type: verificationType,
        status: 'pending'
      });

      if (error) throw error;

      toast({ title: 'Success!', description: 'Verification submitted. We\'ll review it soon.' });
      fetchVerification();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-emerald-light" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-gold" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verification</h1>
          <p className="text-muted-foreground">Verify your eligibility to receive coupons</p>
        </div>

        {verification ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(verification.status)}
                  Verification Status
                </CardTitle>
                <Badge variant={
                  verification.status === 'approved' ? 'default' :
                  verification.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {verification.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Verification Type</p>
                <p className="font-medium text-foreground">
                  {verificationTypes.find(t => t.value === verification.verification_type)?.label || verification.verification_type}
                </p>
              </div>

              {verification.status === 'pending' && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Your verification is under review. This usually takes 2-3 business days. 
                    We'll notify you once it's complete.
                  </p>
                </div>
              )}

              {verification.status === 'approved' && (
                <div className="bg-emerald-light/10 rounded-lg p-4">
                  <p className="text-sm text-emerald-light">
                    Congratulations! You're verified and can now claim coupons.
                  </p>
                </div>
              )}

              {verification.status === 'rejected' && (
                <div className="bg-destructive/10 rounded-lg p-4">
                  <p className="text-sm text-destructive">
                    Your verification was not approved. 
                    {verification.notes && ` Reason: ${verification.notes}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Submit Verification
              </CardTitle>
              <CardDescription>
                Choose your verification type to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Type</Label>
                <Select value={verificationType} onValueChange={setVerificationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification type" />
                  </SelectTrigger>
                  <SelectContent>
                    {verificationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  We verify recipients to ensure coupons go to those who need them most. 
                  This is a simple self-declaration process. In the future, we may ask for 
                  supporting documents.
                </p>
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Verification'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}