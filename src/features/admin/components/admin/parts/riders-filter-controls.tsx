'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GeoFilterBar, type GeoLookup } from '../geo-filter-bar';
import { FilterActionFooter } from './filter-action-footer';

interface RidersFilterControlsProps {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  immunityFilter: string;
  onImmunityFilterChange: (val: string) => void;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
  geoLookup: GeoLookup;
  onCountryChange: (val: string) => void;
  onGovernorateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onResetGeo: () => void;
  onApplyFilters: () => void;
  onResetAllFilters: () => void;
  hasDraftFilter: boolean;
  hasActiveFilter: boolean;
  hasPendingChanges: boolean;
  loading: boolean;
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RidersFilterControls({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  immunityFilter,
  onImmunityFilterChange,
  selectedCountry,
  selectedGovernorate,
  selectedDistrict,
  geoLookup,
  onCountryChange,
  onGovernorateChange,
  onDistrictChange,
  onResetGeo,
  onApplyFilters,
  onResetAllFilters,
  hasDraftFilter,
  hasActiveFilter,
  hasPendingChanges,
  loading,
  isArabic,
  t,
}: RidersFilterControlsProps) {
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hasDraftFilter && !loading) {
      e.preventDefault();
      onApplyFilters();
    }
  };

  return (
    <div className="bg-[#060f1a]/90 border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* 1. Geographic Filtering Bar (Top Priority) */}
      <GeoFilterBar
        geoLookup={geoLookup}
        selectedCountry={selectedCountry}
        selectedGovernorate={selectedGovernorate}
        selectedDistrict={selectedDistrict}
        onCountryChange={onCountryChange}
        onGovernorateChange={onGovernorateChange}
        onDistrictChange={onDistrictChange}
        onResetGeo={onResetGeo}
        isArabic={isArabic}
      />

      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* 2. Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={t('searchPlaceholder')}
          className="w-full h-11 bg-[#0b1524] border border-white/10 text-white ps-10 pe-9 text-sm rounded-xl focus:border-cyan-500/60 focus-visible:ring-1 focus-visible:ring-cyan-500/30 text-start font-medium placeholder:text-slate-500"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchQueryChange('')}
            aria-label={isArabic ? 'مسح البحث' : 'Clear search'}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Status & Immunity Segmented Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b1524] border border-white/10 rounded-xl p-2 text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-bold shrink-0">
            {t('filterStatus')}
          </span>
          {[
            { key: 'ALL', label: t('statusAll') },
            { key: 'ACTIVE', label: t('statusActive') },
            { key: 'IDLE', label: t('statusIdle') },
            { key: 'SUSPENDED', label: t('statusSuspended') },
          ].map((st) => (
            <button
              key={st.key}
              type="button"
              onClick={() => onStatusFilterChange(st.key)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer',
                statusFilter === st.key
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b1524] border border-white/10 rounded-xl p-2 text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-bold shrink-0">
            {t('filterImmunity')}
          </span>
          {[
            { key: 'ALL', label: t('immunityAll') },
            { key: 'HIGH', label: t('immunityExcellent') },
            { key: 'WARNING', label: t('immunityWarning') },
            { key: 'CRITICAL', label: t('immunityCritical') },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onImmunityFilterChange(f.key)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer',
                immunityFilter === f.key
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Action Footer */}
      <FilterActionFooter
        onApplyFilters={onApplyFilters}
        onResetAllFilters={onResetAllFilters}
        hasDraftFilter={hasDraftFilter}
        hasActiveFilter={hasActiveFilter}
        hasPendingChanges={hasPendingChanges}
        loading={loading}
        isArabic={isArabic}
        emptyPromptEn='Select criteria and click "Apply Filter" to load riders'
      />
    </div>
  );
}
