'use client';

import React from 'react';
import { Lock, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminPermissions } from '@/features/admin/context/admin-permissions-context';
import { isGeoScopeRestricted } from '@/features/admin/lib/admin-permissions';
import type { GeoFilterBarProps } from './geo-filter/geo-filter-types';
import { getCountryFlag } from './geo-filter/geo-filter-types';
import { useGeoFilterData } from './geo-filter/use-geo-filter-data';
import { GeoGovernorateSelect } from './geo-filter/geo-governorate-select';
import { GeoDistrictSelect } from './geo-filter/geo-district-select';

export * from './geo-filter/geo-filter-types';

export function GeoFilterBar({
  geoLookup,
  selectedCountry,
  selectedGovernorate,
  selectedDistrict,
  onCountryChange,
  onGovernorateChange,
  onDistrictChange,
  onResetGeo,
  isArabic = true,
  className,
}: GeoFilterBarProps) {
  const { geoScope } = useAdminPermissions();
  const isCountryLocked = geoScope.countryId !== null;
  const effectiveSelectedCountry = isCountryLocked ? String(geoScope.countryId) : selectedCountry;
  const effectiveSelectedGov = geoScope.governorateId !== null ? String(geoScope.governorateId) : selectedGovernorate;

  const { countries, groupedGovernorates, groupedDistricts } = useGeoFilterData(
    geoLookup,
    effectiveSelectedCountry,
    effectiveSelectedGov,
  );

  const visibleCountries = isCountryLocked
    ? countries.filter((c) => c.id === geoScope.countryId)
    : countries;

  const isGeoActive =
    !isGeoScopeRestricted(geoScope) &&
    (selectedCountry !== 'ALL' ||
      selectedGovernorate !== 'ALL' ||
      selectedDistrict !== 'ALL');

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 p-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-black text-[#14F5D5] px-1 shrink-0">
        <MapPin className="w-4 h-4 text-[#14B8A6]" />
        <span>{isArabic ? 'الفلترة الجغرافية:' : 'Geo Filter:'}</span>
      </div>

      {/* 0. Quick Country Switcher Tabs (Segmented pills) */}
      <div className="flex items-center bg-[#070B14] p-1 rounded-xl border border-white/10 shrink-0 gap-1 shadow-inner">
        {!isCountryLocked && (
          <button
            type="button"
            onClick={() => onCountryChange('ALL')}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
              effectiveSelectedCountry === 'ALL'
                ? "bg-[#14B8A6] text-slate-950 font-black shadow-md shadow-[#14B8A6]/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {isArabic ? '🌍 كل الدول' : '🌍 All'}
          </button>
        )}
        {visibleCountries.map((c) => {
          const isSelected = effectiveSelectedCountry === String(c.id);
          const flag = getCountryFlag(c);
          return (
            <button
              key={c.id}
              type="button"
              disabled={isCountryLocked}
              onClick={() => !isCountryLocked && onCountryChange(String(c.id))}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
                isCountryLocked ? "cursor-default" : "cursor-pointer",
                isSelected
                  ? "bg-[#14B8A6] text-slate-950 font-black shadow-md shadow-[#14B8A6]/20"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="text-sm">{flag}</span>
              <span>{c.name_ar}</span>
              {isCountryLocked && <Lock className="w-3 h-3 opacity-80" />}
            </button>
          );
        })}
      </div>

      {/* 1. Governorate Selector (Separated by country groups) */}
      <GeoGovernorateSelect
        selectedGovernorate={selectedGovernorate}
        onGovernorateChange={onGovernorateChange}
        groupedGovernorates={groupedGovernorates}
        isArabic={isArabic}
      />

      {/* 3. District / Region Selector */}
      <GeoDistrictSelect
        selectedDistrict={selectedDistrict}
        onDistrictChange={onDistrictChange}
        groupedDistricts={groupedDistricts}
        isArabic={isArabic}
      />

      {/* Quick Reset Geo Button if active */}
      {isGeoActive && (
        <button
          type="button"
          onClick={onResetGeo}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold transition cursor-pointer"
          title={isArabic ? 'إلغاء التصفية الجغرافية' : 'Reset Geo Filters'}
        >
          <X className="w-3 h-3" />
          <span>{isArabic ? 'إلغاء الفلترة' : 'Clear Geo'}</span>
        </button>
      )}
    </div>
  );
}
