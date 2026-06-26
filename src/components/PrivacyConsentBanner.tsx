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
      className="fixed bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-3xl rounded-xl md:rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-500"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Compact one-line bar on mobile so it doesn't cover the hero CTA. */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2">
        <p className="text-xs text-muted-foreground flex-1 min-w-0 leading-snug">
          We use cookies. See our{' '}
          <Link to="/privacy" className="underline underline-offset-2">
            Privacy
          </Link>
          {' & '}
          <Link to="/terms" className="underline underline-offset-2">
            Terms
          </Link>
          .
        </p>
        <Button
          onClick={accept}
          size="sm"
          className="shrink-0 h-8 px-4 rounded-lg text-xs font-semibold"
        >
          Okay
        </Button>
      </div>

      {/* Full card on md+ where there is room beside the hero. */}
      <div className="hidden md:block p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground mb-1">
              Privacy Information
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to analyze site usage,
              remember your preferences, and improve your experience on
              CouponDonation. By continuing, you agree to our{' '}
              <Link
                to="/privacy"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link
                to="/terms"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
          <div className="md:shrink-0">
            <Button
              onClick={accept}
              size="lg"
              variant="outline"
              className="w-full md:w-auto rounded-xl px-10 font-semibold"
            >
              Okay
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Link
            to="/cookies"
            onClick={() => window.scrollTo({ top: 0 })}
            className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            See Our Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
