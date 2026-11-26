'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type {
  AdminAnalyticsPayload,
  AnalyticsFilterState,
  AnalyticsPeriod,
  AnalyticsRoleFocus,
} from '@/features/admin/types/admin-analytics';

const DEFAULT_FILTERS: AnalyticsFilterState = {
  countryId: 'ALL',
  governorateId: 'ALL',
  districtId: 'ALL',
  period: 'all',
  roleFocus: 'ALL',
};

export function useAdminAnalytics(enabled: boolean) {
  const [filters, setFilters] = useState<AnalyticsFilterState>(DEFAULT_FILTERS);
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        countryId: filters.countryId,
        governorateId: filters.governorateId,
        districtId: filters.districtId,
        period: filters.period,
        roleFocus: filters.roleFocus,
      });
      const res = await adminFetch(`/api/admin/analytics?${qs.toString()}`);
      const json = await res.json();
      if (!res.ok || !json?.success || !json?.analytics) {
        throw new Error(json?.error || 'Failed to load analytics');
      }
      setData(json.analytics);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  }, [enabled, filters]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const setCountryId = useCallback((val: string) => {
    setFilters((prev) => ({
      ...prev,
      countryId: val,
      governorateId: 'ALL',
      districtId: 'ALL',
    }));
  }, []);

  const setGovernorateId = useCallback((val: string) => {
    setFilters((prev) => ({
      ...prev,
      governorateId: val,
      districtId: 'ALL',
    }));
  }, []);

  const setDistrictId = useCallback((val: string) => {
    setFilters((prev) => ({ ...prev, districtId: val }));
  }, []);

  const setPeriod = useCallback((period: AnalyticsPeriod) => {
    setFilters((prev) => ({ ...prev, period }));
  }, []);

  const setRoleFocus = useCallback((roleFocus: AnalyticsRoleFocus) => {
    setFilters((prev) => ({ ...prev, roleFocus }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    data,
    loading,
    error,
    refresh: loadAnalytics,
    setCountryId,
    setGovernorateId,
    setDistrictId,
    setPeriod,
    setRoleFocus,
    resetFilters,
  };
}
