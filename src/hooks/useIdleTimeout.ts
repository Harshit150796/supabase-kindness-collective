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
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

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

  const startCountdown = useCallback(() => {
    setRemainingTime(warningTime);
    
    countdownRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }, [warningTime]);

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    
    clearAllTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      onWarning?.();
      startCountdown();
    }, idleTimeout - warningTime);

    // Set idle timer
    idleTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      onIdle();
    }, idleTimeout);
  }, [enabled, idleTimeout, warningTime, onIdle, onWarning, clearAllTimers, startCountdown]);

  const stayActive = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
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
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 1000); // Throttle to once per second

      // Only reset if not in warning state (user must click "Stay logged in")
      if (!showWarning) {
        resetTimers();
      }
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
  }, [enabled, resetTimers, clearAllTimers, showWarning]);

  return {
    showWarning,
    remainingTime,
    stayActive,
    resetTimers,
  };
}
