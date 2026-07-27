'use client';

import { useCallback, useState } from 'react';
import type { Trip, User as DriverUser, TripStatus } from '@/core/types';

/**
 * Deprecated compatibility shim.
 *
 * The rider dashboard now receives trip/request state from Supabase Realtime
 * inside `RiderViewTab`. This hook intentionally mounts no Firebase listeners.
 */
export function useRiderTripListener(_user: DriverUser | null) {
  const [internalStatus, setInternalStatus] = useState<TripStatus>('idle');

  const resetState = useCallback(() => {
    setInternalStatus('idle');
  }, []);

  return {
    trip: null as Trip | null,
    acceptedDriver: null as DriverUser | null,
    internalStatus,
    setInternalStatus,
    resetState,
    pulsedDrivers: [] as Array<DriverUser & { distance: number }>,
    isPulsing: false,
  };
}
