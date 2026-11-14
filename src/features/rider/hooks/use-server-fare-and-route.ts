import React from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase-client';
import { fetchRoadRoute } from '@/lib/road-route';
import { calculateServerFare, mapRiderMarketplaceError } from '../services/rider-server-marketplace';
import { buildFareRequestKey } from '../services/rider-destination-normalizers';
import {
  FARE_RECALCULATION_DEBOUNCE_MS,
  isUsableRiderLocation,
  isNearbyOriginLocation,
  type UseServerFareAndRouteParams,
  type ServerFareState,
  type RouteEstimateState,
} from './server-fare-and-route-helpers';

export * from './server-fare-and-route-helpers';

/**
 * Debounced server-fare + road-route estimate, keyed by origin/destination/
 * country so a stale response for a since-changed destination never applies.
 */
export function useServerFareAndRoute(params: UseServerFareAndRouteParams) {
  const {
    activeCountryId,
    riderLocation,
    riderLocationStatus,
    selectedDestinationCoords,
    selectedDistrict,
    destinationDataError,
    isDestinationPinMoving,
    trafficFactor,
  } = params;
  const t = useTranslations('riderView');

  const [serverFareState, setServerFareState] = React.useState<ServerFareState>({
    key: '',
    fare: null,
    isLoading: false,
    error: null,
  });
  const [routeEstimateState, setRouteEstimateState] = React.useState<RouteEstimateState>({
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

  const hasUsableRiderLocation = isUsableRiderLocation(riderLocation, riderLocationStatus);

  const isRouteEstimateLoading =
    !!selectedDestinationCoords &&
    (!hasUsableRiderLocation || routeEstimateState.key !== fareRequestKey || routeEstimateState.isLoading || isDestinationPinMoving);
  const isServerFareLoading =
    !!selectedDestinationCoords && (serverFareState.key !== fareRequestKey || serverFareState.isLoading || isDestinationPinMoving);
  const serverFareError = serverFareState.key === fareRequestKey ? serverFareState.error : null;

  React.useEffect(() => {
    let active = true;
    const countryId = Number(activeCountryId);

    if (!selectedDestinationCoords) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    if (isNearbyOriginLocation(riderLocation, selectedDestinationCoords)) {
      setServerFareState({
        key: fareRequestKey,
        fare: null,
        isLoading: false,
        error: null,
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

    if (isRouteEstimateLoading) return;

    const timeoutId = window.setTimeout(() => {
      calculateServerFare(supabase, {
        origin: riderLocation,
        destination: selectedDestinationCoords,
        countryId,
        roadKm: currentRouteEstimate?.distanceKm ?? null,
        durationMinutes: currentRouteEstimate?.durationMinutes ?? null,
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
  }, [
    activeCountryId,
    destinationDataError,
    fareRequestKey,
    Boolean(selectedDistrict),
    t,
    isRouteEstimateLoading,
    currentRouteEstimate,
    riderLocation,
    selectedDestinationCoords,
  ]);

  React.useEffect(() => {
    if (!selectedDestinationCoords || !hasUsableRiderLocation) {
      setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: false });
      return;
    }

    if (isNearbyOriginLocation(riderLocation, selectedDestinationCoords)) {
      setRouteEstimateState({
        key: fareRequestKey,
        estimate: { distanceKm: 0, durationMinutes: 0, isFallback: false },
        isLoading: false,
      });
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setRouteEstimateState({ key: fareRequestKey, estimate: null, isLoading: true });

      void fetchRoadRoute(
        riderLocation,
        selectedDestinationCoords,
        selectedDistrict?.tortuosityFactor || 1.3,
        Number(trafficFactor) || undefined,
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
  }, [
    fareRequestKey,
    hasUsableRiderLocation,
    selectedDistrict?.tortuosityFactor,
    trafficFactor,
    riderLocation,
    selectedDestinationCoords,
  ]);

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
