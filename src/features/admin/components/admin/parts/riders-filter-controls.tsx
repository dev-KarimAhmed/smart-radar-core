'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GeoFilterBar, GeoLookup } from '../geo-filter-bar';

interface RidersFilterControlsProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  immunityFilter: string;
  onImmunityFilterChange: (f: string) => void;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
  geoLookup: GeoLookup;
  onCountryChange: (val: string) => void;
  onGovernorateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onResetGeo: () => void;
  onResetAllFilters: () => void;
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
  onResetAllFilters,
  isArabic,
  t,
}: RidersFilterControlsProps) {
  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    immunityFilter !== 'ALL' ||
    selectedCountry !== 'ALL' ||
    selectedGovernorate !== 'ALL' ||
    selectedDistrict !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="bg-black/70 border-white/15 text-white px-9 h-10 text-xs rounded-xl focus:border-[#14B8A6] text-start font-medium placeholder:text-slate-500"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-500 px-2 font-bold">{t('filterStatus')}</span>
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
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer",
                  statusFilter === st.key
                    ? "bg-cyan-500 text-black font-black"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Immunity filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 text-[11px]">
            <span className="text-slate-500 px-2 font-bold">{t('filterImmunity')}</span>
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
                  "px-2.5 py-1 rounded-lg font-bold transition text-[11px] cursor-pointer",
                  immunityFilter === f.key
                    ? "bg-cyan-500 text-black font-black"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetAllFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
              title={isArabic ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>{isArabic ? 'إعادة تعيين' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Geographic Filtering Bar */}
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
    </div>
  );
}

