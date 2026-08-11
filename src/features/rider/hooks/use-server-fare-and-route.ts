import React from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import { fetchRoadRoute, type RoadRouteEstimate } from '@/lib/road-route';
import { calculateServerFare, mapRiderMarketplaceError } from '../services/rider-server-marketplace';
import { buildFareRequestKey } from '../services/rider-destination-normalizers';
import type { DistrictOption } from '../services/rider-destination-normalizers';
import type { RiderLocation } from '../components/rider-map';

const FARE_RECALCULATION_DEBOUNCE_MS = 350;

/**
 * Debounced server-fare + road-route estimate, keyed by origin/destination/
 * country so a stale response for a since-changed destination never applies.
 */
export function useServerFareAndRoute(params: {
  activeCountryId: number | undefined;
  riderLocation: RiderLocation;
  selectedDestinationCoords: RiderLocation | null;
  selectedDistrict: DistrictOption | null;
  destinationDataError: string | null;
  isDestinationPinMoving: boolean;
}) {
  const { activeCountryId, riderLocation, selectedDestinationCoords, selectedDistrict, destinationDataError, isDestinationPinMoving } = params;
  const t = useTranslations('riderView');

  const [serverFareState, setServerFareState] = React.useState<{
    key: string;
    fare: number | null;
    isLoading: boolean;
    error: string | null;
  }>({
    key: '',
    fare: null,
    isLoading: false,
    error: null,
  });
  const [routeEstimateState, setRouteEstimateState] = React.useState<{
    key: string;
    estimate: RoadRouteEstimate | null;
    isLoading: boolean;
  }>({
    key: '',
    estimate: null,
    isLoading: false,
  });

  const fareRequestKey = React.useMemo(
    () => (selectedDestinationCoords ? buildFareRequestKey(riderLocation, selectedDestinationCoords, activeCountryId) : 'no-destination'),
    [activeCountryId, riderLocation, selectedDestinationCoords],
  );

  const currentServerFare = serverFareState.key === fareRequestKey ? serverFareState.fare : null;
  const currentRouteEstimate = routeEstimateState.key === fareRequestKey ? routeEstimateState.estimate : null;
  const hasUsableRiderLocation =
    Number.isFinite(riderLocation.lat) &&
    Number.isFinite(riderLocation.lng) &&
    (riderLocation.lat !== 0 || riderLocation.lng !== 0);
  const isRouteEstimateLoading =
    !!selectedDestinationCoords &&
    (!hasUsableRiderLocation || routeEstimateState.key !== fareRequestKey || routeEstimateState.isLoading || isDestinationPinMoving);
  const isServerFareLoading =
    !!selectedDestinationCoords && (serverFareState.key !== fareRequestKey || serverFareState.isLoading || isDestinationPinMoving);
  const serverFareError = serverFareState.key === fareRequestKey ? serverFareState.error : null;

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    if (!selectedDistrict) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: destinationDataError || t('destination.noAreaSelectedError'),
      });
      return;
    }

    if (!selectedDestinationCoords) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: t('destination.noCoordinatesError'),
      });
      return;
    }

    if (!Number.isInteger(countryId) || countryId <= 0) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: t('destination.noCountryForFareError'),
      });
      return;
    }

    setServerFareState({
      key: fareRequestKey,
      fare: null,
      isLoading: true,
      error: null,
    });

    const timeoutId = window.setTimeout(() => {
      calculateServerFare(supabase, {
        origin: riderLocation,
        destination: selectedDestinationCoords,
        countryId,
      })
        .then((fare) => {
          if (!active) return;
          setServerFareState({
            key: fareRequestKey,
            fare,
            isLoading: false,
            error: null,
          });
        })
        .catch((error) => {
          if (!active) return;
          const message = mapRiderMarketplaceError(error);
          setServerFareState({
            key: fareRequestKey,
            fare: null,
            isLoading: false,
            error: message,
          });
        });
    }, FARE_RECALCULATION_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [activeCountryId, destinationDataError, fareRequestKey, riderLocation, selectedDestinationCoords, selectedDistrict, t]);

  React.useEffect(() => {
    if (!selectedDestinationCoords || !hasUsableRiderLocation) {
      setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: false });
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: true });

      void fetchRoadRoute(
        riderLocation,
        selectedDestinationCoords,
        selectedDistrict?.tortuosityFactor || 1.3,
      ).then((estimate) => {
        if (!active) return;
        setRouteEstimateState({ key: fareRequestKey, estimate, isLoading: false });
      }).catch((error) => {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Rider Distance Audit]', error);
        }
        setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: false });
      });
    }, FARE_RECALCULATION_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [fareRequestKey, hasUsableRiderLocation, riderLocation, selectedDestinationCoords, selectedDistrict?.tortuosityFactor]);

  const reset = React.useCallback(() => {
    setServerFareState({ key: '', fare: null, isLoading: false, error: null });
    setRouteEstimateState({ key: '', estimate: null, isLoading: false });
  }, []);

  return {
    fareRequestKey,
    currentServerFare,
    currentRouteEstimate,
    hasUsableRiderLocation,
    isRouteEstimateLoading,
    isServerFareLoading,
    serverFareError,
    reset,
  };
}
