import { useEffect, useRef, useCallback, useState } from 'react';

interface UseIdleTimeoutOptions {
  idleTimeout?: number; // in milliseconds
  warningTime?: number; // time before timeout to show warning
  onIdle: () => void;
  onWarning?: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  idleTimeout = 15 * 60 * 1000, // 15 minutes default
  warningTime = 2 * 60 * 1000, // 2 minutes warning
  onIdle,
  onWarning,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(warningTime);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Read inside the activity listener; React state there would be a stale closure.
  const warningRef = useRef(false);
  // Latest callbacks without restarting the timers whenever a parent re-renders.
  const onIdleRef = useRef(onIdle);
  const onWarningRef = useRef(onWarning);
  useEffect(() => {
    onIdleRef.current = onIdle;
    onWarningRef.current = onWarning;
  });

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetTimers = useCallback(() => {
    if (!enabled) return;

    clearAllTimers();
    warningRef.current = false;
    setShowWarning(false);

    warningTimerRef.current = setTimeout(() => {
      warningRef.current = true;
      setShowWarning(true);
      setRemainingTime(warningTime);
      onWarningRef.current?.();
      countdownRef.current = setInterval(() => {
        setRemainingTime((prev) => Math.max(0, prev - 1000));
      }, 1000);
    }, idleTimeout - warningTime);

    idleTimerRef.current = setTimeout(() => {
      clearAllTimers();
      warningRef.current = false;
      setShowWarning(false);
      onIdleRef.current();
    }, idleTimeout);
  }, [enabled, idleTimeout, warningTime, clearAllTimers]);

  const stayActive = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // The listeners and timers start once per enable. They used to restart whenever the
  // warning appeared, which hid the warning again at once and reset the countdown, so
  // the inactivity sign-out never happened and the dialog flashed every 13 minutes.
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      warningRef.current = false;
      setShowWarning(false);
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ];

    // Throttle activity detection to avoid excessive resets
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleActivity = () => {
      // While the warning shows, only "Stay logged in" keeps the session.
      if (throttleTimeout || warningRef.current) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 1000); // Throttle to once per second
      resetTimers();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timers
    resetTimers();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [enabled, resetTimers, clearAllTimers]);

  return {
    showWarning,
    remainingTime,
    stayActive,
    resetTimers,
  };
}
