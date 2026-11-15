'use client';

import { useEffect, useMemo, useState } from 'react';
import { gridDisk, latLngToCell } from 'h3-js';
import { useGeospatialAnchor } from '@/hooks/use-geospatial-anchor';
import { useCountryConfig, getCountryDefaultCenter } from '@/shared/hooks/use-country-config';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import {
  DRIVER_H3_RESOLUTION,
  RADAR_RING_SIZE,
  getRowAnchor,
  type RadarLocation,
} from '../services/driver-radar-mapper';

export function useDriverRadarLocation(user: User | null, driverStatus: string) {
  // Keep the GPS watch running while 'busy' too (not just 'active') — the
  // captain's live position still needs to update during an active trip.
  const { location: driverLocation } = useGeospatialAnchor(driverStatus === 'active' || driverStatus === 'busy');
  const countryConfig = useCountryConfig(user?.countryId);
  const [profileAnchor, setProfileAnchor] = useState<RadarLocation | null>(null);

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
          if (process.env.NODE_ENV !== 'production') console.warn('[Driver radar] district anchor fetch failed:', error);
          setProfileAnchor(null);
          return;
        }

        setProfileAnchor(getRowAnchor(data as Record<string, unknown> | null));
      });

    return () => {
      active = false;
    };
  }, [user?.district]);

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

  return {
    driverLocation,
    effectiveCaptainLocation,
    displayLocation,
    currentH3Cell,
    nearbyCells,
  };
}
