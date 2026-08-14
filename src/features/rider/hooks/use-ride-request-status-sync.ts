import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import { fetchRideOffers, subscribeToRideRequestStatus } from '../services/rider-server-marketplace';
import { getLocalizedMarketplaceError } from '../services/rider-offer-presentation';
import type { RiderDestination, RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';

/**
 * Owns the server ride-request status subscription that drives most
 * state-machine transitions, the active-trip ETA countdown, and the "open
 * destination selection" entry point (triggered directly or via the
 * `rider-open-destination` window event).
 */
export function useRideRequestStatusSync(params: {
  userId: string | undefined;
  selectedDraftDestination: RiderDestination | null;
  language: AppLanguage;
  state: RiderMachineState;
  dispatch: React.Dispatch<RiderMachineAction>;
  pendingAcceptedOfferIdRef: React.RefObject<string | null>;
}) {
  const { userId, selectedDraftDestination, language, state, dispatch, pendingAcceptedOfferIdRef } = params;

  const { toast } = useToast();
  const t = useTranslations('riderView');

  const [etaSeconds, setEtaSeconds] = React.useState(0);

  // The status-subscription effect below only re-subscribes when requestId
  // changes (the same id spans accepted -> arrived -> started), so its
  // closure would otherwise see a stale `state.screen` from whenever the
  // subscription was created. Read the live value through this ref instead.
  const screenRef = React.useRef(state.screen);
  React.useEffect(() => {
    screenRef.current = state.screen;
  }, [state.screen]);

  const openDestination = React.useCallback(() => {
    dispatch({ type: 'OPEN_DESTINATION' });
    if (selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination]);

  React.useEffect(() => {
    if (state.screen === 'DESTINATION_SELECTION' && selectedDraftDestination) {
      dispatch({ type: 'CONFIRM_DESTINATION', destination: selectedDraftDestination });
    }
  }, [dispatch, selectedDraftDestination, state.screen]);

  // Resync on mount/reload — without this, a reload mid-trip previously wiped
  // the whole flow back to the idle map even though the ride_requests row was
  // still active on the server. Look up the rider's own still-open request
  // and rebuild the screen it was on instead of blindly resetting.
  React.useEffect(() => {
    if (!userId) {
      dispatch({ type: 'RESET_TO_IDLE' });
      return;
    }

    let isCancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('rider_id', userId)
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isCancelled) return;

      dispatch({ type: 'RESET_TO_IDLE' });

      if (error || !data) return;

      const row = data as Record<string, unknown>;
      const requestId = String(row.id || '');
      if (!requestId) return;

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING' || status === 'RECEIVING_OFFERS') {
        dispatch({ type: 'REHYDRATE_SEARCHING', requestId });
        return;
      }

      let offers: Offer[] = [];
      try {
        offers = await fetchRideOffers(supabase, requestId);
      } catch (offersError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider status sync] resync offers fetch failed:', offersError);
      }

      if (isCancelled) return;
      dispatch({ type: 'REHYDRATE_ACTIVE_TRIP', requestId, row, offers });
    })();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, userId]);

  React.useEffect(() => {
    window.addEventListener('rider-open-destination', openDestination);
    return () => window.removeEventListener('rider-open-destination', openDestination);
  }, [openDestination]);

  React.useEffect(() => {
    if (!state.requestId) return;

    return subscribeToRideRequestStatus(
      supabase,
      state.requestId,
      (row) => {
        const status = String(row.status || '').toUpperCase();

        if (status === 'RECEIVING_OFFERS') {
          dispatch({ type: 'SERVER_STATUS_RECEIVING_OFFERS' });
        }

        if (
          status === 'ACCEPTED'
          || status === 'EN_ROUTE'
          || status === 'ARRIVED'
          || status === 'STARTED'
          || status === 'TRIP_ACTIVE'
          || status === 'ACTIVE'
          || status === 'IN_PROGRESS'
        ) {
          dispatch({
            type: 'SERVER_STATUS_ACCEPTED',
            row: {
              ...row,
              selected_offer_id: row.selected_offer_id || row.accepted_offer_id || pendingAcceptedOfferIdRef.current,
            },
          });
          if (status === 'ACCEPTED') {
            pendingAcceptedOfferIdRef.current = null;
          }
        }

        if (status === 'CANCELLED') {
          pendingAcceptedOfferIdRef.current = null;
          // A cancellation arriving while a trip is already underway can
          // only be the captain's doing (the rider's own cancel button
          // already shows its own toast) — flag it explicitly here.
          if (screenRef.current === 'TRIP_ACTIVE') {
            toast({
              title: t('request.cancelledByCaptainTitle'),
              description: t('request.cancelledByCaptainDescription'),
            });
          }
          dispatch({ type: 'REQUEST_CANCELLED' });
        }

        if (status === 'COMPLETED') {
          pendingAcceptedOfferIdRef.current = null;
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
        }
      },
      (error) => {
        toast({
          variant: 'destructive',
          title: t('request.updateFailedTitle'),
          description: getLocalizedMarketplaceError(error, language, {
            permissionDenied: t('errors.permissionDenied'),
            authRequired: t('errors.authRequired'),
            network: t('errors.network'),
            fareCalculation: t('errors.fareCalculation'),
            missingColumns: t('errors.missingColumns'),
            invalidStatus: t('errors.invalidStatus'),
            foreignKeyMismatch: t('errors.foreignKeyMismatch'),
            duplicateActive: t('errors.duplicateActive'),
            generic: t('errors.generic'),
          }),
        });
      },
    );
  }, [dispatch, language, pendingAcceptedOfferIdRef, state.requestId, t, toast]);

  React.useEffect(() => {
    if (!state.activeTrip) {
      setEtaSeconds(0);
      return;
    }

    setEtaSeconds(state.activeTrip.etaSeconds);
    const interval = window.setInterval(() => {
      setEtaSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.activeTrip]);

  const reset = React.useCallback(() => {
    setEtaSeconds(0);
  }, []);

  return {
    etaSeconds,
    openDestination,
    reset,
  };
}
