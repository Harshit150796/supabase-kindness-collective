import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { teamAccessOk } from '@/lib/adminGate';
import { TEAM_ROLES } from '@/components/navigation/siteLinks';

/**
 * Whether the admin portal may open: a team role (admin, staff, viewer) and a sign-in that came through
 * the hidden link (and, when TEAM_MFA_REQUIRED is on, its authenticator step) within the last 12 hours.
 * Re-checked every minute.
 */
export function useTeamSession(): 'loading' | 'ok' | 'denied' {
  const { user, session, roles, loading, rolesLoaded } = useAuth();
  const [fresh, setFresh] = useState<boolean | null>(null);
  const token = session?.access_token;
  useEffect(() => {
    let alive = true;
    if (!user) { setFresh(false); return; }
    setFresh(null);
    const check = () => teamAccessOk(user.id, token).then((ok) => { if (alive) setFresh(ok); }, () => { if (alive) setFresh(false); });
    check();
    const timer = window.setInterval(check, 60_000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [user, token]);
  if (loading || (user && (!rolesLoaded || fresh === null))) return 'loading';
  if (!user || !roles.some((role) => TEAM_ROLES.includes(role)) || !fresh) return 'denied';
  return 'ok';
}
