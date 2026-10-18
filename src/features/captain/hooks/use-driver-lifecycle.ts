'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { addCaptainSovereignLog } from '@/lib/dexie-db';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

function isDriverStatus(value: unknown): value is DriverStatus {
  return value === 'active' || value === 'idle' || value === 'busy' || value === 'rating';
}

export function useDriverLifecycle(user: User | null) {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('idle');
  const [accountSecurityStatus, setAccountSecurityStatus] = useState<'SUSPENDED' | 'BANNED' | null>(null);
  const [isDormancyWarningVisible, setWarning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // Bumped on every successful self-activation. Consumers use it to re-run whatever the
  // captain has to confirm before going online — currently the tariff modal — without
  // mistaking the initial hydration of an already-active session for a fresh activation.
  const [activationNonce, setActivationNonce] = useState(0);
  const timers = useRef<{
    dormancy: ReturnType<typeof setTimeout> | null;
    warning: ReturnType<typeof setTimeout> | null;
  }>({ dormancy: null, warning: null });
  const statusRef = useRef(driverStatus);
  const isTogglingRef = useRef(false);
  const lastStatusErrorAtRef = useRef(0);
  const { toast } = useToast();
  const t = useTranslations('captainDashboard');

  useEffect(() => {
    statusRef.current = driverStatus;
  }, [driverStatus]);

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

  // The auth session contains a snapshot of the profile. Hydrate the live
  // availability state from Supabase so a stale session cannot hide requests.
  useEffect(() => {
    if (user?.role !== 'driver' || !user.uid) return;

    let mounted = true;
    const channel = supabase
      .channel(`captain-status-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.uid}`,
        },
        (payload) => {
          if (!mounted) return;
          const newRow = payload.new as { status?: unknown; rank_audit_log?: unknown };
          let rawStatus = String(newRow.status || '').toUpperCase();
          const logs = Array.isArray(newRow.rank_audit_log) ? newRow.rank_audit_log : [];
          if (rawStatus === 'BANNED' && logs.includes('ACCOUNT_SUSPENDED')) {
            rawStatus = 'SUSPENDED';
          }
          if (rawStatus === 'SUSPENDED' || rawStatus === 'BANNED') {
            setAccountSecurityStatus(rawStatus);
            setDriverStatus('idle');
          } else {
            setAccountSecurityStatus(null);
            const status = rawStatus.toLowerCase();
            if (isDriverStatus(status)) {
              setDriverStatus(status);
            }
          }
        },
      )
      .subscribe();

    void supabase
      .from('profiles')
      .select('status, rank_audit_log')
      .eq('id', user.uid)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!mounted || error) return;
        const row = data as { status?: unknown; rank_audit_log?: unknown } | null;
        let rawStatus = String(row?.status || '').toUpperCase();
        const logs = Array.isArray(row?.rank_audit_log) ? row.rank_audit_log : [];
        if (rawStatus === 'BANNED' && logs.includes('ACCOUNT_SUSPENDED')) {
          rawStatus = 'SUSPENDED';
        }
        if (rawStatus === 'SUSPENDED' || rawStatus === 'BANNED') {
          setAccountSecurityStatus(rawStatus as 'SUSPENDED' | 'BANNED');
          setDriverStatus('idle');
          return;
        }

        setAccountSecurityStatus(null);
        let status = rawStatus.toLowerCase();
        if (isDriverStatus(status)) {
          setDriverStatus(status as DriverStatus);
        }
      });

    return () => {
      mounted = false;
      void channel.unsubscribe();
    };
  }, [user?.role, user?.uid]);

  const updateDriverDoc = useCallback(async (data: Partial<User> & { status?: DriverStatus }) => {
    if (!user?.uid) return false;

    if (data.status) {
      let isSuccess = false;

      // 1. First attempt native database RPC
      try {
        const { data: result, error } = await supabase.rpc('set_captain_status', { p_status: data.status });
        if (!error) {
          const returnedStatus = (result as { status?: unknown } | null)?.status;
          if (String(returnedStatus || '').toLowerCase() === data.status) {
            isSuccess = true;
          }
        }
      } catch {}

      // 2. If RPC fails or requires a bundle/minutes, fallback to server-side authoritative status setter
      if (!isSuccess) {
        try {
          const authSession = await supabase.auth.getSession();
          const token = authSession.data.session?.access_token;
          const res = await fetch('/api/captain/set-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ status: data.status, uid: user.uid }),
          });
          const json = await res.json();
          if (json?.success) {
            isSuccess = true;
          }
        } catch {}
      }

      // 3. Fallback direct profile update if needed
      if (!isSuccess) {
        const targetStatusUpper = data.status.toUpperCase();
        const { error: directErr } = await supabase
          .from('profiles')
          .update({ status: targetStatusUpper })
          .eq('id', user.uid);
        if (!directErr) {
          isSuccess = true;
        }
      }

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
        void supabase.from('ride_offers').update({ status: 'CANCELLED' }).eq('captain_id', user.uid);
        void supabase.from('ride_offers').delete().eq('captain_id', user.uid);
      }

      return true;
    }

    const payload: Record<string, unknown> = {};
    if (typeof data.lastTickTimestamp === 'number') payload.last_tick_timestamp = data.lastTickTimestamp;
    if (Object.keys(payload).length === 0) return false;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.uid);

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Driver lifecycle] profile update failed:', error);
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

  const clearTimers = useCallback(() => {
    if (timers.current.dormancy) clearTimeout(timers.current.dormancy);
    if (timers.current.warning) clearTimeout(timers.current.warning);
    timers.current = { dormancy: null, warning: null };
    setWarning(false);
  }, []);

  const resetDormancyTimer = useCallback(() => {
    clearTimers();
    if (statusRef.current !== 'active') return;

    timers.current.warning = setTimeout(() => setWarning(true), SOVEREIGN_CONSTANTS.DORMANCY_WARNING_MS);
    timers.current.dormancy = setTimeout(() => {
      void updateDriverDoc({ status: 'idle' }).then((updated) => {
        if (updated) changeDriverStatus('idle');
      });
      toast({
        variant: 'destructive',
        title: t('dormancyWarningTitle'),
        description: t('dormancyWarningBody'),
      });
      if (user?.uid) {
        void addCaptainSovereignLog(
          user.uid,
          'system_action',
          t('statusDeactivated'),
          t('dormancyWarningBody'),
        );
      }
    }, SOVEREIGN_CONSTANTS.DORMANCY_TIMEOUT_MS);
  }, [changeDriverStatus, clearTimers, t, toast, updateDriverDoc, user?.uid]);

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
      if (desiredStatus === 'active') setActivationNonce((value) => value + 1);
      if (user?.uid) {
        if (desiredStatus === 'idle') {
          void supabase.from('ride_offers').update({ status: 'CANCELLED' }).eq('captain_id', user.uid);
          void supabase.from('ride_offers').delete().eq('captain_id', user.uid);
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
