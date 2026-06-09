'use client';

import { useState, useEffect } from 'react';
import { extractSovereignCoordinates, estimateTripTime } from '@/lib/geospatial';
import { calculateSovereignDistance } from '@/core/logic/geospatial-kernel';
import { trackSovereignError } from '@/lib/error-tracker';

/**
 * [SCR-2026-051] مُقدّر المسافات والأعمدة الزمنية
 */
export function useTripEstimator(pickupLink: string, riderLocation: { lat: number; lng: number } | null) {
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);

  useEffect(() => {
    if (!pickupLink || !riderLocation) {
      setEstimatedDistance(0);
      setEstimatedTime(0);
      return;
    }
  
    try {
      const destCoords = extractSovereignCoordinates(pickupLink);
      if (destCoords) {
        const dist = calculateSovereignDistance(
          riderLocation.lat, riderLocation.lng, destCoords.lat, destCoords.lng
        );
        setEstimatedDistance(dist);
        setEstimatedTime(estimateTripTime(dist));
      } else {
        setEstimatedDistance(0);
        setEstimatedTime(0);
      }
    } catch (error) {
      trackSovereignError(error, { context: 'useTripEstimator_CoordinateResolution' });
      setEstimatedDistance(0);
      setEstimatedTime(0);
    }
  }, [pickupLink, riderLocation]);

  return { estimatedDistance, estimatedTime };
}
