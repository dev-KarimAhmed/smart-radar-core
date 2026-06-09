'use client';

import { useState, useEffect, useRef } from 'react';
import { trackSovereignError } from '@/lib/error-tracker';

interface GpsLocation {
  lat: number;
  lng: number;
}

// هذا هو العهد والمربع الاستراتيجي للملاحة الميدانية للرئيسية والفرسان
export function useSovereignGps(isEnabled: boolean) {
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) {
      setLocation(null); 
      return;
    }

    // fallback simulation for preview sandbox iframe
    if (typeof window !== 'undefined' && !navigator.geolocation) {
       console.warn('[Sovereign GPS] Geolocation not supported. Injected Amman center.');
       setLocation({ lat: 31.95, lng: 35.91 });
       return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // تطبيق بروتوكول تصفية التحديثات المكثفة للحد من الفواتير السحابية
        if (now - lastUpdate.current > 10000) {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          lastUpdate.current = now;
        }
      },
      (err) => {
        trackSovereignError(err, { context: 'SovereignGPS' });
        // gracefully inject Amman coordinates if access is denied in iframe sandbox
        if (err.code === err.PERMISSION_DENIED || err.code === err.POSITION_UNAVAILABLE) {
          console.warn('[Sovereign GPS] Permission denied or unavailable. Fallback to Amman central coordinates.');
          setLocation({ lat: 31.95, lng: 35.91 });
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
         navigator.geolocation.clearWatch(watcher);
      }
    };
  }, [isEnabled]);

  return location;
}
