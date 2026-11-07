import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { dexieDb } from '@/lib/dexie-db';
import { getServerTime } from '@/lib/server-time';
import type { Trip, User } from '@/core/types';
import {
  setCaptainCancelCooldown,
  clearCaptainCancelCooldown,
  calculateRemainingCooldown,
} from '../services/captain-cancel-cooldown';
import {
  mapRideRequestToTrip,
  isAlreadyClosedTripError,
  type RideRequestRow,
} from '../services/driver-trip-mapper';

interface UseDriverTripLifecycleProps {
  captainId: string;
  activeRequest: Trip | null;
  setActiveReq: React.Dispatch<React.SetStateAction<Trip | null>>;
  activeReqRef: React.MutableRefObject<Trip | null>;
  acceptedRider: User | null;
  setAcceptedRider: React.Dispatch<React.SetStateAction<User | null>>;
  setHandshakeAt: React.Dispatch<React.SetStateAction<number | null>>;
  clearPendingOffer: (tripId?: string | null) => void;
  setDriverStatus?: (status: 'active' | 'idle' | 'busy' | 'rating') => void;
  toast: (opts: any) => void;
  t: (key: string, values?: any) => string;
}

export function useDriverTripLifecycle({
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
}: UseDriverTripLifecycleProps) {
  const [isUpdatingTripStep, setIsUpdatingTripStep] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isCancellingTrip, setIsCancellingTrip] = useState(false);
  const [isRatingRider, setIsRatingRider] = useState(false);

  const updatingStepRef = useRef(false);
  const endingRef = useRef(false);
  const cancellingRef = useRef(false);
  const ratingRef = useRef(false);
  const selfCancelledTripId = useRef<string | null>(null);

  const applyCancellationCooldownFromRequest = useCallback(
    (row?: RideRequestRow | null, fallbackReq?: Trip | null) => {
      const targetReq = fallbackReq || activeReqRef.current;
      const tripMinutes = Math.max(
        1,
        Number(row?.estimated_duration_minutes || targetReq?.estimatedDurationMinutes || targetReq?.estimatedTime) > 0
          ? Math.round(Number(row?.estimated_duration_minutes || targetReq?.estimatedDurationMinutes || targetReq?.estimatedTime))
          : Number(row?.estimated_distance_km || targetReq?.estimatedDistance) > 0
            ? Math.max(5, Math.round(Number(row?.estimated_distance_km || targetReq?.estimatedDistance) * 2.5))
            : 20
      );

      const cancellationTime = (row?.cancelled_at || row?.updated_at || getServerTime()) as string | number | Date;
      const status = String(row?.status || targetReq?.status || '').toUpperCase();
      const isTripActive = status === 'TRIP_ACTIVE' || status === 'IN_PROGRESS';
      const rawStartedAt = (row?.started_at as string | undefined) || targetReq?.startedAtMs;
      const startedAt = isTripActive ? rawStartedAt : null;
      const acceptedAt = (row?.accepted_at as string | undefined) || targetReq?.acceptedAtMs;
      const arrivedAt = (row?.arrived_at as string | undefined) || targetReq?.arrivedAtMs;
      const pickupEta = (row?.pickup_eta_minutes as number | undefined) ?? targetReq?.pickup_eta_minutes;

      const { remainingMinutes, remainingSeconds, scheduledEndTimeMs } = calculateRemainingCooldown({
        totalTripMinutes: tripMinutes,
        startedAtMs: startedAt,
        acceptedAtMs: acceptedAt,
        arrivedAtMs: arrivedAt,
        pickupEtaMinutes: pickupEta,
        cancellationTime,
      });

      if (remainingSeconds > 0) {
        setCaptainCancelCooldown(remainingMinutes, remainingSeconds, scheduledEndTimeMs);
      } else {
        clearCaptainCancelCooldown();
      }

      return { remainingMinutes, remainingSeconds, scheduledEndTimeMs };
    },
    [activeReqRef]
  );

  const cleanUpAndReset = useCallback(() => {
    setActiveReq(null);
    setAcceptedRider(null);
    setHandshakeAt(null);
    selfCancelledTripId.current = null;
    clearPendingOffer();
    setDriverStatus?.('active');
    if (captainId) {
      void (async () => {
        try {
          await supabase.rpc('set_captain_status', { p_status: 'active' });
        } catch {}
        try {
          await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('id', captainId);
        } catch {}
      })();
    }
  }, [captainId, clearPendingOffer, setActiveReq, setAcceptedRider, setDriverStatus, setHandshakeAt]);

  const loadAcceptedRequest = useCallback(async (requestId: string) => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) throw error;

    const trip = mapRideRequestToTrip(data as RideRequestRow);
    if (!trip) throw new Error('ride_request_missing_required_fields');

    setActiveReq(trip);
    setHandshakeAt(Date.now());
    clearPendingOffer();
    setDriverStatus?.('busy');

    if (trip.riderId) {
      const { data: riderProfile } = await supabase
        .from('profiles')
        .select('id,full_name,phone,rating,country_id,governorate_id,district_id')
        .eq('id', trip.riderId)
        .maybeSingle();

      if (riderProfile) {
        const row = riderProfile as Record<string, unknown>;
        setAcceptedRider({
          uid: String(row.id),
          role: 'rider',
          name: String(row.full_name || 'Rider'),
          phone: String(row.phone || ''),
          governorate: String(row.governorate_id || ''),
          district: String(row.district_id || ''),
          rating: Number(row.rating || 5),
        });
      }
    }
  }, [clearPendingOffer, setActiveReq, setAcceptedRider, setDriverStatus, setHandshakeAt]);

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
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] arrival milestone failed:', error);
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
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] start trip milestone failed:', error);
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
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] complete trip failed:', error);
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
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] complete trip status check failed:', statusError);
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

  const cancelActiveTrip = useCallback(async () => {
    if (!activeRequest?.id || cancellingRef.current) return false;
    cancellingRef.current = true;
    setIsCancellingTrip(true);
    
    const tripId = activeRequest.id;
    selfCancelledTripId.current = tripId;
    
    applyCancellationCooldownFromRequest(null, activeRequest);

    try {
      const { error } = await supabase.rpc('captain_cancel_active_trip', {
        p_request_id: tripId,
      });

      if (error) throw error;

      toast({
        title: t('tripCancelledTitle'),
        description: t('tripCancelledByCaptainDesc'),
        variant: 'warning',
        duration: 12000,
      });
      cleanUpAndReset();
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] cancel trip failed:', error);
      if (isAlreadyClosedTripError(error)) {
        cleanUpAndReset();
        return true;
      }
      if (selfCancelledTripId.current === tripId) {
        selfCancelledTripId.current = null;
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
  }, [activeRequest, applyCancellationCooldownFromRequest, cleanUpAndReset, t, toast]);

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
    selfCancelledTripId,
    applyCancellationCooldownFromRequest,
    cleanUpAndReset,
    loadAcceptedRequest,
    markArrivedAtPickup,
    startTrip,
    endTrip,
    cancelActiveTrip,
    rateAndFinishTrip,
  };
}
