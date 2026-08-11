'use client';

import React from 'react';
import { latLngToCell } from 'h3-js';
import { CarFront } from 'lucide-react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { useLiveGeolocation } from '@/shared/hooks/use-live-geolocation';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';

import { cn } from '@/lib/utils';
const styles = {
  style423_1: "rider-map-surface relative overflow-hidden rounded-[24px] border border-[#14B8A6]/20 bg-[#0B0F19] shadow-2xl shadow-black/40",
  style430_2: "h-full min-h-0 w-full",
  style431_3: "pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0F19]/78 via-transparent to-[#0B0F19]/20 lg:hidden",
  style435_4: "pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center",
  style438_5: "flex h-8 w-8 items-center justify-center rounded-full border border-[#14F5D5]/60 bg-[#0B0F19]/88 shadow-[0_0_18px_rgba(20,245,213,0.24)] backdrop-blur",
  style439_6: "h-2.5 w-2.5 rounded-full bg-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.8)]",
  style441_7: "-mt-1 h-2.5 w-2.5 rotate-45 border-b border-r border-[#14F5D5]/60 bg-[#0B0F19]/88",
  style442_8: "mt-1.5 hidden rounded-full border border-[#14B8A6]/20 bg-[#0B0F19]/78 px-2.5 py-0.5 text-[9px] font-black text-[#14F5D5] backdrop-blur sm:block",
  style449_9: "pointer-events-none absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/25 bg-[#0B0F19]/88 px-2 py-1.5 text-[#14F5D5] shadow-lg shadow-black/25 backdrop-blur sm:right-4 sm:top-4",
  style450_10: "flex h-6 w-6 items-center justify-center rounded-lg bg-[#14B8A6]/15",
  style451_11: "h-3.5 w-3.5",
  style453_12: "flex flex-col leading-none",
  style454_13: "text-[8px] font-black uppercase tracking-wide text-slate-300",
  style455_14: "mt-0.5 text-xs font-black text-white",
  style461_15: "pointer-events-none absolute right-3 top-20 hidden max-w-[260px] rounded-2xl border border-amber-400/25 bg-[#0B0F19]/88 px-3 py-2 text-right text-[11px] font-bold leading-relaxed text-amber-100 shadow-xl shadow-black/30 backdrop-blur sm:block sm:right-4 sm:top-24 lg:right-[456px]",
  style469_16: "absolute bottom-14 left-3 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/90 text-[#14F5D5] shadow-xl shadow-black/30 backdrop-blur transition hover:border-[#14F5D5]/60 hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 disabled:cursor-wait disabled:opacity-60 sm:bottom-20 sm:left-4 lg:left-[312px]",
  style479_18: "absolute left-4 top-4 rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/90 px-4 py-2 text-xs font-black text-[#14F5D5] shadow-lg backdrop-blur transition hover:bg-[#14B8A6]/15 lg:left-[312px]",
} as const;


interface RiderMapProps {
  activeTripCaptainId?: string | null;
  captainLocations?: RiderMapCaptainPoint[];
  className?: string;
  destinationFlyToTarget?: RiderLocation | null;
  fallbackLocation?: RiderLocation;
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
  isBlocked?: boolean;
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
        isBlocked: !!captain.isBlocked,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [captain.coordinates.lng, captain.coordinates.lat],
      },
    })),
  };
}

export function RiderMap({
  activeTripCaptainId,
  captainLocations = [],
  className,
  destinationFlyToTarget,
  fallbackLocation = DEFAULT_MAP_CENTER,
  showDestinationPin = false,
  onDestinationChange,
  onDestinationMoveStart,
  onLocationChange,
}: RiderMapProps) {
  const { language } = useDashboardLanguage();
  const copy = riderMapCopy[language];
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const lastDestinationFlyToRef = React.useRef('');
  const recenterAfterLocateRef = React.useRef(false);
  const [activeCaptainProgress, setActiveCaptainProgress] = React.useState(0);
  const fallbackLat = fallbackLocation?.lat ?? DEFAULT_MAP_CENTER.lat;
  const fallbackLng = fallbackLocation?.lng ?? DEFAULT_MAP_CENTER.lng;

  const {
    location: riderLocation,
    status: locationStatus,
    refresh: requestLiveLocation,
  } = useLiveGeolocation({ fallbackLocation: { lat: fallbackLat, lng: fallbackLng } });

  const { mapRef, isMapReady } = useMaplibreInstance({
    containerRef,
    center: riderLocation,
    zoom: 13.8,
  });

  const riderCell = React.useMemo(() => latLngToCell(riderLocation.lat, riderLocation.lng, 9), [riderLocation]);
  const activeCaptainCount = React.useMemo(
    () => captainLocations.filter((captain) => !captain.isBlocked).length,
    [captainLocations],
  );

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

  const flyToRiderLocation = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      center: [riderLocation.lng, riderLocation.lat],
      zoom: 15,
      duration: 800,
      essential: true,
    });
  }, [mapRef, riderLocation]);

  const handleRecenter = React.useCallback(() => {
    if (locationStatus !== 'live') {
      recenterAfterLocateRef.current = true;
      requestLiveLocation();
      return;
    }

    flyToRiderLocation();
  }, [flyToRiderLocation, locationStatus, requestLiveLocation]);

  React.useEffect(() => {
    if (locationStatus !== 'live' || !recenterAfterLocateRef.current) return;
    recenterAfterLocateRef.current = false;
    flyToRiderLocation();
  }, [flyToRiderLocation, locationStatus]);

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
    const map = mapRef.current;
    if (!isMapReady || !map) return;

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
        'circle-color': [
          'case',
          ['get', 'isBlocked'],
          '#EF4444',
          '#14B8A6'
        ],
        'circle-opacity': 0.18,
        'circle-stroke-color': [
          'case',
          ['get', 'isBlocked'],
          '#F87171',
          '#14F5D5'
        ],
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.42,
      },
    });

    map.addLayer({
      id: 'captain-cars',
      type: 'symbol',
      source: 'rider-captains',
      layout: {
        'text-field': [
          'case',
          ['get', 'isBlocked'],
          '🚫',
          '🚗'
        ],
        'text-size': 19,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-halo-color': '#020617',
        'text-halo-width': 2,
        'text-opacity': 0.98,
      },
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
    };
    // Runs once when the map finishes loading — riderLocation/displayCaptains
    // at that moment seed the sources; the sync effect below keeps them fresh.
  }, [isMapReady, mapRef]);

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
    <section className={cn(styles.style423_1, className || '')}>
      <style>{`
        .rider-map-surface .maplibregl-ctrl-attrib,
        .rider-map-surface .maplibregl-ctrl-logo {
          display: none !important;
        }
      `}</style>
      <div ref={containerRef} className={styles.style430_2} />
      <div className={styles.style431_3} />
      {showDestinationPin && (
        <div
          data-destination-pin="true"
          className={styles.style435_4}
          aria-hidden="true"
        >
          <div className={styles.style438_5}>
            <div className={styles.style439_6} />
          </div>
          <div className={styles.style441_7} />
          <div className={styles.style442_8}>
            {copy.moveMap}
          </div>
        </div>
      )}

      {!activeTripCaptainId && (
        <div className={styles.style449_9}>
          <span className={styles.style450_10}>
            <CarFront className={styles.style451_11} aria-hidden="true" />
          </span>
          <span className={styles.style453_12}>
            <span className={styles.style454_13}>{copy.activeCaptains}</span>
            <span className={styles.style455_14}>{activeCaptainCount}</span>
          </span>
        </div>
      )}

      {!showDestinationPin && !activeTripCaptainId && captainLocations.length === 0 && (
        <div className={styles.style461_15}>
          {copy.offPeak}
        </div>
      )}
      <RecenterMapButton
        onClick={handleRecenter}
        disabled={locationStatus === 'locating'}
        className={styles.style469_16}
        ariaLabel={copy.recenter}
        title={copy.recenter}
      />
      {locationStatus !== 'live' && (
        <button
          type="button"
          onClick={requestLiveLocation}
          className={styles.style479_18}
        >
          {copy.useMyLocation}
        </button>
      )}
    </section>
  );
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

const riderMapCopy = {
  ar: {
    activeCaptains: 'الكباتن المتاحون',
    denied: 'اسمح للموقع من المتصفح',
    driverOnWay: 'السائق في الطريق إليك',
    fallback: 'GPS غير متاح',
    live: 'موقعك الحالي',
    locating: 'يتم تحديد موقعك...',
    mapReady: 'خريطة الرحلة جاهزة',
    moveMap: 'حرّك الخريطة',
    offPeak: 'المنطقة الحالية خارج أوقات الذروة - قد يستغرق قبول الرحلة وقتا أطول',
    recenter: 'العودة إلى موقعي',
    useMyLocation: 'استخدم موقعي الحالي',
  },
  en: {
    activeCaptains: 'Active captains',
    denied: 'Allow location in browser',
    driverOnWay: 'Driver is on the way',
    fallback: 'GPS unavailable',
    live: 'Your location',
    locating: 'Finding your location...',
    mapReady: 'Map is ready',
    moveMap: 'Move map',
    offPeak: 'This area is quieter now - accepting the ride may take longer',
    recenter: 'Recenter to my location',
    useMyLocation: 'Use my location',
  },
} satisfies Record<AppLanguage, Record<string, string>>;
