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
export function useLiveGeolocation({ fallbackLocation }: { fallbackLocation: LiveGeolocationPoint }): LiveGeolocationResult {
  const cleanupWatchRef = React.useRef<(() => void) | null>(null);
  const [location, setLocation] = React.useState<LiveGeolocationPoint>(fallbackLocation);
  const [status, setStatus] = React.useState<LiveGeolocationStatus>('locating');
  const fallbackLat = fallbackLocation.lat;
  const fallbackLng = fallbackLocation.lng;

  const refresh = React.useCallback(() => {
    cleanupWatchRef.current?.();
    cleanupWatchRef.current = null;

    if (!('geolocation' in navigator)) {
      setLocation({ lat: fallbackLat, lng: fallbackLng });
      setStatus('fallback');
      return;
    }

    let didResolve = false;
    setStatus('locating');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        didResolve = true;
        setStatus('live');
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (didResolve) return;
        setLocation({ lat: fallbackLat, lng: fallbackLng });
        setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'fallback');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000,
      },
    );

    cleanupWatchRef.current = () => navigator.geolocation.clearWatch(watchId);
  }, [fallbackLat, fallbackLng]);

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
