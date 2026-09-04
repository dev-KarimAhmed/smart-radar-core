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
      setDriverStatus((user.status || 'idle') as DriverStatus);
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
          const status = String((payload.new as { status?: unknown }).status || '').toLowerCase();
          if (isDriverStatus(status)) {
            setDriverStatus(status);
          }
        },
      )
      .subscribe();

    void supabase
      .from('profiles')
      .select('status')
      .eq('id', user.uid)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!mounted || error) return;
        let status = String((data as { status?: unknown } | null)?.status || '').toLowerCase();
        if (status === 'active') {
          const { data: walletData } = await supabase.rpc('get_captain_wallet_status');
          const hasBundle = (walletData as { has_active_bundle?: boolean } | null)?.has_active_bundle === true;
          if (!hasBundle) {
            status = 'idle';
            void supabase.from('profiles').update({ status: 'IDLE' }).eq('id', user.uid);
          }
        }
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
      const { data: result, error } = await supabase.rpc('set_captain_status', { p_status: data.status });
      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Driver lifecycle] status update failed:', error);
        }

        const now = Date.now();
        if (now - lastStatusErrorAtRef.current > 1000) {
          lastStatusErrorAtRef.current = now;
          const code = String(error.code || '').toUpperCase();
          const message = `${error.code || ''} ${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
          const isBundleError =
            message.includes('captain_time_bundle_required') ||
            message.includes('time_bundle') ||
            message.includes('bundle');
          const isRoleError = message.includes('captain_role_required');
          const isAuthError = message.includes('authentication_required') || code === '401' || code === 'PGRST301';
          const isProfileError = message.includes('captain_profile_not_found');
          const isInvalidStatus = message.includes('invalid_captain_status');
          const isMissingRpc =
            code === '42883' ||
            code === 'PGRST202' ||
            /could not find (the )?function|schema cache|function .*set_captain_status/.test(message);
          toast({
            variant: 'destructive',
            title: isBundleError
              ? t('radarBundleRequired')
              : isRoleError
                ? t('statusRoleRequired')
                : isAuthError
                  ? t('statusAuthRequired')
                  : isProfileError
                    ? t('statusProfileMissing')
                    : isInvalidStatus
                      ? t('statusInvalid')
                      : isMissingRpc
                        ? t('statusBackendNotReady')
                        : t('statusUpdateFailed'),
            description: t('statusUpdateFailedBody'),
          });
        }
        return false;
      }

      const returnedStatus = (result as { status?: unknown } | null)?.status;
      if (String(returnedStatus || '').toLowerCase() !== data.status) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Driver lifecycle] status RPC returned an unexpected state:', result);
        }
        toast({
          variant: 'destructive',
          title: t('statusUpdateFailed'),
          description: t('statusUpdateFailedBody'),
        });
        return false;
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
  }, [changeDriverStatus, driverStatus, t, updateDriverDoc, user?.uid]);

  return {
    driverStatus,
    activationNonce,
    setDriverStatus: changeDriverStatus,
    isDormancyWarningVisible,
    isUpdatingStatus,
    resetDormancyTimer,
    toggleDriverStatus,
    updateDriverDoc,
  };
}
