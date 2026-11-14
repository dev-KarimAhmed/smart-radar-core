import React from 'react';
import { latLngToCell } from 'h3-js';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { useLiveGeolocation } from '@/shared/hooks/use-live-geolocation';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';
import type { RiderLocation, RiderMapCaptainPoint, RiderLocationUpdate } from './rider-map-shared';
import { interpolate } from './rider-map-shared';
import { useRiderMapLayers } from './use-rider-map-layers';
import { useRiderMapDestination } from './use-rider-map-destination';

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

  const hasAutoCenteredOnLiveGpsRef = React.useRef(false);
  React.useEffect(() => {
    if (locationStatus !== 'live') return;
    if (recenterAfterLocateRef.current || !hasAutoCenteredOnLiveGpsRef.current) {
      hasAutoCenteredOnLiveGpsRef.current = true;
      recenterAfterLocateRef.current = false;
      flyToRiderLocation();
    }
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

  useRiderMapLayers({
    mapRef,
    isMapReady,
    riderLocation,
    displayCaptains,
  });

  useRiderMapDestination({
    mapRef,
    isMapReady,
    riderLocation,
    showDestinationPin,
    destinationFlyToTarget,
    onDestinationChange,
    onDestinationMoveStart,
  });

  return {
    locationStatus,
    activeCaptainCount,
    requestLiveLocation,
    handleRecenter,
  };
}
