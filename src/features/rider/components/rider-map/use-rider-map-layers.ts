import React from 'react';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import type { RiderLocation, RiderMapCaptainPoint } from './rider-map-shared';
import { toRiderFeatureCollection, toCaptainFeatureCollection } from './rider-map-shared';

interface UseRiderMapLayersProps {
  mapRef: React.RefObject<Map | null>;
  isMapReady: boolean;
  riderLocation: RiderLocation;
  displayCaptains: RiderMapCaptainPoint[];
}

export function useRiderMapLayers({
  mapRef,
  isMapReady,
  riderLocation,
  displayCaptains,
}: UseRiderMapLayersProps) {
  React.useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map) return;

    try {
      if (typeof map.getSource !== 'function') return;
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
    } catch {}

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
      try {
        if (!map || typeof map.getLayer !== 'function' || !map.getLayer('captain-pulse')) return;
        pulse = (pulse + 1) % 3;
        map.setPaintProperty('captain-pulse', 'circle-radius', 14 + pulse * 5);
        map.setPaintProperty('captain-pulse', 'circle-opacity', 0.22 - pulse * 0.05);
      } catch {}
    }, 650);

    return () => {
      window.clearInterval(interval);
    };
  }, [isMapReady, mapRef, riderLocation, displayCaptains]);

  React.useEffect(() => {
    const map = mapRef.current;
    try {
      if (!map || typeof map.getSource !== 'function') return;
      if (!map.getSource('rider-captains') || !map.getSource('rider-point')) return;

      const riderSource = map.getSource('rider-point') as GeoJSONSource;
      const captainSource = map.getSource('rider-captains') as GeoJSONSource;
      riderSource?.setData(toRiderFeatureCollection(riderLocation));
      captainSource?.setData(toCaptainFeatureCollection(displayCaptains));
    } catch {}
  }, [displayCaptains, riderLocation, mapRef]);
}
