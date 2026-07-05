'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '../use-toast';
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
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isRatingRider, setIsRatingRider] = useState(false);
  const [isRequestingReport, setIsRequestingReport] = useState(false);
  const submittingRef = useRef(false);
  const endingRef = useRef(false);
  const ratingRef = useRef(false);

  const captainId = user?.uid || '';

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
    setDriverStatus?.('busy');

    if (trip.riderId) {
      const { data: riderProfile } = await supabase
        .from('profiles')
        .select('id,full_name,phone,rating,country_id,governorate_id,district_id')
        .eq('id', trip.riderId)
        .maybeSingle();

      if (riderProfile) {
        setAcceptedRider({
          uid: String((riderProfile as Record<string, unknown>).id),
          role: 'rider',
          name: String((riderProfile as Record<string, unknown>).full_name || 'Rider'),
          phone: String((riderProfile as Record<string, unknown>).phone || ''),
          governorate: '',
          district: '',
          rating: Number((riderProfile as Record<string, unknown>).rating || 5),
        });
      }
    }
  }, [setDriverStatus]);

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
              if (import.meta.env.DEV) console.warn('[Driver transactions] accepted request load failed:', error);
            });
          }
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [captainId, loadAcceptedRequest]);

  const cleanUpAndReset = useCallback(() => {
    setActiveReq(null);
    setAcceptedRider(null);
    setDriverStatus?.('active');
  }, [setDriverStatus]);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number }, rejectRequest: (tripId: string) => void) => {
    if (!captainId) {
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال العرض',
        description: 'يجب تسجيل الدخول بحساب كابتن قبل إرسال العرض.',
      });
      return;
    }

    if (!Number.isFinite(payload.offerPrice) || payload.offerPrice <= 0) {
      toast({
        variant: 'destructive',
        title: 'سعر غير صحيح',
        description: 'اكتب قيمة صحيحة للعرض ثم حاول مرة أخرى.',
      });
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmittingOffer(true);

    try {
      const { error } = await supabase.from('ride_offers').insert({
        request_id: payload.tripId,
        captain_id: captainId,
        offer_price: Number(payload.offerPrice),
        status: 'PENDING',
      });

      if (error) throw error;

      rejectRequest(payload.tripId);
      toast({
        title: 'تم إرسال العرض',
        description: 'سنخبرك فور قبول الراكب للعرض.',
      });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Driver transactions] offer insert failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر إرسال العرض',
        description: 'تحقق من الاتصال أو صلاحيات قاعدة البيانات ثم حاول مرة أخرى.',
      });
    } finally {
      submittingRef.current = false;
      setIsSubmittingOffer(false);
    }
  }, [captainId, toast]);

  const endTrip = useCallback(async () => {
    if (!activeRequest?.id || endingRef.current) return;
    endingRef.current = true;
    setIsEndingTrip(true);

    try {
      const { error } = await supabase.rpc('complete_ride_trip', {
        p_request_id: activeRequest.id,
      });

      if (error) throw error;

      toast({
        title: 'تم إنهاء الرحلة',
        description: 'تم حفظ الرحلة في السجل وسيتم تحديث بيانات الحساب من الخادم.',
      });
      cleanUpAndReset();
    } catch (error) {
      if (import.meta.env.DEV) console.warn('[Driver transactions] complete trip failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر إنهاء الرحلة',
        description: 'لم يقبل الخادم إنهاء الرحلة حالياً. حاول مرة أخرى.',
      });
    } finally {
      endingRef.current = false;
      setIsEndingTrip(false);
    }
  }, [activeRequest?.id, cleanUpAndReset, toast]);

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
      if (import.meta.env.DEV) console.warn('[Driver transactions] rating failed:', error);
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
    submitOffer,
    isSubmittingOffer,
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
    isEndingTrip,
    isRatingRider,
    isRequestingReport,
    isSubmittingOffer,
    rateAndFinishTrip,
    requestWeeklyReport,
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
    status: 'busy',
    pickupCoords: { lat: originLat, lng: originLng },
    exactPickupCoords: { lat: originLat, lng: originLng },
    h3Index: String(row.origin_h3 || ''),
    gridId: String(row.origin_h3 || id),
    dropoff: String(row.destination_address_ar || row.destination_address || 'وجهة الراكب'),
    estimatedDistance: 0,
    estimatedTime: 0,
    offerPrice: toNumber(row.final_fare) ?? toNumber(row.server_estimated_fare) ?? undefined,
    createdAt: String(row.created_at || ''),
  };
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
