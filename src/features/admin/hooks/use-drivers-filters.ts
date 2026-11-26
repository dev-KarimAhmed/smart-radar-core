'use client';

import { useState, useMemo, useCallback } from 'react';
import type { CaptainUser } from '@/features/admin/types/driver-management';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import {
  areDriversFiltersEqual,
  hasAnyDriversFilter,
  INITIAL_DRIVERS_FILTER_SNAPSHOT,
  matchesCaptainSnapshot,
  type DriversFilterSnapshot,
} from './drivers-filter-helpers';

export function useDriversFilters(captains: CaptainUser[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [languageFilter, setLanguageFilter] = useState<'ALL' | 'ar' | 'en'>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  const [appliedFilters, setAppliedFilters] = useState<DriversFilterSnapshot | null>(null);
  const [geoLookup, setGeoLookup] = useState<GeoLookup>({
    countries: [],
    governorates: [],
    districts: [],
  });
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<Set<string>>(new Set());

  const draftFilters = useMemo<DriversFilterSnapshot>(
    () => ({
      searchQuery,
      statusFilter,
      rankFilter,
      languageFilter,
      selectedCountry,
      selectedGovernorate,
      selectedDistrict,
    }),
    [searchQuery, statusFilter, rankFilter, languageFilter, selectedCountry, selectedGovernorate, selectedDistrict],
  );

  const hasDraftFilter = useMemo(() => hasAnyDriversFilter(draftFilters), [draftFilters]);
  const hasActiveFilter = appliedFilters !== null;
  const hasPendingChanges = useMemo(
    () => hasDraftFilter && !areDriversFiltersEqual(draftFilters, appliedFilters),
    [hasDraftFilter, draftFilters, appliedFilters],
  );

  const handleCountryChange = useCallback((val: string) => {
    setSelectedCountry(val);
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  const handleGovernorateChange = useCallback((val: string) => {
    setSelectedGovernorate(val);
    setSelectedDistrict('ALL');
    if (val !== 'ALL') {
      const gov = geoLookup.governorates.find((g) => String(g.id) === val);
      if (gov) setSelectedCountry(String(gov.country_id));
    }
  }, [geoLookup.governorates]);

  const handleDistrictChange = useCallback((val: string) => {
    setSelectedDistrict(val);
    if (val !== 'ALL') {
      const dist = geoLookup.districts.find((d) => String(d.id) === val);
      if (dist) {
        const gov = geoLookup.governorates.find((g) => g.id === dist.governorate_id);
        if (gov) {
          setSelectedGovernorate(String(gov.id));
          setSelectedCountry(String(gov.country_id));
        }
      }
    }
  }, [geoLookup.districts, geoLookup.governorates]);

  const handleResetGeo = useCallback(() => {
    setSelectedCountry('ALL');
    setSelectedGovernorate('ALL');
    setSelectedDistrict('ALL');
  }, []);

  const applyFilters = useCallback(() => {
    if (!hasDraftFilter) {
      setAppliedFilters(null);
      return null;
    }
    const snapshot: DriversFilterSnapshot = { ...draftFilters };
    setAppliedFilters(snapshot);
    return snapshot;
  }, [hasDraftFilter, draftFilters]);

  const handleResetAllFilters = useCallback(() => {
    setStatusFilter(INITIAL_DRIVERS_FILTER_SNAPSHOT.statusFilter);
    setRankFilter(INITIAL_DRIVERS_FILTER_SNAPSHOT.rankFilter);
    setLanguageFilter(INITIAL_DRIVERS_FILTER_SNAPSHOT.languageFilter);
    setSelectedCountry(INITIAL_DRIVERS_FILTER_SNAPSHOT.selectedCountry);
    setSelectedGovernorate(INITIAL_DRIVERS_FILTER_SNAPSHOT.selectedGovernorate);
    setSelectedDistrict(INITIAL_DRIVERS_FILTER_SNAPSHOT.selectedDistrict);
    setSearchQuery(INITIAL_DRIVERS_FILTER_SNAPSHOT.searchQuery);
    setAppliedFilters(null);
    setSelectedCaptainIds(new Set());
  }, []);

  const filteredCaptains = useMemo(() => {
    if (!appliedFilters) return [];
    return captains.filter((c) => matchesCaptainSnapshot(c, appliedFilters, geoLookup));
  }, [captains, appliedFilters, geoLookup]);

  const stats = useMemo(() => {
    const total = captains.length;
    const active = captains.filter((c) => c.status === 'ACTIVE' || c.status === 'BUSY').length;
    const flagged = captains.filter(
      (c) => c.status === 'SUSPENDED' || c.status === 'BANNED' || c.penalty_count > 0,
    ).length;
    return { total, active, flagged };
  }, [captains]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedCaptainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (filteredCaptains.length === 0) return;
    const allFilteredSelected = filteredCaptains.every((c) => selectedCaptainIds.has(c.id));
    setSelectedCaptainIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredCaptains.forEach((c) => next.delete(c.id));
      else filteredCaptains.forEach((c) => next.add(c.id));
      return next;
    });
  }, [filteredCaptains, selectedCaptainIds]);

  const clearSelection = useCallback(() => {
    setSelectedCaptainIds(new Set());
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    rankFilter,
    setRankFilter,
    languageFilter,
    setLanguageFilter,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    geoLookup,
    setGeoLookup,
    handleCountryChange,
    handleGovernorateChange,
    handleDistrictChange,
    handleResetGeo,
    handleResetAllFilters,
    applyFilters,
    appliedFilters,
    hasDraftFilter,
    hasActiveFilter,
    hasPendingChanges,
    filteredCaptains,
    stats,
    selectedCaptainIds,
    toggleSelectOne,
    toggleSelectAll,
    clearSelection,
  };
}
