import React from 'react';
import { latLngToCell } from 'h3-js';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { reverseGeocodeCoordinates } from '../services/reverse-geocoding-cache';
import { countryCodeToCurrency } from '@/shared/services/geo-currency';
import { getLastKnownLocation } from '@/shared/hooks/use-live-geolocation';
import type { RiderLocation, RiderLocationStatus, RiderLocationUpdate } from '../components/rider-map';

const H3_RIDER_REQUEST_RESOLUTION = 9;
const INITIAL_RIDER_LOCATION: RiderLocation = { lat: 30.0444, lng: 31.2357 };

/**
 * Tracks the rider's live location as reported by `RiderMap` (which owns the
 * actual GPS watch via `useLiveGeolocation`) and reverse-geocodes it into a
 * display address, debounced 800ms after each move.
 */
export function useRiderGeolocation(language: AppLanguage, countryDefaultCenter?: RiderLocation | null) {
  const initialPoint = getLastKnownLocation() || countryDefaultCenter || INITIAL_RIDER_LOCATION;
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(initialPoint);
  const [riderH3Cell, setRiderH3Cell] = React.useState(latLngToCell(initialPoint.lat, initialPoint.lng, H3_RIDER_REQUEST_RESOLUTION));
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>(getLastKnownLocation() ? 'live' : 'fallback');
  const [currentAddressName, setCurrentAddressName] = React.useState<string>('');
  const [isGeocoding, setIsGeocoding] = React.useState<boolean>(false);
  const [liveCurrencyCode, setLiveCurrencyCode] = React.useState<string | undefined>(undefined);

  const handleLocationChange = React.useCallback((payload: RiderLocationUpdate) => {
    setRiderLocation(payload.location);
    setRiderH3Cell(payload.h3Cell);
    setLocationStatus(payload.status);
  }, []);

  // Listen to system permission events and active browser permission state
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDenied = () => setLocationStatus('denied');
    const handleGranted = () => setLocationStatus('live');

    window.addEventListener('system-location-denied', handleDenied);
    window.addEventListener('system-location-granted', handleGranted);

    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((perm) => {
        if (perm.state === 'denied') {
          setLocationStatus('denied');
        } else if (perm.state === 'granted') {
          setLocationStatus('live');
        }
        perm.onchange = () => {
          if (perm.state === 'denied') setLocationStatus('denied');
          else if (perm.state === 'granted') setLocationStatus('live');
        };
      }).catch(() => undefined);
    }

    return () => {
      window.removeEventListener('system-location-denied', handleDenied);
      window.removeEventListener('system-location-granted', handleGranted);
    };
  }, []);

  // The account's own country center resolves shortly after mount (one quick
  // Supabase lookup) — replace the generic seed with it as soon as it's
  // available, but only while no real GPS fix has come in yet, so a rider in
  // the UAE sees a UAE-centered map instead of the old Egypt-only default.
  const appliedCountryDefaultRef = React.useRef(false);
  React.useEffect(() => {
    if (!countryDefaultCenter || appliedCountryDefaultRef.current || locationStatus === 'live') return;
    appliedCountryDefaultRef.current = true;
    setRiderLocation(countryDefaultCenter);
    setRiderH3Cell(latLngToCell(countryDefaultCenter.lat, countryDefaultCenter.lng, H3_RIDER_REQUEST_RESOLUTION));
  }, [countryDefaultCenter, locationStatus]);

  React.useEffect(() => {
    if (!riderLocation.lat || !riderLocation.lng) return;

    // Never reverse geocode unconfirmed dummy Cairo placeholder coordinates
    const isDummyCairo = Math.abs(riderLocation.lat - 30.0444) < 0.001 && Math.abs(riderLocation.lng - 31.2357) < 0.001;
    if (locationStatus !== 'live' && isDummyCairo) {
      return;
    }

    let active = true;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      try {
        const data = await reverseGeocodeCoordinates(riderLocation.lat, riderLocation.lng, language);
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
            displayAddress = localPart || cityPart || data.displayName || '';
          }
          setCurrentAddressName(displayAddress);
          setLiveCurrencyCode(countryCodeToCurrency(addr.country_code));
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
    liveCurrencyCode,
    handleLocationChange,
  };
}
