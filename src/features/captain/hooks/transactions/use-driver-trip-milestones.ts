'use client';

import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { dexieDb } from '@/lib/dexie-db';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { getServerTime } from '@/lib/server-time';
import type { Trip, User } from '@/core/types';
import { isAlreadyClosedTripError } from '../../services/driver-transactions-mapper';

interface UseDriverTripMilestonesParams {
  activeRequest: Trip | null;
  captainId: string;
  acceptedRider: User | null;
  cleanUpAndReset: () => void;
}

export function useDriverTripMilestones({
  activeRequest,
  captainId,
  acceptedRider,
  cleanUpAndReset,
}: UseDriverTripMilestonesParams) {
  const { toast } = useToast();
  const t = useTranslations('transactions');

  const [isUpdatingTripStep, setIsUpdatingTripStep] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  const updatingStepRef = useRef(false);
  const endingRef = useRef(false);

  const markArrivedAtPickup = useCallback(async () => {
    if (!activeRequest?.id || updatingStepRef.current) return false;
    updatingStepRef.current = true;
    setIsUpdatingTripStep(true);

    try {
      const { error } = await supabase.rpc('captain_arrived_to_pickup', {
        p_request_id: activeRequest.id,
      });

      if (error) throw error;

      toast({
        title: t('tripArrivedTitle'),
        description: t('tripArrivedDesc'),
        variant: 'success',
        duration: 12000,
      });
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] arrival milestone failed:', error);
      toast({
        variant: 'destructive',
        title: t('tripArrivedFailedTitle'),
        description: t('tripArrivedFailedDesc'),
      });
      return false;
    } finally {
      updatingStepRef.current = false;
      setIsUpdatingTripStep(false);
    }
  }, [activeRequest?.id, t, toast]);

  const startTrip = useCallback(async () => {
    if (!activeRequest?.id || updatingStepRef.current) return false;
    updatingStepRef.current = true;
    setIsUpdatingTripStep(true);

    try {
      const { error } = await supabase.rpc('start_ride_trip', {
        p_request_id: activeRequest.id,
      });

      if (error) throw error;

      toast({
        title: t('tripStartedTitle'),
        description: t('tripStartedDesc'),
        variant: 'success',
        duration: 12000,
      });
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] start trip milestone failed:', error);
      toast({
        variant: 'destructive',
        title: t('tripStartedFailedTitle'),
        description: t('tripStartedFailedDesc'),
      });
      return false;
    } finally {
      updatingStepRef.current = false;
      setIsUpdatingTripStep(false);
    }
  }, [activeRequest?.id, t, toast]);

  const endTrip = useCallback(async () => {
    if (!activeRequest?.id || endingRef.current) return false;

    const startedAtMs = activeRequest.startedAtMs;
    const elapsedSec = startedAtMs ? Math.max(0, Math.floor((getServerTime() - startedAtMs) / 1000)) : 0;
    if (startedAtMs && elapsedSec < 3) {
      toast({
        title: 'يرجى الانتظار بضع ثوانٍ',
        description: 'لا يمكن إنهاء الرحلة مباشرة فور بدئها',
        variant: 'warning',
      });
      return false;
    }

    endingRef.current = true;
    setIsEndingTrip(true);

    try {
      const { error } = await supabase.rpc('complete_ride_trip', {
        p_request_id: activeRequest.id,
      });

      if (error) throw error;

      await dexieDb.captainLedger.put({
        requestId: activeRequest.id,
        captainId,
        riderId: activeRequest.riderId || acceptedRider?.uid || '',
        riderName: acceptedRider?.name || '',
        riderPhone: acceptedRider?.phone || '',
        destination: activeRequest.dropoff || 'Destination',
        pickup: activeRequest.pickupLabel || '',
        finalFare: Number(activeRequest.offerPrice || 0),
        completedAt: Date.now(),
        purgeAt: Date.now() + 72 * 60 * 60 * 1000,
      });

      toast({
        title: t('tripEndedTitle'),
        description: t('tripEndedDesc'),
        variant: 'success',
        duration: 12000,
      });
      cleanUpAndReset();
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] complete trip failed:', error);
      try {
        const { data: statusRow } = await supabase
          .from('ride_requests')
          .select('id,status,completed_at,cancelled_at')
          .eq('id', activeRequest.id)
          .maybeSingle();
        const status = String((statusRow as Record<string, unknown> | null)?.status || '').toUpperCase();
        if (status === 'COMPLETED' || status === 'CANCELLED') {
          cleanUpAndReset();
          return true;
        }
      } catch (statusError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] complete trip status check failed:', statusError);
      }
      if (isAlreadyClosedTripError(error)) {
        cleanUpAndReset();
        return true;
      }
      toast({
        variant: 'destructive',
        title: t('tripEndedFailedTitle'),
        description: t('tripEndedFailedDesc'),
      });
      return false;
    } finally {
      endingRef.current = false;
      setIsEndingTrip(false);
    }
  }, [activeRequest, acceptedRider, captainId, cleanUpAndReset, t, toast]);

  return {
    isUpdatingTripStep,
    isEndingTrip,
    markArrivedAtPickup,
    startTrip,
    endTrip,
  };
}
