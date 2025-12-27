import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Heart } from 'lucide-react';
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
              Donation Cancelled
            </h1>
            <p className="text-muted-foreground">
              No worries! Your payment was not processed and you haven't been charged.
            </p>
          </div>

          {/* Encouragement */}
          <div className="bg-secondary/50 rounded-xl p-6">
            <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-foreground">
              Every donation makes a difference. When you're ready, we'd love to have you join 
              our community of 50,000+ donors helping families in need.
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
