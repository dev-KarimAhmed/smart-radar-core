'use client';

import { useState, useCallback } from 'react';
import { doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { trackSovereignError } from '@/lib/error-tracker';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { callSovereignCloud } from '@/core/contracts/cloud-bridge';
import type { Trip, User, Offer } from '@/core/types';

export function useRiderTransactions(
    user: User | null, 
    trip: Trip | null, 
    acceptedDriver: User | null,
    resetState: () => void, 
    setInternalStatus: (status: any) => void
) {
  const { toast } = useToast();
  
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [isExecutingGuillotine, setIsExecutingGuillotine] = useState(false);
  const [isConfirmingCheckpoint, setIsConfirmingCheckpoint] = useState(false);
  const [isSelectingOffer, setIsSelectingOffer] = useState(false);

  /**
   * [SCR-2026-069] استدعاء النواة السيادية لإطلاق رادار رحلة جديدة
   */
  const requestRide = useCallback(async (payload: any) => {
    setIsRequesting(true);
    
    try {
        console.warn("🔗 Connecting to Sovereign Cloud to dispatch ride...");
        await callSovereignCloud('requestRide', payload);
        
        setInternalStatus('searching');
        
        toast({ 
            title: 'تم إطلاق رادار الرحلة بنجاح 🚀', 
            description: 'تبحث الخوارزمية الفعالة عن الفرسان النشيطين الأقرب لتغطية مسارك.' 
        });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'فشل إرسال الإشارة الملاحية', description: error.message });
    } finally {
        setIsRequesting(false);
    }
  }, [setInternalStatus, toast]);
  
  const cancelTrip = useCallback(async () => {
    if (!trip?.id) return;
    setIsCancelling(true);
    try {
      await updateDoc(doc(db, 'trips', trip.id), { status: 'cancelled' });
      resetState();
      toast({ title: 'تم إلغاء الرحلة ملاحياً', description: 'تم التراجع عن رادار التتبع بنجاح.' });
    } catch (error) { 
      trackSovereignError(error, { context: 'CancelTrip' });
      toast({ variant: 'destructive', title: 'فشل إلغاء الرحلة', description: getSovereignErrorMessage(error) });
    } finally {
      setIsCancelling(false);
    }
  }, [trip?.id, resetState, toast]);

  const rateTrip = useCallback(async (ratings: { driverRating: number; vehicleRating: number; giveHeart: boolean; sensory: any; }) => {
    if (!trip?.id) return;
    setIsRating(true);
    try {
        await callSovereignCloud('submitTripFeedback', { 
            tripId: trip.id,
            driverId: acceptedDriver?.uid || '',
            vehicleId: acceptedDriver?.vehicle?.plate || '',
            ...ratings
        });
        toast({ title: "شكراً لتقييم الحصان السيادي", description: "مشاركتك تساهم في الارتقاء بالنبض والعهد الملاحي." });
        resetState();
    } catch (error) {
        toast({ variant: 'destructive', title: 'تعذر حفظ التقييم السيادي', description: getSovereignErrorMessage(error) });
    } finally {
        setIsRating(false);
    }
  }, [trip, acceptedDriver, resetState, toast]);

  const confirmCheckpoint = useCallback(async () => {
    if (!trip?.id) return;
    setIsConfirmingCheckpoint(true);
    try {
        await updateDoc(doc(db, 'trips', trip.id), { status: 'completed', checkpointConfirmed: true });
        toast({ title: "تم تأكيد المربع الملاحي للأمان", description: "الرحلة تمت بموثوقية عالية." });
        setInternalStatus('rating');
    } catch (error) { 
        trackSovereignError(error, { context: 'ConfirmCheckpoint' }); 
        toast({ variant: 'destructive', title: 'تعذر تأكيد الإحداثيات الميدانية', description: getSovereignErrorMessage(error) });
    } finally {
        setIsConfirmingCheckpoint(false);
    }
  }, [trip?.id, toast, setInternalStatus]);

  const executeRedPathGuillotine = useCallback(async () => {
    if (!trip?.id) return;
    setIsExecutingGuillotine(true);
    try {
      await callSovereignCloud('executeGuillotine', { tripId: trip.id });
      toast({ title: 'تفجير المقصلة التقنية الحمراء ⚡', description: 'تم عزل الرحلة وإقصاء فرسان المسارات لخرق السيادة.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'لم تنجح الإزاحة التعسفية', description: getSovereignErrorMessage(error) });
    } finally {
      setIsExecutingGuillotine(false);
    }
  }, [trip?.id, toast]);

  const selectOffer = useCallback(async (offer: Offer) => {
    if (!trip?.id) return;
    setIsSelectingOffer(true);
    try {
      const tripRef = doc(db, 'trips', trip.id);
      await runTransaction(db, async (transaction) => {
        const tripDoc = await transaction.get(tripRef);
        if (!tripDoc.exists() || tripDoc.data()?.status !== 'searching') {
          throw new Error('OPS_001');
        }
        
        // [المادة 13 - بروتوكول المصافحة الذرية وتجميد السعر والمسافة والزمن]
        // [المادة 7 - قانون التبخر الذاتي السحابي TTL بعد 7 أيام لتكلفة صفرية]
        transaction.update(tripRef, {
          status: 'busy',
          driverId: offer.driverId,
          offerPrice: offer.price,
          finalFrozenPrice: offer.price,
          frozenDistanceKm: trip.estimatedDistance || 0,
          frozenDurationMin: trip.estimatedTime || 0,
          expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // TTL 7 Days Self-Evaporation
          handshakeAt: serverTimestamp(),
          offers: []
        });
      });
      toast({ title: 'تمت المصافحة الذرية بنجاح 🤝', description: 'تم تجميد السعر وإحكام قيم الرحلة ومسار الملاحة.' });
    } catch (error) {
      trackSovereignError(error, { context: 'SelectOffer' });
      toast({ variant: 'destructive', title: 'لم يكتمل تأكيد العهد بالفارس', description: getSovereignErrorMessage(error) });
    } finally {
      setIsSelectingOffer(false);
    }
  }, [trip, toast]);

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
