import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'cd_privacy_consent';
/** The footer's "Cookie settings" link fires this to show the bar again. */
export const COOKIE_SETTINGS_EVENT = 'cd:cookie-settings';

export function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reopen = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

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

  // "Okay" allows analytics; "Essential only" keeps just what the site needs to work. Analytics loads
  // only after "Okay" and never when the browser sends Global Privacy Control (VisitorAnalytics).
  const choose = (analytics: boolean) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: analytics, choice: analytics ? 'all' : 'essential', at: new Date().toISOString() })
      );
    } catch {
      /* ignore */
    }
    if (!analytics) window.dispatchEvent(new Event('cd:analytics-off'));
    setVisible(false);
  };
  const accept = () => choose(true);
  const essentialOnly = () => choose(false);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Privacy information"
      className="fixed bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-3xl rounded-md border border-border bg-background shadow-lg animate-in slide-in-from-bottom duration-500"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Compact one-line bar on mobile so it doesn't cover the hero CTA. */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2">
        <p className="text-xs text-muted-foreground flex-1 min-w-0 leading-snug">
          We use cookies.{' '}
          <Link to="/cookies" className="underline underline-offset-2">
            Cookie Policy
          </Link>
        </p>
        <button
          type="button"
          onClick={essentialOnly}
          className="shrink-0 h-8 px-2 text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Essential only
        </button>
        <Button
          onClick={accept}
          size="sm"
          className="shrink-0 h-8 px-4 text-xs font-semibold"
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
              We use essential cookies and similar storage to run CouponDonation
              and keep you signed in. With your OK, we also use analytics to see
              how the site is used and improve it. Read our{' '}
              <Link
                to="/privacy"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 md:shrink-0 md:flex-row-reverse md:items-center">
            <Button
              onClick={accept}
              size="lg"
              variant="outline"
              className="w-full md:w-auto px-10 font-semibold"
            >
              Okay
            </Button>
            <Button onClick={essentialOnly} size="lg" variant="ghost" className="w-full md:w-auto font-medium text-muted-foreground">
              Essential only
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
