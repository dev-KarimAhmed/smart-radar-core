'use client';

import React, { type ComponentProps } from 'react';
import { Languages, Search, X } from 'lucide-react';
import { GeoFilterBar } from '../geo-filter-bar';
import { FilterActionFooter } from './filter-action-footer';

export interface DriversFilterControlsProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  rankFilter: string;
  setRankFilter: (r: string) => void;
  languageFilter: 'ALL' | 'ar' | 'en';
  setLanguageFilter: (l: 'ALL' | 'ar' | 'en') => void;
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
  { id: 'IDLE', ar: 'خامل', en: 'Idle' },
  { id: 'BUSY', ar: 'في رحلة', en: 'On Trip' },
  { id: 'SUSPENDED', ar: 'معلق', en: 'Suspended' },
  { id: 'BANNED', ar: 'محظور', en: 'Banned' },
] as const;

const RANK_OPTIONS = [
  { id: 'ALL', ar: 'الكل', en: 'All' },
  { id: 'DIAMOND', ar: 'ماسي', en: 'Diamond' },
  { id: 'PLATINUM', ar: 'بلاتيني', en: 'Platinum' },
  { id: 'GOLD', ar: 'ذهبي', en: 'Gold' },
  { id: 'BRONZE', ar: 'برونزي', en: 'Bronze' },
  { id: 'SILVER', ar: 'فضي', en: 'Silver' },
] as const;

const LANGUAGE_OPTIONS = [
  { id: 'ALL', ar: 'كل اللغات', en: 'All' },
  { id: 'ar', ar: 'العربية', en: 'Arabic' },
  { id: 'en', ar: 'English', en: 'English' },
] as const;

export function DriversFilterControls({
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
}: DriversFilterControlsProps) {
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

      {/* 2. Search & Language Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        <div className="lg:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              isArabic
                ? 'بحث بالاسم، الهاتف، كود الكابتن (C-1250)، أو رقم اللوحة...'
                : t('adminDrivers.searchPlaceholder')
            }
            className="w-full h-11 bg-[#0b1524] border border-white/10 rounded-xl ps-10 pe-9 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={isArabic ? 'مسح البحث' : 'Clear search'}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="lg:col-span-5 flex items-center justify-between gap-2 bg-[#0b1524] border border-white/10 rounded-xl p-1.5 h-11">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 px-2 shrink-0">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            {isArabic ? 'اللغة:' : 'Lang:'}
          </span>
          <div className="flex items-center gap-1 flex-1 justify-end">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguageFilter(lang.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  languageFilter === lang.id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {isArabic ? lang.ar : lang.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Status & Rank Segmented Filters */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b1524] border border-white/10 rounded-xl p-2">
          <span className="text-[11px] font-bold text-slate-400 px-2 shrink-0">
            {isArabic ? 'الحالة:' : 'Status:'}
          </span>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {isArabic ? st.ar : st.en}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#0b1524] border border-white/10 rounded-xl p-2">
          <span className="text-[11px] font-bold text-slate-400 px-2 shrink-0">
            {isArabic ? 'الرتبة:' : 'Rank:'}
          </span>
          {RANK_OPTIONS.map((rk) => (
            <button
              key={rk.id}
              type="button"
              onClick={() => setRankFilter(rk.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                rankFilter === rk.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {isArabic ? rk.ar : rk.en}
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
        emptyPromptEn='Select criteria and click "Apply Filter" to load drivers'
      />
    </div>
  );
}
