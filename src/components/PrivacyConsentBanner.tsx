import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'cd_privacy_consent';
/** The footer's "Cookie settings" link fires this to show the bar again. */
export const COOKIE_SETTINGS_EVENT = 'cd:cookie-settings';

export function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // While the bar is up, the page gets room below its last line so nothing ends up hidden under it.
  useEffect(() => {
    const el = barRef.current;
    if (!visible || !el) return;
    const body = document.body;
    const make = () => body.style.setProperty('padding-bottom', `${Math.ceil(el.getBoundingClientRect().height) + 16}px`);
    make();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(make) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); body.style.removeProperty('padding-bottom'); };
  }, [visible]);

  useEffect(() => {
    const reopen = () => setVisible(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        // On the homepage it waits until the opening has finished, so the first view isn't covered
        // (Duck.Design audit, Nov 2026: overlays on overlays).
        let t = 0;
        const show = () => { t = window.setTimeout(() => setVisible(true), 400); };
        if (document.documentElement.classList.contains('cd-intro')) window.addEventListener('cd:intro-end', show, { once: true });
        else show();
        return () => { window.clearTimeout(t); window.removeEventListener('cd:intro-end', show); };
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
      ref={barRef}
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

      {/* One compact row on md+ too, so it doesn't sit over the hero; both choices carry the same weight. */}
      <div className="hidden md:flex items-center gap-5 px-5 py-3">
        <p className="flex-1 min-w-0 text-[13px] leading-snug text-muted-foreground">
          We use essential cookies to run CouponDonation and keep you signed in. With your OK, we also use
          analytics to improve the site.{' '}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
          {' · '}
          <Link to="/cookies" onClick={() => window.scrollTo({ top: 0 })} className="underline underline-offset-2 hover:text-foreground transition-colors">Cookie Policy</Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button onClick={essentialOnly} size="sm" variant="outline" className="h-9 px-4 font-medium">
            Essential only
          </Button>
          <Button onClick={accept} size="sm" variant="outline" className="h-9 px-6 font-semibold">
            Okay
          </Button>
        </div>
      </div>
    </div>
  );
}
