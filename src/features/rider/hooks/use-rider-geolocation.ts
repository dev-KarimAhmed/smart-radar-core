import React from 'react';
import { latLngToCell } from 'h3-js';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderLocation, RiderLocationStatus, RiderLocationUpdate } from '../components/rider-map';

const H3_RIDER_REQUEST_RESOLUTION = 9;
const INITIAL_RIDER_LOCATION: RiderLocation = { lat: 30.0444, lng: 31.2357 };

/**
 * Tracks the rider's live location as reported by `RiderMap` (which owns the
 * actual GPS watch via `useLiveGeolocation`) and reverse-geocodes it into a
 * display address, debounced 800ms after each move.
 */
export function useRiderGeolocation(language: AppLanguage) {
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(INITIAL_RIDER_LOCATION);
  const [riderH3Cell, setRiderH3Cell] = React.useState(latLngToCell(INITIAL_RIDER_LOCATION.lat, INITIAL_RIDER_LOCATION.lng, H3_RIDER_REQUEST_RESOLUTION));
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('fallback');
  const [currentAddressName, setCurrentAddressName] = React.useState<string>('');
  const [isGeocoding, setIsGeocoding] = React.useState<boolean>(false);

  const handleLocationChange = React.useCallback((payload: RiderLocationUpdate) => {
    setRiderLocation(payload.location);
    setRiderH3Cell(payload.h3Cell);
    setLocationStatus(payload.status);
  }, []);

  React.useEffect(() => {
    if (!riderLocation.lat || !riderLocation.lng) return;

    let active = true;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${riderLocation.lat}&lon=${riderLocation.lng}&format=json&accept-language=${language}`
        );
        if (!res.ok) throw new Error('Geocoding fail');
        const data = await res.json();
        if (active && data) {
          const addr = data.address || {};
          const localPart =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.town ||
            addr.city_district ||
            addr.road ||
            '';
          const cityPart =
            addr.city ||
            addr.state ||
            addr.governorate ||
            '';

          const separator = language === 'ar' ? '، ' : ', ';
          let displayAddress = '';
          if (localPart && cityPart && localPart !== cityPart) {
            displayAddress = `${localPart}${separator}${cityPart}`;
          } else {
            displayAddress = localPart || cityPart || data.display_name || '';
          }
          setCurrentAddressName(displayAddress);
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err);
      } finally {
        if (active) setIsGeocoding(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAddress();
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [riderLocation.lat, riderLocation.lng, language]);

  return {
    riderLocation,
    riderH3Cell,
    locationStatus,
    currentAddressName,
    isGeocoding,
    handleLocationChange,
  };
}
