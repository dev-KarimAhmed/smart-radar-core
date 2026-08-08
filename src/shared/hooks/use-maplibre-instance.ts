'use client';

import React from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ensureRtlTextPlugin, OPENFREEMAP_STYLE } from '@/shared/services/maplibre-runtime';

export interface MaplibreInstanceOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: { lat: number; lng: number };
  zoom: number;
}

export interface MaplibreInstanceResult {
  mapRef: React.RefObject<MapLibreMap | null>;
  isMapReady: boolean;
}

/**
 * Owns the MapLibre map lifecycle: construction (with the shared style + RTL
 * plugin bootstrap), the `isMapReady` flag on `'load'`, and teardown on
 * unmount. Callers add their own layers/markers/controls imperatively via
 * `mapRef.current` once `isMapReady` is true — this hook does not touch
 * rendering, resize handling, attribution controls, or error handlers, since
 * those differ per caller. Declare any effect that reads `mapRef.current`
 * after this hook call so it runs in the same commit once the map exists.
 *
 * `center`/`zoom` are only read once, at construction — like the map
 * components using this hook today, it does not re-center the camera when
 * they change after mount.
 */
export function useMaplibreInstance({ containerRef, center, zoom }: MaplibreInstanceOptions): MaplibreInstanceResult {
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const initialCenterRef = React.useRef(center);
  const initialZoomRef = React.useRef(zoom);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureRtlTextPlugin();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [initialCenterRef.current.lng, initialCenterRef.current.lat],
      zoom: initialZoomRef.current,
      attributionControl: false,
    });

    mapRef.current = map;
    map.on('load', () => setIsMapReady(true));

    return () => {
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [containerRef]);

  return { mapRef, isMapReady };
}
