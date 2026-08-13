'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { dexieDb } from '@/lib/dexie-db';
import { useToast } from '@/hooks/use-toast';
import type { Trip, User } from '@/core/types';

type RideOfferRow = Record<string, unknown>;
type RideRequestRow = Record<string, unknown>;

export function useDriverTransactions(
  user: User | null,
  setDriverStatus?: (status: 'active' | 'idle' | 'busy' | 'rating') => void,
) {
  const { toast } = useToast();
  const [activeRequest, setActiveReq] = useState<Trip | null>(null);
  const [acceptedRider, setAcceptedRider] = useState<User | null>(null);
  const [handshakeAt, setHandshakeAt] = useState<number | null>(null);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isUpdatingTripStep, setIsUpdatingTripStep] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isRatingRider, setIsRatingRider] = useState(false);
  const [isRequestingReport, setIsRequestingReport] = useState(false);
  const submittingRef = useRef(false);
  const updatingStepRef = useRef(false);
  const endingRef = useRef(false);
  const ratingRef = useRef(false);

  const captainId = user?.uid || '';

  const cleanUpAndReset = useCallback(() => {
    setActiveReq(null);
    setAcceptedRider(null);
    setHandshakeAt(null);
    setDriverStatus?.('active');
  }, [setDriverStatus]);

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
          name: String(row.full_name || 'راكب'),
          phone: String(row.phone || ''),
          governorate: String(row.governorate_id || ''),
          district: String(row.district_id || ''),
          rating: Number(row.rating || 5),
        });
      }
    }
  }, [setDriverStatus]);

  useEffect(() => {
    if (!activeRequest?.id) return;

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
            cleanUpAndReset();
            return;
          }

          const nextTrip = mapRideRequestToTrip(row);
          if (nextTrip) setActiveReq(nextTrip);
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [activeRequest?.id, cleanUpAndReset]);

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
              if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] accepted request load failed:', error);
            });
          }
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [captainId, loadAcceptedRequest]);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number }, rejectRequest: (tripId: string) => void) => {
    if (!captainId) {
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال العرض',
        description: 'يجب تسجيل الدخول بحساب كابتن قبل إرسال العرض.',
      });
      return false;
    }

    if (!Number.isFinite(payload.offerPrice) || payload.offerPrice <= 0) {
      toast({
        variant: 'destructive',
        title: 'سعر غير صحيح',
        description: 'اكتب قيمة صحيحة للعرض ثم حاول مرة أخرى.',
      });
      return false;
    }

    if (submittingRef.current) return false;
    submittingRef.current = true;
    setIsSubmittingOffer(true);

    try {
      const { error } = await supabase.rpc('submit_ride_offer', {
        p_request_id: payload.tripId,
        p_offer_price: Number(payload.offerPrice),
      });

      if (error) throw error;

      rejectRequest(payload.tripId);
      toast({
        title: 'تم إرسال العرض',
        description: 'سنخبرك فور قبول الراكب للعرض.',
      });
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] offer submit failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال العرض',
        description: 'تحقق من الاتصال أو صلاحيات قاعدة البيانات ثم حاول مرة أخرى.',
      });
      return false;
    } finally {
      submittingRef.current = false;
      setIsSubmittingOffer(false);
    }
  }, [captainId, toast]);

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
        title: 'تم تحديث الرحلة',
        description: 'تم تأكيد وصولك إلى نقطة الركوب.',
      });
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] arrival milestone failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر تحديث الرحلة',
        description: 'لم يتم تأكيد الوصول من الخادم. حاول مرة أخرى.',
      });
      return false;
    } finally {
      updatingStepRef.current = false;
      setIsUpdatingTripStep(false);
    }
  }, [activeRequest?.id, toast]);

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
        title: 'بدأت الرحلة',
        description: 'تم تأكيد بدء الرحلة من الخادم.',
      });
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] start trip milestone failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر بدء الرحلة',
        description: 'لم يتم تأكيد بدء الرحلة من الخادم. حاول مرة أخرى.',
      });
      return false;
    } finally {
      updatingStepRef.current = false;
      setIsUpdatingTripStep(false);
    }
  }, [activeRequest?.id, toast]);

  const endTrip = useCallback(async () => {
    if (!activeRequest?.id || endingRef.current) return false;
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
        riderId: activeRequest.riderId,
        destination: activeRequest.dropoff || 'وجهة الرحلة',
        finalFare: Number(activeRequest.offerPrice || 0),
        completedAt: Date.now(),
        purgeAt: Date.now() + 72 * 60 * 60 * 1000,
      });

      toast({
        title: 'تم إنهاء الرحلة',
        description: 'تم حفظ الرحلة بعد تأكيد الخادم.',
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
        title: 'تعذر إنهاء الرحلة',
        description: 'لم يقبل الخادم إنهاء الرحلة حالياً. حاول مرة أخرى.',
      });
      return false;
    } finally {
      endingRef.current = false;
      setIsEndingTrip(false);
    }
  }, [activeRequest, captainId, cleanUpAndReset, toast]);

  const rateAndFinishTrip = useCallback(async (rating: number) => {
    if (!activeRequest?.id || !activeRequest.riderId || ratingRef.current) return;
    ratingRef.current = true;
    setIsRatingRider(true);

    try {
      const { error } = await supabase.rpc('submit_ride_rating', {
        p_request_id: activeRequest.id,
        p_captain_id: activeRequest.riderId,
        p_rating_value: Math.min(5, Math.max(1, Math.round(rating))),
      });

      if (error) throw error;

      toast({
        title: 'تم حفظ التقييم',
        description: 'شكراً لك، تم تحديث تقييم الرحلة من الخادم.',
      });
      cleanUpAndReset();
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] rating failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر حفظ التقييم',
        description: 'لم يقبل الخادم التقييم حالياً. يمكنك المحاولة لاحقاً.',
      });
      cleanUpAndReset();
    } finally {
      ratingRef.current = false;
      setIsRatingRider(false);
    }
  }, [activeRequest?.id, activeRequest?.riderId, cleanUpAndReset, toast]);

  const requestWeeklyReport = useCallback(async () => {
    setIsRequestingReport(true);
    try {
      toast({
        title: 'التقرير غير متاح حالياً',
        description: 'سيتم ربط تقارير الأداء التفصيلية بعد اكتمال لوحة الإدارة.',
      });
    } finally {
      setIsRequestingReport(false);
    }
  }, [toast]);

  return useMemo(() => ({
    activeRequest,
    acceptedRider,
    handshakeAt,
    submitOffer,
    isSubmittingOffer,
    markArrivedAtPickup,
    startTrip,
    isUpdatingTripStep,
    endTrip,
    isEndingTrip,
    rateAndFinishTrip,
    isRatingRider,
    requestWeeklyReport,
    isRequestingReport,
  }), [
    activeRequest,
    acceptedRider,
    endTrip,
    handshakeAt,
    isEndingTrip,
    isRatingRider,
    isRequestingReport,
    isSubmittingOffer,
    isUpdatingTripStep,
    markArrivedAtPickup,
    rateAndFinishTrip,
    requestWeeklyReport,
    startTrip,
    submitOffer,
  ]);
}

function mapRideRequestToTrip(row: RideRequestRow | null): Trip | null {
  if (!row) return null;
  const id = String(row.id || '');
  const riderId = String(row.rider_id || '');
  const originLat = toNumber(row.origin_lat);
  const originLng = toNumber(row.origin_lng);
  if (!id || !riderId || originLat === null || originLng === null) return null;

  return {
    id,
    riderId,
    driverId: String(row.accepted_captain_id || ''),
    status: mapRideRequestStatusToTripStatus(row.status),
    pickupCoords: { lat: originLat, lng: originLng },
    exactPickupCoords: { lat: originLat, lng: originLng },
    h3Index: String(row.origin_h3 || ''),
    gridId: String(row.origin_h3 || id),
    dropoff: String(row.destination_address_ar || row.destination_address || 'وجهة الراكب'),
    estimatedDistance: 0,
    estimatedTime: 0,
    offerPrice: toNumber(row.final_fare) ?? toNumber(row.offered_fare) ?? toNumber(row.offer_price) ?? toNumber(row.server_estimated_fare) ?? undefined,
    createdAt: String(row.created_at || ''),
  };
}

function mapRideRequestStatusToTripStatus(value: unknown): Trip['status'] {
  const status = String(value || '').toUpperCase();

  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'ARRIVED') return 'arrived';
  if (status === 'TRIP_ACTIVE' || status === 'ACTIVE' || status === 'STARTED' || status === 'IN_PROGRESS') {
    return 'in_progress';
  }
  if (status === 'ACCEPTED' || status === 'EN_ROUTE') return 'accepted';

  return 'busy';
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isAlreadyClosedTripError(error: unknown) {
  const typedError = error as { message?: string; details?: string; code?: string } | null;
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    message.includes('ride_request_not_active') ||
    message.includes('completed') ||
    message.includes('cancelled') ||
    message.includes('not active')
  );
}
