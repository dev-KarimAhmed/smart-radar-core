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
    hasActiveFilter,
    searchQuery,
    statusFilter,
    rankFilter,
    languageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
  } = filters;

  const requestSeqRef = useRef(0);

  const fetchCaptains = useCallback(async (quiet = false) => {
    const seq = ++requestSeqRef.current;
    if (!hasActiveFilter) {
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
        countryId: selectedCountry,
        governorateId: selectedGovernorate,
        districtId: selectedDistrict,
        status: statusFilter,
        tier: rankFilter,
        language: languageFilter,
        q: searchQuery,
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
  }, [
    hasActiveFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    statusFilter,
    rankFilter,
    languageFilter,
    searchQuery,
    toast,
    isArabic,
    setGeoLookup,
    clearSelection,
  ]);

  // Debounce text search; trigger immediately on discrete filter switches
  useEffect(() => {
    const delay = searchQuery.trim() ? 300 : 0;
    const timer = window.setTimeout(() => {
      void fetchCaptains(false);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [fetchCaptains, searchQuery]);

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
    ...actions,
    ...bulk,
    ...welcome,
  };
}

export type UseDriversManagementReturn = ReturnType<typeof useDriversManagement>;
