'use client';

import React from 'react';
import type { CaptainTripStep } from '../../state/captain-state-machine';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import { getServerTime } from '@/lib/server-time';

export function playSystemNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {
      // Browser autoplay restriction handling
    });
  } catch {
    // Ignore audio constructor errors
  }
}

export function useHandshakeCountdown(handshakeAt: number | null, step: CaptainTripStep) {
  const expiresAt = handshakeAt ? handshakeAt + SOVEREIGN_CONSTANTS.TRIP_FORGOTTEN_GRACE_MIN * 60 * 1000 : null;
  const [remainingMs, setRemainingMs] = React.useState(() => (expiresAt ? Math.max(0, expiresAt - getServerTime()) : 0));
  const alertedRef = React.useRef(false);

  React.useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return;
    }
    const update = () => {
      const rem = Math.max(0, expiresAt - getServerTime());
      setRemainingMs(rem);
      if (rem === 0 && step !== 'STARTED' && !alertedRef.current) {
        alertedRef.current = true;
        playSystemNotificationSound();
      }
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, step]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds, isRunningLow: remainingMs > 0 && remainingMs <= 5 * 60 * 1000 };
}
