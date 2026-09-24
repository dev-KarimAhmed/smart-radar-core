'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck } from 'lucide-react';
import { labelFor } from './profile-tab/profile-shared';
import { useProfileState } from './profile-tab/use-profile-state';
import { ProfileHeaderCard } from './profile-tab/profile-header-card';
import { ProfileFormSection } from './profile-tab/profile-form-section';
import { RiderSecuritySection } from './profile-tab/rider-security-section';
import { useTranslations } from "next-intl";

export function ProfileTab() {
  const tAuto = useTranslations('auto');
  const state = useProfileState();

  if (!state.user) {
    return (
      <div className="mx-auto w-full max-w-xl pb-24 font-sans text-start">
        <Card className="rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8 text-center text-sm text-slate-300">
            {state.t('pleaseLogin')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const rating = Number(state.profile?.rating ?? state.user?.rating ?? 5);
  const displayName = state.fullName || state.user?.name || tAuto('key_f38edfd8');
  const displayPhone = state.phone || state.user?.phone || '';
  const displayRole = state.isSovereign ? state.t('roles.admin') : state.isCaptain ? state.t('roles.driver') : state.isPassenger ? state.t('roles.rider') : state.t('roles.user');
  
  const currency = state.isArabic
    ? state.selectedCountry?.currency_ar || state.selectedCountry?.currency_en || state.selectedCountry?.currency_code || state.user?.currencyAr || state.user?.currencyEn
    : state.selectedCountry?.currency_en || state.selectedCountry?.currency_code || state.selectedCountry?.currency_ar || state.user?.currencyEn || state.user?.currencyAr;

  const locationLabel = `${labelFor(state.selectedGovernorate, state.language) || state.t('notSet')} - ${labelFor(state.selectedDistrict, state.language) || state.t('notSet')}`;

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 pb-28 text-start font-sans" dir={state.isArabic ? 'rtl' : 'ltr'}>
      {/* 1. Hero Identity Card */}
      <ProfileHeaderCard
        isArabic={state.isArabic}
        t={state.t}
        toggleLanguage={state.toggleLanguage}
        displayName={displayName}
        displayRole={displayRole}
        serialId={state.profile?.serial_id || state.user.serial_id}
        rating={rating}
        locationLabel={locationLabel}
        displayPhone={displayPhone}
        currency={currency}
      />

      {/* 2. Personal Info & Location Section */}
      <ProfileFormSection
        t={state.t}
        language={state.language}
        isArabic={state.isArabic}
        isLoadingProfile={state.isLoadingProfile}
        isLocationLoading={state.isLocationLoading}
        isSaving={state.isSaving}
        fullName={state.fullName}
        setFullName={state.setFullName}
        phone={state.phone}
        setPhone={state.setPhone}
        emergencyWhatsappContact={state.emergencyWhatsappContact}
        setEmergencyWhatsappContact={state.setEmergencyWhatsappContact}
        countryId={state.countryId}
        handleCountryChange={state.handleCountryChange}
        countries={state.countries}
        isLoadingCountries={state.isLoadingCountries}
        governorateId={state.governorateId}
        handleGovernorateChange={state.handleGovernorateChange}
        governorates={state.governorates}
        isLoadingGovernorates={state.isLoadingGovernorates}
        districtId={state.districtId}
        setDistrictId={state.setDistrictId}
        districts={state.districts}
        isLoadingDistricts={state.isLoadingDistricts}
        handleSubmit={state.handleSubmit}
      />

      {/* 3. Sleek Divider / Barrier Between Personal Info and Security */}
      <div className="relative py-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#14B8A6]/25" />
        </div>
        <div className="relative flex items-center gap-2 rounded-full border border-[#14B8A6]/30 bg-[#0B0F19] px-4 py-1.5 text-xs font-black text-[#14F5D5] shadow-lg shadow-[#14B8A6]/10">
          <ShieldCheck className="h-4 w-4 text-[#14F5D5]" />
          <span>{state.isArabic ? 'الأمان وكلمة المرور' : 'Security & Password'}</span>
        </div>
      </div>

      {/* 4. Security & Password Section */}
      <RiderSecuritySection />

      {/* 5. Elegant Tasteful Logout Button */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={state.logout}
          variant="outline"
          className="h-12 w-full gap-2 rounded-2xl border border-rose-500/20 bg-rose-950/20 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>{state.t('logout')}</span>
        </Button>
      </div>
    </div>
  );
}
