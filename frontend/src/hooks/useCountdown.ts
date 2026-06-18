import { useState, useEffect, useRef } from 'react';
import { CountdownResult } from '../types/countdown.types';

export function useCountdown(expiresAt: string, onExpired?: () => void): CountdownResult {
  const onExpiredRef = useRef(onExpired);
  
  // Keep the callback ref updated so we don't have to restart the interval
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // Ref to ensure onExpired is called exactly once per expiresAt value
  const hasCalledExpired = useRef(false);

  // Helper function to calculate remaining seconds from system time
  const calculateRemaining = (): { secondsLeft: number; isExpired: boolean } => {
    const expiresMs = new Date(expiresAt).getTime();
    const nowMs = Date.now();
    const remainingMs = expiresMs - nowMs;

    if (isNaN(expiresMs) || remainingMs <= 0) {
      return { secondsLeft: 0, isExpired: true };
    }

    // Ceil to ensure we round up remaining seconds (e.g. 9.5s -> 10s)
    return {
      secondsLeft: Math.ceil(remainingMs / 1000),
      isExpired: false,
    };
  };

  const [timeState, setTimeState] = useState(() => calculateRemaining());

  // Effect to manage interval timer and tab focus visibility changes
  useEffect(() => {
    // Reset expiration callback trigger when expiresAt changes
    hasCalledExpired.current = false;

    // Initial calculation on mount/dependency change
    const initial = calculateRemaining();
    setTimeState(initial);

    if (initial.isExpired) {
      if (!hasCalledExpired.current) {
        hasCalledExpired.current = true;
        onExpiredRef.current?.();
      }
      return;
    }

    const interval = setInterval(() => {
      const next = calculateRemaining();
      setTimeState(next);

      if (next.isExpired) {
        clearInterval(interval);
        if (!hasCalledExpired.current) {
          hasCalledExpired.current = true;
          onExpiredRef.current?.();
        }
      }
    }, 1000);

    // Sync immediately on focus/tab resume to survive computer/browser sleep
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const next = calculateRemaining();
        setTimeState(next);
        if (next.isExpired && !hasCalledExpired.current) {
          hasCalledExpired.current = true;
          onExpiredRef.current?.();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [expiresAt]);

  const minutes = Math.floor(timeState.secondsLeft / 60);
  const seconds = timeState.secondsLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    minutes,
    seconds,
    secondsLeft: timeState.secondsLeft,
    formattedTime,
    isExpired: timeState.isExpired,
  };
}

export default useCountdown;
