'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { Trip } from '@/core/types';
import {
  mapRideRequestToTrip,
  type RideRequestRow,
} from '../../services/driver-transactions-mapper';

interface UseDriverActiveTripRealtimeParams {
  activeRequest: Trip | null;
  setActiveReq: React.Dispatch<React.SetStateAction<Trip | null>>;
  selfCancelledTripId: React.MutableRefObject<string | null>;
  applyCancellationCooldownFromRequest: (row?: RideRequestRow | null, fallbackReq?: Trip | null) => void;
  cleanUpAndReset: () => void;
}

export function useDriverActiveTripRealtime({
  activeRequest,
  setActiveReq,
  selfCancelledTripId,
  applyCancellationCooldownFromRequest,
  cleanUpAndReset,
}: UseDriverActiveTripRealtimeParams) {
  const { toast } = useToast();
  const t = useTranslations('transactions');

  useEffect(() => {
    if (!activeRequest?.id) return;
    let cancelled = false;

    const handleTerminalStatus = (row: RideRequestRow) => {
      const status = String(row.status || '').toUpperCase();
      if (status === 'CANCELLED') {
        applyCancellationCooldownFromRequest(row, activeRequest);
        if (selfCancelledTripId.current !== activeRequest.id) {
          toast({
            title: t('tripCancelledTitle'),
            description: t('tripCancelledDesc'),
            variant: 'warning',
            duration: 12000,
          });
        }
      }
      cleanUpAndReset();
    };

    const reconcileActiveTrip = async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', activeRequest.id)
        .maybeSingle();

      if (cancelled || error || !data) return;

      const row = data as RideRequestRow;
      const status = String(row.status || '').toUpperCase();

      if (status === 'COMPLETED' || status === 'CANCELLED') {
        handleTerminalStatus(row);
        return;
      }

      const nextTrip = mapRideRequestToTrip(row);
      if (nextTrip && !cancelled) {
        setActiveReq((prev) => {
          if (!prev) return nextTrip;
          if (
            prev.status !== nextTrip.status ||
            prev.arrivedAtMs !== nextTrip.arrivedAtMs ||
            prev.startedAtMs !== nextTrip.startedAtMs ||
            prev.cancel_requested_by !== nextTrip.cancel_requested_by
          ) {
            return nextTrip;
          }
          return prev;
        });
      }
    };

    const interval = window.setInterval(() => void reconcileActiveTrip(), 3_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void reconcileActiveTrip(); };
    const onFocus = () => void reconcileActiveTrip();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);

    const channel = supabase
      .channel(`driver-request-status-${activeRequest.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ride_requests', filter: `id=eq.${activeRequest.id}` }, (payload) => {
        const row = payload.new as RideRequestRow | undefined;
        if (!row) return;
        const status = String(row.status || '').toUpperCase();
        if (status === 'COMPLETED' || status === 'CANCELLED') {
          handleTerminalStatus(row);
          return;
        }
        const nextTrip = mapRideRequestToTrip(row);
        if (nextTrip) setActiveReq(nextTrip);
      })
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      void channel.unsubscribe();
    };
  }, [activeRequest?.id, applyCancellationCooldownFromRequest, cleanUpAndReset, selfCancelledTripId, setActiveReq, t, toast]);
}
