'use client';

import React from 'react';
import {
  Clock,
  DollarSign,
  MapPin,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CountryItem } from './hourly-rates-types';

interface HourlyRatesHeaderStatsProps {
  countryDefaultPrice: number;
  currency: string;
  totalCustomZones: number;
  totalGovsInCountry: number;
  totalDistsInCountry: number;
  activeCountry: CountryItem;
  countries: CountryItem[];
  selectedCountryId: number;
  onSelectCountry: (id: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterMode: 'all' | 'custom_only' | 'default_only';
  onFilterModeChange: (mode: 'all' | 'custom_only' | 'default_only') => void;
  filteredGovernoratesCount: number;
  onExpandAll: (expand: boolean) => void;
  isArabic: boolean;
  t: (key: string, params?: Record<string, any>) => string;
}

export function HourlyRatesHeaderStats({
  countryDefaultPrice,
  currency,
  totalCustomZones,
  totalGovsInCountry,
  totalDistsInCountry,
  activeCountry,
  countries,
  selectedCountryId,
  onSelectCountry,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  filteredGovernoratesCount,
  onExpandAll,
  isArabic,
  t,
}: HourlyRatesHeaderStatsProps) {
  return (
    <>
      {/* 1. Header & Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric: Base Rate */}
        <div className="rounded-2xl border border-teal-500/20 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
          <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-teal-400" />
            {t('metricBaseRate')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-300 font-mono">
              {countryDefaultPrice.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {currency}
              {t('hourSuffix')}
            </span>
          </div>
        </div>

        {/* Metric: Custom Zones */}
        <div className="rounded-2xl border border-amber-500/20 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
          <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            {t('metricCustomZones')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {totalCustomZones}
            </span>
            <span className="text-xs font-bold text-slate-400">{t('govAndZoneUnit')}</span>
          </div>
        </div>

        {/* Metric: Governorates count */}
        <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
          <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            {t('metricGovs')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              {totalGovsInCountry}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {t('govBelongingTo', {
                country: isArabic ? activeCountry.name_ar : (activeCountry.name_en || activeCountry.name_ar),
              })}
            </span>
          </div>
        </div>

        {/* Metric: Districts count */}
        <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg">
          <p className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            {t('metricDists')}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              {totalDistsInCountry}
            </span>
            <span className="text-xs font-bold text-slate-400">{t('geoZoneUnit')}</span>
          </div>
        </div>
      </div>

      {/* 2. Country Switcher & Explanatory Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-400" />
              <span>{t('title')}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">{t('subtitle')}</p>
          </div>

          {/* Country selector buttons */}
          <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            {countries.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCountry(c.id)}
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

        {/* 3. Search and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="bg-black/50 border-white/10 text-white text-xs h-10 pr-9 pl-3 rounded-xl focus:border-teal-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
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
              {t('filterAll')} ({filteredGovernoratesCount})
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
    </>
  );
}
