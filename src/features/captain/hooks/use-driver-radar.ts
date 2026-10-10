'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cellToLatLng, gridDisk, isValidCell, latLngToCell } from 'h3-js';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import { useGeospatialAnchor } from '@/hooks/use-geospatial-anchor';
import { useCountryConfig, getCountryDefaultCenter } from '@/shared/hooks/use-country-config';
import type { Trip, User } from '@/core/types';
import {
  buildGoogleMapsUrl,
  estimateHaversineDistanceKm,
  isValidCoordinatePair,
  normalizeExternalMapUrl,
} from '../services/ride-location';

const DRIVER_H3_RESOLUTION = 9;
const RADAR_RING_SIZE = 5;
// حصة الكابتن من السوق: 9 ركاب كحد أقصى في قائمة ورادار الطلبات
const RADAR_FALLBACK_LIMIT = 9;
// Hard visibility cutoff — a captain further than this from the pickup point
// never sees the request at all, regardless of how few pending requests exist.
const RADAR_MAX_DISTANCE_KM = 9;
// مدة صلاحية طلب الرحلة الحتمية على الرادار: 4 دقائق (240 ثانية) كحد أقصى لمنع ظهور الطلبات القديمة
const MAX_RADAR_REQUEST_AGE_MS = 240_000;

type RideRequestRow = Record<string, unknown>;
type RadarLocation = { lat: number; lng: number; speed?: number; source?: string };

function playSystemNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {});
  } catch {}
}

export function useDriverRadar(user: User | null, driverStatus: string) {
  const t = useTranslations('captainDashboard');
  // Keep the GPS watch running while 'busy' too (not just 'active') — the
  // captain's live position still needs to update during an active trip for
  // the pickup-navigation map to track them moving toward the rider.
  const { location: driverLocation } = useGeospatialAnchor(driverStatus === 'active' || driverStatus === 'busy');
  const countryConfig = useCountryConfig(user?.countryId);
  const [rawRequests, setRawRequests] = useState<Trip[]>([]);
  const [radarLockMessage, setRadarLockMessage] = useState('');
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
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

    const { data, error } = await supabase.rpc('get_captain_wallet_status');

    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver radar] wallet pre-check failed:', error);
      setRadarLockMessage(tRef.current('radarWalletCheckFailed'));
      return false;
    }

    const walletStatus = data as { has_active_bundle?: boolean; balance?: number; paid_minutes_remaining?: number; bonus_minutes_remaining?: number } | null;
    const totalMinutes = Number(walletStatus?.paid_minutes_remaining || 0) + Number(walletStatus?.bonus_minutes_remaining || 0);
    const hasActiveBundle = walletStatus?.has_active_bundle === true || totalMinutes > 0;
    const cashBalance = Number(walletStatus?.balance || 0);

    if (!hasActiveBundle) {
      setRadarLockMessage(
        cashBalance > 0
          ? tRef.current('radarAllocationRequired')
          : tRef.current('radarBundleRequired')
      );
      return false;
    }

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

    const { data, error } = await supabase
      .from('captain_radar_requests')
      .select('*')
      .eq('status', 'PENDING')
      .gte('created_at', earliestCreatedAt)
      .in('origin_h3', cells)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver radar] request fetch failed:', error);
      setRadarLockMessage(tRef.current('radarRequestsLoadFailed'));
      setRawRequests([]);
      return;
    }

    const now = Date.now();
    const mappedRequests = Array.isArray(data)
      ? (data.map(mapRideRequestToTrip).filter(Boolean) as Trip[])
      : [];

    const rankedRequests = mappedRequests
      // 1. Strict age filter: trip must be created within last 4 minutes (never show old zombie trips)
      .filter((request) => {
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
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && (process.env.NODE_ENV !== 'production')) {
          console.warn('[Driver radar] realtime channel issue:', status);
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [driverStatus, fetchPendingRequests, user?.uid]);

  // Belt-and-suspenders poll every 10 seconds: cleans up expired requests and syncs radar
  useEffect(() => {
    if (driverStatus !== 'active') return;
    const intervalId = window.setInterval(() => {
      void fetchPendingRequests();
    }, 10_000);
    return () => window.clearInterval(intervalId);
  }, [driverStatus, fetchPendingRequests]);

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
    return rawRequests.filter((request) => !rejectedTripIds.includes(request.id));
  }, [rawRequests, rejectedTripIds]);

  return {
    driverLocation: displayLocation,
    requests,
    rejectRequest,
    rejectedTripIds,
    driverSpeed: effectiveCaptainLocation?.speed || 0,
    currentDistrict: user?.district || '',
    currentH3Cell,
    radarLockMessage,
    isDisconnectionLockActive: false,
  };
}

function getRowAnchor(row: Record<string, unknown> | null): RadarLocation | null {
  if (!row) return null;

  const lat = toNumber(row.lat) ?? toNumber(row.latitude) ?? toNumber(row.anchor_lat) ?? toNumber(row.center_lat) ?? toNumber(row.centroid_lat) ?? toNumber(row.location_lat);
  const lng = toNumber(row.lng) ?? toNumber(row.lon) ?? toNumber(row.longitude) ?? toNumber(row.anchor_lng) ?? toNumber(row.anchor_lon) ?? toNumber(row.center_lng) ?? toNumber(row.centroid_lng) ?? toNumber(row.location_lng);

  if (lat === null || lng === null) return null;
  return { lat, lng, source: 'profile' };
}

function mapRideRequestToTrip(row: RideRequestRow): Trip | null {
  const id = stringify(row.id);
  if (!id) return null;

  const riderId = stringify(row.rider_id) || `pending-rider-${id}`;
  const originLat = toNumber(row.origin_lat);
  const originLng = toNumber(row.origin_lng);
  const originH3 = stringify(row.h3_cell) || stringify(row.origin_h3);
  const hasExactOrigin = isValidCoordinatePair(originLat, originLng);
  const hasValidOriginH3 = Boolean(originH3 && isValidCell(originH3));
  if (!hasExactOrigin && !hasValidOriginH3) return null;

  const [h3Lat, h3Lng] = hasValidOriginH3 ? cellToLatLng(originH3) : [null, null];
  const visibleLat = hasExactOrigin ? originLat : h3Lat;
  const visibleLng = hasExactOrigin ? originLng : h3Lng;
  if (!isValidCoordinatePair(visibleLat, visibleLng)) return null;

  const destinationLabel =
    stringify(row.destination_address_ar) ||
    stringify(row.destination_address_en) ||
    stringify(row.destination_address) ||
    'وجهة الراكب';

  const fare = toNumber(row.server_fare) ?? toNumber(row.server_estimated_fare);
  const destinationLat = toNumber(row.destination_lat);
  const destinationLng = toNumber(row.destination_lng);
  const storedDistanceKm = firstPositiveNumber(row.estimated_distance_km, row.route_distance_km, row.trip_distance_km);
  const distanceKm = storedDistanceKm ?? (
    hasExactOrigin ? estimateHaversineDistanceKm(originLat, originLng, destinationLat, destinationLng) : null
  );
  const storedDurationMinutes = firstPositiveNumber(row.estimated_duration_minutes, row.route_duration_minutes, row.trip_duration_minutes);
  const exactPickupMapUrl = normalizeExternalMapUrl(row.origin_google_maps_url);
  const safeVisibleLat = visibleLat as number;
  const safeVisibleLng = visibleLng as number;
  const safeOriginLat = originLat as number;
  const safeOriginLng = originLng as number;
  const pickupGoogleMapsUrl = exactPickupMapUrl || (hasExactOrigin ? buildGoogleMapsUrl(safeOriginLat, safeOriginLng) : null) || undefined;

  return {
    id,
    riderId,
    status: 'searching',
    pickupCoords: { lat: safeVisibleLat, lng: safeVisibleLng },
    exactPickupCoords: hasExactOrigin ? { lat: safeOriginLat, lng: safeOriginLng } : undefined,
    obfuscatedPickupCoords: hasExactOrigin ? undefined : { lat: safeVisibleLat, lng: safeVisibleLng },
    pickupLabel: stringify(row.origin_address),
    pickupGoogleMapsUrl,
    pickupLocationIsApproximate: !exactPickupMapUrl || !hasExactOrigin,
    h3Index: originH3,
    gridId: originH3 || id,
    dropoff: destinationLabel,
    // Left undefined rather than 0 when the rider has never been rated: the card has to be
    // able to tell "no rating yet" from "rated badly".
    riderRating: toNumber(row.rider_rating) ?? undefined,
    riderRatingCount: toNumber(row.rider_rating_count) ?? undefined,
    riderCompletedTrips: toNumber(row.rider_completed_trips) ?? undefined,
    riderFavoritedMe: row.rider_favorited_me === true,
    estimatedDistance: distanceKm ?? undefined,
    estimatedTime: storedDurationMinutes ?? (distanceKm ? Math.max(1, Math.round(distanceKm * 2.5)) : undefined),
    seats: 1,
    offerPrice: fare ?? undefined,
    createdAt: stringify(row.created_at),
    district: destinationLabel || originH3,
    pricingPreference: (['APP', 'TAXI', 'FREE'].includes(String(row.pricing_preference || '').toUpperCase())
      ? String(row.pricing_preference).toUpperCase() as 'APP' | 'TAXI' | 'FREE'
      : null),
  };
}

function stringify(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstPositiveNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
}
