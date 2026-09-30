'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * [ACT-PWA-02] Sovereign Context-Aware WakeLock Hook
 * Keeps the screen awake during active radar scanning (RECEIVING_OFFERS)
 * or active in-progress trips (TRIP_ACTIVE) without holding the lock
 * unconditionally during idle or app launch.
 */
export function useWakeLock(enabled: boolean = true) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!sentinelRef.current) {
        sentinelRef.current = await navigator.wakeLock.request('screen');
        sentinelRef.current.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      }
    } catch {
      // Ignored: wake lock request may be denied due to battery saver or permissions
    }
  }, []);

  const releaseLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Ignored
      }
      sentinelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      void releaseLock();
      return;
    }

    void requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        void requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void releaseLock();
    };
  }, [enabled, requestLock, releaseLock]);

  return { requestLock, releaseLock };
}
