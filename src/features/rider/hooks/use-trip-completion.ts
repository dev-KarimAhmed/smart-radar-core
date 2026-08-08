import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import {
  completeRideTrip,
  fetchRideRequestStatus,
  mapRiderMarketplaceError,
  submitRideRating,
} from '../services/rider-server-marketplace';
import { toHistoricalTrip } from '../services/rider-view-format';
import type { HistoricalTrip } from '../components/rider-dashboard';
import type { RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Owns completing an active trip (persisting it to the local trip ledger)
 * and submitting the post-trip rating, including the local "recently
 * completed" cache the trips tab reads from.
 */
export function useTripCompletion(state: RiderMachineState, dispatch: React.Dispatch<RiderMachineAction>) {
  const { toast } = useToast();
  const t = useTranslations('riderView');

  const [localCompletedTrips, setLocalCompletedTrips] = React.useState<HistoricalTrip[]>([]);
  const [isCompletingTrip, setIsCompletingTrip] = React.useState(false);
  const [riderCount, setRiderCount] = React.useState(1);
  const [rating, setRating] = React.useState({ captain: 0, vehicle: 0, favorite: false });
  const [ratingComment, setRatingComment] = React.useState('');
  const [isSubmittingRating, setIsSubmittingRating] = React.useState(false);

  const tripsWithin72Hours = React.useMemo<HistoricalTrip[]>(
    () => [...localCompletedTrips],
    [localCompletedTrips],
  );

  const handleCompleteTrip = React.useCallback(async () => {
    if (!state.activeTrip) return;
    if (!state.requestId) {
      toast({
        variant: 'destructive',
        title: t('trip.completeNoActiveTitle'),
        description: t('trip.completeNoActiveDescription'),
      });
      return;
    }

    setIsCompletingTrip(true);

    const historicalTrip = toHistoricalTrip(state.activeTrip);
    const ledgerEntry: RiderTripLedgerEntry = {
      ...historicalTrip,
      purgeAt: historicalTrip.timestamp + THREE_DAYS_MS,
    };

    try {
      await completeRideTrip(supabase, { requestId: state.requestId });

      try {
        await dexieDb.riderTripLedger.put(ledgerEntry);
        setLocalCompletedTrips((previous) => [
          historicalTrip,
          ...previous.filter((trip) => trip.tripId !== historicalTrip.tripId),
        ]);
      } catch (cacheError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip Cache]', cacheError);
        setLocalCompletedTrips((previous) => [historicalTrip, ...previous]);
      }

      dispatch({ type: 'COMPLETE_TRIP' });
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip]', error);
      try {
        const row = await fetchRideRequestStatus(supabase, state.requestId);
        const status = String(row?.status || '').toUpperCase();
        if (status === 'COMPLETED') {
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row: row || undefined });
          return;
        }
      } catch (statusError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Complete Trip Status Check]', statusError);
      }
      toast({
        variant: 'destructive',
        title: t('trip.completeFailedTitle'),
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsCompletingTrip(false);
    }
  }, [dispatch, state.activeTrip, state.requestId, t, toast]);

  const handleSubmitRating = React.useCallback(async () => {
    if (!state.completedTrip || !state.requestId) {
      toast({
        variant: 'destructive',
        title: t('rating.incompleteTitle'),
        description: t('rating.incompleteDescription'),
      });
      return;
    }

    const ratingValue = Math.max(1, Math.min(5, Math.round(rating.captain)));
    setIsSubmittingRating(true);

    try {
      await submitRideRating(supabase, {
        requestId: state.requestId,
        captainId: state.completedTrip.captainId,
        ratingValue,
        comment: ratingComment || undefined,
      });

      if (rating.favorite) {
        try {
          const favoriteTrip = toHistoricalTrip(state.completedTrip);
          await dexieDb.favoriteCaptains.put({
            ...favoriteTrip,
            captainId: state.completedTrip.captainId,
            driverId: state.completedTrip.captainId,
            heartedAt: Date.now(),
          } as any);
          if (typeof window !== 'undefined' && state.completedTrip.captainId) {
            window.localStorage.setItem(
              `radar_preferred_captain_${state.completedTrip.captainId}`,
              JSON.stringify({
                captainId: state.completedTrip.captainId,
                driverId: state.completedTrip.captainId,
                captainName: state.completedTrip.captainName,
                fullName: state.completedTrip.captainName,
                captainPhone: state.completedTrip.captainPhone,
                phoneNumber: state.completedTrip.captainPhone,
                vehicleSpecs: `${state.completedTrip.vehicleType} - ${state.completedTrip.vehiclePlate}`,
                savedTimestamp: Date.now(),
              }),
            );
          }
        } catch (cacheError) {
          if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Favorite Captain Cache]', cacheError);
        }
      }

      dispatch({ type: 'SUBMIT_RATING' });
      setRating({ captain: 0, vehicle: 0, favorite: false });
      setRatingComment('');
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Submit Rating]', error);
      toast({
        variant: 'destructive',
        title: t('rating.failedTitle'),
        description: mapRiderMarketplaceError(error),
      });
    } finally {
      setIsSubmittingRating(false);
    }
  }, [dispatch, rating.captain, rating.favorite, ratingComment, state.completedTrip, state.requestId, t, toast]);

  const reset = React.useCallback(() => {
    setRiderCount(1);
    setRating({ captain: 0, vehicle: 0, favorite: false });
    setRatingComment('');
  }, []);

  return {
    localCompletedTrips,
    tripsWithin72Hours,
    isCompletingTrip,
    riderCount,
    setRiderCount,
    rating,
    setRating,
    ratingComment,
    setRatingComment,
    isSubmittingRating,
    handleCompleteTrip,
    handleSubmitRating,
    reset,
  };
}
