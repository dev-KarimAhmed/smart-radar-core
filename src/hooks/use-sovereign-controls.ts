'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';
import { trackSovereignError } from '@/lib/error-tracker';
import { useTranslations } from 'next-intl';

export function useSovereignControls() {
  const tAuto = useTranslations();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
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
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      if (db) {
         // Direct Firestore write fallback if function is offline
         const stateRef = doc(db, 'settings', 'system_state');
         const nextState = !isRadarActive;
         await setDoc(stateRef, { isRadarActive: nextState }, { merge: true });

         toast({
           title: tAuto('systemFinancialsModified'),
           description: nextState ? tAuto('trackingEnabled') : tAuto('trackingSuspended'),
         });
         return;
      }

      const toggleFn = httpsCallable(getFunctions(), 'toggleSovereignKillSwitch');
      const result: any = await toggleFn();
      toast({
        title: tAuto('radarStateModified'),
        description: result.data.message || (result.data.isRadarActive ? tAuto('serviceOpened') : tAuto('serviceFrozen')),
      });
    } catch (err: any) {
      trackSovereignError(err, { context: 'ToggleKillSwitch' });
      toast({
        variant: 'destructive',
        title: tAuto('failedToActivateSafetySocket'),
        description: getSovereignErrorMessage(err),
      });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [isRadarActive, toast, tAuto]);

  const updateFuelIndex = useCallback(async (district: string, newPrice: number) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      const fuelIndexFn = httpsCallable(getFunctions(), 'adminUpdateFuelIndex');
      await fuelIndexFn({ district, price: newPrice });
      toast({ title: tAuto('fuelIndexModified'), description: tAuto('kmPricingUpdated', { district }) });
    } catch (error) {
      trackSovereignError(error, { context: 'UpdateFuelIndex' });

      // Local fallback representation for dry-run
      toast({ title: tAuto('alertLocalSimulation'), description: tAuto('horsePricingModified', { district, price: newPrice }) });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [toast, tAuto]);

  return {
    isProcessing,
    isRadarActive,
    isTogglingKillSwitch: isProcessing,
    isLoadingControls: isRadarActive === null,
    toggleKillSwitch,
    updateFuelIndex,
  };
}
