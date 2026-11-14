import React from 'react';
import type { Map } from 'maplibre-gl';
import type { RiderLocation } from './rider-map-shared';

interface UseRiderMapDestinationProps {
  mapRef: React.RefObject<Map | null>;
  isMapReady: boolean;
  riderLocation: RiderLocation;
  showDestinationPin?: boolean;
  destinationFlyToTarget?: RiderLocation | null;
  onDestinationChange?: (location: RiderLocation) => void;
  onDestinationMoveStart?: () => void;
}

export function useRiderMapDestination({
  mapRef,
  isMapReady,
  riderLocation,
  showDestinationPin = false,
  destinationFlyToTarget,
  onDestinationChange,
  onDestinationMoveStart,
}: UseRiderMapDestinationProps) {
  const lastDestinationFlyToRef = React.useRef('');
  const hasCenteredDestinationPinRef = React.useRef(false);

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
    if (!map || !isMapReady) return;

    if (showDestinationPin) {
      if (!destinationFlyToTarget && !hasCenteredDestinationPinRef.current && riderLocation && (riderLocation.lat !== 0 || riderLocation.lng !== 0)) {
        hasCenteredDestinationPinRef.current = true;
        map.flyTo({
          center: [riderLocation.lng, riderLocation.lat],
          zoom: Math.max(map.getZoom(), 15),
          duration: 600,
          essential: true,
        });
      }
    } else {
      hasCenteredDestinationPinRef.current = false;
    }
  }, [destinationFlyToTarget, isMapReady, mapRef, riderLocation, showDestinationPin]);

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

    const handleMoveStart = (e?: { originalEvent?: unknown }) => {
      if (e?.originalEvent) {
        onDestinationMoveStart?.();
      }
    };

    const handleMoveEnd = (e?: { originalEvent?: unknown }) => {
      if (!e?.originalEvent) return;
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
}
