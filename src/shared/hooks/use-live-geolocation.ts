'use client';

import React from 'react';
import {
  getLastKnownLocation,
  saveLastKnownLocation,
  cachedLastKnownLocation,
  MIN_GPS_DISTANCE_CHANGE_DEG,
  type LiveGeolocationPoint,
  type LiveGeolocationResult,
  type LiveGeolocationStatus,
} from '../services/last-known-location';

export * from '../services/last-known-location';

/**
 * Watches the browser's live GPS position (`navigator.geolocation.watchPosition`),
 * falling back to `fallbackLocation` when geolocation is unsupported,
 * permission is denied, or no fix has arrived yet. `refresh()` re-requests a
 * fix (for a "use my location" retry action). While not live, the reported
 * location tracks `fallbackLocation` if it changes.
 */
export function useLiveGeolocation({ fallbackLocation }: { fallbackLocation: LiveGeolocationPoint }): LiveGeolocationResult {
  const cleanupWatchRef = React.useRef<(() => void) | null>(null);
  const lastCoordsRef = React.useRef<LiveGeolocationPoint | null>(null);
  const initialSaved = getLastKnownLocation();
  const [location, setLocation] = React.useState<LiveGeolocationPoint>(
    initialSaved || fallbackLocation
  );
  const [status, setStatus] = React.useState<LiveGeolocationStatus>(initialSaved ? 'live' : 'locating');
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
      saveLastKnownLocation(newPoint);
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
      }
      setStatus('denied');
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('system-location-granted'));
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('system-location-denied'));
          }
          return;
        }
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              didResolve = true;
              updateLocation(pos.coords.latitude, pos.coords.longitude);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('system-location-granted'));
              }
            },
            (err2) => {
              if (err2.code === err2.PERMISSION_DENIED) {
                setStatus('denied');
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('system-location-denied'));
                }
              }
            },
            {
              enableHighAccuracy: false,
              maximumAge: 300000,
              timeout: 10000,
            }
          );
        }
        if (!didResolve && !cachedLastKnownLocation) {
          setLocation({ lat: fallbackLat, lng: fallbackLng });
          setStatus('fallback');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      }
    );

    // Continuous watch stream
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        didResolve = true;
        updateLocation(position.coords.latitude, position.coords.longitude);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('system-location-granted'));
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('system-location-denied'));
          }
          return;
        }
        if (!didResolve && !cachedLastKnownLocation) {
          setLocation({ lat: fallbackLat, lng: fallbackLng });
          setStatus('fallback');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 15000,
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
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
        if (perm.state === 'denied') {
          setStatus('denied');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('system-location-denied'));
          }
        }
        perm.onchange = () => {
          if (perm.state === 'denied') {
            setStatus('denied');
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('system-location-denied'));
            }
          } else if (perm.state === 'granted') {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('system-location-granted'));
            }
            refresh();
          }
        };
      }).catch(() => {});
    }
  }, [refresh]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleRequest = () => refresh();
    window.addEventListener('request-live-location', handleRequest);
    return () => window.removeEventListener('request-live-location', handleRequest);
  }, [refresh]);

  React.useEffect(() => {
    refresh();
    return () => cleanupWatchRef.current?.();
  }, [refresh]);

  return { location, status, refresh };
}
