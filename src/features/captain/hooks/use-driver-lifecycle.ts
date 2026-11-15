'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { addCaptainSovereignLog } from '@/lib/dexie-db';
import {
  setCaptainStatusRemotely,
  updateCaptainProfileDoc,
  type DriverStatus,
} from '../services/driver-lifecycle-service';
import { useDriverStatusSync } from './use-driver-status-sync';
import { useDriverDormancy } from './use-driver-dormancy';

export function useDriverLifecycle(user: User | null) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('idle');
  const [accountSecurityStatus, setAccountSecurityStatus] = useState<'SUSPENDED' | 'BANNED' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activationNonce, setActivationNonce] = useState(0);
  const isTogglingRef = useRef(false);
  const { toast } = useToast();
  const t = useTranslations('captainDashboard');

  useEffect(() => {
    if (user?.role === 'driver') {
      const initialStatus = String(user.status || '').toUpperCase();
      if (initialStatus === 'SUSPENDED' || initialStatus === 'BANNED') {
        setAccountSecurityStatus(initialStatus as 'SUSPENDED' | 'BANNED');
        setDriverStatus('idle');
      } else {
        setAccountSecurityStatus(null);
        setDriverStatus((user.status || 'idle') as DriverStatus);
      }
    }
  }, [user?.role, user?.status]);

  useDriverStatusSync({
    user,
    setAccountSecurityStatus,
    setDriverStatus,
  });

  const updateDriverDoc = useCallback(async (data: Partial<User> & { status?: DriverStatus }) => {
    if (!user?.uid) return false;

    if (data.status) {
      const isSuccess = await setCaptainStatusRemotely(user.uid, data.status);

      if (!isSuccess) {
        toast({
          variant: 'destructive',
          title: t('statusUpdateFailed'),
          description: t('statusUpdateFailedBody'),
        });
        return false;
      }

      setDriverStatus(data.status);

      if (data.status === 'idle') {
        void supabase.from('ride_offers').update({ status: 'CANCELLED' }).eq('captain_id', user.uid).neq('status', 'ACCEPTED');
        void supabase.from('ride_offers').delete().eq('captain_id', user.uid).neq('status', 'ACCEPTED');
      }

      return true;
    }

    const payload: Record<string, unknown> = {};
    if (typeof data.lastTickTimestamp === 'number') payload.last_tick_timestamp = data.lastTickTimestamp;
    if (Object.keys(payload).length === 0) return false;

    const ok = await updateCaptainProfileDoc(user.uid, payload);
    if (!ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Driver lifecycle] profile update failed');
      }
      toast({
        variant: 'destructive',
        title: t('statusUpdateFailed'),
        description: t('statusUpdateFailedBody'),
      });
      return false;
    }

    return true;
  }, [t, toast, user?.uid]);

  const changeDriverStatus = useCallback((nextStatus: DriverStatus) => {
    setDriverStatus(nextStatus);
  }, []);

  const { isDormancyWarningVisible, resetDormancyTimer } = useDriverDormancy({
    user,
    driverStatus,
    changeDriverStatus,
    updateDriverDoc,
  });

  const toggleDriverStatus = useCallback(async (desiredStatus: 'active' | 'idle') => {
    if (accountSecurityStatus) {
      toast({
        variant: 'destructive',
        title: accountSecurityStatus === 'BANNED' ? 'الحساب محظور نهائياً 🚫' : 'الحساب معلق مؤقتاً ⚠️',
        description: 'لا يمكن تفعيل الاتصال بالرادار أثناء إيقاف أو تعليق الحساب من قبل الإدارة.',
      });
      return false;
    }
    if (driverStatus === 'busy' || driverStatus === 'rating') return false;
    if (isTogglingRef.current) return false;
    isTogglingRef.current = true;
    setIsUpdatingStatus(true);

    try {
      const updated = await updateDriverDoc({
        status: desiredStatus,
        lastTickTimestamp: Date.now(),
      });
      if (!updated) return false;

      changeDriverStatus(desiredStatus);
      if (desiredStatus === 'active') {
        setActivationNonce((prev) => prev + 1);
      }
      if (user?.uid) {
        if (desiredStatus === 'idle') {
          void supabase.from('ride_offers').update({ status: 'CANCELLED' }).eq('captain_id', user.uid).neq('status', 'ACCEPTED');
          void supabase.from('ride_offers').delete().eq('captain_id', user.uid).neq('status', 'ACCEPTED');
        }
        void addCaptainSovereignLog(
          user.uid,
          'status_change',
          desiredStatus === 'active' ? t('statusActivated') : t('statusDeactivated'),
          desiredStatus === 'active' ? t('statusActivated') : t('statusDeactivated'),
        );
      }
      return true;
    } finally {
      isTogglingRef.current = false;
      setIsUpdatingStatus(false);
    }
  }, [accountSecurityStatus, changeDriverStatus, driverStatus, t, toast, updateDriverDoc, user?.uid]);

  return {
    driverStatus,
    accountSecurityStatus,
    activationNonce,
    setDriverStatus: changeDriverStatus,
    isDormancyWarningVisible,
    isUpdatingStatus,
    resetDormancyTimer,
    toggleDriverStatus,
    updateDriverDoc,
  };
}
