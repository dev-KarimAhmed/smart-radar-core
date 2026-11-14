'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHourlyRates } from '@/features/admin/hooks/use-hourly-rates';
import { HourlyRatesHeaderMetrics } from './parts/hourly-rates-header-metrics';
import { HourlyRatesFilterBar } from './parts/hourly-rates-filter-bar';
import { HourlyRateGovCard } from './parts/hourly-rate-gov-card';

// Re-export types for 100% backward compatibility
export type {
  CountryItem,
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
  HourlyRateFilterMode,
} from '@/features/admin/types/hourly-rates';

export function HourlyRatesManagementPanel() {
  const {
    t,
    isArabic,
    direction,
    loading,
    countries,
    districts,
    customRates,
    selectedCountryId,
    setSelectedCountryId,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    expandedGovs,
    toggleGovExpanded,
    expandAllGovs,
    localGovInputs,
    setLocalGovInputs,
    localDistInputs,
    setLocalDistInputs,
    savingKey,
    activeCountry,
    currency,
    countryDefaultPrice,
    filteredGovernorates,
    totalGovsInCountry,
    totalDistsInCountry,
    totalCustomZones,
    handleSaveGovRate,
    handleResetGovRate,
    handleApplyToAllDistricts,
    handleSaveDistrictRate,
    handleResetDistrictRate,
  } = useHourlyRates();

  return (
    <div className={cn("space-y-6", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* 1. Header & Summary Stats */}
      <HourlyRatesHeaderMetrics
        countryDefaultPrice={countryDefaultPrice}
        currency={currency}
        totalCustomZones={totalCustomZones}
        totalGovsInCountry={totalGovsInCountry}
        totalDistsInCountry={totalDistsInCountry}
        activeCountryName={isArabic ? activeCountry.name_ar : (activeCountry.name_en || activeCountry.name_ar)}
        t={t}
      />

      {/* 2. Country Switcher, Search and Filter Bar */}
      <HourlyRatesFilterBar
        countries={countries}
        selectedCountryId={selectedCountryId}
        onSelectCountryId={setSelectedCountryId}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        filteredCount={filteredGovernorates.length}
        onExpandAll={expandAllGovs}
        isArabic={isArabic}
        t={t}
      />

      {/* 3. Governorates & Districts List */}
      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400 rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-xs">{t('loadingRates')}</p>
        </div>
      ) : filteredGovernorates.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400 rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-12">
          <MapPin className="h-8 w-8 text-slate-600" />
          <p className="text-xs">{t('emptySearchResult')}</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredGovernorates.map((gov) => {
            const govDists = districts.filter((d) => d.governorate_id === gov.id);
            const isExpanded = !!expandedGovs[gov.id] || !!searchQuery.trim();

            return (
              <HourlyRateGovCard
                key={gov.id}
                gov={gov}
                govDists={govDists}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleGovExpanded(gov.id)}
                customRates={customRates}
                countryDefaultPrice={countryDefaultPrice}
                currency={currency}
                isArabic={isArabic}
                localGovInputs={localGovInputs}
                onGovDraftChange={(val) => setLocalGovInputs((prev) => ({ ...prev, [gov.id]: val }))}
                localDistInputs={localDistInputs}
                onDistDraftChange={(distId, val) => setLocalDistInputs((prev) => ({ ...prev, [distId]: val }))}
                savingKey={savingKey}
                onSaveGov={() => handleSaveGovRate(gov.id)}
                onResetGov={() => handleResetGovRate(gov.id)}
                onApplyAllDistricts={() => handleApplyToAllDistricts(gov.id)}
                onSaveDistrict={handleSaveDistrictRate}
                onResetDistrict={handleResetDistrictRate}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
