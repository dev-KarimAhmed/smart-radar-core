import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Loader2 } from 'lucide-react';
import { labelFor, type CountryRow, type GovernorateRow, type DistrictRow } from '../profile-shared';

export interface ProfileLocationSelectsProps {
  t: any;
  language: string;
  isArabic: boolean;
  countryId: string;
  handleCountryChange: (val: string) => void;
  countries: CountryRow[];
  isLoadingCountries: boolean;
  governorateId: string;
  handleGovernorateChange: (val: string) => void;
  governorates: GovernorateRow[];
  isLoadingGovernorates: boolean;
  districtId: string;
  setDistrictId: (val: string) => void;
  districts: DistrictRow[];
  isLoadingDistricts: boolean;
  isLocationLoading: boolean;
}

export function ProfileLocationSelects({
  t,
  language,
  isArabic,
  countryId,
  handleCountryChange,
  countries,
  isLoadingCountries,
  governorateId,
  handleGovernorateChange,
  governorates,
  isLoadingGovernorates,
  districtId,
  setDistrictId,
  districts,
  isLoadingDistricts,
  isLocationLoading,
}: ProfileLocationSelectsProps) {
  return (
    <div className="space-y-2 pt-1">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
        <Globe className="h-3.5 w-3.5 text-[#14F5D5]" />
        <span>{t('location')}</span>
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Country */}
        <div className="space-y-1">
          <span className="block text-[11px] font-semibold text-slate-400">{t('country')}</span>
          <Select value={countryId} onValueChange={handleCountryChange} required>
            <SelectTrigger className="h-11 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]" dir={isArabic ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={isLoadingCountries ? t('loading') : t('chooseCountry')} />
            </SelectTrigger>
            <SelectContent className="border-[#14B8A6]/30 bg-[#0B0F19] text-white shadow-2xl">
              {countries.map((country) => (
                <SelectItem key={country.id} value={String(country.id)} className="justify-end text-start cursor-pointer hover:bg-white/10">
                  {labelFor(country, language as 'en' | 'ar')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Governorate */}
        <div className="space-y-1">
          <span className="block text-[11px] font-semibold text-slate-400">{t('governorate')}</span>
          <Select value={governorateId} onValueChange={handleGovernorateChange} disabled={!countryId || isLoadingGovernorates} required>
            <SelectTrigger className="h-11 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]" dir={isArabic ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={isLoadingGovernorates ? t('loading') : t('chooseGovernorate')} />
            </SelectTrigger>
            <SelectContent className="border-[#14B8A6]/30 bg-[#0B0F19] text-white shadow-2xl">
              {governorates.map((governorate) => (
                <SelectItem key={governorate.id} value={String(governorate.id)} className="justify-end text-start cursor-pointer hover:bg-white/10">
                  {labelFor(governorate, language as 'en' | 'ar')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District */}
        <div className="space-y-1">
          <span className="block text-[11px] font-semibold text-slate-400">{t('district')}</span>
          <Select value={districtId} onValueChange={setDistrictId} disabled={!governorateId || isLoadingDistricts} required>
            <SelectTrigger className="h-11 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]" dir={isArabic ? 'rtl' : 'ltr'}>
              <SelectValue placeholder={isLoadingDistricts ? t('loading') : t('chooseDistrict')} />
            </SelectTrigger>
            <SelectContent className="border-[#14B8A6]/30 bg-[#0B0F19] text-white shadow-2xl">
              {districts.map((district) => (
                <SelectItem key={district.id} value={String(district.id)} className="justify-end text-start cursor-pointer hover:bg-white/10">
                  {labelFor(district, language as 'en' | 'ar')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLocationLoading ? (
        <p className="flex items-center gap-2 text-xs text-[#14F5D5]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{t('updatingLists')}</span>
        </p>
      ) : null}
    </div>
  );
}
