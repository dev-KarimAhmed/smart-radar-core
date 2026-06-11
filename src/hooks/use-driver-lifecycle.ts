'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { RadarTimeSubscriptionKernel } from '@/core/logic/time-kernel';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

export function useDriverLifecycle(user: User | null) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('idle');
  const [isDormancyWarningVisible, setWarning] = useState(false);
  const timers = useRef<{ dormancy: ReturnType<typeof setTimeout> | null; warning: ReturnType<typeof setTimeout> | null }>({ dormancy: null, warning: null });
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role === 'driver') {
      setDriverStatus((user.status || 'idle') as DriverStatus);
    }
  }, [user]);

  const updateDriverDoc = useCallback(async (data: Partial<User> & { status?: DriverStatus }) => {
    if (!user?.uid) return;
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    } catch (error) {
      trackSovereignError(error, { context: 'UpdateDriverDoc' });
    }
  }, [user?.uid]);

  const clearTimers = useCallback(() => {
    if (timers.current.dormancy) clearTimeout(timers.current.dormancy);
    if (timers.current.warning) clearTimeout(timers.current.warning);
    setWarning(false);
  }, []);

  const resetDormancyTimer = useCallback(() => {
    clearTimers();
    if (driverStatus !== 'active') return;
    
    // Warn driver about dormancy
    timers.current.warning = setTimeout(() => setWarning(true), SOVEREIGN_CONSTANTS.DORMANCY_WARNING_MS);
    
    // Auto idle driver if dormant for too long
    timers.current.dormancy = setTimeout(() => {
      setDriverStatus('idle');
      updateDriverDoc({ status: 'idle' });
    }, SOVEREIGN_CONSTANTS.DORMANCY_TIMEOUT_MS);
  }, [driverStatus, clearTimers, updateDriverDoc]);

  // Touch and scroll listener for activity tracking
  useEffect(() => {
    if (user?.role !== 'driver' || driverStatus !== 'active') {
       clearTimers();
       return;
    }
    
    const wake = () => resetDormancyTimer();
    const events = ['touchstart', 'scroll']; 
    
    events.forEach(e => window.addEventListener(e, wake, { passive: true }));
    resetDormancyTimer();
    
    return () => {
      events.forEach(e => window.removeEventListener(e, wake));
      clearTimers();
    };
  }, [user?.role, driverStatus, resetDormancyTimer, clearTimers]);

  // ⏳ [حزمة شحن الساعات] - Real-time active hour deduction based on RadarTimeSubscriptionKernel
  useEffect(() => {
    if (!user?.uid || user.role !== 'driver') {
      return;
    }

    const interval = setInterval(async () => {
      const isRadarActive = driverStatus === 'active' || driverStatus === 'busy';
      const paidHours = user.paidHoursRemaining !== undefined ? user.paidHoursRemaining : (user.subscriptionHours !== undefined ? Math.round(user.subscriptionHours * 60) : 870);
      const bonusHours = user.bonusHoursRemaining !== undefined ? user.bonusHoursRemaining : 0;
      const lastTick = user.lastTickTimestamp || Date.now();

      const wallet = {
        captainId: user.uid,
        paidHoursRemaining: paidHours,
        bonusHoursRemaining: bonusHours,
        isRadarActive,
        lastTickTimestamp: lastTick
      };

      const result = RadarTimeSubscriptionKernel.processLocalTimeTick(wallet);

      if (result.triggerSync) {
        const updated = result.updatedWallet;
        const totalHoursFraction = (updated.paidHoursRemaining + updated.bonusHoursRemaining) / 60;

        if (!updated.isRadarActive && isRadarActive) {
          setDriverStatus('idle');
          await setDoc(doc(db, 'users', user.uid), {
            status: 'idle',
            paidHoursRemaining: 0,
            bonusHoursRemaining: 0,
            subscriptionHours: 0,
            lastTickTimestamp: updated.lastTickTimestamp
          }, { merge: true });

          toast({
            variant: 'destructive',
            title: '🚨 نفاد باقة ساعات الملاحة',
            description: 'لقد نفدت حزمة ساعات البث المخصصة لك كلياً. يرجى التوجه لتبويب المحفظة لشحن رصيد ساعات جديد.'
          });
        } else {
          await setDoc(doc(db, 'users', user.uid), {
            paidHoursRemaining: updated.paidHoursRemaining,
            bonusHoursRemaining: updated.bonusHoursRemaining,
            subscriptionHours: Number(totalHoursFraction.toFixed(3)),
            lastTickTimestamp: updated.lastTickTimestamp
          }, { merge: true });
        }
      } else if (!user.lastTickTimestamp) {
        await setDoc(doc(db, 'users', user.uid), {
          lastTickTimestamp: Date.now()
        }, { merge: true });
      }
    }, 10000); // Check loop every 10 seconds to handle ticks gracefully

    return () => clearInterval(interval);
  }, [user?.uid, user?.role, user?.subscriptionHours, user?.paidHoursRemaining, user?.bonusHoursRemaining, user?.lastTickTimestamp, driverStatus, toast]);

  const toggleDriverStatus = useCallback(async (desiredStatus: 'active' | 'idle') => {
    if (driverStatus === 'busy' || driverStatus === 'rating') return;
    
    const paidHours = user?.paidHoursRemaining !== undefined ? user.paidHoursRemaining : (user?.subscriptionHours !== undefined ? Math.round(user.subscriptionHours * 60) : 870);
    const bonusHours = user?.bonusHoursRemaining !== undefined ? user.bonusHoursRemaining : 0;
    const totalMinutes = paidHours + bonusHours;

    if (desiredStatus === 'active' && totalMinutes <= 0) {
      toast({
        variant: 'destructive',
        title: '🚫 عجز ساعات البث',
        description: 'لا يوجد لديك رصيد باقة ساعات كافٍ لتشغيل استقبال البث الملاحي. يرجى شحن حزمة جديدة كابتن.'
      });
      return;
    }

    setDriverStatus(desiredStatus);
    await updateDriverDoc({ 
      status: desiredStatus,
      lastTickTimestamp: desiredStatus === 'active' ? Date.now() : (user?.lastTickTimestamp || Date.now())
    });
  }, [driverStatus, updateDriverDoc, user?.paidHoursRemaining, user?.bonusHoursRemaining, user?.subscriptionHours, user?.lastTickTimestamp, toast]);

  return {
    driverStatus,
    setDriverStatus,
    isDormancyWarningVisible,
    resetDormancyTimer,
    toggleDriverStatus,
    updateDriverDoc
  };
}
