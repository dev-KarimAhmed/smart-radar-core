'use client';

import { useState, useEffect, useRef } from 'react';
import { trackSovereignError } from '@/lib/error-tracker';

interface LocationState {
  location: { lat: number; lng: number } | null;
  speed: number; // in km/h
}

function calculateRawDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function useLocation(isEnabled: boolean): LocationState {
  const [state, setState] = useState<LocationState>({ location: null, speed: 0 });
  const lastPosition = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setState({ location: null, speed: 0 });
      lastPosition.current = null;
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
       setState({ location: { lat: 31.95, lng: 35.91 }, speed: 0 });
       return;
    }

    let watcherId: number;

    watcherId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const currentTimestamp = position.timestamp;

        let calculatedSpeed = 0;

        if (speed !== null && speed > 0) {
          calculatedSpeed = speed * 3.6; // Convert m/s -> km/h
        } else if (lastPosition.current) {
          const distance = calculateRawDistance(
            lastPosition.current.lat,
            lastPosition.current.lng,
            latitude,
            longitude
          );
          
          const timeDiff = (currentTimestamp - lastPosition.current.timestamp) / 1000; // in seconds

          if (timeDiff > 0) {
            const speedInKps = distance / timeDiff;
            calculatedSpeed = speedInKps * 3600; // km/h
          }
        }

        setState({
          location: { lat: latitude, lng: longitude },
          speed: Math.round(calculatedSpeed),
        });

        lastPosition.current = {
          lat: latitude,
          lng: longitude,
          timestamp: currentTimestamp,
        };
      },
      (error) => {
        trackSovereignError(error, { context: 'SovereignLocationWatcher' });
        // elegant iframe bypass
        setState({ location: { lat: 31.95, lng: 35.91 }, speed: 0 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => {
      if (watcherId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watcherId);
      }
    };
  }, [isEnabled]);

  return state;
}
