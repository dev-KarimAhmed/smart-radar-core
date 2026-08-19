'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface GeoLocation {
  lat: number;
  lng: number;
  speed?: number;
  source: 'gps' | 'pwa_share' | 'fallback';
}

/**
 * [SCR-2026-047] مرساة الموقع الجغرافي المعزز (The Geospatial Anchor)
 * المستند الرقمي والأساسي لتجميع الإحداثيات والنهج المركزي دون تشويش.
 */
export const useGeospatialAnchor = (watch = false) => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watcherRef = useRef<number | null>(null);

  const establishAnchor = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. التقاط إحداثيات المشاورة من الرابط المفتوح (في محاكاة PWA Share)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedLat = urlParams.get('lat');
    const sharedLng = urlParams.get('lng');

    if (sharedLat && sharedLng) {
      setLocation({ 
        lat: parseFloat(sharedLat), 
        lng: parseFloat(sharedLng), 
        source: 'pwa_share' 
      });
      return;
    }

    // 2. التحقق من قدرة النظام على الاتصال بجهاز الاستقبال
    if (!navigator.geolocation) {
      setError("الرجاء التحقق من تفعيل التتبع الجغرافي للجهاز.");
      // Leave location unset (null) — a hardcoded coordinate here would
      // shadow better fallbacks (profile country/district) in callers that
      // do `driverLocation || ...`, since a truthy object always wins over them.
      return;
    }

    if (watcherRef.current !== null) {
      navigator.geolocation.clearWatch(watcherRef.current);
      watcherRef.current = null;
    }

    if (watch) {
      watcherRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed ? pos.coords.speed * 3.6 : 0, // km/h
            source: 'gps'
          });
        },
        (err) => {
          setError(err.message);
          // Leave location as-is (do not shadow profile/country fallbacks).
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: 'gps'
          });
        },
        (err) => {
          setError(err.message);
          // Leave location as-is (do not shadow profile/country fallbacks).
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
  }, [watch]);

  useEffect(() => {
    establishAnchor();
    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
    };
  }, [establishAnchor]);

  return { location, error, refreshAnchor: establishAnchor };
};
