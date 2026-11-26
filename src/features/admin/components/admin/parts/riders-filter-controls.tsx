'use client';

import React, { type ComponentProps } from 'react';
import { Check, Filter, Loader2, RotateCcw, Search, ShieldCheck, X } from 'lucide-react';
import { GeoFilterBar } from '../geo-filter-bar';

export interface RidersFilterControlsProps {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  immunityFilter: string;
  onImmunityFilterChange: (val: string) => void;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
  geoLookup: ComponentProps<typeof GeoFilterBar>['geoLookup'];
  onCountryChange: (c: string) => void;
  onGovernorateChange: (g: string) => void;
  onDistrictChange: (d: string) => void;
  onResetGeo: () => void;
  onApplyFilters: () => void;
  onResetAllFilters: () => void;
  hasDraftFilter: boolean;
  hasActiveFilter: boolean;
  hasPendingChanges: boolean;
  loading: boolean;
  isArabic: boolean;
  t: (key: string) => string;
}

const STATUS_OPTIONS = [
  { id: 'ALL', ar: 'الكل', en: 'All' },
  { id: 'ACTIVE', ar: 'نشط', en: 'Active' },
  { id: 'SUSPENDED', ar: 'موقوف', en: 'Suspended' },
  { id: 'BANNED', ar: 'محظور', en: 'Banned' },
] as const;

const IMMUNITY_OPTIONS = [
  { id: 'ALL', ar: 'كل المستويات', en: 'All Levels' },
  { id: 'HIGH', ar: 'ممتازة (4.5+)', en: 'High (4.5+)' },
  { id: 'WARNING', ar: 'تحت المراقبة', en: 'Monitor' },
  { id: 'CRITICAL', ar: 'مهدد بالتطهير', en: 'At Risk' },
] as const;

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
      {/* 1. Geographic Filter (Top Priority) */}
      <GeoFilterBar
        selectedCountry={selectedCountry}
        selectedGovernorate={selectedGovernorate}
        selectedDistrict={selectedDistrict}
        geoLookup={geoLookup}
        onCountryChange={onCountryChange}
        onGovernorateChange={onGovernorateChange}
        onDistrictChange={onDistrictChange}
        onResetGeo={onResetGeo}
        isArabic={isArabic}
      />

      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* 2. Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={
            isArabic
              ? 'بحث بالاسم، الهاتف، أو كود المستخدم (P-100)...'
              : t('adminRiders.searchPlaceholder')
          }
          className="w-full h-11 bg-[#0b1524] border border-white/10 rounded-xl ps-10 pe-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
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
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b1524] border border-white/10 rounded-xl p-2">
          <span className="text-[11px] font-bold text-slate-400 px-2 shrink-0">
            {isArabic ? 'الحالة:' : 'Status:'}
          </span>
          {STATUS_OPTIONS.map((st) => {
            const active = statusFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onStatusFilterChange(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {isArabic ? st.ar : st.en}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b1524] border border-white/10 rounded-xl p-2">
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 px-2 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isArabic ? 'المناعة:' : 'Immunity:'}
          </span>
          {IMMUNITY_OPTIONS.map((im) => {
            const active = immunityFilter === im.id;
            return (
              <button
                key={im.id}
                type="button"
                onClick={() => onImmunityFilterChange(im.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {isArabic ? im.ar : im.en}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          {hasPendingChanges ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-semibold">
                {isArabic
                  ? 'تم تعديل الفلتر — اضغط «تطبيق الفلتر» لجلب النتائج'
                  : 'Filters changed — click "Apply Filter" to fetch results'}
              </span>
            </>
          ) : hasActiveFilter ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300/90 font-medium">
                {isArabic ? 'النتائج معروضة حسب الفلتر المطبق' : 'Showing results for applied filter'}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-slate-400">
                {isArabic
                  ? 'اختر معايير التصفية ثم اضغط «تطبيق الفلتر»'
                  : 'Select criteria and click "Apply Filter" to load riders'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 ms-auto">
          {(hasDraftFilter || hasActiveFilter) && (
            <button
              type="button"
              onClick={onResetAllFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isArabic ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}

          <button
            type="button"
            onClick={onApplyFilters}
            disabled={!hasDraftFilter || loading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg ${
              !hasDraftFilter || loading
                ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/20 cursor-pointer'
            } ${hasPendingChanges && hasDraftFilter && !loading ? 'ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-[#060f1a]' : ''}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasActiveFilter && !hasPendingChanges ? (
              <Check className="w-4 h-4" />
            ) : (
              <Filter className="w-4 h-4" />
            )}
            <span>{isArabic ? 'تطبيق الفلتر' : 'Apply Filter'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
