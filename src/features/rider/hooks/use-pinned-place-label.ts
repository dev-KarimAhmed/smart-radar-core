'use client';

import React from 'react';

import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderLocation } from '../components/rider-map';

/**
 * The name of the place the destination pin is actually sitting on.
 *
 * The destination label was built only from the governorate/district dropdown, or from a
 * pasted Google link — never from the pin. So a rider who dragged the pin to Cairo still saw
 * "سادس من أكتوبر - الجيزة", because the label followed the dropdown while the coordinates,
 * the distance and the fare all followed the pin. Two sources of truth for one destination,
 * and only one of them moved when the rider moved it.
 *
 * Reverse-geocoded through Nominatim, which this app already uses for the rider's own
 * address and inside /api/maps/resolve — free, and no new dependency.
 */
export function usePinnedPlaceLabel(
  location: RiderLocation | null,
  language: AppLanguage,
  enabled = true,
) {
  const [label, setLabel] = React.useState('');
  const [isResolving, setIsResolving] = React.useState(false);

  // Rounded to ~11 m so nudging the pin by a few metres does not re-query a shared free
  // service that asks for at most one request per second.
  const key = location && enabled
    ? `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
    : '';

  React.useEffect(() => {
    if (!key) {
      setLabel('');
      return;
    }

    let active = true;
    const [lat, lng] = key.split(',');

    // Debounced: the pin emits continuously while it is being dragged.
    const timeoutId = window.setTimeout(async () => {
      setIsResolving(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${language}`,
          { headers: { Accept: 'application/json' } },
        );
        if (!response.ok) throw new Error('reverse_geocode_failed');

        const data = await response.json() as { address?: Record<string, string> };
        const address = data.address || {};

        // Narrow to wide, so the rider gets the most specific name the map knows.
        const local = address.suburb
          || address.neighbourhood
          || address.quarter
          || address.city_district
          || address.village
          || address.town
          || address.road
          || '';
        const wide = address.city
          || address.state
          || address.county
          || address.governorate
          || '';

        if (!active) return;
        setLabel([local, wide].filter(Boolean).join(' - '));
      } catch {
        // A failed lookup leaves the label empty, and the caller falls back to the district
        // name. Being unable to name the pin is not a reason to block the trip.
        if (active) setLabel('');
      } finally {
        if (active) setIsResolving(false);
      }
    }, 800);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [key, language]);

  return { label, isResolving };
}
