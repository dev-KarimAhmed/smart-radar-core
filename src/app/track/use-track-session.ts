import { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { TrackErrorState, TrackLocationCoords } from './track-types';

interface UseTrackSessionParams {
  requestId: string;
  token: string;
  isArabic: boolean;
  mapRef: React.RefObject<maplibregl.Map | null>;
  isMapReady: boolean;
}

export function useTrackSession({
  requestId,
  token,
  isArabic,
  mapRef,
  isMapReady,
}: UseTrackSessionParams) {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [errorState, setErrorState] = useState<TrackErrorState>(null);
  const [coords, setCoords] = useState<TrackLocationCoords | null>(null);
  const [shortId, setShortId] = useState<string>(requestId ? requestId.slice(0, 8).toUpperCase() : 'LIVE');
  const [captainName, setCaptainName] = useState<string>(isArabic ? 'السائق' : 'Captain');
  const [plate, setPlate] = useState<string>('');
  const [vehicle, setVehicle] = useState<string>('');
  const [destination, setDestination] = useState<string>(isArabic ? 'وجهة الرحلة' : 'Trip Destination');
  const [captainPhone, setCaptainPhone] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>(isArabic ? 'الآن' : 'Just now');
  const [tripStatus, setTripStatus] = useState<string>(isArabic ? 'قيد المتابعة الحية' : 'Live Tracking Active');

  const markerRef = useRef<maplibregl.Marker | null>(null);

  const wipeSensitiveState = (nextState: Exclude<TrackErrorState, null>, statusLabel?: string) => {
    setErrorState(nextState);
    setCoords(null);
    setCaptainPhone('');
    setPlate('');
    setVehicle('');
    setCaptainName('');
    setDestination('');
    if (statusLabel) {
      setTripStatus(statusLabel);
    }
    markerRef.current?.remove();
    markerRef.current = null;
  };

  // Sync animated vehicle marker only when server-verified location is active
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !coords || errorState) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const map = mapRef.current;

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.style.transition = 'transform 1s ease-out';
      el.innerHTML = `
        <div style="position: absolute; width: 52px; height: 52px; border-radius: 50%; background: rgba(20,184,166,0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(20,184,166,0.35);"></div>
        <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #0A0F1D; border: 2.5px solid #14F5D5; box-shadow: 0 0 16px rgba(20,245,213,0.6); display: flex; align-items: center; justify-content: center; font-size: 16px;">🚗</div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
      map.easeTo({ center: [coords.lng, coords.lat], duration: 800 });
    } else {
      markerRef.current.setLngLat([coords.lng, coords.lat]);
      map.easeTo({ center: [coords.lng, coords.lat], duration: 1200 });
    }
  }, [isMapReady, mapRef, coords, errorState]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, []);

  // Poll HMAC-verified live tracking API and halt immediately on trip completion/expiry
  useEffect(() => {
    if (!requestId || !token) {
      wipeSensitiveState('missing');
      setIsInitialLoading(false);
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const pollTracking = async () => {
      try {
        const res = await fetch(
          `/api/trip/track?id=${encodeURIComponent(requestId)}&t=${encodeURIComponent(token)}`,
          { method: 'GET', cache: 'no-store' },
        );

        if (!active) return;

        if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
          wipeSensitiveState('invalid');
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          setIsInitialLoading(false);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!active || !data?.success) {
          setIsInitialLoading(false);
          return;
        }

        if (data.shortId) {
          setShortId(String(data.shortId));
        }

        // Service 11 Compliance: Halt tracking & clear location/PII immediately when closed
        if (data.tripEnded === true || data.active === false) {
          wipeSensitiveState('ended', String(data.status || 'COMPLETED'));
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
          setIsInitialLoading(false);
          return;
        }

        setErrorState(null);
        if (data.status) {
          setTripStatus(String(data.status).toUpperCase());
        }
        if (data.destination) {
          setDestination(String(data.destination));
        }
        if (data.captain) {
          setCaptainName(String(data.captain.name || (isArabic ? 'السائق' : 'Captain')));
          setCaptainPhone(data.captain.phone ? String(data.captain.phone) : '');
          setPlate(data.captain.plate ? String(data.captain.plate) : '');
          setVehicle(data.captain.vehicle ? String(data.captain.vehicle) : '');
        }
        if (data.location && Number.isFinite(Number(data.location.lat)) && Number.isFinite(Number(data.location.lng))) {
          setCoords({ lat: Number(data.location.lat), lng: Number(data.location.lng) });
        }

        const parsedDate = data.updatedAt ? new Date(String(data.updatedAt)) : new Date();
        setLastUpdated(
          (Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate).toLocaleTimeString(
            isArabic ? 'ar-JO' : 'en-US',
            { hour: '2-digit', minute: '2-digit', second: '2-digit' },
          ),
        );
        setIsInitialLoading(false);
      } catch {
        if (active) {
          setIsInitialLoading(false);
        }
      }
    };

    void pollTracking();
    timer = setInterval(() => {
      void pollTracking();
    }, 3500);

    return () => {
      active = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [requestId, token, isArabic]);

  return {
    isInitialLoading,
    errorState,
    coords,
    shortId,
    captainName,
    plate,
    vehicle,
    destination,
    captainPhone,
    lastUpdated,
    tripStatus,
  };
}
