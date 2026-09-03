'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { dexieDb } from '@/lib/dexie-db';
import { useToast } from '@/hooks/use-toast';
import type { Trip, User } from '@/core/types';
import { buildGoogleMapsUrl, isValidCoordinatePair, normalizeExternalMapUrl } from '../services/ride-location';
import { generateWeeklyReport, type CaptainRankName } from '../services/captain-rank';
import { toEpochMs } from '@/shared/services/trip-countdown';

type RideOfferRow = Record<string, unknown>;
type RideRequestRow = Record<string, unknown>;

export const MIN_OFFER_WAIT_SECONDS = 5;

/**
 * submit_ride_offer refuses out-of-band prices server-side, so these are reachable even
 * when the bidding sheet's own guards pass — a stale server fare on the captain's screen,
 * or a rank that changed between load and submit.
 */
function describeOfferSubmitError(rawMessage: string | undefined) {
  const message = String(rawMessage || '');
  const limit = message.match(/:\s*([\d.]+)\s*$/)?.[1];

  if (message.includes('captain_too_far_from_pickup')) {
    return {
      title: 'الطلب بعيد عنك',
      description: 'أصبحت بعيداً عن نقطة الالتقاط (أكثر من 9 كم). لا يمكن تقديم عرض على هذا الطلب.',
    };
  }

  if (message.includes('offer_below_market_floor')) {
    return {
      title: 'السعر أقل من المسموح',
      description: limit
        ? `أقل سعر مقبول لهذا الطلب هو ${limit}. ارفع سعرك وحاول مرة أخرى.`
        : 'سعرك أقل من الحد المسموح مقابل سعر السوق. ارفع سعرك وحاول مرة أخرى.',
    };
  }

  if (message.includes('offer_above_rank_ceiling')) {
    return {
      title: 'السعر أعلى من سقف رتبتك',
      description: limit
        ? `أعلى سعر مسموح لرتبتك في هذا الطلب هو ${limit}. قلّل سعرك وحاول مرة أخرى.`
        : 'سعرك أعلى من السقف المسموح لرتبتك. قلّل سعرك وحاول مرة أخرى.',
    };
  }

  return {
    title: 'تعذر إرسال العرض',
    description: 'تحقق من الاتصال أو صلاحيات قاعدة البيانات ثم حاول مرة أخرى.',
  };
}

const RANK_LABELS_AR: Record<CaptainRankName, string> = {
  PLATINUM: 'بلاتيني',
  GOLD: 'ذهبي',
  SILVER: 'فضي',
  BRONZE: 'برونزي',
};

export function useDriverTransactions(
  user: User | null,
  setDriverStatus?: (status: 'active' | 'idle' | 'busy' | 'rating') => void,
) {
  const { toast } = useToast();
  const [activeRequest, setActiveReq] = useState<Trip | null>(null);
  const [acceptedRider, setAcceptedRider] = useState<User | null>(null);
  const [handshakeAt, setHandshakeAt] = useState<number | null>(null);
  const [pendingOfferRequestId, setPendingOfferRequestId] = useState<string | null>(null);
  const pendingOfferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isUpdatingTripStep, setIsUpdatingTripStep] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isCancellingTrip, setIsCancellingTrip] = useState(false);
  const [isRatingRider, setIsRatingRider] = useState(false);
  const [isRequestingReport, setIsRequestingReport] = useState(false);
  const submittingRef = useRef(false);
  const updatingStepRef = useRef(false);
  const endingRef = useRef(false);
  const cancellingRef = useRef(false);
  const ratingRef = useRef(false);

  const captainId = user?.uid || '';

  const clearPendingOffer = useCallback(() => {
    if (pendingOfferTimeoutRef.current) {
      clearTimeout(pendingOfferTimeoutRef.current);
      pendingOfferTimeoutRef.current = null;
    }
    setPendingOfferRequestId(null);
  }, []);

  // The waitSeconds timeout above is a last-resort fallback — this checks the
  // actual request directly so a stale lock clears immediately once the rider
  // cancels (or picks a different captain), instead of blocking every other
  // request as "you have a pending offer" until the countdown runs out.
  //
  // This can't query `ride_requests` directly: its RLS policy only allows a
  // captain to SELECT a row they're the accepted captain for (or the rider,
  // never true here) — a request this captain merely bid on but never got
  // accepted for returns zero rows, silently, no error. `captain_radar_requests`
  // is the view the whole radar system already reads through instead, and it
  // only ever returns rows that are still PENDING — so "not found" here
  // reliably means this offer is moot (cancelled, or a different captain got
  // accepted), whether or not it was ever accepted for this captain (that
  // path already clears the lock separately, via loadAcceptedRequest).
  useEffect(() => {
    if (!pendingOfferRequestId) return;
    let isCancelled = false;

    const checkStillPending = async () => {
      const { data, error } = await supabase
        .from('captain_radar_requests')
        .select('id')
        .eq('id', pendingOfferRequestId)
        .maybeSingle();

      if (isCancelled || error) return;
      if (!data) clearPendingOffer();
    };

    const intervalId = window.setInterval(() => void checkStillPending(), 8_000);
    void checkStillPending();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingOfferRequestId, clearPendingOffer]);

  const cleanUpAndReset = useCallback(() => {
    setActiveReq(null);
    setAcceptedRider(null);
    setHandshakeAt(null);
    clearPendingOffer();
    setDriverStatus?.('active');
  }, [clearPendingOffer, setDriverStatus]);

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
          name: String(row.full_name || 'راكب'),
          phone: String(row.phone || ''),
          governorate: String(row.governorate_id || ''),
          district: String(row.district_id || ''),
          rating: Number(row.rating || 5),
        });
      }
    }
  }, [clearPendingOffer, setDriverStatus]);

  useEffect(() => {
    return () => {
      if (pendingOfferTimeoutRef.current) clearTimeout(pendingOfferTimeoutRef.current);
    };
  }, []);

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
            if (status === 'CANCELLED') {
              toast({
                title: 'تم إلغاء الرحلة',
                description: 'قام الراكب بإلغاء هذه الرحلة.',
              });
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

  // Resync on mount/reload — `activeRequest` otherwise only ever populates via
  // the realtime channel above (a live "offer accepted" event), so a reload
  // mid-trip previously lost all trace of it even though it's still active on
  // the server. Look up the captain's own still-open request and re-hydrate
  // through the same `loadAcceptedRequest` path the live flow already uses.
  useEffect(() => {
    if (!captainId) return;
    let isCancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('id')
        .eq('accepted_captain_id', captainId)
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isCancelled || error || !data) return;

      const requestId = String((data as Record<string, unknown>).id || '');
      if (!requestId) return;

      try {
        await loadAcceptedRequest(requestId);
      } catch (bootstrapError) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] active trip resync failed:', bootstrapError);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [captainId, loadAcceptedRequest]);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number; waitSeconds: number }) => {
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

    if (!Number.isInteger(payload.waitSeconds) || payload.waitSeconds < MIN_OFFER_WAIT_SECONDS) {
      toast({
        variant: 'destructive',
        title: 'مدة الانتظار غير صحيحة',
        description: `حدد عدد ثواني ظهور العرض (على الأقل ${MIN_OFFER_WAIT_SECONDS} ثواني) ثم حاول مرة أخرى.`,
      });
      return false;
    }

    if (pendingOfferRequestId && pendingOfferRequestId !== payload.tripId) {
      toast({
        variant: 'destructive',
        title: 'لديك عرض قيد الانتظار',
        description: 'انتظر رد الراكب على عرضك الحالي قبل تقديم عرض جديد.',
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
        p_wait_seconds: payload.waitSeconds,
      });

      if (error) throw error;

      // The card for this request stays visible on the radar (in a "pending"
      // state, per the UI layer) instead of being hidden like an ignored
      // request — the captain should still see their own submitted bid.
      // Cleared after exactly `waitSeconds` — the same window the rider's
      // offer countdown uses — so the captain is freed to bid again the
      // moment the offer disappears from the rider's screen, not blocked
      // for some unrelated fixed duration.
      setPendingOfferRequestId(payload.tripId);
      if (pendingOfferTimeoutRef.current) clearTimeout(pendingOfferTimeoutRef.current);
      pendingOfferTimeoutRef.current = setTimeout(() => setPendingOfferRequestId(null), payload.waitSeconds * 1000);
      toast({
        title: 'تم إرسال العرض',
        description: 'سنخبرك فور قبول الراكب للعرض.',
      });
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] offer submit failed:', error);
      toast({
        variant: 'destructive',
        ...describeOfferSubmitError((error as { message?: string })?.message),
      });
      return false;
    } finally {
      submittingRef.current = false;
      setIsSubmittingOffer(false);
    }
  }, [captainId, pendingOfferRequestId, toast]);

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

  const cancelActiveTrip = useCallback(async () => {
    if (!activeRequest?.id || cancellingRef.current) return false;
    cancellingRef.current = true;
    setIsCancellingTrip(true);

    try {
      const { error } = await supabase.rpc('captain_cancel_active_trip', {
        p_request_id: activeRequest.id,
      });

      if (error) throw error;

      toast({
        title: 'تم إلغاء الرحلة',
        description: 'تم إلغاء الرحلة بنجاح.',
      });
      cleanUpAndReset();
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] cancel trip failed:', error);
      if (isAlreadyClosedTripError(error)) {
        cleanUpAndReset();
        return true;
      }
      toast({
        variant: 'destructive',
        title: 'تعذر إلغاء الرحلة',
        description: 'لم يقبل الخادم إلغاء الرحلة حالياً. حاول مرة أخرى.',
      });
      return false;
    } finally {
      cancellingRef.current = false;
      setIsCancellingTrip(false);
    }
  }, [activeRequest?.id, cleanUpAndReset, toast]);

  /**
   * The captain rates the rider through DriverRatingModal (captain-view renders it on
   * screen === 'RATING_MODAL'), which writes the detailed criteria to `reviews`. This hook
   * only has to close the trip out afterwards.
   *
   * It used to call the submit_ride_rating RPC with p_captain_id = riderId, which that
   * function rejects unconditionally — it raises `not_request_owner` for any caller that is
   * not the request's rider, and a captain never is. So it always failed, and had it ever
   * succeeded it would have written the rider's id into rider_ratings.captain_id.
   */
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

  const requestWeeklyReport = useCallback(async () => {
    setIsRequestingReport(true);
    try {
      const report = await generateWeeklyReport();

      if (!report.success) {
        // COURT_001 = no new ratings since the last report, COURT_002 = still inside the
        // 72h disciplinary lock. Both are legitimate answers, not failures.
        toast({
          title: RANK_LABELS_AR[report.rank] ?? report.rank,
          description: report.message,
        });
        return;
      }

      const { averageRating, heartCount, newRank } = report.stats;
      toast({
        title: `رتبتك: ${RANK_LABELS_AR[newRank] ?? newRank}`,
        description: `متوسط التقييم ${Number(averageRating).toFixed(2)} · ${heartCount} قلب`,
      });
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver transactions] weekly report failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر تجهيز التقرير',
        description: error?.message || 'حاول مرة أخرى بعد قليل.',
      });
    } finally {
      setIsRequestingReport(false);
    }
  }, [toast]);

  return useMemo(() => ({
    activeRequest,
    acceptedRider,
    handshakeAt,
    pendingOfferRequestId,
    submitOffer,
    isSubmittingOffer,
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
    endTrip,
    handshakeAt,
    isCancellingTrip,
    isEndingTrip,
    isRatingRider,
    isRequestingReport,
    isSubmittingOffer,
    isUpdatingTripStep,
    markArrivedAtPickup,
    pendingOfferRequestId,
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
  if (!id || !riderId || !isValidCoordinatePair(originLat, originLng)) return null;

  const safeOriginLat = originLat as number;
  const safeOriginLng = originLng as number;
  const pickupGoogleMapsUrl = normalizeExternalMapUrl(row.origin_google_maps_url) || buildGoogleMapsUrl(safeOriginLat, safeOriginLng) || undefined;
  const estimatedDistance = firstPositiveNumber(row.estimated_distance_km, row.route_distance_km, row.trip_distance_km);
  const estimatedTime = firstPositiveNumber(row.estimated_duration_minutes, row.route_duration_minutes, row.trip_duration_minutes);
  const destinationLat = toNumber(row.destination_lat);
  const destinationLng = toNumber(row.destination_lng);

  return {
    id,
    riderId,
    driverId: String(row.accepted_captain_id || ''),
    status: mapRideRequestStatusToTripStatus(row.status),
    pickupCoords: { lat: safeOriginLat, lng: safeOriginLng },
    exactPickupCoords: { lat: safeOriginLat, lng: safeOriginLng },
    pickupLabel: String(row.origin_address || ''),
    pickupGoogleMapsUrl,
    pickupLocationIsApproximate: false,
    h3Index: String(row.origin_h3 || ''),
    gridId: String(row.origin_h3 || id),
    dropoff: String(row.destination_address_ar || row.destination_address || 'وجهة الراكب'),
    dropoffCoords: isValidCoordinatePair(destinationLat, destinationLng)
      ? { lat: destinationLat as number, lng: destinationLng as number }
      : undefined,
    estimatedDistance: estimatedDistance ?? undefined,
    estimatedTime: estimatedTime ?? undefined,
    // The trip countdown's anchors. Carried through the realtime UPDATE re-map above, so
    // pressing "arrived"/"start" moves the captain's timer to the next phase without a fetch.
    acceptedAtMs: toEpochMs(row.accepted_at),
    arrivedAtMs: toEpochMs(row.arrived_at),
    startedAtMs: toEpochMs(row.started_at),
    pickupEtaMinutes: firstPositiveNumber(row.pickup_eta_minutes),
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

function firstPositiveNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = toNumber(value);
    if (parsed !== null && parsed > 0) return parsed;
  }
  return null;
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
