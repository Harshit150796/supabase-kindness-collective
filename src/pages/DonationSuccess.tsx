import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Heart, Utensils, Home, Gift, History } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';

export default function DonationSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const amount = searchParams.get('amount') || '50';
  const meals = searchParams.get('meals') || '100';
  const goldCoins = parseInt(amount) * 10;
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
          navigate('/donor/history');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 left-1/2 transform -translate-x-1/2 translate-x-8">
              <Heart className="w-8 h-8 text-primary fill-primary animate-pulse" />
            </div>
          </div>

          {/* Thank You Message */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Thank You for Your Generosity!
            </h1>
            <p className="text-muted-foreground">
              Your donation has been successfully processed.
            </p>
          </div>

          {/* Impact Summary */}
          <div className="bg-secondary/50 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">${amount}</div>
                <div className="text-sm text-muted-foreground">Donated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                  <Utensils className="w-6 h-6" />
                  {meals}
                </div>
                <div className="text-sm text-muted-foreground">Meals Provided</div>
              </div>
            </div>

            {/* Gold Coins Earned */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">+{goldCoins} Gold Coins Earned!</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use your coins for exclusive rewards and discounts
              </p>
            </div>
          </div>

          {/* Impact Message */}
          <div className="bg-primary/5 rounded-lg p-4">
            <p className="text-sm text-foreground">
              Your donation will help families access essential groceries and household items. 
              Together, we're making a real difference in our communities.
            </p>
          </div>

          {/* Receipt Notice */}
          <p className="text-xs text-muted-foreground">
            A receipt has been sent to your email address.
          </p>

          {/* Action Buttons */}
          {user ? (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/donor/history">
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
