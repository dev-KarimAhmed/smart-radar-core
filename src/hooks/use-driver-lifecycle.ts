'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { RadarTimeSubscriptionKernel } from '@/core/logic/time-kernel';
import { RadarSovereignCommuteKernel } from '@/lib/commute-kernel';
import { RadarAntiCheatKernel } from '@/core/logic/anti-cheat-kernel';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

export function useDriverLifecycle(user: User | null) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('idle');
  const [isDormancyWarningVisible, setWarning] = useState(false);
  const timers = useRef<{ dormancy: ReturnType<typeof setTimeout> | null; warning: ReturnType<typeof setTimeout> | null }>({ dormancy: null, warning: null });
  const { toast } = useToast();

  const userRef = useRef(user);
  const statusRef = useRef(driverStatus);
  const sessionStartRef = useRef<{ dateNow: number; perfNow: number } | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    statusRef.current = driverStatus;
  }, [driverStatus]);

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
      const currentUser = userRef.current;
      const currentStatus = statusRef.current;
      if (!currentUser?.uid || currentUser.role !== 'driver') return;

      if (!sessionStartRef.current) {
        sessionStartRef.current = {
          dateNow: Date.now(),
          perfNow: performance.now()
        };
      }

      // Calculate real monotonic elapsed time to neutralize any clock modifications (forward or backward)
      const realElapsedMs = performance.now() - sessionStartRef.current.perfNow;
      const wallElapsedMs = Date.now() - sessionStartRef.current.dateNow;

      let clientNow = Date.now();
      // If manual clock alteration is detected (system clock drifted from performance timer by > 15s)
      if (Math.abs(wallElapsedMs - realElapsedMs) > 15000) {
        console.warn("🚫 [كشف التلاعب الزمني]: تم رصد تموج مفرط أو يدوي بساعة الجهاز. استرداد الزمن المونوتوني المعاير.");
        clientNow = sessionStartRef.current.dateNow + realElapsedMs;
      }

      const isRadarActive = currentStatus === 'active' || currentStatus === 'busy';
      const paidHours = currentUser.paidHoursRemaining !== undefined ? currentUser.paidHoursRemaining : (currentUser.subscriptionHours !== undefined ? Math.round(currentUser.subscriptionHours * 60) : 870);
      const bonusHours = currentUser.bonusHoursRemaining !== undefined ? currentUser.bonusHoursRemaining : 0;
      const lastTick = currentUser.lastTickTimestamp || Date.now();

      // [علاق ثغرة الوقت]: ميزان فحص سلامة الوقت لمنع التلاعب بساعة الهاتف
      const integrity = RadarAntiCheatKernel.validateTimeIntegrity({
        paidMinutesRemaining: paidHours,
        lastServerSyncedTimestamp: lastTick,
        localTimeDeltaMs: 0
      }, clientNow);

      if (integrity.isTimeTampered) {
        clientNow = integrity.correctedNow;
      }

      const wallet = {
        captainId: currentUser.uid,
        paidHoursRemaining: paidHours,
        bonusHoursRemaining: bonusHours,
        isRadarActive,
        lastTickTimestamp: lastTick
      };

      const result = RadarTimeSubscriptionKernel.processLocalTimeTick(wallet, clientNow);

      if (result.triggerSync) {
        const updated = result.updatedWallet;
        const totalHoursFraction = (updated.paidHoursRemaining + updated.bonusHoursRemaining) / 60;

        // [قفل المصافحة الجداري]: تحديث الهاش في المتصفح محلياً فوراً لحبس العداد وحفظ نزاهته
        const nextHash = RadarSovereignCommuteKernel.generateStateHash(currentUser.uid, updated.paidHoursRemaining, updated.bonusHoursRemaining);
        localStorage.setItem(`sovereign_shake_${currentUser.uid}`, nextHash);

        if (!updated.isRadarActive && isRadarActive) {
          setDriverStatus('idle');
          await setDoc(doc(db, 'users', currentUser.uid), {
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
          await setDoc(doc(db, 'users', currentUser.uid), {
            paidHoursRemaining: updated.paidHoursRemaining,
            bonusHoursRemaining: updated.bonusHoursRemaining,
            subscriptionHours: Number(totalHoursFraction.toFixed(3)),
            lastTickTimestamp: updated.lastTickTimestamp
          }, { merge: true });
        }
      } else if (!currentUser.lastTickTimestamp) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          lastTickTimestamp: Date.now()
        }, { merge: true });
      }
    }, 10000); // Check loop every 10 seconds to handle ticks gracefully

    return () => clearInterval(interval);
  }, [user?.uid, user?.role, toast]);

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
