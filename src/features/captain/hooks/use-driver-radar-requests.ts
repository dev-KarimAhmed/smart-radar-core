'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import type { Trip, User } from '@/core/types';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { getCaptainCancelCooldown, type CaptainCancelCooldownState } from '../services/captain-cancel-cooldown';
import {
  MAX_RADAR_REQUEST_AGE_MS,
  RADAR_FALLBACK_LIMIT,
  RADAR_MAX_DISTANCE_KM,
  mapRideRequestToTrip,
  playSystemNotificationSound,
  type RadarLocation,
} from '../services/driver-radar-mapper';

interface UseDriverRadarRequestsProps {
  user: User | null;
  driverStatus: string;
  pendingTripIds?: string[];
  effectiveCaptainLocation: RadarLocation | null;
  nearbyCells: string[];
  currentH3Cell: string;
}

export function useDriverRadarRequests({
  user,
  driverStatus,
  pendingTripIds,
  effectiveCaptainLocation,
  nearbyCells,
  currentH3Cell,
}: UseDriverRadarRequestsProps) {
  const t = useTranslations('captainDashboard');
  const [rawRequests, setRawRequests] = useState<Trip[]>([]);
  const [radarLockMessage, setRadarLockMessage] = useState('');
  const [cancelCooldown, setCancelCooldown] = useState<CaptainCancelCooldownState>(() => getCaptainCancelCooldown());
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
  const pendingTripIdsRef = useRef<string[]>(pendingTripIds || []);

  useEffect(() => {
    pendingTripIdsRef.current = pendingTripIds || [];
  }, [pendingTripIds]);

  useEffect(() => {
    const handleCooldownChange = () => {
      setCancelCooldown(getCaptainCancelCooldown());
    };
    window.addEventListener('captain-cancel-cooldown-changed', handleCooldownChange);
    window.addEventListener('storage', handleCooldownChange);

    const interval = window.setInterval(() => {
      const live = getCaptainCancelCooldown();
      setCancelCooldown((prev) => {
        if (prev.isActive !== live.isActive || prev.remainingSeconds !== live.remainingSeconds) {
          return live;
        }
        return prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener('captain-cancel-cooldown-changed', handleCooldownChange);
      window.removeEventListener('storage', handleCooldownChange);
      window.clearInterval(interval);
    };
  }, []);

  const effectiveCaptainLocationRef = useRef(effectiveCaptainLocation);
  effectiveCaptainLocationRef.current = effectiveCaptainLocation;
  const nearbyCellsRef = useRef(nearbyCells);
  nearbyCellsRef.current = nearbyCells;
  const driverStatusRef = useRef(driverStatus);
  driverStatusRef.current = driverStatus;
  const tRef = useRef(t);
  tRef.current = t;
  const userUidRef = useRef(user?.uid);
  userUidRef.current = user?.uid;
  const channelIdRef = useRef(`driver-radar-${user?.uid || 'anonymous'}-${Math.random().toString(36).slice(2)}`);

  const checkTimeBundle = useCallback(async () => {
    const uid = userUidRef.current;
    const status = driverStatusRef.current;
    if (!uid || status !== 'active') {
      setRadarLockMessage('');
      return false;
    }

    const cooldown = getCaptainCancelCooldown();
    if (cooldown.isActive) {
      setRadarLockMessage('');
      return false;
    }

    setRadarLockMessage('');
    return true;
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    const status = driverStatusRef.current;
    if (status !== 'active') {
      setRawRequests([]);
      setRadarLockMessage('');
      return;
    }

    const liveCooldown = getCaptainCancelCooldown();
    if (liveCooldown.isActive) {
      setRawRequests([]);
      setRadarLockMessage('');
      return;
    }

    const canUseRadar = await checkTimeBundle();
    if (!canUseRadar) {
      setRawRequests([]);
      return;
    }

    const loc = effectiveCaptainLocationRef.current;
    const cells = nearbyCellsRef.current;

    if (!loc || !cells || cells.length === 0) {
      setRawRequests([]);
      return;
    }

    const earliestCreatedAt = new Date(Date.now() - MAX_RADAR_REQUEST_AGE_MS).toISOString();
    const activePendingTripIds = pendingTripIdsRef.current;

    const { data, error } = await supabase.rpc('get_captain_radar_requests', {
      p_origin_h3: cells,
      p_since: earliestCreatedAt,
      p_limit: 50,
    });

    let allRows = Array.isArray(data)
      ? data.filter((r: any) => String(r?.status || '').toUpperCase() === 'PENDING')
      : [];

    if (activePendingTripIds && activePendingTripIds.length > 0) {
      const { data: pendingRows } = await supabase.rpc('get_captain_radar_requests', {
        p_request_ids: activePendingTripIds,
        p_limit: 50,
      });

      if (pendingRows && Array.isArray(pendingRows)) {
        const existingIds = new Set(allRows.map((r: any) => r.id));
        for (const pRow of pendingRows) {
          if (
            String((pRow as any)?.status || '').toUpperCase() === 'PENDING' &&
            !existingIds.has((pRow as any).id)
          ) {
            allRows.push(pRow);
            existingIds.add((pRow as any).id);
          }
        }
      }
    }

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver radar] request fetch failed:', error);
      setRadarLockMessage(tRef.current('radarRequestsLoadFailed'));
      setRawRequests([]);
      return;
    }

    const now = Date.now();
    const mappedRequests = Array.isArray(allRows)
      ? (allRows.map(mapRideRequestToTrip).filter(Boolean) as Trip[])
      : [];

    const rankedRequests = mappedRequests
      .filter((request) => {
        const isPendingOffer = Boolean(activePendingTripIds && activePendingTripIds.includes(request.id));
        if (isPendingOffer) return true;
        const createdMs = request.createdAt ? new Date(request.createdAt).getTime() : 0;
        return createdMs > 0 && now - createdMs <= MAX_RADAR_REQUEST_AGE_MS;
      })
      .map((request) => {
        const driverDistanceKm =
          estimateHaversineDistanceKm(loc.lat, loc.lng, request.pickupCoords.lat, request.pickupCoords.lng) ??
          Number.POSITIVE_INFINITY;
        const isInH3Disk = request.h3Index ? cells.includes(request.h3Index) : false;
        return { request, driverDistanceKm, isInH3Disk };
      })
      .filter(({ driverDistanceKm }) => Number.isFinite(driverDistanceKm) && driverDistanceKm <= RADAR_MAX_DISTANCE_KM)
      .sort((a, b) => {
        if (a.isInH3Disk !== b.isInH3Disk) return a.isInH3Disk ? -1 : 1;
        return a.driverDistanceKm - b.driverDistanceKm;
      })
      .slice(0, RADAR_FALLBACK_LIMIT)
      .map(({ request }) => request);

    let hasNewRequest = false;
    const currentIds = new Set(rankedRequests.map((req) => req.id));

    for (const req of rankedRequests) {
      if (!previousRequestIdsRef.current.has(req.id)) {
        hasNewRequest = true;
        break;
      }
    }

    if (hasNewRequest) {
      playSystemNotificationSound();
    }

    previousRequestIdsRef.current = currentIds;
    setRadarLockMessage('');
    setRawRequests(rankedRequests);
  }, [checkTimeBundle]);

  useEffect(() => {
    void fetchPendingRequests();
  }, [fetchPendingRequests, driverStatus]);

  const lastFetchedCellRef = useRef<string>('');
  useEffect(() => {
    if (driverStatus !== 'active' || !currentH3Cell) return;
    if (currentH3Cell !== lastFetchedCellRef.current) {
      lastFetchedCellRef.current = currentH3Cell;
      void fetchPendingRequests();
    }
  }, [driverStatus, currentH3Cell, fetchPendingRequests]);

  useEffect(() => {
    if (driverStatus !== 'active') return;

    const channel = supabase
      .channel(channelIdRef.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, () => {
        void fetchPendingRequests();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_blocks' }, () => {
        void fetchPendingRequests();
      })
      .on('broadcast', { event: 'RIDE_REQUEST_CREATED' }, () => {
        void fetchPendingRequests();
      })
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && process.env.NODE_ENV !== 'production') {
          console.warn('[Driver radar] realtime channel issue:', status);
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [driverStatus, fetchPendingRequests, user?.uid]);

  useEffect(() => {
    if (driverStatus !== 'active') return;
    const intervalId = window.setInterval(() => {
      void fetchPendingRequests();
    }, 2_500);
    return () => window.clearInterval(intervalId);
  }, [driverStatus, fetchPendingRequests]);

  useEffect(() => {
    if (!cancelCooldown.isActive) return;
    const interval = window.setInterval(() => {
      const nextState = getCaptainCancelCooldown();
      setCancelCooldown(nextState);
      if (!nextState.isActive) {
        void fetchPendingRequests();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [cancelCooldown.isActive, fetchPendingRequests]);

  return {
    rawRequests,
    radarLockMessage,
    cancelCooldown,
    fetchPendingRequests,
  };
}
