'use client';

import React, { useMemo } from 'react';
import { Globe, Building2, MapPin, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface GeoCountry {
  id: number;
  name_ar: string;
  country_code?: string;
}

export interface GeoGovernorate {
  id: number;
  name_ar: string;
  country_id: number;
}

export interface GeoDistrict {
  id: number;
  name_ar: string;
  governorate_id: number;
}

export interface GeoLookup {
  countries: GeoCountry[];
  governorates: GeoGovernorate[];
  districts: GeoDistrict[];
}

export interface GeoFilterBarProps {
  geoLookup: GeoLookup;
  selectedCountry: string;
  selectedGovernorate: string;
  selectedDistrict: string;
  onCountryChange: (val: string) => void;
  onGovernorateChange: (val: string) => void;
  onDistrictChange: (val: string) => void;
  onResetGeo: () => void;
  isArabic?: boolean;
  className?: string;
}

const getCountryFlag = (country?: { name_ar?: string; country_code?: string } | null) => {
  if (!country) return '📍';
  const code = (country.country_code || '').toUpperCase();
  const name = country.name_ar || '';
  if (code === 'JO' || name.includes('أردن') || name.includes('Jordan')) return '🇯🇴';
  if (code === 'EG' || name.includes('مصر') || name.includes('Egypt')) return '🇪🇬';
  if (code === 'SA' || name.includes('سعودية')) return '🇸🇦';
  return '📍';
};

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
  // Countries list with fallbacks if empty
  const countries = useMemo(() => {
    if (geoLookup.countries && geoLookup.countries.length > 0) {
      return geoLookup.countries;
    }
    return [
      { id: 1, name_ar: 'الأردن', country_code: 'JO' },
      { id: 2, name_ar: 'مصر', country_code: 'EG' },
    ];
  }, [geoLookup.countries]);

  // Map governorate_id -> country_id
  const govCountryMap = useMemo(() => {
    const map = new Map<number, number>();
    (geoLookup.governorates || []).forEach((g) => {
      map.set(g.id, g.country_id);
    });
    return map;
  }, [geoLookup.governorates]);

  // Filtered governorates based on selected country
  const filteredGovernorates = useMemo(() => {
    if (!geoLookup.governorates) return [];
    if (selectedCountry === 'ALL') {
      return geoLookup.governorates;
    }
    const cId = Number(selectedCountry);
    return geoLookup.governorates.filter((g) => g.country_id === cId);
  }, [geoLookup.governorates, selectedCountry]);

  // Filtered districts based on selected governorate and country
  const filteredDistricts = useMemo(() => {
    if (!geoLookup.districts) return [];
    if (selectedGovernorate !== 'ALL') {
      const gId = Number(selectedGovernorate);
      return geoLookup.districts.filter((d) => d.governorate_id === gId);
    }
    if (selectedCountry !== 'ALL') {
      const govIds = new Set(filteredGovernorates.map((g) => g.id));
      return geoLookup.districts.filter((d) => govIds.has(d.governorate_id));
    }
    return geoLookup.districts;
  }, [geoLookup.districts, selectedGovernorate, selectedCountry, filteredGovernorates]);

  // Group governorates by country
  const groupedGovernorates = useMemo(() => {
    return countries
      .map((c) => ({
        country: c,
        flag: getCountryFlag(c),
        governorates: filteredGovernorates.filter((g) => g.country_id === c.id),
      }))
      .filter((group) => group.governorates.length > 0);
  }, [countries, filteredGovernorates]);

  // Group districts by country
  const groupedDistricts = useMemo(() => {
    return countries
      .map((c) => ({
        country: c,
        flag: getCountryFlag(c),
        districts: filteredDistricts.filter((d) => {
          const cId = govCountryMap.get(d.governorate_id);
          return cId === c.id;
        }),
      }))
      .filter((group) => group.districts.length > 0);
  }, [countries, filteredDistricts, govCountryMap]);

  const isGeoActive =
    selectedCountry !== 'ALL' ||
    selectedGovernorate !== 'ALL' ||
    selectedDistrict !== 'ALL';

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
        <button
          type="button"
          onClick={() => onCountryChange('ALL')}
          className={cn(
            "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
            selectedCountry === 'ALL'
              ? "bg-[#14B8A6] text-slate-950 font-black shadow-md shadow-[#14B8A6]/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          {isArabic ? '🌍 كل الدول' : '🌍 All'}
        </button>
        {countries.map((c) => {
          const isSelected = selectedCountry === String(c.id);
          const flag = getCountryFlag(c);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCountryChange(String(c.id))}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                isSelected
                  ? "bg-[#14B8A6] text-slate-950 font-black shadow-md shadow-[#14B8A6]/20"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="text-sm">{flag}</span>
              <span>{c.name_ar}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Country Selector Dropdown */}
      <div className="w-32 sm:w-36 shrink-0">
        <Select
          value={selectedCountry}
          onValueChange={(val) => {
            onCountryChange(val);
          }}
        >
          <SelectTrigger className="h-9 bg-[#0B0F19] border-white/10 text-xs font-bold text-white rounded-xl focus:ring-[#14B8A6]/40 focus:border-[#14B8A6]">
            <div className="flex items-center gap-1.5 truncate">
              <Globe className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <SelectValue placeholder={isArabic ? 'كل الدول' : 'All Countries'} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#0B0F19] text-white border-white/10 z-[100]">
            <SelectItem value="ALL" className="text-xs font-bold cursor-pointer">
              {isArabic ? '🌍 كل الدول' : '🌍 All Countries'}
            </SelectItem>
            {countries.map((c) => (
              <SelectItem
                key={c.id}
                value={String(c.id)}
                className="text-xs font-bold cursor-pointer"
              >
                {getCountryFlag(c)} {c.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Governorate Selector (Separated by country groups) */}
      <div className="w-36 sm:w-44 shrink-0">
        <Select
          value={selectedGovernorate}
          onValueChange={(val) => {
            onGovernorateChange(val);
          }}
        >
          <SelectTrigger className="h-9 bg-[#0B0F19] border-white/10 text-xs font-bold text-white rounded-xl focus:ring-[#14B8A6]/40 focus:border-[#14B8A6]">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <SelectValue placeholder={isArabic ? 'كل المحافظات' : 'All Governorates'} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#0B0F19] text-white border-white/10 max-h-72 z-[100] overflow-y-auto">
            <SelectItem value="ALL" className="text-xs font-bold cursor-pointer text-cyan-300">
              {isArabic ? '🏛️ كل المحافظات' : '🏛️ All Governorates'}
            </SelectItem>
            {groupedGovernorates.map((group, idx) => (
              <React.Fragment key={group.country.id}>
                {idx > 0 && <SelectSeparator className="my-1.5 bg-white/10" />}
                <SelectGroup>
                  <SelectLabel className="px-3 py-1.5 text-[11px] font-black tracking-wide text-cyan-300 bg-white/[0.04] rounded-md mx-1 my-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>{group.flag}</span>
                      <span>
                        {isArabic
                          ? `محافظات ${group.country.name_ar}`
                          : `${group.country.name_ar} Governorates`}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({group.governorates.length})</span>
                  </SelectLabel>
                  {group.governorates.map((g) => (
                    <SelectItem
                      key={g.id}
                      value={String(g.id)}
                      className="text-xs font-bold cursor-pointer pr-4"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] opacity-60">{group.flag}</span>
                        <span>{g.name_ar}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. District / Region Selector (Cleanly Separated by Jordan and Egypt!) */}
      <div className="w-36 sm:w-48 shrink-0">
        <Select
          value={selectedDistrict}
          onValueChange={(val) => {
            onDistrictChange(val);
          }}
        >
          <SelectTrigger className="h-9 bg-[#0B0F19] border-white/10 text-xs font-bold text-white rounded-xl focus:ring-[#14B8A6]/40 focus:border-[#14B8A6]">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <SelectValue placeholder={isArabic ? 'كل المناطق' : 'All Districts'} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-[#0B0F19] text-white border-white/10 max-h-72 z-[100] overflow-y-auto">
            <SelectItem value="ALL" className="text-xs font-bold cursor-pointer text-cyan-300">
              {isArabic ? '📍 كل المناطق' : '📍 All Districts'}
            </SelectItem>
            {groupedDistricts.map((group, idx) => (
              <React.Fragment key={group.country.id}>
                {idx > 0 && <SelectSeparator className="my-1.5 bg-white/10" />}
                <SelectGroup>
                  <SelectLabel className="px-3 py-1.5 text-[11px] font-black tracking-wide text-emerald-400 bg-white/[0.04] rounded-md mx-1 my-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>{group.flag}</span>
                      <span>
                        {isArabic
                          ? `مناطق ${group.country.name_ar}`
                          : `${group.country.name_ar} Districts`}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({group.districts.length})</span>
                  </SelectLabel>
                  {group.districts.map((d) => (
                    <SelectItem
                      key={d.id}
                      value={String(d.id)}
                      className="text-xs font-bold cursor-pointer pr-4"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] opacity-60">{group.flag}</span>
                        <span>{d.name_ar}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

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
