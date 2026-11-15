import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { subscribeToRideRequestStatus } from '../../services/rider-server-marketplace';
import type { RiderMachineAction } from '../../state/rider-state-machine';

export function useRequestRealtimeSub(params: {
  requestId: string | null;
  language: AppLanguage;
  dispatch: React.Dispatch<RiderMachineAction>;
  pendingAcceptedOfferIdRef: React.MutableRefObject<string | null>;
  announcedArrivalForRef: React.MutableRefObject<string | null>;
  arrivalToastDismissRef: React.MutableRefObject<(() => void) | null>;
  t: (key: string) => string;
  toast: (opts: any) => any;
}) {
  const {
    requestId,
    language,
    dispatch,
    pendingAcceptedOfferIdRef,
    announcedArrivalForRef,
    arrivalToastDismissRef,
    t,
    toast,
  } = params;

  React.useEffect(() => {
    if (!requestId) return;

    return subscribeToRideRequestStatus(
      supabase,
      requestId,
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

          if (status === 'ARRIVED' && announcedArrivalForRef.current !== requestId) {
            announcedArrivalForRef.current = requestId;
            const arrivalToast = toast({
              title: t('trip.driverArrivedTitle'),
              description: t('trip.driverArrivedNote'),
              variant: 'success',
              duration: 15000,
            });
            arrivalToastDismissRef.current = arrivalToast?.dismiss || null;
            try {
              navigator.vibrate?.([120, 60, 120]);
            } catch {}
          }
        }

        if (status === 'CANCELLED') {
          arrivalToastDismissRef.current?.();
          arrivalToastDismissRef.current = null;
          dispatch({ type: 'REQUEST_CANCELLED' });
        }

        if (status === 'COMPLETED') {
          arrivalToastDismissRef.current?.();
          arrivalToastDismissRef.current = null;
          dispatch({ type: 'SERVER_STATUS_COMPLETED', row });
        }
      },
      (error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Rider status sync] Realtime subscription notice:', error);
        }
      },
    );
  }, [dispatch, language, requestId, t, toast, pendingAcceptedOfferIdRef, announcedArrivalForRef, arrivalToastDismissRef]);
}

