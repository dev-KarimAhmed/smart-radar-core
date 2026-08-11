'use client';

import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Offer, Trip, User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';

const styles = {
  root: "",
} as const;


export function useRiderTransactions(
  user: User | null,
  trip: Trip | null,
  acceptedDriver: User | null,
  resetState: () => void,
  setInternalStatus: (status: any) => void,
) {
  const { toast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isExecutingGuillotine, setIsExecutingGuillotine] = useState(false);
  const [isConfirmingCheckpoint, setIsConfirmingCheckpoint] = useState(false);
  const [isSelectingOffer, setIsSelectingOffer] = useState(false);
  const lockRef = useRef<string | null>(null);

  const withLock = useCallback(async <T,>(key: string, run: () => Promise<T>) => {
    if (lockRef.current) return undefined;
    lockRef.current = key;
    try {
      return await run();
    } finally {
      lockRef.current = null;
    }
  }, []);

  const requestRide = useCallback(async (_payload: any) => {
    toast({
      title: 'استخدم شاشة طلب الرحلة الجديدة',
      description: 'إنشاء الطلبات يتم الآن من شاشة الراكب عبر Supabase.',
    });
    setInternalStatus('searching');
  }, [setInternalStatus, toast]);

  const cancelTrip = useCallback(async () => {
    if (!trip?.id) return;
    await withLock('cancel', async () => {
      setIsCancelling(true);
      try {
        const { error } = await supabase.rpc('cancel_ride_request', { p_request_id: trip.id });
        if (error) throw error;
        resetState();
        toast({ title: 'تم إلغاء الرحلة', description: 'تم إلغاء الطلب من الخادم.' });
      } catch {
        toast({ variant: 'destructive', title: 'تعذر إلغاء الرحلة', description: 'حاول مرة أخرى بعد قليل.' });
      } finally {
        setIsCancelling(false);
      }
    });
  }, [resetState, toast, trip?.id, withLock]);

  const rateTrip = useCallback(async (ratings: { driverRating: number }) => {
    if (!trip?.id || !acceptedDriver?.uid) return;
    await withLock('rating', async () => {
      setIsRating(true);
      try {
        const { error } = await supabase.rpc('submit_ride_rating', {
          p_request_id: trip.id,
          p_captain_id: acceptedDriver.uid,
          p_rating_value: Math.max(1, Math.min(5, Math.round(ratings.driverRating))),
        });
        if (error) throw error;
        toast({ title: 'شكراً لتقييمك', description: 'تم حفظ التقييم.' });
        resetState();
      } catch {
        toast({ variant: 'destructive', title: 'تعذر حفظ التقييم', description: 'حاول مرة أخرى بعد قليل.' });
      } finally {
        setIsRating(false);
      }
    });
  }, [acceptedDriver?.uid, resetState, toast, trip?.id, withLock]);

  const confirmCheckpoint = useCallback(async () => {
    if (!trip?.id) return;
    await withLock('complete', async () => {
      setIsConfirmingCheckpoint(true);
      try {
        const { error } = await supabase.rpc('complete_ride_trip', { p_request_id: trip.id });
        if (error) throw error;
        toast({ title: 'تم تأكيد الرحلة', description: 'يمكنك الآن تقييم التجربة.' });
        setInternalStatus('rating');
      } catch {
        toast({ variant: 'destructive', title: 'تعذر تأكيد الرحلة', description: 'حاول مرة أخرى بعد قليل.' });
      } finally {
        setIsConfirmingCheckpoint(false);
      }
    });
  }, [setInternalStatus, toast, trip?.id, withLock]);

  const executeRedPathGuillotine = useCallback(async () => {
    setIsExecutingGuillotine(true);
    toast({ title: 'تم إرسال البلاغ', description: 'سنراجع الرحلة ونتابع الإجراء المناسب.' });
    setIsExecutingGuillotine(false);
  }, [toast]);

  const selectOffer = useCallback(async (offer: Offer) => {
    if (!trip?.id) return;
    await withLock('offer', async () => {
      setIsSelectingOffer(true);
      try {
        const { error } = await supabase.rpc('accept_ride_offer', {
          p_request_id: trip.id,
          p_offer_id: offer.id,
        });
        if (error) throw error;
        toast({ title: 'تم قبول العرض', description: 'سيتم تحديث حالة الرحلة من الخادم.' });
      } catch {
        toast({ variant: 'destructive', title: 'تعذر قبول العرض', description: 'قد يكون العرض انتهى أو تم قبوله من قبل.' });
      } finally {
        setIsSelectingOffer(false);
      }
    });
  }, [toast, trip?.id, withLock]);

  return {
    requestRide,
    isRequesting,
    cancelTrip,
    isCancelling,
    rateTrip,
    isRating,
    executeRedPathGuillotine,
    isExecutingGuillotine,
    confirmCheckpoint,
    isConfirmingCheckpoint,
    selectOffer,
    isSelectingOffer,
  };
}
