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
  const expectedServerStatusRef = useRef<DriverStatus | null>(null);

  const changeDriverStatus = useCallback((nextStatus: DriverStatus) => {
    setDriverStatus(nextStatus);
    expectedServerStatusRef.current = nextStatus;
  }, []);

  const [isDormancyWarningVisible, setWarning] = useState(false);
  const timers = useRef<{ dormancy: ReturnType<typeof setTimeout> | null; warning: ReturnType<typeof setTimeout> | null }>({ dormancy: null, warning: null });
  const { toast } = useToast();

  const userRef = useRef(user);
  const statusRef = useRef(driverStatus);
  const sessionStartRef = useRef<{ dateNow: number; perfNow: number } | null>(null);

  const lastUidRef = useRef<string | null>(null);
  const lastProcessedTickRef = useRef<number | null>(null);
  const localPaidHoursRef = useRef<number | null>(null);
  const localBonusHoursRef = useRef<number | null>(null);
  const localTimeDeltaRef = useRef<number>(0);

  const lastSavedOnServerRef = useRef<{ paid: number; bonus: number } | null>(null);
  const previousLocalStateRef = useRef<{ paid: number; bonus: number } | null>(null);

  if (user?.uid !== lastUidRef.current) {
    lastUidRef.current = user?.uid || null;
    lastProcessedTickRef.current = null;
    localPaidHoursRef.current = null;
    localBonusHoursRef.current = null;
    localTimeDeltaRef.current = 0;
    sessionStartRef.current = null;
    lastSavedOnServerRef.current = null;
    previousLocalStateRef.current = null;
    expectedServerStatusRef.current = null;
  }

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    statusRef.current = driverStatus;
  }, [driverStatus]);

  useEffect(() => {
    if (user?.role === 'driver') {
      const serverStatus = (user.status || 'idle') as DriverStatus;
      
      if (expectedServerStatusRef.current !== null) {
        if (serverStatus === expectedServerStatusRef.current) {
          expectedServerStatusRef.current = null;
        } else {
          console.log(`⏳ [SSOT status check]: Ignoring stale server status "${serverStatus}" because we expected "${expectedServerStatusRef.current}"`);
          return;
        }
      }
      
      if (serverStatus !== driverStatus) {
        setDriverStatus(serverStatus);
      }
    }
  }, [user, driverStatus]);

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
      changeDriverStatus('idle');
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

  // ⚡️ [مزامنة الصندوق السيادي الفورية لمنع تزييف الحقيقة]: مزامنة سريعة ولحظية عند حدوث عمليات شحن رصيد أو تعديل خارجي
  useEffect(() => {
    if (!user?.uid || user.role !== 'driver') {
      return;
    }

    const initialPaidHours = user.paidHoursRemaining !== undefined ? user.paidHoursRemaining : (user.subscriptionHours !== undefined ? Math.round(user.subscriptionHours * 60) : 870);
    const initialBonusHours = user.bonusHoursRemaining !== undefined ? user.bonusHoursRemaining : 0;

    if (localPaidHoursRef.current === null || localBonusHoursRef.current === null) {
      localPaidHoursRef.current = initialPaidHours;
      localBonusHoursRef.current = initialBonusHours;
      const syncHash = RadarSovereignCommuteKernel.generateStateHash(user.uid, initialPaidHours, initialBonusHours);
      localStorage.setItem(`sovereign_shake_${user.uid}`, syncHash);
      localStorage.setItem(`sovereign_paid_${user.uid}`, String(initialPaidHours));
      localStorage.setItem(`sovereign_bonus_${user.uid}`, String(initialBonusHours));
    } else {
      const isRefill = initialPaidHours > localPaidHoursRef.current || initialBonusHours > localBonusHoursRef.current;
      const isTransientEcho = 
        (lastSavedOnServerRef.current && initialPaidHours === lastSavedOnServerRef.current.paid && initialBonusHours === lastSavedOnServerRef.current.bonus) ||
        (previousLocalStateRef.current && initialPaidHours === previousLocalStateRef.current.paid && initialBonusHours === previousLocalStateRef.current.bonus);

      const isDivergent = initialPaidHours !== localPaidHoursRef.current || initialBonusHours !== localBonusHoursRef.current;

      if (isRefill || (isDivergent && !isTransientEcho)) {
        console.log(`📡 [مزامنة الصندوق السيادي الفورية]: تم دمج حالة الساعات الخارجية فوراً منعاً للتزييف: ${initialPaidHours} مدفوعة، ${initialBonusHours} بونص.`);
        localPaidHoursRef.current = initialPaidHours;
        localBonusHoursRef.current = initialBonusHours;
        
        const syncHash = RadarSovereignCommuteKernel.generateStateHash(user.uid, initialPaidHours, initialBonusHours);
        localStorage.setItem(`sovereign_shake_${user.uid}`, syncHash);
        localStorage.setItem(`sovereign_paid_${user.uid}`, String(initialPaidHours));
        localStorage.setItem(`sovereign_bonus_${user.uid}`, String(initialBonusHours));
      }
    }
  }, [user?.uid, user?.paidHoursRemaining, user?.bonusHoursRemaining, user?.role]);

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
        const startLastTick = currentUser.lastTickTimestamp || Date.now();
        // [النبض الشبكي التفاضلي V2.6-Secured]: احتساب الفارق الرياضي بين توقيت السيرفر الموثق وساعة الهاتف
        localTimeDeltaRef.current = startLastTick - Date.now();
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

      // 🏛️ SSOT Alignment: Initialize or synchronize local refs with remote user document if a refill has happened
      const initialPaidHours = currentUser.paidHoursRemaining !== undefined ? currentUser.paidHoursRemaining : (currentUser.subscriptionHours !== undefined ? Math.round(currentUser.subscriptionHours * 60) : 870);
      const initialBonusHours = currentUser.bonusHoursRemaining !== undefined ? currentUser.bonusHoursRemaining : 0;
      const initialLastTick = currentUser.lastTickTimestamp || Date.now();

      let didImportRemote = false;

      if (localPaidHoursRef.current === null || localBonusHoursRef.current === null) {
        localPaidHoursRef.current = initialPaidHours;
        localBonusHoursRef.current = initialBonusHours;
        didImportRemote = true;
      } else {
        // Prevent State Desync loop (lagging reverberation of older Firestore writes overwriting newer local state).
        // Authoritative updates must satisfy either:
        // 1. Value is greater than current local state (e.g., wallet package refill).
        // 2. Value has changed but is NOT a lagging echo of our own past written states.
        const isRefill = initialPaidHours > localPaidHoursRef.current || initialBonusHours > localBonusHoursRef.current;
        
        const isTransientEcho = 
          (lastSavedOnServerRef.current && initialPaidHours === lastSavedOnServerRef.current.paid && initialBonusHours === lastSavedOnServerRef.current.bonus) ||
          (previousLocalStateRef.current && initialPaidHours === previousLocalStateRef.current.paid && initialBonusHours === previousLocalStateRef.current.bonus);

        const isDivergent = initialPaidHours !== localPaidHoursRef.current || initialBonusHours !== localBonusHoursRef.current;

        if (isRefill || (isDivergent && !isTransientEcho)) {
          console.log(`📡 [مزامنة الصندوق السيادي]: تم دمج حالة الساعات الخارجية بنجاح منعاً للتزييف: ${initialPaidHours} مدفوعة، ${initialBonusHours} بونص.`);
          localPaidHoursRef.current = initialPaidHours;
          localBonusHoursRef.current = initialBonusHours;
          didImportRemote = true;
        }
      }

      if (didImportRemote) {
        // Update security hash and values in localStorage in perfect synchronicity to avoid false lockout locks
        const syncHash = RadarSovereignCommuteKernel.generateStateHash(currentUser.uid, localPaidHoursRef.current, localBonusHoursRef.current);
        localStorage.setItem(`sovereign_shake_${currentUser.uid}`, syncHash);
        localStorage.setItem(`sovereign_paid_${currentUser.uid}`, String(localPaidHoursRef.current));
        localStorage.setItem(`sovereign_bonus_${currentUser.uid}`, String(localBonusHoursRef.current));
      }

      if (lastProcessedTickRef.current === null) {
        lastProcessedTickRef.current = initialLastTick;
      }

      const paidHours = localPaidHoursRef.current;
      const bonusHours = localBonusHoursRef.current;
      const lastTick = lastProcessedTickRef.current;

      // [علاق ثغرة الوقت]: ميزان فحص سلامة الوقت لمنع التلاعب بساعة الهاتف
      const integrity = RadarAntiCheatKernel.validateTimeIntegrity({
        paidMinutesRemaining: paidHours,
        lastServerSyncedTimestamp: lastTick,
        localTimeDeltaMs: localTimeDeltaRef.current
      }, clientNow);

      if (integrity.isTimeTampered) {
        clientNow = integrity.correctedNow;
      }

      // 📡 [بروتوكول المصافحة التصفوية الصامتة V2.6-Secured - اقتران ضعيف]
      const handshakeResult = RadarAntiCheatKernel.evaluateSilentHandshake({
        isRadarActive,
        serverStatus: currentUser.status || 'idle',
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        clientNow,
        deviceNow: Date.now()
      });

      if (!handshakeResult.isHandshakePassed) {
        console.warn(`📡 [المصافحة الصامتة]: تم تعليق خصم الساعات لحفظ الرصيد من التلاشي أثناء عطل التغطية أو عدم مطابقة البث أو التلاعب بالوقت. السبب: ${handshakeResult.reason}`);
        // نجمد العداد محلياً بمزامنة توقيت العداد مع توقيت النبضة الحالي دون ترحيل الخصم
        lastProcessedTickRef.current = clientNow;
        return;
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

        // Feed state transition history to prevent feedback loop desync when Firestore pushes lazy snapshots
        previousLocalStateRef.current = { paid: paidHours, bonus: bonusHours };
        lastSavedOnServerRef.current = { paid: updated.paidHoursRemaining, bonus: updated.bonusHoursRemaining };

        // Synchronously update local SSOT refs IMMEDIATELY to prevent double tick on next interval run!
        localPaidHoursRef.current = updated.paidHoursRemaining;
        localBonusHoursRef.current = updated.bonusHoursRemaining;
        lastProcessedTickRef.current = updated.lastTickTimestamp;

        // [قفل المصافحة الجداري]: تحديث الهاش في المتصفح محلياً فوراً لحبس العداد وحفظ نزاهته
        const nextHash = RadarSovereignCommuteKernel.generateStateHash(currentUser.uid, updated.paidHoursRemaining, updated.bonusHoursRemaining);
        localStorage.setItem(`sovereign_shake_${currentUser.uid}`, nextHash);
        localStorage.setItem(`sovereign_paid_${currentUser.uid}`, String(updated.paidHoursRemaining));
        localStorage.setItem(`sovereign_bonus_${currentUser.uid}`, String(updated.bonusHoursRemaining));

        if (!updated.isRadarActive && isRadarActive) {
          changeDriverStatus('idle');
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

    changeDriverStatus(desiredStatus);
    await updateDriverDoc({ 
      status: desiredStatus,
      lastTickTimestamp: desiredStatus === 'active' ? Date.now() : (user?.lastTickTimestamp || Date.now())
    });
  }, [driverStatus, updateDriverDoc, user?.paidHoursRemaining, user?.bonusHoursRemaining, user?.subscriptionHours, user?.lastTickTimestamp, toast]);

  return {
    driverStatus,
    setDriverStatus: changeDriverStatus,
    isDormancyWarningVisible,
    resetDormancyTimer,
    toggleDriverStatus,
    updateDriverDoc
  };
}
