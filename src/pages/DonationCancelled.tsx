import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Heart, CreditCard, Phone, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function DonationCancelled() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-6">
          {/* Cancelled Icon */}
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>

          {/* Message */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Payment Not Completed
            </h1>
            <p className="text-muted-foreground">
              Your payment was not processed and you haven't been charged. This can happen for several reasons.
            </p>
          </div>

          {/* Common reasons & tips */}
          <div className="bg-secondary/50 rounded-xl p-5 text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">Common reasons & what to try:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CreditCard className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>Card declined by your bank</strong> — Your bank may have flagged the transaction. Try a different card or contact your bank to approve it.</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>Too many recent attempts</strong> — Some banks limit how often you can transact online. Wait a few minutes and try again.</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span><strong>3D Secure verification failed</strong> — If your bank requires a verification code, make sure to complete it in the popup.</span>
              </li>
            </ul>
          </div>

          {/* Encouragement */}
          <div className="bg-primary/5 rounded-xl p-4 flex items-center gap-3">
            <Heart className="w-6 h-6 text-primary shrink-0" />
            <p className="text-sm text-foreground text-left">
              Every donation makes a difference. When you're ready, we'd love to have you join our community of donors helping families in need.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/#donate">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">
                Return Home
              </Link>
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
