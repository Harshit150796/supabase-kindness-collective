import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'cd_privacy_consent';

export function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        const t = setTimeout(() => setVisible(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: true, at: new Date().toISOString() })
      );
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Privacy information"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-500"
    >
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground mb-1">
              Privacy Information
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to analyze site usage,
              remember your preferences, and improve your experience on
              CouponDonation. By continuing to use our site, you consent to the
              use of these technologies as explained in our{' '}
              <Link
                to="/privacy"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              {' '}and agree to our{' '}
              <Link
                to="/terms"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-4 md:shrink-0">
            <Link
              to="/privacy"
              className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors md:hidden"
            >
              See Privacy Policy
            </Link>
            <Button
              onClick={accept}
              size="lg"
              className="rounded-full px-10 font-semibold"
            >
              Okay
            </Button>
          </div>
        </div>
        <div className="hidden md:flex justify-center mt-2">
          <Link
            to="/privacy"
            className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            See Our Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
