'use client';

import React from 'react';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { generateMockCaptainDots, getRiderMockH3Cell, RIDER_MOCK_LOCATION, type MockCaptainDot } from './rider-map-utils';

interface RiderMapProps {
  activeTripCaptainId?: string | null;
  className?: string;
}

type RiderLocation = {
  lat: number;
  lng: number;
};

type RiderLocationStatus = 'locating' | 'live' | 'fallback' | 'denied';

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const RTL_TEXT_PLUGIN_URL = 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js';
let rtlPluginRequested = false;

function ensureRtlTextPlugin() {
  if (rtlPluginRequested || typeof window === 'undefined') return;
  rtlPluginRequested = true;

  try {
    const status = maplibregl.getRTLTextPluginStatus?.();
    if (status === 'loaded' || status === 'loading') return;
    maplibregl.setRTLTextPlugin(RTL_TEXT_PLUGIN_URL, true);
  } catch (error) {
    console.warn('MapLibre RTL text plugin was not loaded:', error);
  }
}

function toRiderFeatureCollection(location: RiderLocation) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { label: 'rider' },
        geometry: {
          type: 'Point' as const,
          coordinates: [location.lng, location.lat],
        },
      },
    ],
  };
}

function toCaptainFeatureCollection(captains: MockCaptainDot[]) {
  return {
    type: 'FeatureCollection' as const,
    features: captains.map((captain) => ({
      type: 'Feature' as const,
      properties: {
        id: captain.id,
        serial: captain.serial,
        etaMinutes: captain.etaMinutes,
        rank: captain.rank,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [captain.coordinates.lng, captain.coordinates.lat],
      },
    })),
  };
}

function getLocationStatusLabel(status: RiderLocationStatus) {
  if (status === 'live') return 'موقعك الحالي';
  if (status === 'locating') return 'يحدد موقعك...';
  if (status === 'denied') return 'اسمح للموقع من المتصفح';
  return 'GPS غير متاح - موقع تقريبي';
}

export function RiderMap({ activeTripCaptainId, className }: RiderMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const cleanupWatchRef = React.useRef<(() => void) | null>(null);
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(RIDER_MOCK_LOCATION);
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('locating');
  const riderCell = React.useMemo(() => getRiderMockH3Cell(riderLocation), [riderLocation]);
  const captains = React.useMemo(() => generateMockCaptainDots(riderCell), [riderCell]);

  const requestLiveLocation = React.useCallback(() => {
    cleanupWatchRef.current?.();
    cleanupWatchRef.current = null;

    if (!('geolocation' in navigator)) {
      setLocationStatus('fallback');
      return;
    }

    let didResolve = false;
    setLocationStatus('locating');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        didResolve = true;
        setLocationStatus('live');
        setRiderLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (didResolve) return;
        setLocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'fallback');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000,
      },
    );

    cleanupWatchRef.current = () => navigator.geolocation.clearWatch(watchId);
  }, []);

  React.useEffect(() => {
    requestLiveLocation();
    return () => cleanupWatchRef.current?.();
  }, [requestLiveLocation]);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureRtlTextPlugin();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [riderLocation.lng, riderLocation.lat],
      zoom: 13.8,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      map.addSource('rider-point', {
        type: 'geojson',
        data: toRiderFeatureCollection(riderLocation),
      });

      map.addSource('rider-captains', {
        type: 'geojson',
        data: toCaptainFeatureCollection(captains),
      });

      map.addLayer({
        id: 'rider-anchor-halo',
        type: 'circle',
        source: 'rider-point',
        paint: {
          'circle-radius': 22,
          'circle-color': '#14B8A6',
          'circle-opacity': 0.16,
          'circle-stroke-color': '#14F5D5',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.45,
        },
      });

      map.addLayer({
        id: 'rider-anchor-dot',
        type: 'circle',
        source: 'rider-point',
        paint: {
          'circle-radius': 6,
          'circle-color': '#14F5D5',
          'circle-stroke-color': '#031315',
          'circle-stroke-width': 2,
        },
      });

      map.addLayer({
        id: 'captain-pulse',
        type: 'circle',
        source: 'rider-captains',
        paint: {
          'circle-radius': 16,
          'circle-color': '#14B8A6',
          'circle-opacity': 0.18,
          'circle-stroke-color': '#14F5D5',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.42,
        },
      });

      map.addLayer({
        id: 'captain-dots',
        type: 'circle',
        source: 'rider-captains',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'rank'],
            'Platinum',
            '#67E8F9',
            'Gold',
            '#14F5D5',
            '#A7F3D0',
          ],
          'circle-stroke-color': '#020617',
          'circle-stroke-width': 2,
        },
      });
    });

    let pulse = 0;
    const interval = window.setInterval(() => {
      if (!map.getLayer('captain-pulse')) return;
      pulse = (pulse + 1) % 3;
      map.setPaintProperty('captain-pulse', 'circle-radius', 14 + pulse * 5);
      map.setPaintProperty('captain-pulse', 'circle-opacity', 0.22 - pulse * 0.05);
    }, 650);

    return () => {
      window.clearInterval(interval);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('rider-captains') || !map.getSource('rider-point')) return;

    const riderSource = map.getSource('rider-point') as GeoJSONSource;
    const captainSource = map.getSource('rider-captains') as GeoJSONSource;
    riderSource.setData(toRiderFeatureCollection(riderLocation));
    captainSource.setData(toCaptainFeatureCollection(captains));
    map.easeTo({
      center: [riderLocation.lng, riderLocation.lat],
      duration: 650,
    });
  }, [captains, riderLocation, activeTripCaptainId]);

  return (
    <section className={`relative overflow-hidden rounded-[24px] border border-[#14B8A6]/20 bg-[#0B0F19] shadow-2xl shadow-black/40 ${className || ''}`}>
      <div ref={containerRef} className="h-full min-h-[340px] w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/78 via-transparent to-[#0B0F19]/20" />
      <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-[#14B8A6]/25 bg-[#0B0F19]/80 px-3 py-2 text-right text-[11px] font-black text-[#14F5D5] backdrop-blur">
        <span className="block">{getLocationStatusLabel(locationStatus)}</span>
        <span className="mt-1 block font-mono">H3 R9: {riderCell.slice(0, 8).toUpperCase()}</span>
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 left-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B0F19]/82 px-4 py-3 text-xs text-white backdrop-blur">
        <span className="font-black text-[#14F5D5]">كباتن قريبون: {captains.length}</span>
        <span className="text-[10px] text-slate-300">MapLibre + OpenFreeMap</span>
      </div>
      {locationStatus !== 'live' && (
        <button
          type="button"
          onClick={requestLiveLocation}
          className="absolute left-4 top-4 rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/90 px-4 py-2 text-xs font-black text-[#14F5D5] shadow-lg backdrop-blur transition hover:bg-[#14B8A6]/15"
        >
          استخدم موقعي
        </button>
      )}
    </section>
  );
}
