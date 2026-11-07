'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gridDisk, latLngToCell } from 'h3-js';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import { useGeospatialAnchor } from '@/hooks/use-geospatial-anchor';
import { useCountryConfig, getCountryDefaultCenter } from '@/shared/hooks/use-country-config';
import type { Trip, User } from '@/core/types';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { getCaptainCancelCooldown, type CaptainCancelCooldownState } from '../services/captain-cancel-cooldown';
import {
  playSystemNotificationSound,
  getRowAnchor,
  mapRideRequestToTrip,
  type RadarLocation,
} from '../services/driver-radar-helpers';

const DRIVER_H3_RESOLUTION = 9;
const RADAR_RING_SIZE = 5;
// حصة الكابتن من السوق: 9 ركاب كحد أقصى في قائمة ورادار الطلبات
const RADAR_FALLBACK_LIMIT = 9;
// Hard visibility cutoff — a captain further than this from the pickup point
// never sees the request at all, regardless of how few pending requests exist.
const RADAR_MAX_DISTANCE_KM = 9;
// مدة صلاحية طلب الرحلة الحتمية على الرادار: 4 دقائق (240 ثانية) كحد أقصى لمنع ظهور الطلبات القديمة
const MAX_RADAR_REQUEST_AGE_MS = 240_000;

export function useDriverRadar(user: User | null, driverStatus: string, pendingTripIds?: string[]) {
  const t = useTranslations('captainDashboard');
  // Keep the GPS watch running while 'busy' too (not just 'active') — the
  // captain's live position still needs to update during an active trip for
  // the pickup-navigation map to track them moving toward the rider.
  const { location: driverLocation } = useGeospatialAnchor(driverStatus === 'active' || driverStatus === 'busy');
  const countryConfig = useCountryConfig(user?.countryId);
  const [rawRequests, setRawRequests] = useState<Trip[]>([]);
  const [radarLockMessage, setRadarLockMessage] = useState('');
  const [cancelCooldown, setCancelCooldown] = useState<CaptainCancelCooldownState>(() => getCaptainCancelCooldown());
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
  const pendingTripIdsRef = useRef<string[]>(pendingTripIds || []);
  useEffect(() => {
    pendingTripIdsRef.current = pendingTripIds || [];
  }, [pendingTripIds]);
  const [profileAnchor, setProfileAnchor] = useState<RadarLocation | null>(null);
  const [rejectedTripIds, setRejectedTripIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem('radar_driver_rejected_requests_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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

  // Cached real GPS location from previous session in this device to eliminate fallback jumps
  const [cachedGpsLocation] = useState<RadarLocation | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('radar_captain_last_known_gps');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        if (!parsed.timestamp || Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return { lat: parsed.lat, lng: parsed.lng, source: 'cached_gps' };
        }
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (driverLocation?.lat && driverLocation?.lng && driverLocation.source === 'gps') {
      try {
        localStorage.setItem(
          'radar_captain_last_known_gps',
          JSON.stringify({ lat: driverLocation.lat, lng: driverLocation.lng, timestamp: Date.now() })
        );
      } catch {}
    }
  }, [driverLocation]);

  // The captain's true physical position (never capital city center fallback)
  const effectiveCaptainLocation = useMemo<RadarLocation | null>(() => {
    if (driverLocation && driverLocation.source !== 'fallback') return driverLocation;
    if (cachedGpsLocation) return cachedGpsLocation;
    if (user?.location) return user.location;
    if (profileAnchor) return profileAnchor;
    return null;
  }, [driverLocation, cachedGpsLocation, user?.location, profileAnchor]);

  // Display location for UI map background only
  const displayLocation = useMemo<RadarLocation | null>(() => {
    return effectiveCaptainLocation || getCountryDefaultCenter(countryConfig);
  }, [effectiveCaptainLocation, countryConfig]);

  const currentH3Cell = useMemo(() => {
    if (!effectiveCaptainLocation?.lat || !effectiveCaptainLocation?.lng) return '';
    return latLngToCell(effectiveCaptainLocation.lat, effectiveCaptainLocation.lng, DRIVER_H3_RESOLUTION);
  }, [effectiveCaptainLocation?.lat, effectiveCaptainLocation?.lng]);

  const nearbyCells = useMemo(() => {
    if (!currentH3Cell) return [];
    return gridDisk(currentH3Cell, RADAR_RING_SIZE);
  }, [currentH3Cell]);

  // --- Refs so fetch callbacks always read the latest values without being
  // listed as deps (listing them caused a new callback ref on every GPS tick,
  // which in turn re-fired the useEffect on line ~174 and created an infinite
  // API call loop).
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
  // Stable channel ID — must not include currentH3Cell because that changes on
  // every GPS tick, which would rename the channel and force a
  // unsubscribe/resubscribe on every location update = infinite API loop.
  const channelIdRef = useRef(`driver-radar-${user?.uid || 'anonymous'}-${Math.random().toString(36).slice(2)}`);

  // Stable callback: reads latest values from refs — never changes identity,
  // so it won't re-fire the mount-effects on every GPS position update.
  const checkTimeBundle = useCallback(async () => {
    const uid = userUidRef.current;
    const status = driverStatusRef.current;
    if (!uid || status !== 'active') {
      setRadarLockMessage('');
      return false;
    }

    const cooldown = getCaptainCancelCooldown();
    if (cooldown.isActive) {
      // Silent shadow-freeze: captain must not know they are frozen
      setRadarLockMessage('');
      return false;
    }

    // Captain is allowed to be available and use radar freely even with zero balance
    setRadarLockMessage('');
    return true;
  }, []); // ✅ stable — reads uid/status/t from refs

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

    // Read location/cells from refs — latest values without being deps
    const loc = effectiveCaptainLocationRef.current;
    const cells = nearbyCellsRef.current;

    // Zero-leakage: if captain's location is not resolved yet, do not query or show out-of-range requests
    if (!loc || !cells || cells.length === 0) {
      setRawRequests([]);
      return;
    }

    const earliestCreatedAt = new Date(Date.now() - MAX_RADAR_REQUEST_AGE_MS).toISOString();
    const activePendingTripIds = pendingTripIdsRef.current;

    const { data, error } = await supabase
      .from('captain_radar_requests')
      .select('*')
      .eq('status', 'PENDING')
      .gte('created_at', earliestCreatedAt)
      .in('origin_h3', cells)
      .order('created_at', { ascending: false })
      .limit(50);

    let allRows = Array.isArray(data) ? [...data] : [];

    // Also fetch any requests that this captain has an active pending offer on!
    if (activePendingTripIds && activePendingTripIds.length > 0) {
      const { data: pendingRows } = await supabase
        .from('captain_radar_requests')
        .select('*')
        .eq('status', 'PENDING')
        .in('id', activePendingTripIds);

      if (pendingRows && Array.isArray(pendingRows)) {
        const existingIds = new Set(allRows.map((r: any) => r.id));
        for (const pRow of pendingRows) {
          if (!existingIds.has(pRow.id)) {
            allRows.push(pRow);
            existingIds.add(pRow.id);
          }
        }
      }
    }

    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver radar] request fetch failed:', error);
      setRadarLockMessage(tRef.current('radarRequestsLoadFailed'));
      setRawRequests([]);
      return;
    }

    const now = Date.now();
    const mappedRequests = Array.isArray(allRows)
      ? (allRows.map(mapRideRequestToTrip).filter(Boolean) as Trip[])
      : [];

    const rankedRequests = mappedRequests
      // 1. Strict age filter: fresh requests (< 4 mins) OR requests where captain has an active pending offer
      .filter((request) => {
        const isPendingOffer = Boolean(activePendingTripIds && activePendingTripIds.includes(request.id));
        if (isPendingOffer) return true; // Keep captain's active bids visible while rider reviews!
        const createdMs = request.createdAt ? new Date(request.createdAt).getTime() : 0;
        return createdMs > 0 && (now - createdMs) <= MAX_RADAR_REQUEST_AGE_MS;
      })
      .map((request) => {
        const driverDistanceKm = estimateHaversineDistanceKm(
          loc.lat,
          loc.lng,
          request.pickupCoords.lat,
          request.pickupCoords.lng
        ) ?? Number.POSITIVE_INFINITY;
        const isInH3Disk = request.h3Index ? cells.includes(request.h3Index) : false;
        return { request, driverDistanceKm, isInH3Disk };
      })
      // 2. Strict distance cutoff: only requests with finite distance <= 9 km
      .filter(({ driverDistanceKm }) => Number.isFinite(driverDistanceKm) && driverDistanceKm <= RADAR_MAX_DISTANCE_KM)
      .sort((a, b) => {
        if (a.isInH3Disk !== b.isInH3Disk) return a.isInH3Disk ? -1 : 1;
        return a.driverDistanceKm - b.driverDistanceKm;
      })
      .slice(0, RADAR_FALLBACK_LIMIT)
      .map(({ request }) => request);

    // Play sound for any NEW requests that weren't here on the last poll
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
  }, [checkTimeBundle]); // ✅ stable — checkTimeBundle is stable, location/cells read from refs

  useEffect(() => {
    let active = true;
    const districtId = Number(user?.district);

    if (!Number.isInteger(districtId) || districtId <= 0) {
      setProfileAnchor(null);
      return;
    }

    supabase
      .from('districts')
      .select('*')
      .eq('id', districtId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver radar] district anchor fetch failed:', error);
          setProfileAnchor(null);
          return;
        }

        setProfileAnchor(getRowAnchor(data as Record<string, unknown> | null));
      });

    return () => {
      active = false;
    };
  }, [user?.district]);

  // Fetch once on mount and whenever driverStatus changes (active ↔ idle).
  useEffect(() => {
    void fetchPendingRequests();
  }, [fetchPendingRequests, driverStatus]);

  // Immediate reactive fetch as soon as GPS establishes/updates currentH3Cell
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
        },
        () => {
          void fetchPendingRequests();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_blocks',
        },
        () => {
          void fetchPendingRequests();
        },
      )
      .on(
        'broadcast',
        { event: 'RIDE_REQUEST_CREATED' },
        () => {
          void fetchPendingRequests();
        },
      )
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && (process.env.NODE_ENV !== 'production')) {
          console.warn('[Driver radar] realtime channel issue:', status);
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [driverStatus, fetchPendingRequests, user?.uid]);

  // Active radar polling every 2.5 seconds: fast, responsive updates for incoming requests
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
