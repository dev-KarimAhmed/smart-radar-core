'use client';

import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { Trip, User } from '@/core/types';
import {
  isAlreadyClosedTripError,
  type RideRequestRow,
} from '../../services/driver-transactions-mapper';
import { useDriverTripMilestones } from './use-driver-trip-milestones';

interface UseDriverTripLifecycleParams {
  activeRequest: Trip | null;
  activeReqRef: React.MutableRefObject<Trip | null>;
  captainId: string;
  acceptedRider: User | null;
  selfCancelledTripId: React.MutableRefObject<string | null>;
  cleanUpAndReset: () => void;
  applyCancellationCooldownFromRequest: (row?: RideRequestRow | null, fallbackReq?: Trip | null) => void;
  loadAcceptedRequest: (requestId: string) => Promise<void>;
}

export function useDriverTripLifecycle({
  activeRequest,
  activeReqRef,
  captainId,
  acceptedRider,
  selfCancelledTripId,
  cleanUpAndReset,
  applyCancellationCooldownFromRequest,
  loadAcceptedRequest,
}: UseDriverTripLifecycleParams) {
  const { toast } = useToast();
  const t = useTranslations('transactions');

  const {
    isUpdatingTripStep,
    isEndingTrip,
    markArrivedAtPickup,
    startTrip,
    endTrip,
  } = useDriverTripMilestones({
    activeRequest,
    captainId,
    acceptedRider,
    cleanUpAndReset,
  });

  const [isCancellingTrip, setIsCancellingTrip] = useState(false);
  const [isRatingRider, setIsRatingRider] = useState(false);

  const cancellingRef = useRef(false);
  const ratingRef = useRef(false);

  const acknowledgeMutualCancel = useCallback(() => {
    const tripId = activeReqRef.current?.id;
    if (tripId) {
      selfCancelledTripId.current = tripId;
    }
    cleanUpAndReset();
  }, [activeReqRef, cleanUpAndReset, selfCancelledTripId]);

  const cancelActiveTrip = useCallback(async () => {
    if (!activeRequest?.id || cancellingRef.current) return false;
    cancellingRef.current = true;
    setIsCancellingTrip(true);

    const targetRequest = activeRequest;
    const tripId = targetRequest.id;
    selfCancelledTripId.current = tripId;

    try {
      const { error } = await supabase.rpc('captain_cancel_active_trip', {
        p_request_id: tripId,
      });

      if (error) throw error;

      applyCancellationCooldownFromRequest(null, targetRequest);

      toast({
        title: t('tripCancelledTitle'),
        description: t('tripCancelledByCaptainDesc'),
        variant: 'warning',
        duration: 12000,
      });
      cleanUpAndReset();
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] cancel trip failed:', error);

      try {
        const { data: statusRow } = await supabase
          .from('ride_requests')
          .select('id,status,started_at,accepted_at,arrived_at,pickup_eta_minutes,estimated_duration_minutes,estimated_distance_km,cancelled_at,updated_at')
          .eq('id', tripId)
          .maybeSingle();
        const status = String((statusRow as Record<string, unknown> | null)?.status || '').toUpperCase();
        if (status === 'CANCELLED') {
          applyCancellationCooldownFromRequest(statusRow as RideRequestRow, targetRequest);
          cleanUpAndReset();
          return true;
        }
        if (status === 'COMPLETED') {
          cleanUpAndReset();
          return true;
        }
      } catch (statusError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] cancel trip status check failed:', statusError);
      }

      if (isAlreadyClosedTripError(error)) {
        cleanUpAndReset();
        return true;
      }

      if (selfCancelledTripId.current === tripId) {
        selfCancelledTripId.current = null;
      }

      const rawMsg = String((error as { message?: string } | null)?.message || '').toLowerCase();
      if (rawMsg.includes('cannot_cancel_active_trip')) {
        void loadAcceptedRequest(tripId).catch(() => {});
        toast({
          variant: 'warning',
          title: t('tripCancelFailedTitle'),
          description: 'الرحلة بدأت بالفعل ويتطلب إلغاؤها موافقة الراكب عبر زر إيقاف الرحلة.',
        });
        return false;
      }

      toast({
        variant: 'destructive',
        title: t('tripCancelFailedTitle'),
        description: t('tripCancelFailedDesc'),
      });
      return false;
    } finally {
      cancellingRef.current = false;
      setIsCancellingTrip(false);
    }
  }, [activeRequest, applyCancellationCooldownFromRequest, cleanUpAndReset, loadAcceptedRequest, selfCancelledTripId, t, toast]);

  const rateAndFinishTrip = useCallback(async () => {
    if (!activeRequest?.id || ratingRef.current) return;
    ratingRef.current = true;
    setIsRatingRider(true);

    try {
      cleanUpAndReset();
    } finally {
      ratingRef.current = false;
      setIsRatingRider(false);
    }
  }, [activeRequest?.id, cleanUpAndReset]);

  return {
    isUpdatingTripStep,
    isEndingTrip,
    isCancellingTrip,
    isRatingRider,
    markArrivedAtPickup,
    startTrip,
    endTrip,
    acknowledgeMutualCancel,
    cancelActiveTrip,
    rateAndFinishTrip,
  };
}
