'use client';

import { useCallback, useMemo, useState } from 'react';
import type { User } from '@/core/types';
import { getCaptainCancelCooldown } from '../services/captain-cancel-cooldown';
import { useDriverRadarLocation } from './use-driver-radar-location';
import { useDriverRadarRequests } from './use-driver-radar-requests';

export function useDriverRadar(user: User | null, driverStatus: string, pendingTripIds?: string[]) {
  const {
    effectiveCaptainLocation,
    displayLocation,
    currentH3Cell,
    nearbyCells,
  } = useDriverRadarLocation(user, driverStatus);

  const {
    rawRequests,
    radarLockMessage,
    cancelCooldown,
  } = useDriverRadarRequests({
    user,
    driverStatus,
    pendingTripIds,
    effectiveCaptainLocation,
    nearbyCells,
    currentH3Cell,
  });

  const [rejectedTripIds, setRejectedTripIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem('radar_driver_rejected_requests_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const rejectRequest = useCallback((tripId: string) => {
    setRejectedTripIds((prev) => {
      const next = [...new Set([...prev, tripId])];
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('radar_driver_rejected_requests_v1', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const requests = useMemo(() => {
    const live = getCaptainCancelCooldown();
    if (live.isActive || cancelCooldown.isActive) return [];
    return rawRequests.filter((request) => !rejectedTripIds.includes(request.id));
  }, [cancelCooldown.isActive, rawRequests, rejectedTripIds]);

  return {
    driverLocation: displayLocation,
    requests,
    rejectRequest,
    rejectedTripIds,
    driverSpeed: effectiveCaptainLocation?.speed || 0,
    currentDistrict: user?.district || '',
    currentH3Cell,
    radarLockMessage,
    cancelCooldown,
    isDisconnectionLockActive: false,
  };
}
