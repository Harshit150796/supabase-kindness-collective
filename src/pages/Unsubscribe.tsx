import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const unsubscribe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('handle-newsletter-unsubscribe', {
          body: { token },
        });
        if (error || !data?.success) {
          setStatus('error');
        } else {
          setEmail(data.email || '');
          setStatus('success');
        }
      } catch {
        setStatus('error');
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Processing your request...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h1 className="text-xl font-bold text-foreground">Unsubscribed Successfully</h1>
                <p className="text-muted-foreground">
                  {email ? `${email} has` : 'You have'} been removed from our mailing list. You won't receive any more newsletters from us.
                </p>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <h1 className="text-xl font-bold text-foreground">Something Went Wrong</h1>
                <p className="text-muted-foreground">
                  We couldn't process your unsubscribe request. The link may be invalid or expired.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
