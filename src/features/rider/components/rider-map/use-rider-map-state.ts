import React from 'react';
import { latLngToCell } from 'h3-js';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { useLiveGeolocation } from '@/shared/hooks/use-live-geolocation';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import type { RiderLocation, RiderMapCaptainPoint, RiderLocationUpdate } from './rider-map-shared';
import { toRiderFeatureCollection, toCaptainFeatureCollection, interpolate } from './rider-map-shared';

interface UseRiderMapStateProps {
  activeTripCaptainId?: string | null;
  captainLocations?: RiderMapCaptainPoint[];
  destinationFlyToTarget?: RiderLocation | null;
  fallbackLocation?: RiderLocation;
  showDestinationPin?: boolean;
  onDestinationChange?: (location: RiderLocation) => void;
  onDestinationMoveStart?: () => void;
  onLocationChange?: (payload: RiderLocationUpdate) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useRiderMapState({
  activeTripCaptainId,
  captainLocations = [],
  destinationFlyToTarget,
  fallbackLocation = DEFAULT_MAP_CENTER,
  showDestinationPin = false,
  onDestinationChange,
  onDestinationMoveStart,
  onLocationChange,
  containerRef,
}: UseRiderMapStateProps) {
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

    if (!map.getSource('rider-point')) {
      map.addSource('rider-point', {
        type: 'geojson',
        data: toRiderFeatureCollection(riderLocation),
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
    }

    if (!map.getSource('rider-captains')) {
      map.addSource('rider-captains', {
        type: 'geojson',
        data: toCaptainFeatureCollection(displayCaptains),
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
    }

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
  }, [isMapReady, mapRef, riderLocation, displayCaptains]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource('rider-captains') || !map.getSource('rider-point')) return;

    const riderSource = map.getSource('rider-point') as GeoJSONSource;
    const captainSource = map.getSource('rider-captains') as GeoJSONSource;
    riderSource.setData(toRiderFeatureCollection(riderLocation));
    captainSource.setData(toCaptainFeatureCollection(displayCaptains));
  }, [displayCaptains, riderLocation, mapRef]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || showDestinationPin) return;

    map.easeTo({
      center: [riderLocation.lng, riderLocation.lat],
      duration: 650,
    });
  }, [riderLocation, showDestinationPin, mapRef]);

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
  }, [destinationFlyToTarget, isMapReady, mapRef]);

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
  }, [isMapReady, onDestinationChange, onDestinationMoveStart, showDestinationPin, mapRef]);

  return {
    locationStatus,
    activeCaptainCount,
    requestLiveLocation,
    handleRecenter,
  };
}
