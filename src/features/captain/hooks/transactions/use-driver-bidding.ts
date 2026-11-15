'use client';

import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  MIN_OFFER_WAIT_SECONDS,
  MAX_OFFER_WAIT_SECONDS,
  describeOfferSubmitError,
} from '../../services/driver-transactions-mapper';
import { getCaptainCancelCooldown } from '../../services/captain-cancel-cooldown';
import { executeCaptainOfferCancel } from './driver-cancel-offer-service';
import type { Trip } from '@/core/types';

interface UseDriverBiddingParams {
  captainId: string;
  activeReqRef: React.MutableRefObject<Trip | null>;
}

export function useDriverBidding({ captainId, activeReqRef }: UseDriverBiddingParams) {
  const { toast } = useToast();
  const t = useTranslations('transactions');

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
      Object.values(pendingOfferTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
      pendingOfferTimeoutsRef.current = {};
      setPendingOffersCount({});
      setPendingOfferRequestId(null);
    }
  }, []);

  const cancelOffer = useCallback(async (tripId?: string | null, silent = false) => {
    const targetRequestId = tripId || pendingOfferRequestId;
    if (!targetRequestId || !captainId) return false;
    if (cancellingOfferRef.current) return false;

    cancellingOfferRef.current = true;
    setIsCancellingOffer(true);

    try {
      const result = await executeCaptainOfferCancel(targetRequestId, captainId);

      if (result.alreadyAccepted) {
        toast({
          variant: 'destructive',
          title: t('offerAlreadyAcceptedTitle'),
          description: t('offerAlreadyAcceptedDesc'),
        });
        clearPendingOffer(targetRequestId);
        return false;
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
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] cancel offer failed:', error);
      if (!silent) {
        toast({
          variant: 'destructive',
          title: t('offerCancelFailedTitle'),
          description: t('offerCancelFailedDesc'),
        });
      }
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

    if (activeReqRef.current) {
      toast({
        variant: 'destructive',
        title: t('errorCaptainBusyTitle'),
        description: t('errorCaptainBusyDesc'),
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
      const { data: activeTrips } = await supabase
        .from('ride_requests')
        .select('id, status, started_at, updated_at, created_at')
        .eq('accepted_captain_id', captainId)
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .order('updated_at', { ascending: false })
        .limit(3);

      const nowMs = Date.now();
      const hasBusyTrip = Array.isArray(activeTrips) && activeTrips.some((row) => {
        const st = String((row as Record<string, unknown>)?.status || '').toUpperCase();
        if (!['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'STARTED', 'TRIP_ACTIVE', 'ACTIVE', 'IN_PROGRESS'].includes(st)) {
          return false;
        }
        const rec = row as Record<string, unknown>;
        const touchRaw = rec.started_at || rec.updated_at || rec.created_at;
        if (!touchRaw) return true;
        const touchMs = Date.parse(String(touchRaw));
        return !Number.isFinite(touchMs) || nowMs - touchMs <= 4 * 60 * 60 * 1000;
      });

      if (hasBusyTrip) {
        throw new Error('captain_already_busy');
      }

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
      if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] offer submit failed:', error);
      toast({
        variant: 'destructive',
        ...describeOfferSubmitError((error as { message?: string })?.message, t),
      });
      return false;
    } finally {
      submittingRef.current = false;
      setIsSubmittingOffer(false);
    }
  }, [cancelOffer, captainId, pendingOffersCount, toast, t, activeReqRef]);

  return {
    pendingOfferRequestId,
    pendingOffersCount,
    pendingOfferTimeoutsRef,
    isSubmittingOffer,
    isCancellingOffer,
    clearPendingOffer,
    cancelOffer,
    submitOffer,
  };
}
