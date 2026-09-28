import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Heart, Home, History } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';

export default function DonationSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Auto-redirect for logged-in users
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard/giving');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, navigate]);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <Card className="max-w-lg w-full rounded-md p-8 text-center space-y-6 shadow-sm">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 left-1/2 transform -translate-x-1/2 translate-x-8">
              <Heart className="w-8 h-8 text-primary fill-primary animate-pulse" />
            </div>
          </div>

          {/* Thank You Message */}
          <div>
            <h1 className="font-display text-4xl font-normal text-foreground mb-2">
              Thank you for giving.
            </h1>
            <p className="text-muted-foreground">
              Your donation has been successfully processed.
            </p>
          </div>

          {/* Impact Message */}
          <div className="border-y border-border bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              Your donation creates coupons that are distributed to verified families, 
              redeemable at partner brands for groceries, essentials, and more.
            </p>
          </div>

          {user && <p className="text-sm text-muted-foreground">Gold Coins are credited to your account after the donation is confirmed.</p>}

          {/* Receipt Notice */}
          <p className="text-xs text-muted-foreground">
            A receipt has been sent to your email address.
          </p>

          {/* Action Buttons */}
          {user ? (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/dashboard/giving">
                  <History className="w-4 h-4 mr-2" />
                  View Your Donations
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Redirecting to your donation history in {countdown}s...
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/auth?mode=signup&role=donor">
                  Create Account
                </Link>
              </Button>
            </div>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
