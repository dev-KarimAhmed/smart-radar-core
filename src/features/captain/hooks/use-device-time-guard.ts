'use client';

import { useEffect, useRef, useState } from 'react';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';

const CHECK_INTERVAL_MS = 5000;
// If more than 15 seconds passed between 5-second ticks, the device was sleeping,
// locked, or the browser throttled the background tab.
const SUSPENSION_THRESHOLD_MS = 15000;

export function useDeviceTimeGuard() {
  const [isTimeTamperingDetected, setIsTimeTamperingDetected] = useState(false);
  const baselineRef = useRef<{ dateNow: number; perfNow: number } | null>(null);
  const lastTickDateRef = useRef<number>(0);
  const lastTickPerfRef = useRef<number>(0);

  useEffect(() => {
    if (typeof performance === 'undefined' || typeof window === 'undefined') return;

    const reAnchor = () => {
      const nowD = Date.now();
      const nowP = performance.now();
      baselineRef.current = { dateNow: nowD, perfNow: nowP };
      lastTickDateRef.current = nowD;
      lastTickPerfRef.current = nowP;
    };

    reAnchor();

    // Re-anchor on app resume, screen unlock, or tab visibility change
    // to prevent false positives from CPU sleep / background tab throttling.
    const handleVisibilityOrResume = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        reAnchor();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrResume);
    window.addEventListener('focus', handleVisibilityOrResume);
    window.addEventListener('pageshow', handleVisibilityOrResume);

    const interval = window.setInterval(() => {
      const baseline = baselineRef.current;
      if (!baseline) {
        reAnchor();
        return;
      }

      // If tab is in background or hidden, do not perform tampering check
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      const nowDate = Date.now();
      const nowPerf = performance.now();
      const gapSinceLastTick = nowDate - lastTickDateRef.current;

      // If the timer interval was suspended (e.g. phone screen lock or sleep),
      // re-anchor to current time instead of falsely triggering a tampering alert.
      if (gapSinceLastTick > SUSPENSION_THRESHOLD_MS) {
        reAnchor();
        return;
      }

      lastTickDateRef.current = nowDate;
      lastTickPerfRef.current = nowPerf;

      const expectedWallClockNow = baseline.dateNow + (nowPerf - baseline.perfNow);

      try {
        RadarAntiCheatKernel.validateDeviceTime(expectedWallClockNow, nowDate);
        // If clock is valid again (e.g. user corrected it), clear the alert
        setIsTimeTamperingDetected(false);
      } catch {
        setIsTimeTamperingDetected(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityOrResume);
      window.removeEventListener('focus', handleVisibilityOrResume);
      window.removeEventListener('pageshow', handleVisibilityOrResume);
    };
  }, []);

  return { isTimeTamperingDetected };
}
