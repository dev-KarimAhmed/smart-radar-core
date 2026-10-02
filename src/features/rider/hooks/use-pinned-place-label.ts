'use client';

import React from 'react';

import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderLocation } from '../components/rider-map';
import { reverseGeocodeCoordinates } from '../services/reverse-geocoding-cache';

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
        const data = await reverseGeocodeCoordinates(Number(lat), Number(lng), language);
        const address = data.address || {};

        const road = address.road || '';
        const area = address.suburb
          || address.neighbourhood
          || address.quarter
          || address.city_district
          || address.village
          || address.town
          || '';
        const wide = address.city
          || address.state
          || address.county
          || address.governorate
          || '';

        const sep = language === 'ar' ? '، ' : ', ';
        let local = '';
        if (road && area && road !== area) {
          local = `${road}${sep}${area}`;
        } else {
          local = road || area || '';
        }

        const parts: string[] = [];
        if (local) parts.push(local);
        if (wide && !parts.some((p) => p.includes(wide))) {
          parts.push(wide);
        }

        let resolvedLabel = parts.join(' - ');
        if (!resolvedLabel && (data.displayName || data.display_name)) {
          const raw = (data.displayName || data.display_name || '').split(',').map((s) => s.trim()).filter(Boolean);
          resolvedLabel = raw.slice(0, 2).join(' - ');
        }

        if (!active) return;
        setLabel(resolvedLabel);
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
