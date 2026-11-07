import { useCallback, useRef, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getCaptainCancelCooldown } from '../services/captain-cancel-cooldown';
import {
  MIN_OFFER_WAIT_SECONDS,
  MAX_OFFER_WAIT_SECONDS,
  describeOfferSubmitError,
} from '../services/driver-trip-mapper';

interface UseDriverBiddingProps {
  captainId: string;
  driverStatus?: string;
  t: (key: string, values?: any) => string;
  toast: (opts: any) => void;
}

export function useDriverBidding({
  captainId,
  driverStatus,
  t,
  toast,
}: UseDriverBiddingProps) {
  const [pendingOfferRequestId, setPendingOfferRequestId] = useState<string | null>(null);
  const [pendingOffersCount, setPendingOffersCount] = useState<Record<string, number>>({});
  const pendingOfferTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isCancellingOffer, setIsCancellingOffer] = useState(false);
  const submittingRef = useRef(false);
  const cancellingOfferRef = useRef(false);

  const clearPendingOffer = useCallback((tripId?: string | null) => {
    if (tripId) {
      if (pendingOfferTimeoutsRef.current[tripId]) {
        clearTimeout(pendingOfferTimeoutsRef.current[tripId]);
        delete pendingOfferTimeoutsRef.current[tripId];
      }
      setPendingOffersCount((prev) => {
        const next = { ...prev };
        delete next[tripId];
        return next;
      });
      setPendingOfferRequestId((curr) => {
        if (curr === tripId) {
          const remaining = Object.keys(pendingOfferTimeoutsRef.current).filter((id) => id !== tripId);
          return remaining[0] || null;
        }
        return curr;
      });
    } else {
      Object.values(pendingOfferTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
      pendingOfferTimeoutsRef.current = {};
      setPendingOffersCount({});
      setPendingOfferRequestId(null);
    }
  }, []);

  useEffect(() => {
    if (driverStatus === 'idle') {
      clearPendingOffer();
    }
  }, [driverStatus, clearPendingOffer]);

  useEffect(() => {
    return () => {
      Object.values(pendingOfferTimeoutsRef.current).forEach((timer) => clearTimeout(timer));
      pendingOfferTimeoutsRef.current = {};
    };
  }, []);

  const cancelOffer = useCallback(async (tripId?: string | null, silent = false) => {
    const targetRequestId = tripId || pendingOfferRequestId;
    if (!targetRequestId || !captainId) return false;
    if (cancellingOfferRef.current) return false;

    cancellingOfferRef.current = true;
    setIsCancellingOffer(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      let apiSuccess = false;

      try {
        const res = await fetch('/api/captain/cancel-offer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ requestId: targetRequestId, uid: captainId }),
        });

        const data = await res.json();
        if (res.status === 409 || data.error === 'offer_already_accepted') {
          toast({
            variant: 'destructive',
            title: t('offerAlreadyAcceptedTitle'),
            description: t('offerAlreadyAcceptedDesc'),
          });
          clearPendingOffer(targetRequestId);
          return false;
        }

        if (res.ok && data.success) {
          apiSuccess = true;
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Driver bidding] cancel-offer API route error:', e);
      }

      if (!apiSuccess) {
        const { error: rpcErr } = await supabase.rpc('cancel_ride_offer', {
          p_request_id: targetRequestId,
        });

        if (rpcErr) {
          if (rpcErr.message?.includes('offer_already_accepted')) {
            toast({
              variant: 'destructive',
              title: t('offerAlreadyAcceptedTitle'),
              description: t('offerAlreadyAcceptedDesc'),
            });
            clearPendingOffer(targetRequestId);
            return false;
          }
          await supabase
            .from('ride_offers')
            .delete()
            .eq('request_id', targetRequestId)
            .eq('captain_id', captainId);
        }
      }

      clearPendingOffer(targetRequestId);

      if (!silent) {
        toast({
          title: t('offerCancelledTitle'),
          description: t('offerCancelledDesc'),
        });
      }
      return true;
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver bidding] cancel offer failed:', error);
      toast({
        variant: 'destructive',
        title: t('offerCancelFailedTitle'),
        description: t('offerCancelFailedDesc'),
      });
      return false;
    } finally {
      cancellingOfferRef.current = false;
      setIsCancellingOffer(false);
    }
  }, [captainId, clearPendingOffer, pendingOfferRequestId, t, toast]);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number; waitSeconds: number; pricingMode?: 'FREE' | 'APP' | 'TAXI' }) => {
    if (!captainId) {
      toast({
        variant: 'destructive',
        title: t('errorSubmitFailedTitle'),
        description: t('errorAuthRequiredDesc'),
      });
      return false;
    }

    if (!Number.isFinite(payload.offerPrice) || payload.offerPrice <= 0) {
      toast({
        variant: 'destructive',
        title: t('errorInvalidPriceTitle'),
        description: t('errorInvalidPriceDesc'),
      });
      return false;
    }

    if (!Number.isInteger(payload.waitSeconds) || payload.waitSeconds < MIN_OFFER_WAIT_SECONDS) {
      toast({
        variant: 'destructive',
        title: t('errorInvalidWaitTimeTitle'),
        description: t('errorInvalidWaitTimeDesc', { min: MIN_OFFER_WAIT_SECONDS }),
      });
      return false;
    }

    if ((pendingOffersCount[payload.tripId] || 0) > 0) {
      toast({
        variant: 'destructive',
        title: t('errorDuplicateOfferTitle'),
        description: t('errorDuplicateOfferDesc'),
      });
      return false;
    }

    const liveCooldown = getCaptainCancelCooldown();
    if (liveCooldown.isActive) {
      toast({
        variant: 'destructive',
        title: t('cooldownActiveTitle') || 'الرادار غير متاح مؤقتاً',
        description: t('cooldownActiveDesc') || 'يرجى الانتظار، الرادار في وضع التهدئة.',
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
        p_wait_seconds: Math.min(MAX_OFFER_WAIT_SECONDS, Math.max(MIN_OFFER_WAIT_SECONDS, payload.waitSeconds)),
        p_pricing_mode: payload.pricingMode || 'FREE',
      });

      if (error) throw error;

      setPendingOffersCount((prev) => ({
        ...prev,
        [payload.tripId]: 1,
      }));
      setPendingOfferRequestId(payload.tripId);

      if (pendingOfferTimeoutsRef.current[payload.tripId]) {
        clearTimeout(pendingOfferTimeoutsRef.current[payload.tripId]);
      }
      pendingOfferTimeoutsRef.current[payload.tripId] = setTimeout(() => {
        void cancelOffer(payload.tripId, true);
      }, Math.min(MAX_OFFER_WAIT_SECONDS, Math.max(MIN_OFFER_WAIT_SECONDS, payload.waitSeconds)) * 1000);

      toast({
        title: t('offerSubmittedTitle'),
        description: t('offerSubmittedDesc'),
      });
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver bidding] offer submit failed:', error);
      toast({
        variant: 'destructive',
        ...describeOfferSubmitError((error as { message?: string })?.message, t),
      });
      return false;
    } finally {
      submittingRef.current = false;
      setIsSubmittingOffer(false);
    }
  }, [cancelOffer, captainId, pendingOffersCount, t, toast]);

  return {
    pendingOfferRequestId,
    pendingOffersCount,
    isSubmittingOffer,
    isCancellingOffer,
    clearPendingOffer,
    cancelOffer,
    submitOffer,
  };
}
