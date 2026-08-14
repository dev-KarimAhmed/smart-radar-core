'use client';

import { useEffect, useRef, useState } from 'react';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';

const CHECK_INTERVAL_MS = 5000;

// Spec 5.1.1 without a server round-trip: `performance.now()` is a monotonic
// clock the OS clock setting can't move, while `Date.now()` jumps the instant
// someone manually changes the device clock. Comparing "where the wall clock
// should be" (baseline + monotonic elapsed) against where it actually is
// reuses the frozen kernel's own `validateDeviceTime` throw/threshold as the
// single source of truth for what counts as tampering.
export function useDeviceTimeGuard() {
  const [isTimeTamperingDetected, setIsTimeTamperingDetected] = useState(false);
  const baselineRef = useRef<{ dateNow: number; perfNow: number } | null>(null);

  useEffect(() => {
    if (typeof performance === 'undefined') return;
    baselineRef.current = { dateNow: Date.now(), perfNow: performance.now() };

    const interval = window.setInterval(() => {
      const baseline = baselineRef.current;
      if (!baseline) return;

      const expectedWallClockNow = baseline.dateNow + (performance.now() - baseline.perfNow);

      try {
        RadarAntiCheatKernel.validateDeviceTime(expectedWallClockNow, Date.now());
      } catch {
        setIsTimeTamperingDetected(true);
      }
    }, CHECK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return { isTimeTamperingDetected };
}
