'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';

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

  const updateDriverDoc = useCallback(async (data: { status?: DriverStatus; gridId?: string }) => {
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

  // ⏳ [حزمة شحن الساعات] - Real-time active hour deduction based on real work minutes
  useEffect(() => {
    if (!user?.uid || user.role !== 'driver' || (driverStatus !== 'active' && driverStatus !== 'busy')) {
      return;
    }

    const interval = setInterval(async () => {
      const currentHours = user.subscriptionHours !== undefined ? user.subscriptionHours : 14.5;
      
      if (currentHours <= 0) {
        setDriverStatus('idle');
        await setDoc(doc(db, 'users', user.uid), { 
          status: 'idle', 
          subscriptionHours: 0 
        }, { merge: true });
        
        toast({
          variant: 'destructive',
          title: '🚨 نفاد باقة ساعات الملاحة',
          description: 'لقد نفدت حزمة ساعات البث المخصصة لك كلياً. يرجى التوجه لتبويب المحفظة لشحن رصيد ساعات جديد.'
        });
        return;
      }

      // Decrement by 1 minute of actual work (1 / 60 of an hour ~ 0.0167 hours)
      const finalHours = Math.max(0, currentHours - (1 / 60));
      
      await setDoc(doc(db, 'users', user.uid), { 
        subscriptionHours: Number(finalHours.toFixed(3)) 
      }, { merge: true });

    }, 60000); // Deduct hours every 60 seconds of online work

    return () => clearInterval(interval);
  }, [user?.uid, user?.role, user?.subscriptionHours, driverStatus, toast]);

  const toggleDriverStatus = useCallback(async (desiredStatus: 'active' | 'idle') => {
    if (driverStatus === 'busy' || driverStatus === 'rating') return;
    
    const currentHours = user?.subscriptionHours !== undefined ? user.subscriptionHours : 14.5;
    if (desiredStatus === 'active' && currentHours <= 0) {
      toast({
        variant: 'destructive',
        title: '🚫 عجز ساعات البث',
        description: 'لا يوجد لديك رصيد باقة ساعات كافٍ لتشغيل استقبال البث الملاحي. يرجى شحن حزمة جديدة كابتن.'
      });
      return;
    }

    setDriverStatus(desiredStatus);
    await updateDriverDoc({ status: desiredStatus });
  }, [driverStatus, updateDriverDoc, user?.subscriptionHours, toast]);

  return {
    driverStatus,
    setDriverStatus,
    isDormancyWarningVisible,
    resetDormancyTimer,
    toggleDriverStatus,
    updateDriverDoc
  };
}
