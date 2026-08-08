import React from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { subscribeToRideRequestStatus } from '../services/rider-server-marketplace';
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

  React.useEffect(() => {
    dispatch({ type: 'RESET_TO_IDLE' });
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
