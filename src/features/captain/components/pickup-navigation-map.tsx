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
} as const;

interface PickupNavigationMapProps {
  language: 'ar' | 'en';
  driverLocation: { lat: number; lng: number } | null;
  pickupLocation: { lat: number; lng: number } | null;
}

const mapCopy = {
  ar: { badge: 'مسار الوصول لنقطة الركوب', recenter: 'العودة إلى موقعي' },
  en: { badge: 'Route to pickup point', recenter: 'Back to my location' },
} as const;

// Purged automatically when this component unmounts (screen leaves the active-trip
// state) — the MapLibre instance is torn down inside `useMaplibreInstance`'s cleanup.
export function PickupNavigationMap({ language, driverLocation, pickupLocation }: PickupNavigationMapProps) {
  const copy = mapCopy[language];
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const driverMarkerRef = React.useRef<maplibregl.Marker | null>(null);
  const pickupMarkerRef = React.useRef<maplibregl.Marker | null>(null);
  const hasFitRef = React.useRef(false);

  const center = driverLocation || pickupLocation || DEFAULT_MAP_CENTER;
  const { mapRef, isMapReady } = useMaplibreInstance({ containerRef, center, zoom: 14.5 });

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    return () => {
      driverMarkerRef.current?.remove();
      pickupMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      pickupMarkerRef.current = null;
    };
  }, [mapRef]);

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
        {copy.badge}
      </span>
      <RecenterMapButton onClick={recenter} className={styles.recenter} ariaLabel={copy.recenter} />
    </div>
  );
}
