'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { styles as personalStyles } from './personal-step.styles';
import { getCountryLabel, type SupabaseCountryRow } from '../../hooks/use-supabase-countries';
import {
  getLocationLabel,
  type SupabaseDistrictRow,
  type SupabaseGovernorateRow,
} from '../../hooks/use-supabase-locations';

interface EarlyLaunchAdFormProps {
  isArabic: boolean;
  firstFieldLabel: string;
  entityOrCategory: string;
  setEntityOrCategory: (val: string) => void;
  specialty: string;
  setSpecialty: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  selectedCountryId: string;
  onSelectCountry: (val: string) => void;
  selectedGovId: string;
  onSelectGov: (val: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (val: string) => void;
  countryRows: SupabaseCountryRow[];
  governorateRows: SupabaseGovernorateRow[];
  districtRows: SupabaseDistrictRow[];
  countriesLoading: boolean;
  govLoading: boolean;
  distLoading: boolean;
  error: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function EarlyLaunchAdForm({
  isArabic,
  firstFieldLabel,
  entityOrCategory,
  setEntityOrCategory,
  specialty,
  setSpecialty,
  phone,
  setPhone,
  selectedCountryId,
  onSelectCountry,
  selectedGovId,
  onSelectGov,
  selectedDistrict,
  setSelectedDistrict,
  countryRows,
  governorateRows,
  districtRows,
  countriesLoading,
  govLoading,
  distLoading,
  error,
  isSubmitting,
  onSubmit,
}: EarlyLaunchAdFormProps) {
  const lang = isArabic ? 'ar' : 'en';

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">{firstFieldLabel}</label>
        <input
          type="text"
          value={entityOrCategory}
          onChange={(e) => setEntityOrCategory(e.target.value)}
          placeholder={firstFieldLabel}
          className="w-full rounded-xl border border-slate-700 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">{isArabic ? 'التخصص' : 'Specialty'}</label>
        <input
          type="text"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder={isArabic ? 'التخصص' : 'Specialty'}
          className="w-full rounded-xl border border-slate-700 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">{isArabic ? 'رقم الهاتف' : 'Phone Number'}</label>
        <input
          type="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XXXXXXXX"
          className="w-full rounded-xl border border-slate-700 bg-black/50 px-3.5 py-2.5 text-sm text-white outline-none focus:border-teal-400 text-start"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">{isArabic ? 'الدولة' : 'Country'}</label>
          <Select
            dir={isArabic ? 'rtl' : 'ltr'}
            value={selectedCountryId}
            onValueChange={onSelectCountry}
            disabled={countriesLoading}
          >
            <SelectTrigger className={personalStyles.customSelectTrigger}>
              <SelectValue placeholder={countriesLoading ? '...' : (isArabic ? 'اختر الدولة' : 'Select Country')} />
            </SelectTrigger>
            <SelectContent className={cn(personalStyles.customSelectContent, 'z-[9999] max-h-60')}>
              {countryRows.map((row) => (
                <SelectItem key={row.id} value={String(row.id)} className={personalStyles.customSelectItem}>
                  {getCountryLabel(row, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">{isArabic ? 'المحافظة' : 'Governorate'}</label>
          <Select
            dir={isArabic ? 'rtl' : 'ltr'}
            value={selectedGovId}
            onValueChange={onSelectGov}
            disabled={govLoading}
          >
            <SelectTrigger className={personalStyles.customSelectTrigger}>
              <SelectValue placeholder={govLoading ? '...' : (isArabic ? 'اختر المحافظة' : 'Select Governorate')} />
            </SelectTrigger>
            <SelectContent className={cn(personalStyles.customSelectContent, 'z-[9999] max-h-60')}>
              {governorateRows.map((row) => (
                <SelectItem key={row.id} value={String(row.id)} className={personalStyles.customSelectItem}>
                  {getLocationLabel(row, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">{isArabic ? 'اللواء' : 'District'}</label>
          <Select
            dir={isArabic ? 'rtl' : 'ltr'}
            value={selectedDistrict}
            onValueChange={setSelectedDistrict}
            disabled={!selectedGovId || distLoading}
          >
            <SelectTrigger className={personalStyles.customSelectTrigger}>
              <SelectValue placeholder={distLoading ? '...' : (isArabic ? 'اختر اللواء' : 'Select District')} />
            </SelectTrigger>
            <SelectContent className={cn(personalStyles.customSelectContent, 'z-[9999] max-h-60')}>
              {districtRows.map((row) => (
                <SelectItem key={row.id} value={getLocationLabel(row, 'ar')} className={personalStyles.customSelectItem}>
                  {getLocationLabel(row, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] py-3 text-sm font-black text-slate-950 shadow-lg hover:brightness-110 active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        <span>{isArabic ? 'حفظ البيانات وإنشاء رابط المشاركة' : 'Save & Generate Share Link'}</span>
      </button>
    </form>
  );
}
