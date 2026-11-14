'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import type { CaptainUser } from '@/features/admin/types/driver-management';
import { fetchCaptainsData } from '@/features/admin/services/drivers-admin-service';
import { useDriversFilters } from './use-drivers-filters';
import { useDriversActions } from './use-drivers-actions';
import { useDriversBulk } from './use-drivers-bulk';
import { useDriversWelcomeConfig } from './use-drivers-welcome-config';

export function useDriversManagement() {
  const t = useTranslations('adminCaptains');
  const { isArabic, direction } = useDashboardLanguage();
  const { toast } = useToast();

  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = useDriversFilters(captains);
  const { setGeoLookup, filteredCaptains, selectedCaptainIds } = filters;

  const fetchCaptains = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await fetchCaptainsData();
      setCaptains(data.users);
      if (data.geo) {
        setGeoLookup(data.geo);
      }
    } catch (err: any) {
      console.warn('[DriversManagementTab] fetch error:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ استدعاء الأسطول' : 'Fleet Fetch Error',
        description: err.message || (isArabic ? 'تعذر جلب بيانات الكباتن المعلنين' : 'Unable to fetch captains'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isArabic, setGeoLookup]);

  useEffect(() => {
    void fetchCaptains();
  }, [fetchCaptains]);

  const actions = useDriversActions({
    isArabic,
    onRefresh: fetchCaptains,
    setCaptains,
  });

  const bulk = useDriversBulk({
    isArabic,
    captains,
    filteredCaptains,
    selectedCaptainIds,
    onRefresh: fetchCaptains,
  });

  const welcome = useDriversWelcomeConfig({
    onRefresh: fetchCaptains,
    t,
  });

  return {
    t,
    isArabic,
    direction,
    captains,
    loading,
    fetchCaptains,
    ...filters,
    ...actions,
    ...bulk,
    ...welcome,
  };
}

export type UseDriversManagementReturn = ReturnType<typeof useDriversManagement>;

