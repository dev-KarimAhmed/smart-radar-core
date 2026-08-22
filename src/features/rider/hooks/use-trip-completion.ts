import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import {
  completeRideTrip,
  fetchRideRequestStatus,
  mapRiderMarketplaceError,
} from '../services/rider-server-marketplace';
import { toHistoricalTrip } from '../services/rider-view-format';
import type { HistoricalTrip } from '../components/rider-dashboard';
import type { RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Owns completing an active trip (persisting it to the local trip ledger) and the local
 * "recently completed" cache the trips tab reads from.
 *
 * Rating is NOT here: the rider submits it through RatingModal, which writes the detailed
 * criteria to `reviews`. This hook used to carry a second, star-based submission path via
 * the submit_ride_rating RPC that no component ever called — removed, because two writers
 * of profiles.rating clobber each other. See docs/rating-system-audit.md.
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
    handleCompleteTrip,
    reset,
  };
}
