import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useIdleTimeout } from './useIdleTimeout';
import { toast } from 'sonner';

const SESSION_START_KEY = 'session_start_time';
const ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before logout

export function useSessionSecurity() {
  const { user, signOut } = useAuth();

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
    enabled: !!user,
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
    if (!user) return;

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
  }, [user, signOut]);

  return {
    showWarning,
    remainingTime,
    stayActive,
  };
}
