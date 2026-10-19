'use client';

import React, { useMemo } from 'react';
import { Globe, Building2, MapPin, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
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

      {/* 1. Country Selector */}
      <div className="w-36 sm:w-40 shrink-0">
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
                {c.name_ar === 'مصر' || c.country_code === 'EG'
                  ? '🇪🇬 '
                  : c.name_ar === 'الأردن' || c.country_code === 'JO'
                  ? '🇯🇴 '
                  : '📍 '}
                {c.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. Governorate Selector */}
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
          <SelectContent className="bg-[#0B0F19] text-white border-white/10 max-h-60 z-[100]">
            <SelectItem value="ALL" className="text-xs font-bold cursor-pointer">
              {isArabic ? '🏛️ كل المحافظات' : '🏛️ All Governorates'}
            </SelectItem>
            {filteredGovernorates.map((g) => (
              <SelectItem
                key={g.id}
                value={String(g.id)}
                className="text-xs font-bold cursor-pointer"
              >
                {g.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. District / Region Selector */}
      <div className="w-36 sm:w-44 shrink-0">
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
          <SelectContent className="bg-[#0B0F19] text-white border-white/10 max-h-60 z-[100]">
            <SelectItem value="ALL" className="text-xs font-bold cursor-pointer">
              {isArabic ? '📍 كل المناطق' : '📍 All Districts'}
            </SelectItem>
            {filteredDistricts.map((d) => (
              <SelectItem
                key={d.id}
                value={String(d.id)}
                className="text-xs font-bold cursor-pointer"
              >
                {d.name_ar}
              </SelectItem>
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

