import { useEffect } from 'react';
import { initAdTags } from '@/lib/adTracking';

// Loads the Google Ads tag and Meta pixel once the cookie bar allows them (same consent rule as
// VisitorAnalytics). Renders nothing.
export function AdTags() {
  useEffect(() => {
    initAdTags();
    const t = window.setInterval(initAdTags, 1500);
    return () => window.clearInterval(t);
  }, []);
  return null;
}
