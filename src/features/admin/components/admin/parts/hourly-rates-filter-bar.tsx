'use client';

import React from 'react';
import { Clock, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CountryItem, HourlyRateFilterMode } from '@/features/admin/types/hourly-rates';

interface HourlyRatesFilterBarProps {
  countries: CountryItem[];
  selectedCountryId: number;
  onSelectCountryId: (id: number) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filterMode: HourlyRateFilterMode;
  onFilterModeChange: (mode: HourlyRateFilterMode) => void;
  filteredCount: number;
  onExpandAll: (expand: boolean) => void;
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function HourlyRatesFilterBar({
  countries,
  selectedCountryId,
  onSelectCountryId,
  searchQuery,
  onSearchQueryChange,
  filterMode,
  onFilterModeChange,
  filteredCount,
  onExpandAll,
  isArabic,
  t,
}: HourlyRatesFilterBarProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-400" />
            <span>{t('title')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Country selector buttons */}
        <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          {countries.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCountryId(c.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                selectedCountryId === c.id
                  ? "bg-teal-500 text-[#0B0F19] shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <span>{c.country_code === 'JO' ? '🇯🇴' : '🇪🇬'}</span>
              <span>{isArabic ? c.name_ar : (c.name_en || c.name_ar)}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({isArabic ? c.currency_ar : (c.currency_en || c.currency_ar)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="bg-black/50 border-white/10 text-white text-xs h-10 pr-9 pl-3 rounded-xl focus:border-teal-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              {t('clearSearch')}
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onFilterModeChange('all')}
            className={cn(
              "h-9 px-3 rounded-xl text-xs font-bold border transition-all",
              filterMode === 'all'
                ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
          >
            {t('filterAll')} ({filteredCount})
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onFilterModeChange('custom_only')}
            className={cn(
              "h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1",
              filterMode === 'custom_only'
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
          >
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>{t('filterCustomOnly')}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onFilterModeChange('default_only')}
            className={cn(
              "h-9 px-3 rounded-xl text-xs font-bold border transition-all",
              filterMode === 'default_only'
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
          >
            {t('filterDefaultOnly')}
          </Button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onExpandAll(true)}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-2.5 rounded-xl text-[11px]"
            title={t('expandAll')}
          >
            {t('expandAll')}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onExpandAll(false)}
            className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-2.5 rounded-xl text-[11px]"
            title={t('collapseAll')}
          >
            {t('collapseAll')}
          </Button>
        </div>
      </div>
    </div>
  );
}
