'use client';

import { useMemo, useState } from 'react';
import type {
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
  HourlyRateFilterMode,
} from '@/features/admin/types/hourly-rates';

interface UseHourlyRatesFiltersParams {
  governorates: GovernorateItem[];
  districts: DistrictItem[];
  selectedCountryId: number;
  customRates: CustomRatesMatrix;
}

export function useHourlyRatesFilters({
  governorates,
  districts,
  selectedCountryId,
  customRates,
}: UseHourlyRatesFiltersParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<HourlyRateFilterMode>('all');
  const [expandedGovs, setExpandedGovs] = useState<Record<number, boolean>>({});

  const toggleGovExpanded = (govId: number) => {
    setExpandedGovs((prev) => ({ ...prev, [govId]: !prev[govId] }));
  };

  const expandAllGovs = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    for (const g of governorates) next[g.id] = expand;
    setExpandedGovs(next);
  };

  const filteredGovernorates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const countryGovs = governorates.filter((g) => g.country_id === selectedCountryId);
    return countryGovs.filter((gov) => {
      const govDists = districts.filter((d) => d.governorate_id === gov.id);
      const hasGovCustom = customRates.governorates[String(gov.id)] !== undefined;
      const hasAnyDistCustom = govDists.some((d) => customRates.districts[String(d.id)] !== undefined);
      if (filterMode === 'custom_only' && !hasGovCustom && !hasAnyDistCustom) return false;
      if (filterMode === 'default_only' && (hasGovCustom || hasAnyDistCustom)) return false;
      if (!q) return true;
      const govMatch = gov.name_ar.toLowerCase().includes(q) || gov.name_en.toLowerCase().includes(q);
      if (govMatch) return true;
      return govDists.some((d) => d.name_ar.toLowerCase().includes(q) || d.name_en.toLowerCase().includes(q));
    });
  }, [governorates, districts, selectedCountryId, searchQuery, filterMode, customRates]);

  const totalGovsInCountry = governorates.filter((g) => g.country_id === selectedCountryId).length;
  const totalDistsInCountry = districts.filter((d) => {
    const g = governorates.find((gov) => gov.id === d.governorate_id);
    return g?.country_id === selectedCountryId;
  }).length;

  const totalCustomZones = useMemo(() => {
    const govIds = new Set(governorates.filter((g) => g.country_id === selectedCountryId).map((g) => String(g.id)));
    const customGovCount = Object.keys(customRates.governorates).filter((id) => govIds.has(id)).length;
    const distIds = new Set(
      districts
        .filter((d) => {
          const g = governorates.find((gov) => gov.id === d.governorate_id);
          return g?.country_id === selectedCountryId;
        })
        .map((d) => String(d.id))
    );
    const customDistCount = Object.keys(customRates.districts).filter((id) => distIds.has(id)).length;
    return customGovCount + customDistCount;
  }, [governorates, districts, selectedCountryId, customRates]);

  return {
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    expandedGovs,
    toggleGovExpanded,
    expandAllGovs,
    filteredGovernorates,
    totalGovsInCountry,
    totalDistsInCountry,
    totalCustomZones,
  };
}

