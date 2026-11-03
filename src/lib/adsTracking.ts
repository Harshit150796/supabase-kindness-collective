// Google Ads tag. Loads only after the visitor pressed Okay on the cookie bar and never when the browser
// sends Global Privacy Control (same gate as PostHog, see VisitorAnalytics). Does nothing until
// VITE_GOOGLE_ADS_ID (AW-…) is set. Consent Mode starts denied; the tag is granted ad_storage and
// ad_user_data only once the visitor allowed analytics, and personalised ads are never enabled.
const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
const CONVERSION_LABEL = import.meta.env.VITE_GOOGLE_ADS_DONATION_LABEL as string | undefined;

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag }
}

let loaded = false;

export function startAds() {
  if (loaded) { window.gtag?.('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted' }); return; }
  if (!ADS_ID || !/^AW-\d+$/.test(ADS_ID) || /bot|crawl|spider/i.test(navigator.userAgent)) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the `arguments` object, so this must stay a function declaration rather than a rest-args arrow.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer!.push(arguments); } as Gtag;
  window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  window.gtag('js', new Date());
  window.gtag('set', 'allow_ad_personalization_signals', false);
  window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted' });
  window.gtag('config', ADS_ID, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;
  document.head.appendChild(s);
}

/** Called when the visitor switches to "Essential only": stop sending anything further. */
export function stopAds() {
  try {
    window.gtag?.('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied' });
  } catch { /* not loaded */ }
}

/** Reports one finished donation. `ref` is the checkout reference so a reload never counts twice. */
export function trackDonationConversion(ref: string | null) {
  if (!loaded || !ADS_ID || !CONVERSION_LABEL || !window.gtag) return;
  try {
    const key = `cd_ads_conv:${ref || 'none'}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* private mode: send anyway */ }
  window.gtag('event', 'conversion', { send_to: `${ADS_ID}/${CONVERSION_LABEL}`, ...(ref ? { transaction_id: ref } : {}) });
}
