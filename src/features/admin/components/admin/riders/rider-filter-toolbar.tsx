'use client';

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GeoFilterBar, GeoLookup } from '../geo-filter-bar';
import { styles } from './riders-types';

interface RiderFilterToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  immunityFilter: string;
  setImmunityFilter: (val: string) => void;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
  geoLookup: GeoLookup;
  onCountryChange: (val: string) => void;
  onGovernorateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onResetGeo: () => void;
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function RiderFilterToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  immunityFilter,
  setImmunityFilter,
  selectedCountry,
  selectedGovernorate,
  selectedDistrict,
  geoLookup,
  onCountryChange,
  onGovernorateChange,
  onDistrictChange,
  onResetGeo,
  isArabic,
  t,
}: RiderFilterToolbarProps) {
  const isAnyFilterActive =
    statusFilter !== 'ALL' ||
    immunityFilter !== 'ALL' ||
    selectedCountry !== 'ALL' ||
    selectedGovernorate !== 'ALL' ||
    selectedDistrict !== 'ALL' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/10 p-3.5 rounded-2xl">
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={styles.searchInput}
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
                onClick={() => setStatusFilter(st.key)}
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
                onClick={() => setImmunityFilter(f.key)}
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
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setImmunityFilter('ALL');
                onResetGeo();
                setSearchQuery('');
              }}
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
