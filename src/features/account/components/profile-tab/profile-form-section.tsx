import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Globe, Loader2, MessageCircle, Phone, Save, Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
import { labelFor } from './profile-shared';
import { RecoveryEmailField } from '@/features/auth/components/recovery-email-field';
import type { CountryRow, GovernorateRow, DistrictRow } from './profile-shared';

interface ProfileFormSectionProps {
  t: any;
  language: string;
  isArabic: boolean;
  isLoadingProfile: boolean;
  isLocationLoading: boolean;
  isSaving: boolean;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  emergencyWhatsappContact: string;
  setEmergencyWhatsappContact: (val: string) => void;
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
  handleSubmit: (e: React.FormEvent) => void;
}

export function ProfileFormSection({
  t,
  language,
  isArabic,
  isLoadingProfile,
  isLocationLoading,
  isSaving,
  fullName,
  setFullName,
  phone,
  setPhone,
  emergencyWhatsappContact,
  setEmergencyWhatsappContact,
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
  handleSubmit,
}: ProfileFormSectionProps) {
  const selectedCountry = React.useMemo(
    () => countries.find((c) => String(c.id) === String(countryId)) || null,
    [countries, countryId],
  );

  const phoneValidation = React.useMemo(() => {
    const val = phone?.trim();
    if (!val) return { ok: false, message: isArabic ? 'اكتب رقم الهاتف' : 'Enter phone number' };
    return normalizePhoneForCountry(val, selectedCountry as any);
  }, [phone, selectedCountry, isArabic]);

  const isPhoneValid = phoneValidation.ok;

  const emergencyValidation = React.useMemo(() => {
    const val = emergencyWhatsappContact?.trim();
    if (!val) return { ok: true, message: '' };
    return normalizePhoneForCountry(val, selectedCountry as any);
  }, [emergencyWhatsappContact, selectedCountry]);

  const isEmergencyValid = emergencyValidation.ok;

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl">
      {/* Top glowing ambient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-sm">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-black text-white flex items-center gap-2">
              {t('editTitle')}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {t('editDescription')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {isLoadingProfile ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#14B8A6]/20 bg-black/30 p-8 text-sm text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-[#14F5D5]" />
            <span className="font-semibold">{t('loadingProfile')}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Full Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <User className="h-3.5 w-3.5 text-[#14F5D5]" />
                <span>{t('fullName')}</span>
              </label>
              <Input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-11 rounded-2xl border-[#14B8A6]/25 bg-black/40 text-white text-sm focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]"
                placeholder={t('fullNamePlaceholder')}
                required
              />
            </div>

            {/* 2. Phone Number */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Phone className="h-3.5 w-3.5 text-[#14F5D5]" />
                <span>{t('phone')}</span>
              </label>
              <div className="relative">
                <Input
                  value={phone}
                  dir="ltr"
                  onChange={(event) => setPhone(event.target.value)}
                  className={cn(
                    "h-11 rounded-2xl border-[#14B8A6]/25 bg-black/40 text-white text-sm font-mono focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]",
                    isPhoneValid && "!border-emerald-500/70 focus-visible:!border-emerald-500 ring-1 ring-emerald-500/20",
                    !isPhoneValid && phone.trim() && "!border-amber-500/60 focus-visible:!border-amber-500"
                  )}
                  placeholder="+962790000000"
                  required
                />
                {isPhoneValid ? (
                  <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </span>
                ) : null}
              </div>
              {!isPhoneValid ? (
                <p className="text-[11px] text-amber-400/90 font-medium pt-0.5">
                  {phone.trim() ? (phoneValidation.message || t('phoneInvalid')) : (isArabic ? 'اكتب رقم هاتفك بالنسق المحلي أو الدولي' : 'Enter your phone number')}
                </p>
              ) : null}
            </div>

            {/* 3. Emergency WhatsApp Contact */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <MessageCircle className="h-3.5 w-3.5 text-[#14F5D5]" />
                <span>{t('emergencyWhatsappContact')}</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={emergencyWhatsappContact}
                    dir="ltr"
                    onChange={(event) => setEmergencyWhatsappContact(event.target.value)}
                    className={cn(
                      "h-11 rounded-2xl border-[#14B8A6]/25 bg-black/40 text-white text-sm font-mono focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]",
                      emergencyWhatsappContact.trim() && isEmergencyValid && "!border-emerald-500/70 focus-visible:!border-emerald-500 ring-1 ring-emerald-500/20",
                      emergencyWhatsappContact.trim() && !isEmergencyValid && "!border-amber-500/60 focus-visible:!border-amber-500"
                    )}
                    placeholder={t('emergencyWhatsappPlaceholder')}
                  />
                  {emergencyWhatsappContact.trim() && isEmergencyValid ? (
                    <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </span>
                  ) : null}
                </div>
                {emergencyWhatsappContact ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmergencyWhatsappContact('')}
                    className="h-11 shrink-0 rounded-2xl border-rose-500/20 bg-rose-950/20 px-3 text-rose-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                    aria-label={t('deleteEmergencyContact')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              {emergencyWhatsappContact.trim() && !isEmergencyValid ? (
                <p className="text-[11px] text-amber-400/90 font-medium pt-0.5">
                  {emergencyValidation.message || (isArabic ? 'رقم الواتساب غير صالح' : 'Invalid WhatsApp phone number')}
                </p>
              ) : null}
            </div>

            {/* 4. Location Dropdowns */}
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
            </div>

            {/* 5. Recovery Email Slot */}
            <div className="pt-2">
              <RecoveryEmailField />
            </div>

            {isLocationLoading ? (
              <p className="flex items-center gap-2 text-xs text-[#14F5D5]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t('updatingLists')}</span>
              </p>
            ) : null}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSaving || isLocationLoading}
              className="h-12 w-full gap-2 rounded-2xl bg-[#14B8A6] text-sm font-black text-[#0B0F19] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#0fa596] active:scale-[0.99] transition-all cursor-pointer mt-4"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-[#0B0F19]" />
                  <span>{t('save')}</span>
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
