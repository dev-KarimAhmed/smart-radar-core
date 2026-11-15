import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, User } from 'lucide-react';
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
import { RecoveryEmailField } from '@/features/auth/components/recovery-email-field';
import type { CountryRow, GovernorateRow, DistrictRow } from './profile-shared';
import { ProfileLocationSelects } from './parts/profile-location-selects';
import { ProfilePhoneInputs } from './parts/profile-phone-inputs';

export * from './parts/profile-location-selects';
export * from './parts/profile-phone-inputs';

export interface ProfileFormSectionProps {
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

            {/* 2 & 3. Phone and Emergency WhatsApp */}
            <ProfilePhoneInputs
              t={t}
              isArabic={isArabic}
              phone={phone}
              setPhone={setPhone}
              isPhoneValid={isPhoneValid}
              phoneValidation={phoneValidation}
              emergencyWhatsappContact={emergencyWhatsappContact}
              setEmergencyWhatsappContact={setEmergencyWhatsappContact}
              isEmergencyValid={isEmergencyValid}
              emergencyValidation={emergencyValidation}
            />

            {/* 4. Location Dropdowns */}
            <ProfileLocationSelects
              t={t}
              language={language}
              isArabic={isArabic}
              countryId={countryId}
              handleCountryChange={handleCountryChange}
              countries={countries}
              isLoadingCountries={isLoadingCountries}
              governorateId={governorateId}
              handleGovernorateChange={handleGovernorateChange}
              governorates={governorates}
              isLoadingGovernorates={isLoadingGovernorates}
              districtId={districtId}
              setDistrictId={setDistrictId}
              districts={districts}
              isLoadingDistricts={isLoadingDistricts}
              isLocationLoading={isLocationLoading}
            />

            {/* 5. Recovery Email Slot */}
            <div className="pt-2">
              <RecoveryEmailField />
            </div>

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
