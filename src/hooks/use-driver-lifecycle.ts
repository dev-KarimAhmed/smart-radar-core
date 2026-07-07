'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { addCaptainSovereignLog } from '@/lib/dexie-db';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

export function useDriverLifecycle(user: User | null) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('idle');
  const [isDormancyWarningVisible, setWarning] = useState(false);
  const timers = useRef<{ dormancy: ReturnType<typeof setTimeout> | null; warning: ReturnType<typeof setTimeout> | null }>({ dormancy: null, warning: null });
  const statusRef = useRef(driverStatus);
  const isTogglingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    statusRef.current = driverStatus;
  }, [driverStatus]);

  useEffect(() => {
    if (user?.role === 'driver') {
      setDriverStatus((user.status || 'idle') as DriverStatus);
    }
  }, [user?.role, user?.status]);

  const updateDriverDoc = useCallback(async (data: Partial<User> & { status?: DriverStatus }) => {
    if (!user?.uid) return;

    const payload: Record<string, unknown> = {};
    if (data.status) payload.status = data.status;
    if (typeof data.lastTickTimestamp === 'number') payload.last_tick_timestamp = data.lastTickTimestamp;
    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.uid);

    if (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver lifecycle] profile update failed:', error);
      toast({
        variant: 'destructive',
        title: 'تعذر تحديث حالة الكابتن',
        description: 'تحقق من الاتصال أو صلاحيات الحساب ثم حاول مرة أخرى.',
      });
    }
  }, [toast, user?.uid]);

  const changeDriverStatus = useCallback((nextStatus: DriverStatus) => {
    setDriverStatus(nextStatus);
  }, []);

  const clearTimers = useCallback(() => {
    if (timers.current.dormancy) clearTimeout(timers.current.dormancy);
    if (timers.current.warning) clearTimeout(timers.current.warning);
    timers.current = { dormancy: null, warning: null };
    setWarning(false);
  }, []);

  const resetDormancyTimer = useCallback(() => {
    clearTimers();
    if (statusRef.current !== 'active') return;

    timers.current.warning = setTimeout(() => setWarning(true), 4 * 60 * 1000);
    timers.current.dormancy = setTimeout(() => {
      changeDriverStatus('idle');
      void updateDriverDoc({ status: 'idle' });
      if (user?.uid) {
        void addCaptainSovereignLog(
          user.uid,
          'system_action',
          'تعطيل تلقائي',
          'تم تحويل حالة الكابتن إلى غير متاح بسبب عدم وجود نشاط لفترة طويلة.',
        );
      }
    }, 5 * 60 * 1000);
  }, [changeDriverStatus, clearTimers, updateDriverDoc, user?.uid]);

  useEffect(() => {
    if (user?.role !== 'driver' || driverStatus !== 'active') {
      clearTimers();
      return;
    }

    const wake = () => resetDormancyTimer();
    window.addEventListener('touchstart', wake, { passive: true });
    window.addEventListener('scroll', wake, { passive: true });
    resetDormancyTimer();

    return () => {
      window.removeEventListener('touchstart', wake);
      window.removeEventListener('scroll', wake);
      clearTimers();
    };
  }, [clearTimers, driverStatus, resetDormancyTimer, user?.role]);

  const toggleDriverStatus = useCallback(async (desiredStatus: 'active' | 'idle') => {
    if (driverStatus === 'busy' || driverStatus === 'rating') return;
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    try {
      changeDriverStatus(desiredStatus);
      await updateDriverDoc({
        status: desiredStatus,
        lastTickTimestamp: Date.now(),
      });

      if (user?.uid) {
        void addCaptainSovereignLog(
          user.uid,
          'status_change',
          desiredStatus === 'active' ? 'متاح لاستقبال الطلبات' : 'غير متاح',
          desiredStatus === 'active'
            ? 'تم تفعيل استقبال الطلبات.'
            : 'تم إيقاف استقبال الطلبات.',
        );
      }
    } finally {
      isTogglingRef.current = false;
    }
  }, [changeDriverStatus, driverStatus, updateDriverDoc, user?.uid]);

  return {
    driverStatus,
    setDriverStatus: changeDriverStatus,
    isDormancyWarningVisible,
    resetDormancyTimer,
    toggleDriverStatus,
    updateDriverDoc,
  };
}
