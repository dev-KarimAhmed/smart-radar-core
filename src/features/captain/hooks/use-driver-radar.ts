'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';
import { supabase } from '@/lib/supabase-client';
import { useGeospatialAnchor } from '@/hooks/use-geospatial-anchor';
import type { Trip, User } from '@/core/types';

const DRIVER_H3_RESOLUTION = 9;
const RADAR_RING_SIZE = 5;
const RADAR_FALLBACK_LIMIT = 25;

type RideRequestRow = Record<string, unknown>;
type RadarLocation = { lat: number; lng: number; speed?: number; source?: string };

export function useDriverRadar(user: User | null, driverStatus: string) {
  const { location: driverLocation } = useGeospatialAnchor(driverStatus === 'active');
  const [rawRequests, setRawRequests] = useState<Trip[]>([]);
  const [radarLockMessage, setRadarLockMessage] = useState('');
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

  const radarLocation = useMemo<RadarLocation | null>(() => {
    return driverLocation || user?.location || profileAnchor;
  }, [driverLocation, profileAnchor, user?.location]);

  const currentH3Cell = useMemo(() => {
    if (!radarLocation?.lat || !radarLocation?.lng) return '';
    return latLngToCell(radarLocation.lat, radarLocation.lng, DRIVER_H3_RESOLUTION);
  }, [radarLocation?.lat, radarLocation?.lng]);

  const nearbyCells = useMemo(() => {
    if (!currentH3Cell) return [];
    return gridDisk(currentH3Cell, RADAR_RING_SIZE);
  }, [currentH3Cell]);

  const checkTimeBundle = useCallback(async () => {
    if (!user?.uid || driverStatus !== 'active') {
      setRadarLockMessage('');
      return false;
    }

    const { data, error } = await supabase
      .from('wallet_accounts')
      .select('profile_id,paid_minutes_remaining,bonus_minutes_remaining,active_package_name,balance')
      .eq('profile_id', user.uid)
      .maybeSingle();

    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver radar] wallet pre-check failed:', error);
      setRadarLockMessage('تعذر التحقق من باقة الوقت. حاول مرة أخرى بعد قليل.');
      return false;
    }

    const row = data as Record<string, unknown> | null;
    const balance = toNumber(row?.balance) || 0;

    // Time conversion logic
    const TEST_PRICE_PER_HOUR = 200; 
    const totalPaidHours = balance / TEST_PRICE_PER_HOUR;
    const paidHours = Math.floor(totalPaidHours);
    const paidMinutesCalculated = Math.round((totalPaidHours - paidHours) * 60);
    const paidMinutes = paidHours * 60 + paidMinutesCalculated;

    const totalExtraHours = balance > 0 ? paidHours * 0.4 : 0;
    const extraHours = Math.floor(totalExtraHours);
    const extraMinutesCalculated = Math.round((totalExtraHours - extraHours) * 60);
    const bonusMinutes = extraHours * 60 + extraMinutesCalculated;

    const hasMinutes = paidMinutes + bonusMinutes > 0;

    if (!row || !hasMinutes) {
      setRadarLockMessage('يرجى شحن باقة الوقت لتفعيل الرادار واستقبال الطلبات.');
      return false;
    }

    setRadarLockMessage('');
    return true;
  }, [driverStatus, user?.uid]);

  const fetchPendingRequests = useCallback(async () => {
    if (driverStatus !== 'active') {
      setRawRequests([]);
      setRadarLockMessage('');
      return;
    }

    const canUseRadar = await checkTimeBundle();
    if (!canUseRadar) {
      setRawRequests([]);
      return;
    }

    const query = supabase
      .from('captain_radar_requests')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data, error } = await query;
    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver radar] request fetch failed:', error);
      setRadarLockMessage('تعذر تحميل الطلبات القريبة من الخادم. تحقق من صلاحيات قاعدة البيانات ثم حاول مرة أخرى.');
      setRawRequests([]);
      return;
    }

    const mappedRequests = Array.isArray(data)
      ? data.map(mapRideRequestToTrip).filter(Boolean) as Trip[]
      : [];

    const rankedRequests = mappedRequests
      .map((request) => {
        const driverDistanceKm = radarLocation
          ? estimateDistanceKm(radarLocation.lat, radarLocation.lng, request.pickupCoords.lat, request.pickupCoords.lng)
          : Number.POSITIVE_INFINITY;
        const isInH3Disk = request.h3Index ? nearbyCells.includes(request.h3Index) : false;
        return { request, driverDistanceKm, isInH3Disk };
      })
      .sort((a, b) => {
        if (a.isInH3Disk !== b.isInH3Disk) return a.isInH3Disk ? -1 : 1;
        return a.driverDistanceKm - b.driverDistanceKm;
      })
      .slice(0, RADAR_FALLBACK_LIMIT)
      .map(({ request }) => request);

    setRadarLockMessage('');
    setRawRequests(rankedRequests);
  }, [checkTimeBundle, driverStatus, nearbyCells, radarLocation]);

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

  useEffect(() => {
    void fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    if (driverStatus !== 'active' || radarLockMessage) return;

    const channel = supabase
      .channel(`driver-radar-${user?.uid || 'anonymous'}-${currentH3Cell || 'country'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: 'status=eq.PENDING',
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
  }, [currentH3Cell, driverStatus, fetchPendingRequests, radarLockMessage, user?.uid]);

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
    driverLocation: radarLocation,
    requests,
    rejectRequest,
    rejectedTripIds,
    driverSpeed: radarLocation?.speed || 0,
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
  if (!originH3 && (originLat === null || originLng === null)) return null;

  const [h3Lat, h3Lng] = originH3 ? cellToLatLng(originH3) : [null, null];
  const visibleLat = originLat ?? h3Lat;
  const visibleLng = originLng ?? h3Lng;
  if (visibleLat === null || visibleLng === null) return null;

  const destinationLabel =
    stringify(row.destination_address_ar) ||
    stringify(row.destination_address_en) ||
    stringify(row.destination_address) ||
    'وجهة الراكب';

  const fare = toNumber(row.server_fare) ?? toNumber(row.server_estimated_fare);
  const destinationLat = toNumber(row.destination_lat);
  const destinationLng = toNumber(row.destination_lng);
  const distanceKm = estimateDistanceKm(visibleLat, visibleLng, destinationLat, destinationLng);

  return {
    id,
    riderId,
    status: 'searching',
    pickupCoords: { lat: visibleLat, lng: visibleLng },
    exactPickupCoords: originLat !== null && originLng !== null ? { lat: originLat, lng: originLng } : undefined,
    obfuscatedPickupCoords: originLat === null || originLng === null ? { lat: visibleLat, lng: visibleLng } : undefined,
    h3Index: originH3,
    gridId: originH3 || id,
    dropoff: destinationLabel,
    estimatedDistance: distanceKm,
    estimatedTime: Math.max(1, Math.round(distanceKm * 2.5)),
    seats: 1,
    offerPrice: fare ?? undefined,
    createdAt: stringify(row.created_at),
    district: destinationLabel || originH3,
  };
}

function estimateDistanceKm(originLat: number, originLng: number, destLat: number | null, destLng: number | null) {
  if (destLat === null || destLng === null) return 0;
  const radiusKm = 6371;
  const dLat = degreesToRadians(destLat - originLat);
  const dLng = degreesToRadians(destLng - originLng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(degreesToRadians(originLat)) * Math.cos(degreesToRadians(destLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round((2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 10) / 10;
}

function degreesToRadians(value: number) {
  return value * Math.PI / 180;
}

function stringify(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
