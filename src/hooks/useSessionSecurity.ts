import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useIdleTimeout } from './useIdleTimeout';
import { toast } from 'sonner';
import { TEAM_ROLES } from '@/components/navigation/siteLinks';

const SESSION_START_KEY = 'session_start_time';
const ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before logout

export function useSessionSecurity() {
  const { user, roles, rolesLoaded, signOut } = useAuth();
  // Team members (admin, staff, viewer) are never signed out by these timers (founder request, Nov 23, 2026):
  // the 15-minute idle sign-out kept ending admin work, including from an idle tab elsewhere on the site, since
  // signing out one tab signs out every tab. The admin portal keeps its own 12-hour check (useTeamSession).
  // Until roles load, nobody is timed (a team member must never be signed out in that moment).
  const timed = !!user && rolesLoaded && !roles.some((role) => TEAM_ROLES.includes(role));

  // Handle idle timeout logout
  const handleIdleLogout = useCallback(async () => {
    toast.info('You have been logged out due to inactivity', {
      description: 'Please sign in again to continue.',
      duration: 5000,
    });
    await signOut();
  }, [signOut]);

  // Handle warning notification
  const handleWarning = useCallback(() => {
    // Warning is handled by the modal, no toast needed
  }, []);

  const { showWarning, remainingTime, stayActive } = useIdleTimeout({
    idleTimeout: IDLE_TIMEOUT,
    warningTime: WARNING_TIME,
    onIdle: handleIdleLogout,
    onWarning: handleWarning,
    enabled: timed,
  });

  // Track session start time
  useEffect(() => {
    if (user) {
      const existingStart = sessionStorage.getItem(SESSION_START_KEY);
      if (!existingStart) {
        sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
      }
    } else {
      sessionStorage.removeItem(SESSION_START_KEY);
    }
  }, [user]);

  // Check absolute session timeout
  useEffect(() => {
    if (!timed) return;

    const checkAbsoluteTimeout = () => {
      const sessionStart = sessionStorage.getItem(SESSION_START_KEY);
      if (!sessionStart) return;

      const startTime = parseInt(sessionStart, 10);
      const elapsed = Date.now() - startTime;

      if (elapsed >= ABSOLUTE_TIMEOUT) {
        toast.info('Your session has expired', {
          description: 'For security, please sign in again.',
          duration: 5000,
        });
        signOut();
      }
    };

    // Check immediately
    checkAbsoluteTimeout();

    // Check every minute
    const interval = setInterval(checkAbsoluteTimeout, 60 * 1000);

    return () => clearInterval(interval);
  }, [timed, signOut]);

  return {
    showWarning,
    remainingTime,
    stayActive,
  };
}
