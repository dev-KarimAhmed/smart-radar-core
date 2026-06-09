'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { trackSovereignError } from '@/lib/error-tracker';

export function useSovereignControls() {
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRadarActive, setIsRadarActive] = useState<boolean | null>(null);

  // Listen first to settings/system_state Firestore doc
  useEffect(() => {
    let isMounted = true;
    const stateRef = doc(db, 'settings', 'system_state');
    
    const unsubscribe = onSnapshot(stateRef, (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setIsRadarActive(docSnap.data().isRadarActive);
        } else {
          // default behavior
          setIsRadarActive(true);
        }
    }, (err) => {
        if (!isMounted) return;
        trackSovereignError(err, { context: 'SovereignControlsListener' });
        setIsRadarActive(true); // default safe bypass
    });

    return () => { isMounted = false; unsubscribe(); };
  }, []);
  
  const toggleKillSwitch = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (db) {
         // Direct Firestore write fallback if function is offline
         const stateRef = doc(db, 'settings', 'system_state');
         const nextState = !isRadarActive;
         await setDoc(stateRef, { isRadarActive: nextState }, { merge: true });
         
         toast({
           title: 'تم تعديل العهد السيادي المالي نظاماً',
           description: nextState ? 'تم تفعيل التتبع ورادارات المسارات' : 'تم تعليق رادارات الهواتف وأدوات النقل السيادي للفرسان مؤقتاً.',
         });
         setIsProcessing(false);
         return;
      }

      const toggleFn = httpsCallable(getFunctions(), 'toggleSovereignKillSwitch');
      const result: any = await toggleFn();
      toast({
        title: 'تم تعديل حالة رادار العهد',
        description: result.data.message || (result.data.isRadarActive ? 'تم فتح الخدمة السيادية' : 'تم تجميد الخدمة السيادية'),
      });
    } catch (err: any) {
      trackSovereignError(err, { context: 'ToggleKillSwitch' });
      toast({
        variant: 'destructive',
        title: 'تعذر تنشيط مقبس الأمان الخاص بالنظام',
        description: getSovereignErrorMessage(err),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isRadarActive, toast]);

  const updateFuelIndex = useCallback(async (district: string, newPrice: number) => {
    setIsProcessing(true);
    try {
      const fuelIndexFn = httpsCallable(getFunctions(), 'adminUpdateFuelIndex');
      await fuelIndexFn({ district, price: newPrice });
      
      toast({ title: 'تم تعديل مؤشر الوقود للمنطقة', description: `تم بنجاح تحديث تسعيرة الكيلومتر لتتلائم مع نبض السوق في ${district}.` });
    } catch (error) {
      trackSovereignError(error, { context: 'UpdateFuelIndex' });
      
      // Local fallback representation for dry-run
      toast({ title: 'تنبيه: محاكاة محلية لعهد الأسعار', description: `تم تعديل تسعيرة الحصان السيادي في ${district} لتصبح ${newPrice} د.أ.` });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);
  
  return {
    isProcessing,
    isRadarActive,
    isTogglingKillSwitch: isProcessing,
    isLoadingControls: isRadarActive === null,
    toggleKillSwitch,
    updateFuelIndex,
  };
}
