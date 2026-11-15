import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@/core/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { addCaptainSovereignLog } from '@/lib/dexie-db';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import type { DriverStatus } from '../services/driver-lifecycle-service';

interface UseDriverDormancyProps {
  user: User | null;
  driverStatus: DriverStatus;
  changeDriverStatus: (nextStatus: DriverStatus) => void;
  updateDriverDoc: (data: Partial<User> & { status?: DriverStatus }) => Promise<boolean>;
}

export function useDriverDormancy({
  user,
  driverStatus,
  changeDriverStatus,
  updateDriverDoc,
}: UseDriverDormancyProps) {
  const [isDormancyWarningVisible, setWarning] = useState(false);
  const timers = useRef<{
    dormancy: ReturnType<typeof setTimeout> | null;
    warning: ReturnType<typeof setTimeout> | null;
  }>({ dormancy: null, warning: null });
  const statusRef = useRef(driverStatus);
  const { toast } = useToast();
  const t = useTranslations('captainDashboard');

  useEffect(() => {
    statusRef.current = driverStatus;
  }, [driverStatus]);

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

  return {
    isDormancyWarningVisible,
    resetDormancyTimer,
  };
}
