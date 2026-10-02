'use client';

import React from 'react';

export type LiveGeolocationStatus = 'locating' | 'live' | 'fallback' | 'denied';

export interface LiveGeolocationPoint {
  lat: number;
  lng: number;
}

export interface LiveGeolocationResult {
  location: LiveGeolocationPoint;
  status: LiveGeolocationStatus;
  refresh: () => void;
}

/**
 * Watches the browser's live GPS position (`navigator.geolocation.watchPosition`),
 * falling back to `fallbackLocation` when geolocation is unsupported,
 * permission is denied, or no fix has arrived yet. `refresh()` re-requests a
 * fix (for a "use my location" retry action). While not live, the reported
 * location tracks `fallbackLocation` if it changes.
 */
const MIN_GPS_DISTANCE_CHANGE_DEG = 0.00008;
const LAST_KNOWN_LOCATION_STORAGE_KEY = 'smart_radar_last_known_location';

function isDummyCairo(lat: number, lng: number): boolean {
  return Math.abs(lat - 30.0444) < 0.001 && Math.abs(lng - 31.2357) < 0.001;
}

const GPS_STORAGE_KEY = 'radar_last_known_gps';

let cachedLastKnownLocation: LiveGeolocationPoint | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(GPS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && parsed.lat !== 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return null;
})();

export function getLastKnownLocation(): LiveGeolocationPoint | null {
  if (cachedLastKnownLocation && !isDummyCairo(cachedLastKnownLocation.lat, cachedLastKnownLocation.lng)) {
    return cachedLastKnownLocation;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(LAST_KNOWN_LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          typeof parsed.lat === 'number' &&
          typeof parsed.lng === 'number' &&
          Number.isFinite(parsed.lat) &&
          Number.isFinite(parsed.lng) &&
          (parsed.lat !== 0 || parsed.lng !== 0) &&
          !isDummyCairo(parsed.lat, parsed.lng)
        ) {
          cachedLastKnownLocation = { lat: parsed.lat, lng: parsed.lng };
          return cachedLastKnownLocation;
        }
      }
    } catch {
      // Storage unavailable or parsing error
    }
  }
  return null;
}

export function useLiveGeolocation({ fallbackLocation }: { fallbackLocation: LiveGeolocationPoint }): LiveGeolocationResult {
  const cleanupWatchRef = React.useRef<(() => void) | null>(null);
  const lastCoordsRef = React.useRef<LiveGeolocationPoint | null>(null);
  const [location, setLocation] = React.useState<LiveGeolocationPoint>(
    initialSaved || fallbackLocation
  );
  const [status, setStatus] = React.useState<LiveGeolocationStatus>('locating');
  const fallbackLat = fallbackLocation.lat;
  const fallbackLng = fallbackLocation.lng;

  const updateLocation = React.useCallback((nextLat: number, nextLng: number) => {
    const last = lastCoordsRef.current;
    if (
      !last ||
      Math.abs(nextLat - last.lat) > MIN_GPS_DISTANCE_CHANGE_DEG ||
      Math.abs(nextLng - last.lng) > MIN_GPS_DISTANCE_CHANGE_DEG
    ) {
      const newPoint = { lat: nextLat, lng: nextLng };
      lastCoordsRef.current = newPoint;
      cachedLastKnownLocation = newPoint;
      try {
        window.localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(newPoint));
      } catch {}
      setLocation(newPoint);
      setStatus('live');
    } else {
      setStatus('live');
    }
  }, []);

  const refresh = React.useCallback(() => {
    cleanupWatchRef.current?.();
    cleanupWatchRef.current = null;

    if (!('geolocation' in navigator)) {
      if (!cachedLastKnownLocation) {
        setLocation({ lat: fallbackLat, lng: fallbackLng });
        setStatus('fallback');
      }
      return;
    }

    let didResolve = false;
    if (!cachedLastKnownLocation) {
      setStatus('locating');
    }

    // Direct immediate fix request
    navigator.geolocation.getCurrentPosition(
      (position) => {
        didResolve = true;
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        if (!didResolve && !cachedLastKnownLocation) {
          setLocation({ lat: fallbackLat, lng: fallbackLng });
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'fallback');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // Continuous watch stream
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        didResolve = true;
        setStatus('live');

        if (
          !last ||
          Math.abs(nextLat - last.lat) > MIN_GPS_DISTANCE_CHANGE_DEG ||
          Math.abs(nextLng - last.lng) > MIN_GPS_DISTANCE_CHANGE_DEG
        ) {
          lastCoordsRef.current = { lat: nextLat, lng: nextLng };
          cachedLastKnownLocation = lastCoordsRef.current;
          setLocation({
            lat: nextLat,
            lng: nextLng,
          });
        }
      },
      (error) => {
        if (!didResolve && !cachedLastKnownLocation) {
          setLocation({ lat: fallbackLat, lng: fallbackLng });
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'fallback');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );

    cleanupWatchRef.current = () => navigator.geolocation.clearWatch(watchId);
  }, [fallbackLat, fallbackLng, updateLocation]);

  React.useEffect(() => {
    if (status === 'live' || status === 'locating') return;
    setLocation((prev) => {
      if (prev.lat === fallbackLat && prev.lng === fallbackLng) return prev;
      return { lat: fallbackLat, lng: fallbackLng };
    });
  }, [fallbackLat, fallbackLng, status]);

  React.useEffect(() => {
    refresh();
    return () => cleanupWatchRef.current?.();
  }, [refresh]);

  return { location, status, refresh };
}
