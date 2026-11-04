// Ad measurement (Google Ads tag + Meta pixel) loads only after the visitor pressed Okay on the
// cookie bar (cd_privacy_consent), and never when the browser sends Global Privacy Control — the
// same rule as VisitorAnalytics. The only conversion reported is a completed gift, fired by the
// donation success page after the server confirms the donation; no value is sent because the
// client never sees a trusted amount.
import { ANALYTICS_OFF_EVENT } from '@/components/VisitorAnalytics';

const CONSENT_KEY = 'cd_privacy_consent';
const GOOGLE_TAG_ID = 'AW-18266677995';
const GOOGLE_GIFT_SEND_TO = 'AW-18266677995/Xb_3CN_W07EdEOvFnYZE';
const META_PIXEL_ID = '1093853740304162';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void };
    _fbq?: Window['fbq'];
  }
}

const hasConsent = () => {
  // Global Privacy Control (a browser-wide opt-out) always wins over the cookie bar.
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  try { return !!JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.accepted; } catch { return false; }
};

let blocked = false;
let googleLoaded = false;
let metaLoaded = false;
const reported = new Set<string>();

function loadGoogleTag() {
  if (googleLoaded || blocked || !hasConsent()) return;
  googleLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => { window.dataLayer!.push(args); });
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_TAG_ID);
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
  script.async = true;
  script.setAttribute('data-google-ads', '');
  document.head.appendChild(script);
}

function loadMetaPixel() {
  if (metaLoaded || blocked || !hasConsent()) return;
  metaLoaded = true;
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    }) as NonNullable<Window['fbq']>;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    window._fbq = fbq;
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.async = true;
    script.setAttribute('data-meta-pixel', '');
    document.head.appendChild(script);
  }
  window.fbq!('init', META_PIXEL_ID, {}, { agent: 'lovable' });
  window.fbq!('track', 'PageView');
}

/** Loads the base ad tags when the cookie bar allows it. Safe to call repeatedly; returns true once loaded. */
export function initAdTags() {
  if (!hasConsent()) return false;
  loadGoogleTag();
  loadMetaPixel();
  return googleLoaded && metaLoaded;
}

/** Reports one completed gift to Google Ads and Meta, once per checkout reference. */
export function reportCompletedGift(transactionId: string) {
  if (blocked || !transactionId || reported.has(transactionId)) return;
  if (!hasConsent()) return; // never queue a blocked event
  reported.add(transactionId);
  initAdTags();
  window.gtag?.('event', 'conversion', { send_to: GOOGLE_GIFT_SEND_TO, transaction_id: transactionId });
  window.fbq?.('track', 'Purchase', {}, { eventID: transactionId });
}

// The cookie bar fires this when the visitor switches to "Essential only" after allowing analytics:
// already-loaded tags stay in the page, but nothing further is reported.
if (typeof window !== 'undefined') {
  window.addEventListener(ANALYTICS_OFF_EVENT, () => { blocked = true; });
}
