'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import type { Trip, User } from '@/core/types';
import { useTranslations } from 'next-intl';
import { generateWeeklyReport } from '../services/captain-rank';
import {
  MIN_OFFER_WAIT_SECONDS,
  MAX_OFFER_WAIT_SECONDS,
  mapRideRequestToTrip,
  type RideOfferRow,
  type RideRequestRow,
} from '../services/driver-trip-mapper';
import { useDriverTripLifecycle } from './use-driver-trip-lifecycle';
import { useDriverBidding } from './use-driver-bidding';

// Re-export constants & mapper for backward compatibility
export {
  MIN_OFFER_WAIT_SECONDS,
  DEFAULT_OFFER_WAIT_SECONDS,
  MAX_OFFER_WAIT_SECONDS,
} from '../services/driver-trip-mapper';

export function useDriverTransactions(
  user: User | null,
  setDriverStatus?: (status: 'active' | 'idle' | 'busy' | 'rating') => void,
  driverStatus?: string,
) {
  const { toast } = useToast();
  const t = useTranslations('transactions');
  const [activeRequest, setActiveReq] = useState<Trip | null>(null);
  const activeReqRef = useRef<Trip | null>(null);
  useEffect(() => {
    activeReqRef.current = activeRequest;
  }, [activeRequest]);

  const [acceptedRider, setAcceptedRider] = useState<User | null>(null);
  const [handshakeAt, setHandshakeAt] = useState<number | null>(null);
  const [isRequestingReport, setIsRequestingReport] = useState(false);

  const captainId = user?.uid || '';

  const {
    pendingOfferRequestId,
    pendingOffersCount,
    isSubmittingOffer,
    isCancellingOffer,
    clearPendingOffer,
    cancelOffer,
    submitOffer,
  } = useDriverBidding({
    captainId,
    driverStatus,
    t,
    toast,
  });

  const {
    isUpdatingTripStep,
    isEndingTrip,
    isCancellingTrip,
    isRatingRider,
    selfCancelledTripId,
    applyCancellationCooldownFromRequest,
    cleanUpAndReset,
    loadAcceptedRequest,
    markArrivedAtPickup,
    startTrip,
    endTrip,
    cancelActiveTrip,
    rateAndFinishTrip,
  } = useDriverTripLifecycle({
    captainId,
    activeRequest,
    setActiveReq,
    activeReqRef,
    acceptedRider,
    setAcceptedRider,
    setHandshakeAt,
    clearPendingOffer,
    setDriverStatus,
    toast,
    t,
  });

  useEffect(() => {
    const pendingTripIds = Object.keys(pendingOffersCount);
    if (pendingTripIds.length === 0 || !captainId) return;
    let isCancelled = false;

    const checkStillPending = async () => {
      const { data: acceptedRows } = await supabase
        .from('ride_requests')
        .select('id, status, accepted_captain_id')
        .in('id', pendingTripIds)
        .eq('accepted_captain_id', captainId);

      if (isCancelled) return;

      const myAccepted = (acceptedRows || []).find(
        (r: any) => String(r.status || '').toUpperCase() === 'ACCEPTED'
      );

      if (myAccepted?.id) {
        const acceptedId = String(myAccepted.id);
        clearPendingOffer();
        try {
          await loadAcceptedRequest(acceptedId);
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] loadAcceptedRequest error:', e);
        }
        return;
      }

      const { data: radarRows, error } = await supabase
        .from('captain_radar_requests')
        .select('id, created_at')
        .in('id', pendingTripIds);

      if (isCancelled) return;
      if (error) return;

      const activeMap = new Map<string, number>();
      for (const row of (radarRows || []) as any[]) {
        const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
        activeMap.set(String(row.id), createdAt);
      }

      for (const tripId of pendingTripIds) {
        if (!activeMap.has(tripId)) {
          clearPendingOffer(tripId);
        }
      }
    };

    const intervalId = window.setInterval(() => void checkStillPending(), 3_000);
    void checkStillPending();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingOffersCount, captainId, clearPendingOffer, loadAcceptedRequest]);

  useEffect(() => {
    if (!activeRequest?.id) return;

    let cancelled = false;

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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${activeRequest.id}`,
        },
        (payload) => {
          const row = payload.new as RideRequestRow | undefined;
          if (!row) return;

          const status = String(row.status || '').toUpperCase();
          if (status === 'COMPLETED' || status === 'CANCELLED') {
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
            return;
          }

          const nextTrip = mapRideRequestToTrip(row);
          if (nextTrip) setActiveReq(nextTrip);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('focus', onFocus);
      void channel.unsubscribe();
    };
  }, [activeRequest?.id, applyCancellationCooldownFromRequest, cleanUpAndReset, selfCancelledTripId, setActiveReq, t, toast]);

  useEffect(() => {
    if (!captainId) return;

    const channel = supabase
      .channel(`driver-offers-${captainId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_offers',
          filter: `captain_id=eq.${captainId}`,
        },
        (payload) => {
          const row = payload.new as RideOfferRow | undefined;
          if (!row) return;

          const status = String(row.status || '').toUpperCase();
          const requestId = String(row.request_id || '');
          if (status === 'ACCEPTED' && requestId) {
            void loadAcceptedRequest(requestId).catch((error) => {
              if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] accepted request load failed:', error);
            });
          }
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [captainId, loadAcceptedRequest]);

  useEffect(() => {
    if (!captainId) return;
    let isCancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('id, created_at, updated_at, started_at')
        .eq('accepted_captain_id', captainId)
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isCancelled || error) return;

      if (!data) {
        try {
          const { data: cancelledRow } = await supabase
            .from('ride_requests')
            .select('id, status, started_at, accepted_at, arrived_at, pickup_eta_minutes, estimated_duration_minutes, estimated_distance_km, cancelled_at, updated_at')
            .eq('accepted_captain_id', captainId)
            .eq('status', 'CANCELLED')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!isCancelled && cancelledRow) {
            applyCancellationCooldownFromRequest(cancelledRow as RideRequestRow, null);
          }
        } catch (cooldownSyncErr) {
          if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] cooldown resync failed:', cooldownSyncErr);
        }
        return;
      }

      const row = data as Record<string, unknown>;
      const requestId = String(row.id || '');
      if (!requestId) return;

      const lastTouch = new Date((row.started_at || row.updated_at || row.created_at || 0) as string).getTime();
      if (lastTouch > 0 && Date.now() - lastTouch > 4 * 60 * 60 * 1000) {
        return;
      }

      try {
        await loadAcceptedRequest(requestId);
      } catch (bootstrapError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] active trip resync failed:', bootstrapError);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [applyCancellationCooldownFromRequest, captainId, loadAcceptedRequest]);

  const requestWeeklyReport = useCallback(async () => {
    setIsRequestingReport(true);
    try {
      const report = await generateWeeklyReport();

      if (!report.success) {
        toast({
          title: t(`rank${report.rank}`) ?? report.rank,
          description: report.message,
        });
        return;
      }

      const { averageRating, heartCount, newRank } = report.stats;
      toast({
        title: t('rankLabel', { rank: t(`rank${newRank}`) ?? newRank }),
        description: t('rankStats', { rating: Number(averageRating).toFixed(2), hearts: heartCount }),
      });
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] weekly report failed:', error);
      toast({
        variant: 'destructive',
        title: t('reportFailedTitle'),
        description: error?.message || t('reportFailedDesc'),
      });
    } finally {
      setIsRequestingReport(false);
    }
  }, [t, toast]);

  return useMemo(() => ({
    activeRequest,
    acceptedRider,
    handshakeAt,
    pendingOfferRequestId,
    pendingOffersCount,
    submitOffer,
    isSubmittingOffer,
    cancelOffer,
    isCancellingOffer,
    markArrivedAtPickup,
    startTrip,
    isUpdatingTripStep,
    endTrip,
    isEndingTrip,
    cancelActiveTrip,
    isCancellingTrip,
    rateAndFinishTrip,
    isRatingRider,
    requestWeeklyReport,
    isRequestingReport,
  }), [
    activeRequest,
    acceptedRider,
    cancelActiveTrip,
    cancelOffer,
    endTrip,
    handshakeAt,
    isCancellingOffer,
    isCancellingTrip,
    isEndingTrip,
    isRatingRider,
    isRequestingReport,
    isSubmittingOffer,
    isUpdatingTripStep,
    markArrivedAtPickup,
    pendingOfferRequestId,
    pendingOffersCount,
    rateAndFinishTrip,
    requestWeeklyReport,
    startTrip,
    submitOffer,
  ]);
}
