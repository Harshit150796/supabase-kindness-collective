import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// PostHog loads only after the visitor pressed Okay on the cookie bar (cd_privacy_consent), and never
// when the browser sends Global Privacy Control.
// Field values are never captured; signed-in visitors are joined by their account ID only.
const CONSENT_KEY = 'cd_privacy_consent';
const hasConsent = () => {
  // Global Privacy Control (a browser-wide opt-out) always wins over the cookie bar.
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  try { return !!JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.accepted; } catch { return false; }
};

let started = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instance: any = null;
/** The cookie bar fires this when the visitor switches to "Essential only" after allowing analytics. */
export const ANALYTICS_OFF_EVENT = 'cd:analytics-off';
async function start() {
  if (started) return;
  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY;
  if (!token || /bot|crawl|spider/i.test(navigator.userAgent)) return;
  started = true;
  const { default: posthog } = await import('posthog-js');
  instance = posthog;
  const region = import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_REGION || 'us';
  posthog.init(token, {
    api_host: region === 'eu' ? 'https://eu.i.posthog.com' : 'https://us.i.posthog.com',
    capture_pageview: 'history_change',
    autocapture: { dom_event_allowlist: ['click', 'submit'] },
    mask_all_element_attributes: false,
    disable_session_recording: true,
    respect_dnt: true,
    person_profiles: 'identified_only',
  });
  const identify = (id?: string) => { if (id) posthog.identify(id); };
  const { data } = await supabase.auth.getSession();
  identify(data.session?.user.id);
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') posthog.reset();
    else identify(session?.user.id);
  });
}

export function VisitorAnalytics() {
  useEffect(() => {
    const off = () => { try { instance?.opt_out_capturing(); instance?.reset(); } catch { /* not loaded */ } };
    window.addEventListener(ANALYTICS_OFF_EVENT, off);
    return () => window.removeEventListener(ANALYTICS_OFF_EVENT, off);
  }, []);
  useEffect(() => {
    if (hasConsent()) { void start(); return; }
    const t = window.setInterval(() => { if (hasConsent()) { window.clearInterval(t); void start(); } }, 1500);
    return () => window.clearInterval(t);
  }, []);
  return null;
}
