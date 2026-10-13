import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// PostHog loads only after the visitor accepted the cookie bar (cd_privacy_consent).
// Field values are never captured; signed-in visitors are joined by their account ID only.
const CONSENT_KEY = 'cd_privacy_consent';
const hasConsent = () => {
  try { return !!JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')?.accepted; } catch { return false; }
};

let started = false;
async function start() {
  if (started) return;
  const token = import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY;
  if (!token || /bot|crawl|spider/i.test(navigator.userAgent)) return;
  started = true;
  const { default: posthog } = await import('posthog-js');
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
    if (hasConsent()) { void start(); return; }
    const t = window.setInterval(() => { if (hasConsent()) { window.clearInterval(t); void start(); } }, 1500);
    return () => window.clearInterval(t);
  }, []);
  return null;
}
