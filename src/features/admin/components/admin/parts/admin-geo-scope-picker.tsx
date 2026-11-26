'use client';

import React, { useMemo } from 'react';
import { Globe, MapPin, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';
import {
  UNRESTRICTED_GEO_SCOPE,
  isGeoScopeRestricted,
  type AdminGeoScope,
} from '@/features/admin/lib/admin-permissions';

interface AdminGeoScopePickerProps {
  isArabic: boolean;
  geoLookup: GeoLookup;
  geoScope: AdminGeoScope;
  setGeoScope: React.Dispatch<React.SetStateAction<AdminGeoScope>>;
}

export function AdminGeoScopePicker({
  isArabic,
  geoLookup,
  geoScope,
  setGeoScope,
}: AdminGeoScopePickerProps) {
  const availableGovernorates = useMemo(() => {
    if (!geoScope.countryId) return [];
    return geoLookup.governorates.filter((g) => g.country_id === geoScope.countryId);
  }, [geoLookup.governorates, geoScope.countryId]);

  const availableDistricts = useMemo(() => {
    if (!geoScope.governorateId) return [];
    return geoLookup.districts.filter((d) => d.governorate_id === geoScope.governorateId);
  }, [geoLookup.districts, geoScope.governorateId]);

  const scopeSummary = useMemo(() => {
    if (!isGeoScopeRestricted(geoScope)) {
      return isArabic ? 'كل الدول والمناطق (نطاق مفتوح)' : 'All Countries & Regions (Unrestricted)';
    }
    const parts: string[] = [];
    const country = geoLookup.countries.find((c) => c.id === geoScope.countryId);
    if (country) parts.push(country.name_ar);
    const gov = geoLookup.governorates.find((g) => g.id === geoScope.governorateId);
    if (gov) parts.push(gov.name_ar);
    const dist = geoLookup.districts.find((d) => d.id === geoScope.districtId);
    if (dist) parts.push(dist.name_ar);
    return parts.join(' ← ') || (isArabic ? 'نطاق محدد' : 'Scoped');
  }, [geoScope, geoLookup, isArabic]);

  const isRestricted = isGeoScopeRestricted(geoScope);

  return (
    <div className="space-y-3 pt-3 border-t border-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <label className="text-xs font-bold text-slate-200">
            {isArabic ? 'النطاق الجغرافي المصرح به لهذا المشرف:' : 'Assigned Geographic Territory:'}
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-bold px-2.5 py-0.5',
              isRestricted
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            )}
          >
            {scopeSummary}
          </Badge>
          {isRestricted && (
            <button
              type="button"
              onClick={() => setGeoScope({ ...UNRESTRICTED_GEO_SCOPE })}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              {isArabic ? 'فتح الكل' : 'All'}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0B0F19]/80 p-3 space-y-3">
        {/* Country Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setGeoScope({ countryId: null, governorateId: null, districtId: null })}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer',
              geoScope.countryId === null
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isArabic ? 'كل الدول' : 'All Countries'}</span>
          </button>

          {geoLookup.countries.map((country) => {
            const active = geoScope.countryId === country.id;
            return (
              <button
                key={country.id}
                type="button"
                onClick={() =>
                  setGeoScope({
                    countryId: country.id,
                    governorateId: null,
                    districtId: null,
                  })
                }
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer',
                  active
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30'
                    : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                )}
              >
                <span>{country.country_code === 'EG' ? '🇪🇬' : '🇯🇴'}</span>
                <span>{country.name_ar}</span>
              </button>
            );
          })}
        </div>

        {/* Governorate & District Drilldown when a Country is selected */}
        {geoScope.countryId !== null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {isArabic ? 'المحافظة (اختياري — اتركها الكل لتشمل الدولة كاملة)' : 'Governorate (Optional)'}
              </label>
              <Select
                value={geoScope.governorateId ? String(geoScope.governorateId) : 'ALL'}
                onValueChange={(val) =>
                  setGeoScope((prev) => ({
                    ...prev,
                    governorateId: val === 'ALL' ? null : Number(val),
                    districtId: null,
                  }))
                }
              >
                <SelectTrigger className="h-9 bg-black/50 border-white/10 text-xs text-white rounded-xl">
                  <SelectValue placeholder={isArabic ? 'كل المحافظات' : 'All Governorates'} />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F19] border-white/10 text-white max-h-64">
                  <SelectItem value="ALL" className="text-xs font-bold text-cyan-300">
                    {isArabic ? 'كل المحافظات في الدولة' : 'All Governorates'}
                  </SelectItem>
                  {availableGovernorates.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)} className="text-xs">
                      {g.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                {isArabic ? 'اللواء / المنطقة (اختياري)' : 'District (Optional)'}
              </label>
              <Select
                value={geoScope.districtId ? String(geoScope.districtId) : 'ALL'}
                disabled={!geoScope.governorateId}
                onValueChange={(val) =>
                  setGeoScope((prev) => ({
                    ...prev,
                    districtId: val === 'ALL' ? null : Number(val),
                  }))
                }
              >
                <SelectTrigger className="h-9 bg-black/50 border-white/10 text-xs text-white rounded-xl disabled:opacity-50">
                  <SelectValue placeholder={isArabic ? 'كل المناطق' : 'All Districts'} />
                </SelectTrigger>
                <SelectContent className="bg-[#0B0F19] border-white/10 text-white max-h-64">
                  <SelectItem value="ALL" className="text-xs font-bold text-cyan-300">
                    {isArabic ? 'كل المناطق في المحافظة' : 'All Districts'}
                  </SelectItem>
                  {availableDistricts.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)} className="text-xs">
                      {d.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
