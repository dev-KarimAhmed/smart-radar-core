'use client';

import * as React from 'react';
import { latLngToCell } from 'h3-js';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

interface CaptainPulseLocation {
  lat: number;
  lng: number;
  source?: 'gps' | 'pwa_share' | 'fallback' | string;
}

interface UseCaptainLocationPulseInput {
  user: User | null;
  driverStatus: DriverStatus;
  location: CaptainPulseLocation | null;
}

const CAPTAIN_PULSE_INTERVAL_MS = 15_000;
const CAPTAIN_H3_RESOLUTION = 9;

export function useCaptainLocationPulse({ user, driverStatus, location }: UseCaptainLocationPulseInput) {
  const [lastPulseAt, setLastPulseAt] = React.useState<number | null>(null);
  const [lastPulseH3, setLastPulseH3] = React.useState<string | null>(null);
  const [lastPulseError, setLastPulseError] = React.useState<unknown>(null);
  const inFlightRef = React.useRef(false);

  const shouldPulse =
    user?.role === 'driver' &&
    driverStatus === 'active' &&
    !!location &&
    location.source !== 'fallback' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng);

  const pulse = React.useCallback(async () => {
    if (!shouldPulse || !location || inFlightRef.current) return;

    inFlightRef.current = true;
    const h3Cell = latLngToCell(location.lat, location.lng, CAPTAIN_H3_RESOLUTION);

    try {
      const { error } = await supabase.rpc('pulse_captain_location', {
        p_lat: Number(location.lat),
        p_lng: Number(location.lng),
        p_h3_cell: h3Cell,
      });

      if (error) {
        const fallback = await supabase.rpc('pulse_captain_location', {
          p_lat: Number(location.lat),
          p_lng: Number(location.lng),
          p_h3: h3Cell,
        });

        if (fallback.error) throw fallback.error;
      }

      setLastPulseAt(Date.now());
      setLastPulseH3(h3Cell);
      setLastPulseError(null);
    } catch (error) {
      setLastPulseError(error);
      if (import.meta.env.DEV) {
        console.warn('[Captain Location Pulse]', error);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [location, shouldPulse]);

  React.useEffect(() => {
    if (!shouldPulse) return;

    void pulse();
    const interval = window.setInterval(() => void pulse(), CAPTAIN_PULSE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [pulse, shouldPulse]);

  return {
    lastPulseAt,
    lastPulseH3,
    lastPulseError,
    isPulseActive: shouldPulse,
  };
}
