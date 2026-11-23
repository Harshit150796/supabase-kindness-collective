import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sessionIdOf, teamAccessOk } from '@/lib/adminGate';
import { TEAM_ROLES } from '@/components/navigation/siteLinks';

/**
 * Whether the admin portal may open: a team role (admin, staff, viewer) and a sign-in that came through
 * the hidden link (and, when TEAM_MFA_REQUIRED is on, its authenticator step) within the last 12 hours.
 * Re-checked every minute, in place: the hourly token refresh keeps the same sign-in, so it no longer
 * swaps the whole portal for "Loading…" (which also threw away whatever was open, founder report Nov 23, 2026).
 */
export function useTeamSession(): 'loading' | 'ok' | 'denied' {
  const { user, session, roles, loading, rolesLoaded } = useAuth();
  const userId = user?.id ?? null;
  const token = session?.access_token;
  // One answer per person and sign-in; a refreshed token for the same sign-in keeps it.
  const key = userId ? `${userId}:${sessionIdOf(token) ?? ''}` : null;
  const [fresh, setFresh] = useState<{ key: string; ok: boolean } | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  useEffect(() => {
    if (!key || !userId) return;
    let alive = true;
    const check = () => teamAccessOk(userId, tokenRef.current).then(
      (ok) => { if (alive) setFresh({ key, ok }); },
      () => { if (alive) setFresh({ key, ok: false }); },
    );
    check();
    const timer = window.setInterval(check, 60_000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [key, userId]);
  const answer = fresh && fresh.key === key ? fresh.ok : null;
  if (loading || (user && (!rolesLoaded || answer === null))) return 'loading';
  if (!user || !roles.some((role) => TEAM_ROLES.includes(role)) || !answer) return 'denied';
  return 'ok';
}
