'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [totalCaptainsCount, setTotalCaptainsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const filters = useDriversFilters(captains);
  const {
    setGeoLookup,
    filteredCaptains,
    selectedCaptainIds,
    clearSelection,
    appliedFilters,
    applyFilters,
    handleResetAllFilters,
  } = filters;

  const requestSeqRef = useRef(0);

  const fetchCaptains = useCallback(async (quiet = false) => {
    const seq = ++requestSeqRef.current;
    if (!appliedFilters) {
      setCaptains([]);
      clearSelection();
      try {
        const meta = await fetchCaptainsData({ metaOnly: true });
        if (seq !== requestSeqRef.current) return;
        if (meta.geo) setGeoLookup(meta.geo);
        if (typeof meta.totalCount === 'number') setTotalCaptainsCount(meta.totalCount);
      } catch (err) {
        console.warn('[DriversManagementTab] meta fetch error:', err);
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
      return;
    }

    if (!quiet) setLoading(true);
    try {
      const data = await fetchCaptainsData({
        countryId: appliedFilters.selectedCountry,
        governorateId: appliedFilters.selectedGovernorate,
        districtId: appliedFilters.selectedDistrict,
        status: appliedFilters.statusFilter,
        tier: appliedFilters.rankFilter,
        language: appliedFilters.languageFilter,
        q: appliedFilters.searchQuery,
      });
      if (seq !== requestSeqRef.current) return;
      setCaptains(data.users);
      if (data.geo) setGeoLookup(data.geo);
    } catch (err: any) {
      if (seq !== requestSeqRef.current) return;
      console.warn('[DriversManagementTab] fetch error:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ استدعاء الأسطول' : 'Fleet Fetch Error',
        description: err.message || (isArabic ? 'تعذر جلب بيانات الكباتن المعلنين' : 'Unable to fetch captains'),
      });
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [appliedFilters, toast, isArabic, setGeoLookup, clearSelection]);

  // Fetches metaOnly on mount, and fetches filtered list ONLY when appliedFilters changes via Apply Filter button
  useEffect(() => {
    void fetchCaptains(false);
  }, [fetchCaptains]);

  const handleApplyFilters = useCallback(() => {
    const snap = applyFilters();
    if (!snap) {
      toast({
        title: isArabic ? 'اختر فلتراً أولاً' : 'Select a Filter First',
        description: isArabic
          ? 'يرجى تحديد أي فلتر (الدولة، المحافظة، الحالة، الرتبة، اللغة) أو كتابة كلمة بحث ثم الضغط على تطبيق الفلتر.'
          : 'Please choose at least one filter or enter a search query.',
      });
    }
  }, [applyFilters, toast, isArabic]);

  const handleResetAll = useCallback(() => {
    handleResetAllFilters();
    setCaptains([]);
  }, [handleResetAllFilters]);

  const actions = useDriversActions({
    isArabic,
    onRefresh: fetchCaptains,
    setCaptains,
  });

  const bulk = useDriversBulk({
    isArabic,
    captains,
    totalCaptainsCount,
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
    totalCaptainsCount,
    loading,
    fetchCaptains,
    ...filters,
    handleApplyFilters,
    handleResetAllFilters: handleResetAll,
    ...actions,
    ...bulk,
    ...welcome,
  };
}

export type UseDriversManagementReturn = ReturnType<typeof useDriversManagement>;
