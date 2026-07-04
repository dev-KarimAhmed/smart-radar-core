'use client';

import React from 'react';
import { latLngToCell } from 'h3-js';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AMMAN_FALLBACK_LOCATION } from './jordan-destinations';

interface RiderMapProps {
  activeTripCaptainId?: string | null;
  captainLocations?: RiderMapCaptainPoint[];
  className?: string;
  destinationFlyToTarget?: RiderLocation | null;
  showDestinationPin?: boolean;
  onDestinationChange?: (location: RiderLocation) => void;
  onDestinationMoveStart?: () => void;
  onLocationChange?: (payload: RiderLocationUpdate) => void;
}

export type RiderLocation = {
  lat: number;
  lng: number;
};

export type RiderLocationStatus = 'locating' | 'live' | 'fallback' | 'denied';

export interface RiderLocationUpdate {
  location: RiderLocation;
  status: RiderLocationStatus;
  h3Cell: string;
}

export interface RiderMapCaptainPoint {
  id: string;
  serial: string;
  h3Cell: string;
  coordinates: RiderLocation;
  etaMinutes?: number;
  rank?: string;
}

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

function toCaptainFeatureCollection(captains: RiderMapCaptainPoint[]) {
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
  if (status === 'locating') return 'يتم تحديد موقعك...';
  if (status === 'denied') return 'اسمح للموقع من المتصفح';
  return 'GPS غير متاح';
}

export function RiderMap({
  activeTripCaptainId,
  captainLocations = [],
  className,
  destinationFlyToTarget,
  showDestinationPin = false,
  onDestinationChange,
  onDestinationMoveStart,
  onLocationChange,
}: RiderMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const cleanupWatchRef = React.useRef<(() => void) | null>(null);
  const lastDestinationFlyToRef = React.useRef('');
  const [riderLocation, setRiderLocation] = React.useState<RiderLocation>(AMMAN_FALLBACK_LOCATION);
  const [locationStatus, setLocationStatus] = React.useState<RiderLocationStatus>('locating');
  const [activeCaptainProgress, setActiveCaptainProgress] = React.useState(0);
  const [isMapReady, setIsMapReady] = React.useState(false);
  const riderCell = React.useMemo(() => latLngToCell(riderLocation.lat, riderLocation.lng, 9), [riderLocation]);

  const displayCaptains = React.useMemo(() => {
    if (!activeTripCaptainId) return captainLocations;

    return captainLocations.map((captain) => {
      if (captain.id !== activeTripCaptainId) return captain;

      const progress = Math.min(0.92, Math.max(0.08, activeCaptainProgress));
      return {
        ...captain,
        coordinates: {
          lat: interpolate(captain.coordinates.lat, riderLocation.lat, progress),
          lng: interpolate(captain.coordinates.lng, riderLocation.lng, progress),
        },
      };
    });
  }, [activeCaptainProgress, activeTripCaptainId, captainLocations, riderLocation]);

  const requestLiveLocation = React.useCallback(() => {
    cleanupWatchRef.current?.();
    cleanupWatchRef.current = null;

    if (!('geolocation' in navigator)) {
      setRiderLocation(AMMAN_FALLBACK_LOCATION);
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
        setRiderLocation(AMMAN_FALLBACK_LOCATION);
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
    onLocationChange?.({
      location: riderLocation,
      status: locationStatus,
      h3Cell: riderCell,
    });
  }, [locationStatus, onLocationChange, riderCell, riderLocation]);

  React.useEffect(() => {
    if (!activeTripCaptainId) {
      setActiveCaptainProgress(0);
      return;
    }

    setActiveCaptainProgress(0.08);
    const interval = window.setInterval(() => {
      setActiveCaptainProgress((previous) => (previous >= 0.92 ? 0.92 : previous + 0.055));
    }, 850);

    return () => window.clearInterval(interval);
  }, [activeTripCaptainId]);

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

    map.on('load', () => {
      setIsMapReady(true);

      map.addSource('rider-point', {
        type: 'geojson',
        data: toRiderFeatureCollection(riderLocation),
      });

      map.addSource('rider-captains', {
        type: 'geojson',
        data: toCaptainFeatureCollection(displayCaptains),
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
      setIsMapReady(false);
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('rider-captains') || !map.getSource('rider-point')) return;

    const riderSource = map.getSource('rider-point') as GeoJSONSource;
    const captainSource = map.getSource('rider-captains') as GeoJSONSource;
    riderSource.setData(toRiderFeatureCollection(riderLocation));
    captainSource.setData(toCaptainFeatureCollection(displayCaptains));
  }, [displayCaptains, riderLocation]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || showDestinationPin) return;

    map.easeTo({
      center: [riderLocation.lng, riderLocation.lat],
      duration: 650,
    });
  }, [riderLocation, showDestinationPin]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !destinationFlyToTarget) return;

    const targetKey = `${destinationFlyToTarget.lat.toFixed(6)}:${destinationFlyToTarget.lng.toFixed(6)}`;
    if (lastDestinationFlyToRef.current === targetKey) return;
    lastDestinationFlyToRef.current = targetKey;

    map.flyTo({
      center: [destinationFlyToTarget.lng, destinationFlyToTarget.lat],
      zoom: Math.max(map.getZoom(), 14.6),
      duration: 900,
      essential: true,
    });
  }, [destinationFlyToTarget, isMapReady]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !showDestinationPin) return;

    const handleMoveStart = () => {
      onDestinationMoveStart?.();
    };

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onDestinationChange?.({ lat: center.lat, lng: center.lng });
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
    };
  }, [isMapReady, onDestinationChange, onDestinationMoveStart, showDestinationPin]);

  return (
    <section className={`relative overflow-hidden rounded-[24px] border border-[#14B8A6]/20 bg-[#0B0F19] shadow-2xl shadow-black/40 ${className || ''}`}>
      <div ref={containerRef} className="h-full min-h-0 w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/78 via-transparent to-[#0B0F19]/20 lg:hidden" />
      {showDestinationPin && (
        <div
          data-destination-pin="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center"
          aria-hidden="true"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#14F5D5]/60 bg-[#0B0F19]/88 shadow-[0_0_18px_rgba(20,245,213,0.24)] backdrop-blur">
            <div className="h-2.5 w-2.5 rounded-full bg-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.8)]" />
          </div>
          <div className="-mt-1 h-2.5 w-2.5 rotate-45 border-b border-r border-[#14F5D5]/60 bg-[#0B0F19]/88" />
          <div className="mt-1.5 hidden rounded-full border border-[#14B8A6]/20 bg-[#0B0F19]/78 px-2.5 py-0.5 text-[9px] font-black text-[#14F5D5] backdrop-blur sm:block">
            حرّك الخريطة
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute right-2 top-2 max-w-[150px] rounded-xl border border-[#14B8A6]/25 bg-[#0B0F19]/82 px-2 py-1.5 text-right text-[9px] font-black text-[#14F5D5] backdrop-blur sm:right-4 sm:top-4 sm:max-w-none sm:rounded-2xl sm:px-3 sm:py-2 sm:text-[11px] lg:right-[456px]">
        <span className="block">{getLocationStatusLabel(locationStatus)}</span>
        <span className="mt-1 block font-mono">H3 R9: {riderCell.slice(0, 8).toUpperCase()}</span>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 left-2 flex items-center justify-end rounded-xl border border-white/10 bg-[#0B0F19]/82 px-2.5 py-1.5 text-[10px] text-white backdrop-blur sm:bottom-4 sm:right-4 sm:left-4 sm:justify-between sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs lg:left-[312px] lg:right-[456px]">
        <span className="font-black text-[#14F5D5]">
          {activeTripCaptainId ? 'السائق في الطريق إليك' : 'خريطة الرحلة جاهزة'}
        </span>
        <span className="hidden text-[10px] text-slate-300 sm:block">MapLibre + OpenFreeMap / © OSM</span>
      </div>
      {!showDestinationPin && !activeTripCaptainId && captainLocations.length === 0 && (
        <div className="pointer-events-none absolute right-3 top-20 hidden max-w-[260px] rounded-2xl border border-amber-400/25 bg-[#0B0F19]/88 px-3 py-2 text-right text-[11px] font-bold leading-relaxed text-amber-100 shadow-xl shadow-black/30 backdrop-blur sm:block sm:right-4 sm:top-24 lg:right-[456px]">
          المنطقة الحالية خارج أوقات الذروة - قد يستغرق قبول الرحلة وقتا أطول
        </div>
      )}
      {locationStatus !== 'live' && (
        <button
          type="button"
          onClick={requestLiveLocation}
          className="absolute left-4 top-4 rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/90 px-4 py-2 text-xs font-black text-[#14F5D5] shadow-lg backdrop-blur transition hover:bg-[#14B8A6]/15 lg:left-[312px]"
        >
          استخدم موقعي الحالي
        </button>
      )}
    </section>
  );
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}
