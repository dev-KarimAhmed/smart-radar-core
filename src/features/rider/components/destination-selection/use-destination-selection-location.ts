'use client';

import React from 'react';
import type { RiderLocationStatus } from '../rider-map';

export function useDestinationSelectionLocation(locationStatus?: RiderLocationStatus) {
  const [isLocationDisabled, setIsLocationDisabled] = React.useState(
    locationStatus === 'denied'
  );

  React.useEffect(() => {
    if (locationStatus === 'denied') {
      setIsLocationDisabled(true);
    } else if (locationStatus === 'live' || locationStatus === 'locating') {
      setIsLocationDisabled(false);
    }
  }, [locationStatus]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((res) => {
        if (res.state === 'denied') {
          setIsLocationDisabled(true);
        } else if (res.state === 'granted') {
          setIsLocationDisabled(false);
        }
        res.onchange = () => {
          if (res.state === 'denied') {
            setIsLocationDisabled(true);
          } else if (res.state === 'granted') {
            setIsLocationDisabled(false);
          }
        };
      }).catch(() => undefined);
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setIsLocationDisabled(false),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setIsLocationDisabled(true);
            window.dispatchEvent(new CustomEvent('system-location-denied'));
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }

    const handleDenied = () => setIsLocationDisabled(true);
    const handleGranted = () => setIsLocationDisabled(false);

    window.addEventListener('system-location-denied', handleDenied);
    window.addEventListener('system-location-granted', handleGranted);

    return () => {
      window.removeEventListener('system-location-denied', handleDenied);
      window.removeEventListener('system-location-granted', handleGranted);
    };
  }, []);

  const handleRequestLocation = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('request-live-location'));
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setIsLocationDisabled(false);
            window.dispatchEvent(new CustomEvent('system-location-granted'));
            window.dispatchEvent(new CustomEvent('request-live-location'));
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              setIsLocationDisabled(true);
              window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
              window.dispatchEvent(new CustomEvent('system-location-denied'));
            } else {
              navigator.geolocation.getCurrentPosition(
                () => {
                  setIsLocationDisabled(false);
                  window.dispatchEvent(new CustomEvent('system-location-granted'));
                  window.dispatchEvent(new CustomEvent('request-live-location'));
                },
                (err2) => {
                  if (err2.code === err2.PERMISSION_DENIED) {
                    setIsLocationDisabled(true);
                    window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
                    window.dispatchEvent(new CustomEvent('system-location-denied'));
                  }
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
              );
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    }
  }, []);

  return {
    isLocationDisabled,
    handleRequestLocation,
  };
}
