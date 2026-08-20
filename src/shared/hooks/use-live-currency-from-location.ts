'use client';

import React from 'react';
import { countryCodeToCurrency } from '../services/geo-currency';

/**
 * Reverse-geocodes a live GPS point to its ISO 3166-1 alpha-2 country code
 * and ISO 4217 currency code (via Nominatim's country-level zoom +
 * `country-to-currency`), debounced 800ms. For screens that don't already
 * run their own reverse-geocode (unlike the rider map, which derives this
 * from its existing address lookup).
 */
export function useLiveCurrencyFromLocation(location: { lat: number; lng: number } | null | undefined) {
  const [currencyCode, setCurrencyCode] = React.useState<string | undefined>(undefined);
  const [countryCode, setCountryCode] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!location?.lat || !location?.lng) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json&zoom=3`,
        );
        if (!res.ok) throw new Error('geocode_failed');
        const data = await res.json();
        if (!active) return;
        const liveCountryCode = data?.address?.country_code as string | undefined;
        setCountryCode(liveCountryCode);
        setCurrencyCode(countryCodeToCurrency(liveCountryCode));
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Live currency lookup]', error);
      }
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [location?.lat, location?.lng]);

  return { currencyCode, countryCode };
}
