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

  const refreshLocation = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('request-live-location'));
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc: RiderLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setRiderLocation(loc);
            setRiderH3Cell(latLngToCell(loc.lat, loc.lng, H3_RIDER_REQUEST_RESOLUTION));
            setLocationStatus('live');
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              setLocationStatus('denied');
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          setLocationStatus('denied');
        }
        const handleChange = () => {
          if (permissionStatus.state === 'denied') {
            setLocationStatus('denied');
          } else if (permissionStatus.state === 'granted') {
            refreshLocation();
          }
        };
        permissionStatus.addEventListener('change', handleChange);
        return () => {
          permissionStatus.removeEventListener('change', handleChange);
        };
      }).catch(() => {});
    }
  }, [refreshLocation]);

  return {
    riderLocation,
    riderH3Cell,
    locationStatus,
    currentAddressName,
    isGeocoding,
    liveCurrencyCode,
    handleLocationChange,
    refreshLocation,
  };
}
