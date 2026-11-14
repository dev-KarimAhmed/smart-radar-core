'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
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
  resolveGovernorateLabel,
  resolveLocationLabel,
} from '@/shared/utils/location-translator';
import type { GeoCountry, GeoGovernorate } from './geo-filter-types';

interface GeoGovernorateSelectProps {
  selectedGovernorate: string;
  onGovernorateChange: (val: string) => void;
  groupedGovernorates: Array<{
    country: GeoCountry;
    flag: string;
    governorates: GeoGovernorate[];
  }>;
  isArabic: boolean;
}

export function GeoGovernorateSelect({
  selectedGovernorate,
  onGovernorateChange,
  groupedGovernorates,
  isArabic,
}: GeoGovernorateSelectProps) {
  return (
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
                        : `${resolveLocationLabel(group.country as any, 'en')} Governorates`}
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
                      <span>{resolveGovernorateLabel(g as any, isArabic ? 'ar' : 'en')}</span>
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
