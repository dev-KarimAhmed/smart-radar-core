'use client';

import React from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type {
  CountryItem,
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
} from './hourly-rates/hourly-rates-types';
import { HourlyRatesHeaderStats } from './hourly-rates/hourly-rates-header-stats';
import { GovernorateRateCard } from './hourly-rates/governorate-rate-card';
import { useHourlyRates } from './hourly-rates/use-hourly-rates';

export type { CountryItem, GovernorateItem, DistrictItem, CustomRatesMatrix } from './hourly-rates/hourly-rates-types';

export function HourlyRatesManagementPanel() {
  const { direction, isArabic } = useDashboardLanguage();
  const {
    t,
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
    localGovInputs,
    setLocalGovInputs,
    localDistInputs,
    setLocalDistInputs,
    savingKey,
    activeCountry,
    countryDefaultPrice,
    toggleGovExpanded,
    expandAllGovs,
    handleSaveGovRate,
    handleResetGovRate,
    handleApplyToAllDistricts,
    handleSaveDistrictRate,
    handleResetDistrictRate,
    filteredGovernorates,
    totalGovsInCountry,
    totalDistsInCountry,
    totalCustomZones,
  } = useHourlyRates();

  const currency = isArabic ? activeCountry.currency_ar : activeCountry.currency_en || 'JOD';

  return (
    <div className={cn("space-y-6", isArabic ? "text-right" : "text-left")} dir={direction}>
      <HourlyRatesHeaderStats
        countryDefaultPrice={countryDefaultPrice}
        currency={currency}
        totalCustomZones={totalCustomZones}
        totalGovsInCountry={totalGovsInCountry}
        totalDistsInCountry={totalDistsInCountry}
        activeCountry={activeCountry}
        countries={countries}
        selectedCountryId={selectedCountryId}
        onSelectCountry={setSelectedCountryId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        filteredGovernoratesCount={filteredGovernorates.length}
        onExpandAll={expandAllGovs}
        isArabic={isArabic}
        t={t}
      />

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
              <GovernorateRateCard
                key={gov.id}
                gov={gov}
                govDists={govDists}
                isArabic={isArabic}
                currency={currency}
                countryDefaultPrice={countryDefaultPrice}
                customRates={customRates}
                localGovInputs={localGovInputs}
                localDistInputs={localDistInputs}
                isExpanded={isExpanded}
                savingKey={savingKey}
                onToggleExpand={() => toggleGovExpanded(gov.id)}
                onGovDraftChange={(val) => setLocalGovInputs((prev) => ({ ...prev, [gov.id]: val }))}
                onDistDraftChange={(distId, val) => setLocalDistInputs((prev) => ({ ...prev, [distId]: val }))}
                onSaveGov={() => handleSaveGovRate(gov.id, currency)}
                onResetGov={() => handleResetGovRate(gov.id)}
                onApplyAllDistricts={() => handleApplyToAllDistricts(gov.id, currency)}
                onSaveDistrict={(distId) => handleSaveDistrictRate(distId, currency)}
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
