'use client';

import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeoFilterBar, type GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import type {
  AnalyticsFilterState,
  AnalyticsPeriod,
  AnalyticsRoleFocus,
} from '@/features/admin/types/admin-analytics';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  geoLookup: GeoLookup;
  isArabic: boolean;
  onCountryChange: (val: string) => void;
  onGovernorateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  onRoleFocusChange: (role: AnalyticsRoleFocus) => void;
  onResetAll: () => void;
}

const PERIOD_OPTIONS: Array<{ id: AnalyticsPeriod; ar: string; en: string }> = [
  { id: 'all', ar: 'كل الفترات', en: 'All Time' },
  { id: '24h', ar: 'آخر 24 ساعة', en: 'Last 24h' },
  { id: '7d', ar: 'آخر 7 أيام', en: '7 Days' },
  { id: '30d', ar: 'آخر 30 يوم', en: '30 Days' },
];

const FOCUS_OPTIONS: Array<{ id: AnalyticsRoleFocus; ar: string; en: string }> = [
  { id: 'ALL', ar: 'شامل', en: 'All' },
  { id: 'CAPTAIN', ar: 'السائقين', en: 'Captains' },
  { id: 'RIDER', ar: 'المستخدمين', en: 'Riders' },
  { id: 'TRIPS', ar: 'الرحلات', en: 'Trips' },
];

export function AnalyticsFilterBar({
  filters,
  geoLookup,
  isArabic,
  onCountryChange,
  onGovernorateChange,
  onDistrictChange,
  onPeriodChange,
  onRoleFocusChange,
  onResetAll,
}: AnalyticsFilterBarProps) {
  const hasAnyFilter =
    filters.countryId !== 'ALL' ||
    filters.governorateId !== 'ALL' ||
    filters.districtId !== 'ALL' ||
    filters.period !== 'all' ||
    filters.roleFocus !== 'ALL';

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-3.5 sm:p-4 backdrop-blur-xl shadow-xl">
      <GeoFilterBar
        geoLookup={geoLookup}
        selectedCountry={filters.countryId}
        selectedGovernorate={filters.governorateId}
        selectedDistrict={filters.districtId}
        onCountryChange={onCountryChange}
        onGovernorateChange={onGovernorateChange}
        onDistrictChange={onDistrictChange}
        onResetGeo={() => onCountryChange('ALL')}
        isArabic={isArabic}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-[#14B8A6]" />
            <span>{isArabic ? 'النطاق الزمني:' : 'Period:'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070B14] p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onPeriodChange(opt.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                  filters.period === opt.id
                    ? 'bg-[#14B8A6] text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                {isArabic ? opt.ar : opt.en}
              </button>
            ))}
          </div>
        </div>

        {/* Role / Metric Focus Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-300">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isArabic ? 'ترتيب المؤشرات حسب:' : 'Focus:'}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070B14] p-1">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onRoleFocusChange(opt.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer',
                  filters.roleFocus === opt.id
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                {isArabic ? opt.ar : opt.en}
              </button>
            ))}
          </div>

          {hasAnyFilter && (
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isArabic ? 'تصفير الكل' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
