import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NoIndex } from '@/components/SEO';
import { isAdminGatePath } from '@/lib/adminGate';

const AdminSignIn = lazy(() => import('@/pages/AdminSignIn'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/**
 * Every unknown address: the hidden team sign-in when it is the secret link (checked by its SHA-256),
 * otherwise the ordinary "page not found". Nothing else on the site links to the sign-in.
 */
export function AdminGateRoute() {
  const { pathname } = useLocation();
  const [gate, setGate] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    setGate(null);
    isAdminGatePath(pathname).then((ok) => { if (alive) setGate(ok); }, () => { if (alive) setGate(false); });
    return () => { alive = false; };
  }, [pathname]);
  if (gate === null) return null;
  return (
    <Suspense fallback={null}>
      {gate ? <><NoIndex title="Sign in" /><AdminSignIn /></> : <><NoIndex title="Page not found" /><NotFound /></>}
    </Suspense>
  );
}

/** What /admin shows to anyone without a verified team session: the same "page not found". */
export function AdminNotFound() {
  return <Suspense fallback={null}><NoIndex title="Page not found" /><NotFound /></Suspense>;
}
