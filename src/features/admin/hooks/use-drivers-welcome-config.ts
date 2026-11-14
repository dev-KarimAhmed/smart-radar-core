'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { WelcomeHoursConfig } from '@/features/admin/types/driver-management';
import {
  fetchWelcomeHoursConfig,
  saveWelcomeHoursConfig,
  applyWelcomeHoursToExisting,
} from '@/features/admin/services/drivers-admin-service';

interface UseDriversWelcomeConfigProps {
  onRefresh: (quiet?: boolean) => Promise<void>;
  t: (key: string, values?: Record<string, any>) => string;
}

export function useDriversWelcomeConfig({ onRefresh, t }: UseDriversWelcomeConfigProps) {
  const { toast } = useToast();

  const [isWelcomeHoursOpen, setIsWelcomeHoursOpen] = useState(false);
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeHoursConfig>({
    enabled: true,
    hours: 20,
    minutes: 1200,
    validityDays: 30,
  });
  const [loadingWelcomeConfig, setLoadingWelcomeConfig] = useState(false);
  const [savingWelcomeConfig, setSavingWelcomeConfig] = useState(false);
  const [applyingToExisting, setApplyingToExisting] = useState(false);

  const loadWelcomeConfig = useCallback(async () => {
    try {
      setLoadingWelcomeConfig(true);
      const config = await fetchWelcomeHoursConfig();
      setWelcomeConfig(config);
    } catch (err) {
      console.warn('[WelcomeHours] Failed to fetch config:', err);
    } finally {
      setLoadingWelcomeConfig(false);
    }
  }, []);

  useEffect(() => {
    void loadWelcomeConfig();
  }, [loadWelcomeConfig]);

  const handleSaveWelcomeSettings = async () => {
    try {
      setSavingWelcomeConfig(true);
      const msg = await saveWelcomeHoursConfig({
        enabled: welcomeConfig.enabled,
        hours: welcomeConfig.hours,
        validityDays: welcomeConfig.validityDays,
      });
      toast({
        title: t('welcomeHoursSavedToast'),
        description: msg || `تم ضبط رصيد الترحيب إلى ${welcomeConfig.hours} ساعة بنجاح.`,
      });
      setIsWelcomeHoursOpen(false);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ في الحفظ', description: err.message || 'تعذر حفظ إعدادات رصيد الترحيب' });
    } finally {
      setSavingWelcomeConfig(false);
    }
  };

  const handleApplyToExisting = async () => {
    const confirmed = window.confirm(t('welcomeHoursRetroConfirm', { hours: welcomeConfig.hours }));
    if (!confirmed) return;

    try {
      setApplyingToExisting(true);
      const result = await applyWelcomeHoursToExisting({
        hours: welcomeConfig.hours,
        validityDays: welcomeConfig.validityDays,
      });
      toast({
        title: t('welcomeHoursApplySuccessToast', { count: result.count || 0 }),
        description: result.message,
      });
      await onRefresh(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'خطأ أثناء المنح', description: err.message || 'تعذر منح الرصيد للكباتن المسجلين' });
    } finally {
      setApplyingToExisting(false);
    }
  };

  return {
    isWelcomeHoursOpen,
    setIsWelcomeHoursOpen,
    welcomeConfig,
    setWelcomeConfig,
    loadingWelcomeConfig,
    savingWelcomeConfig,
    applyingToExisting,
    handleSaveWelcomeSettings,
    handleApplyToExisting,
  };
}

