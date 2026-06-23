'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, serverTimestamp, query, collection, where, limit, onSnapshot } from 'firebase/firestore';
import { getDistrictFromCoords } from '@/core/logic/geospatial-kernel';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { useToast } from '../use-toast';
import { callSovereignCloud } from '@/core/contracts/cloud-bridge';
import type { Trip, User, Offer } from '@/core/types';
import { SovereignMarketKernel } from '@/core/logic/sovereign-market-kernel';

export function useDriverTransactions(
  user: User | null, 
  setDriverStatus: Function, 
  updateDriverDoc: Function
) {
  const { toast } = useToast();
  const [activeRequest, setActiveReq] = useState<Trip | null>(null);
  const [acceptedRider, setAcceptedRider] = useState<User | null>(null);
  
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [isRatingRider, setIsRatingRider] = useState(false);
  const [isRequestingReport, setIsRequestingReport] = useState(false);

  // Synchronous execution locks for driver transactions
  const isSubmittingOfferRef = useRef(false);
  const isEndingTripRef = useRef(false);
  const isRatingRiderRef = useRef(false);
  const isRequestingReportRef = useRef(false);

  const fetchRealRiderProfile = useCallback(async (riderId: string) => {
    try {
        const riderRef = doc(db, 'users', riderId);
        const riderSnap = await getDoc(riderRef);
        if (riderSnap.exists()) {
            setAcceptedRider({ uid: riderSnap.id, ...riderSnap.data() } as User);
        }
    } catch (error) {
        trackSovereignError(error, { context: 'FetchRealRiderProfile' });
    }
  }, []);

  const cleanUpAndReset = useCallback(() => {
      updateDriverDoc({ status: 'active' });
      setActiveReq(null);
      setAcceptedRider(null);
      setDriverStatus('active');
  }, [updateDriverDoc, setDriverStatus]);

  // Monitor active trip assigned to driver
  useEffect(() => {
    if (!user?.uid || user.role !== 'driver') return;

    const q = query(
      collection(db, 'trips'),
      where('driverId', '==', user.uid),
      where('status', 'in', ['busy', 'rating', 'completed', 'checkpoint_required']),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const tripData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Trip;
        setActiveReq(tripData);

        if (tripData.riderId && (!acceptedRider || acceptedRider.uid !== tripData.riderId)) {
            fetchRealRiderProfile(tripData.riderId);
        }
        
        if (tripData.status === 'completed' || tripData.status === 'checkpoint_required') {
            setDriverStatus('rating');
        } else {
            setDriverStatus(tripData.status);
        }
      } else {
        cleanUpAndReset();
      }
    }, (error) => {
        trackSovereignError(error, { context: 'Driver_TripLifecycleListener' });
        cleanUpAndReset();
    });

    return () => unsubscribe();
  }, [user?.uid, cleanUpAndReset, fetchRealRiderProfile, acceptedRider, setDriverStatus]);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number }, rejectRequest: Function) => {
    if (!user || !user.vehicle || !user.affiliation) {
        toast({ 
          variant: 'destructive', 
          title: 'بيانات الفارس غير مكتملة', 
          description: 'للقيام بتقديم عروض، يرجى استكمال بياناتك وتفعيل عهد الحصان السيادي أولاً.' 
        });
        return;
    }

    if (isSubmittingOfferRef.current) return;
    isSubmittingOfferRef.current = true;
    setIsSubmittingOffer(true);
    try {
      if (!user.vehicle?.plate) { 
        toast({ variant: 'destructive', title: 'مركبة غير مسجلة', description: 'الرجاء التأكد من ربط الحصان السيادي بمركبة صالحة.' });
        setIsSubmittingOffer(false);
        isSubmittingOfferRef.current = false;
        return;
      }

      const tripRef = doc(db, 'trips', payload.tripId);
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) throw new Error('TRIP_NOT_FOUND');

      const tripData = tripSnap.data() as Trip;
      const distance = tripData.estimatedDistance || 0;
      const duration = tripData.estimatedTime || 0;
      const currentRating = user.rating || 5.0;

      // Evaluate price dumping and sovereign rank
      const evaluation = SovereignMarketKernel.evaluateSovereignRank(
        currentRating,
        payload.offerPrice,
        distance,
        duration
      );

      const vehicleRef = doc(db, 'vehicles', user.vehicle.plate);
      const vehicleSnap = await getDoc(vehicleRef);
      const vehicleSensoryData = vehicleSnap.exists() ? vehicleSnap.data() : {};

      const offer: Offer = {
        driverId: user.uid,
        price: payload.offerPrice,
        driverName: user.name,
        driverRating: currentRating,
        driverRank: evaluation.assignedRank,
        driverVehicle: { ...user.vehicle, ...vehicleSensoryData },
        silencePreference: user.silencePreference || 'neutral',
        isDumping: evaluation.isDumping,
        displayTarget: evaluation.displayTarget
      };

      await callSovereignCloud('submitOffer', {
        tripId: payload.tripId,
        offer
      });

      // [الدستور التنفيذي V5.5 - الباب الأول] : توليد الفرصة الإعلانية وتصاعد السعة عند حرق/شذوذ الأسعار وثغرات كوابح السوق
      if (evaluation.isDumping) {
        let activeDistrict = user?.district || 'وادي السير';
        if (tripData.pickupCoords?.lat && tripData.pickupCoords?.lng) {
          const resolvedGeo = getDistrictFromCoords(tripData.pickupCoords.lat, tripData.pickupCoords.lng);
          if (resolvedGeo.district) {
            activeDistrict = resolvedGeo.district;
          }
        }
        
        const pulseDocRef = doc(db, 'market_pulse', activeDistrict);
        try {
          const pulseSnap = await getDoc(pulseDocRef);
          if (pulseSnap.exists()) {
            const pData = pulseSnap.data();
            const prevCount = pData.priceAnomaliesCount || 0;
            const newCount = prevCount + 1;
            await updateDoc(pulseDocRef, {
              priceAnomaliesCount: newCount,
              priceAnomalyTrend: 'up',
              emergencyAdCapacityActive: newCount >= 3 // تفعيل السعة الطارئة والمكثفة عند رصد أكثر من حالتين
            });
          } else {
            await setDoc(pulseDocRef, {
              trend: 'balanced',
              demand: 5,
              supply: 5,
              priceAnomaliesCount: 1,
              priceAnomalyTrend: 'up',
              emergencyAdCapacityActive: false
            });
          }
          console.log(`[الباب الأول V5.5] تم تسجيل حالة شذوذ سعري للواء ${activeDistrict}. تم تحويل الأزمة إلى فرصة إعلانية.`);
        } catch (pulseErr) {
          console.warn('[V5.5 Market Integrity] Failed to update pricing anomaly pulse:', pulseErr);
        }
      }

      toast({ title: 'تم إرفاق العرض للراكب', description: 'عرضك معروض في منصة المنافسة السيادية حالاً.' });
      rejectRequest(payload.tripId);
    } catch (e: any) {
      trackSovereignError(e, { context: 'SubmitOffer' });
      toast({ variant: 'destructive', title: 'فشل إدراج السعر المعروض', description: getSovereignErrorMessage(e) });
    } finally {
      setIsSubmittingOffer(false);
      isSubmittingOfferRef.current = false;
    }
  }, [user, toast]);

  const endTrip = useCallback(async () => {
    if (!activeRequest?.id) return;
    if (isEndingTripRef.current) return;
    isEndingTripRef.current = true;
    setIsEndingTrip(true);
    try {
      await callSovereignCloud('endTrip', {
        tripId: activeRequest.id
      });
      toast({ title: 'طلب تأكيد المربع الميداني', description: 'يرجى الانتظار لحين تأكيد الراكب إتمام المسار.' });
    } catch (error) {
      trackSovereignError(error, { context: 'EndTrip' });
      toast({ variant: 'destructive', title: 'فشل تفعيل المحطة النهائية', description: getSovereignErrorMessage(error) });
    } finally {
      setIsEndingTrip(false);
      isEndingTripRef.current = false;
    }
  }, [activeRequest?.id, toast]);

  const rateAndFinishTrip = useCallback(async (rating: number) => {
    if (!activeRequest?.id || !activeRequest?.riderId) return;
    if (isRatingRiderRef.current) return;
    isRatingRiderRef.current = true;
    setIsRatingRider(true);
    try {
      await callSovereignCloud('submitRiderRating', {
        tripId: activeRequest.id,
        riderId: activeRequest.riderId,
        rating
      });
      toast({ title: 'تم تسجيل مستوى الراكب السيادي', description: 'شكراً للحفاظ على جودة النسيج الاجتماعي للمنظومة.' });
      cleanUpAndReset();
    } catch (error) {
      trackSovereignError(error, { context: 'SubmitRiderRating' });
      toast({ variant: 'destructive', title: 'عذرًا، لم يكتمل تقييم الفارس', description: getSovereignErrorMessage(error) });
      // Keep safety bypass to let developer exit state if function offline
      cleanUpAndReset();
    } finally {
      setIsRatingRider(false);
      isRatingRiderRef.current = false;
    }
  }, [activeRequest, toast, cleanUpAndReset]);

  const requestWeeklyReport = useCallback(async () => {
    if (isRequestingReportRef.current) return;
    isRequestingReportRef.current = true;
    setIsRequestingReport(true);
    toast({ title: 'جاري تجميع التقرير السنوي/الأسبوعي المالي ملاحياً...', description: 'يجرى الآن فحص العهد والتصنيفات في قاعدة البيانات.' });
    try {
      const result = await callSovereignCloud('generateWeeklyReport', undefined);
      if (result.success && result.stats) {
          toast({ 
            title: 'تم تحديث الترتيب والتقرير الملاحي للفرسان 🎉', 
            description: `تقرير الرحلات المنجزة: ${result.stats.completedRides || 0}. الرتبة والنبض حالياً: ${result.newRank || 'Platinum'}` 
          });
      } else {
          toast({ title: 'التقرير السحابي غير مصنف', description: result.message || 'يرجى مراجعة المشرف لاحقاً.' });
      }
    } catch (error) {
      trackSovereignError(error, { context: 'WeeklyReport' });
      toast({ variant: 'destructive', title: 'لم نتمكن من جمع الإحصاءات حالياً', description: getSovereignErrorMessage(error) });
    } finally {
      setIsRequestingReport(false);
      isRequestingReportRef.current = false;
    }
  }, [toast]);

  return { activeRequest, acceptedRider, submitOffer, isSubmittingOffer, endTrip, isEndingTrip, rateAndFinishTrip, isRatingRider, requestWeeklyReport, isRequestingReport };
}
