'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';
import { supabase } from '@/lib/supabase-client';
import { useGeospatialAnchor } from '../use-geospatial-anchor';
import type { Trip, User } from '@/core/types';

const DRIVER_H3_RESOLUTION = 9;
const RADAR_RING_SIZE = 1;

type RideRequestRow = Record<string, unknown>;

export function useDriverRadar(user: User | null, driverStatus: string) {
  const { location: driverLocation } = useGeospatialAnchor(driverStatus === 'active');
  const [rawRequests, setRawRequests] = useState<Trip[]>([]);
  const [radarLockMessage, setRadarLockMessage] = useState('');
  const [rejectedTripIds, setRejectedTripIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem('radar_driver_rejected_requests_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const currentH3Cell = useMemo(() => {
    if (!driverLocation?.lat || !driverLocation?.lng) return '';
    return latLngToCell(driverLocation.lat, driverLocation.lng, DRIVER_H3_RESOLUTION);
  }, [driverLocation?.lat, driverLocation?.lng]);

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
      .select('profile_id,paid_minutes_remaining,bonus_minutes_remaining,active_package_name')
      .eq('profile_id', user.uid)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) console.warn('[Driver radar] wallet pre-check failed:', error);
      setRadarLockMessage('تعذر التحقق من باقة الوقت. حاول مرة أخرى بعد قليل.');
      return false;
    }

    const row = data as Record<string, unknown> | null;
    const paidMinutes = toNumber(row?.paid_minutes_remaining) || 0;
    const bonusMinutes = toNumber(row?.bonus_minutes_remaining) || 0;
    const hasMinutes = paidMinutes + bonusMinutes > 0;

    if (!row || !hasMinutes) {
      setRadarLockMessage('يرجى شحن باقة الوقت لتفعيل الرادار واستقبال الطلبات.');
      return false;
    }

    setRadarLockMessage('');
    return true;
  }, [driverStatus, user?.uid]);

  const fetchPendingRequests = useCallback(async () => {
    if (driverStatus !== 'active' || nearbyCells.length === 0) {
      setRawRequests([]);
      return;
    }

    const canUseRadar = await checkTimeBundle();
    if (!canUseRadar) {
      setRawRequests([]);
      return;
    }

    let query = supabase
      .from('captain_radar_requests')
      .select('*')
      .eq('status', 'PENDING')
      .in('origin_h3', nearbyCells)
      .order('created_at', { ascending: false })
      .limit(25);

    if (user?.countryId) {
      query = query.eq('country_id', user.countryId);
    }

    const { data, error } = await query;
    if (error) {
      if (import.meta.env.DEV) console.warn('[Driver radar] request fetch failed:', error);
      setRawRequests([]);
      return;
    }

    setRawRequests(Array.isArray(data) ? data.map(mapRideRequestToTrip).filter(Boolean) as Trip[] : []);
  }, [checkTimeBundle, driverStatus, nearbyCells, user?.countryId]);

  useEffect(() => {
    void fetchPendingRequests();
  }, [fetchPendingRequests]);

  useEffect(() => {
    if (driverStatus !== 'active' || nearbyCells.length === 0 || radarLockMessage) return;

    const channel = supabase
      .channel(`driver-radar-${user?.uid || 'anonymous'}-${currentH3Cell}`)
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
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && import.meta.env.DEV) {
          console.warn('[Driver radar] realtime channel issue:', status);
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [currentH3Cell, driverStatus, fetchPendingRequests, nearbyCells.length, radarLockMessage, user?.uid]);

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
    driverLocation,
    requests,
    rejectRequest,
    rejectedTripIds,
    driverSpeed: driverLocation?.speed || 0,
    currentDistrict: user?.district || '',
    currentH3Cell,
    radarLockMessage,
    isDisconnectionLockActive: false,
  };
}

function mapRideRequestToTrip(row: RideRequestRow): Trip | null {
  const id = stringify(row.id);
  const riderId = stringify(row.rider_id);
  const originLat = toNumber(row.origin_lat);
  const originLng = toNumber(row.origin_lng);
  const originH3 = stringify(row.origin_h3);
  if (!id || !riderId || (!originH3 && (originLat === null || originLng === null))) return null;

  const [h3Lat, h3Lng] = originH3 ? cellToLatLng(originH3) : [null, null];
  const visibleLat = originLat ?? h3Lat;
  const visibleLng = originLng ?? h3Lng;
  if (visibleLat === null || visibleLng === null) return null;

  const destinationLabel =
    stringify(row.destination_address_ar) ||
    stringify(row.destination_address_en) ||
    stringify(row.destination_address) ||
    'وجهة الراكب';

  const fare = toNumber(row.server_estimated_fare);
  const distanceKm = estimateDistanceKm(visibleLat, visibleLng, toNumber(row.destination_lat), toNumber(row.destination_lng));

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
    district: stringify(row.destination_address_ar) || stringify(row.origin_h3),
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

