'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
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
import {
  resolveDistrictLabel,
  resolveLocationLabel,
} from '@/shared/utils/location-translator';
import type { GeoCountry, GeoDistrict } from './geo-filter-types';

interface GeoDistrictSelectProps {
  selectedDistrict: string;
  onDistrictChange: (val: string) => void;
  groupedDistricts: Array<{
    country: GeoCountry;
    flag: string;
    districts: GeoDistrict[];
  }>;
  isArabic: boolean;
}

export function GeoDistrictSelect({
  selectedDistrict,
  onDistrictChange,
  groupedDistricts,
  isArabic,
}: GeoDistrictSelectProps) {
  return (
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
                        : `${resolveLocationLabel(group.country as any, 'en')} Districts`}
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
                      <span>{resolveDistrictLabel(d as any, isArabic ? 'ar' : 'en')}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
