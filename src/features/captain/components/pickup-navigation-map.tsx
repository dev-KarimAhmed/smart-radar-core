'use client';

import React from 'react';
import maplibregl from 'maplibre-gl';
import { Navigation } from 'lucide-react';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';

const styles = {
  root: "relative h-64 overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#05080f] sm:h-80",
  container: "absolute inset-0",
  badge: "absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-[#0B0F19]/92 px-3 py-1.5 text-xs font-black text-emerald-200 backdrop-blur",
  badgeIcon: "h-3.5 w-3.5",
  recenter: "absolute bottom-4 left-4 z-20 rounded-2xl border border-emerald-500/25 bg-[#0B0F19]/95 p-3 text-emerald-300 shadow-2xl transition hover:border-emerald-300",
  issue: "absolute inset-x-4 top-14 z-20 rounded-2xl border border-amber-500/30 bg-[#0B0F19]/92 p-3 text-xs font-bold text-amber-200 backdrop-blur",
} as const;

interface PickupNavigationMapProps {
  language: 'ar' | 'en';
  driverLocation: { lat: number; lng: number } | null;
  pickupLocation: { lat: number; lng: number } | null;
  mode?: 'pickup' | 'dropoff';
}

const mapCopy = {
  ar: {
    badge: { pickup: 'مسار الوصول لنقطة الركوب', dropoff: 'مسار الوصول لوجهة الراكب' },
    recenter: 'العودة إلى موقعي',
    mapIssue: 'تعذر تحميل الخريطة. تحقق من الاتصال بالإنترنت.',
  },
  en: {
    badge: { pickup: 'Route to pickup point', dropoff: 'Route to rider destination' },
    recenter: 'Back to my location',
    mapIssue: 'Could not load the map. Check your internet connection.',
  },
} as const;

// Purged automatically when this component unmounts (screen leaves the active-trip
// state) — the MapLibre instance is torn down inside `useMaplibreInstance`'s cleanup.
export function PickupNavigationMap({ language, driverLocation, pickupLocation, mode = 'pickup' }: PickupNavigationMapProps) {
  const copy = mapCopy[language];
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const driverMarkerRef = React.useRef<maplibregl.Marker | null>(null);
  const pickupMarkerRef = React.useRef<maplibregl.Marker | null>(null);
  const hasFitRef = React.useRef(false);
  const previousModeRef = React.useRef(mode);
  const [mapIssue, setMapIssue] = React.useState(false);

  // Re-fit the camera once when switching from the pickup target to the
  // dropoff target (e.g. after "Start trip"), instead of staying locked to
  // whatever bounds were fit for the pickup leg of the journey.
  React.useEffect(() => {
    if (previousModeRef.current === mode) return;
    previousModeRef.current = mode;
    hasFitRef.current = false;
  }, [mode]);

  const center = driverLocation || pickupLocation || DEFAULT_MAP_CENTER;
  const { mapRef, isMapReady } = useMaplibreInstance({ containerRef, center, zoom: 14.5 });

  const resize = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    window.requestAnimationFrame(() => map.resize());
  }, [mapRef]);

  // This component only ever mounts inside a conditionally-rendered screen
  // (active trip), so the container's real size isn't settled the instant
  // MapLibre constructs against it. A one-shot timed resize isn't reliable
  // enough here — a ResizeObserver keeps the canvas correctly sized for as
  // long as the component lives, self-healing any later layout shift too.
  React.useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    map.on('error', () => setMapIssue(true));

    const observer = new ResizeObserver(() => resize());
    observer.observe(container);

    // If the style/tiles never finish loading and never fire an 'error'
    // either (e.g. a silently hanging request), surface the same diagnostic
    // message instead of leaving the screen blank with no signal at all.
    const loadTimeout = window.setTimeout(() => {
      if (!mapRef.current?.isStyleLoaded()) setMapIssue(true);
    }, 8000);

    return () => {
      observer.disconnect();
      window.clearTimeout(loadTimeout);
      driverMarkerRef.current?.remove();
      pickupMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      pickupMarkerRef.current = null;
    };
  }, [mapRef, resize]);

  React.useEffect(() => {
    if (!isMapReady) return;
    resize();
  }, [isMapReady, resize]);

  React.useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    const lngLat: [number, number] = [driverLocation.lng, driverLocation.lat];
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new maplibregl.Marker({ color: '#14B8A6' }).setLngLat(lngLat).addTo(mapRef.current);
    } else {
      driverMarkerRef.current.setLngLat(lngLat);
    }
  }, [driverLocation, mapRef]);

  React.useEffect(() => {
    if (!mapRef.current || !pickupLocation) return;
    const lngLat: [number, number] = [pickupLocation.lng, pickupLocation.lat];
    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = new maplibregl.Marker({ color: '#f59e0b' }).setLngLat(lngLat).addTo(mapRef.current);
    } else {
      pickupMarkerRef.current.setLngLat(lngLat);
    }
  }, [pickupLocation, mapRef]);

  React.useEffect(() => {
    if (!isMapReady || !mapRef.current || hasFitRef.current || !driverLocation || !pickupLocation) return;
    hasFitRef.current = true;
    const bounds = new maplibregl.LngLatBounds(
      [driverLocation.lng, driverLocation.lat],
      [driverLocation.lng, driverLocation.lat],
    );
    bounds.extend([pickupLocation.lng, pickupLocation.lat]);
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 0 });
  }, [driverLocation, isMapReady, mapRef, pickupLocation]);

  const recenter = React.useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [center.lng, center.lat], zoom: 15, duration: 700 });
  }, [center.lat, center.lng, mapRef]);

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.container} />
      <span className={styles.badge}>
        <Navigation className={styles.badgeIcon} />
        {copy.badge[mode]}
      </span>
      {mapIssue ? <p className={styles.issue}>{copy.mapIssue}</p> : null}
      <RecenterMapButton onClick={recenter} className={styles.recenter} ariaLabel={copy.recenter} />
    </div>
  );
}
