'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, User } from 'lucide-react';
import { labelFor } from './profile-tab/profile-shared';
import { useProfileState } from './profile-tab/use-profile-state';
import { ProfileHeaderCard } from './profile-tab/profile-header-card';
import { ProfileFormSection } from './profile-tab/profile-form-section';
import { RiderSecuritySection } from './profile-tab/rider-security-section';
import { useTranslations } from "next-intl";

export function ProfileTab() {
  const tAuto = useTranslations('auto');
  const state = useProfileState();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

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
    <div className="mx-auto w-full max-w-xl space-y-5 pb-28 text-start font-sans" dir={state.isArabic ? 'rtl' : 'ltr'}>
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

      {/* 2. Sleek Segmented Tab Switcher */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={
            activeTab === 'info'
              ? 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#14B8A6] text-[#0B0F19] shadow-md shadow-[#14B8A6]/20 font-black'
              : 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/5'
          }
        >
          <User className="h-4 w-4" />
          <span>{state.isArabic ? 'البيانات الشخصية' : 'Personal Info'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={
            activeTab === 'security'
              ? 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#14B8A6] text-[#0B0F19] shadow-md shadow-[#14B8A6]/20 font-black'
              : 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer text-slate-400 hover:text-white hover:bg-white/5'
          }
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{state.isArabic ? 'الأمان وكلمة المرور' : 'Security & Password'}</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'info' ? (
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
      ) : (
        <RiderSecuritySection />
      )}

      {/* 4. Elegant Tasteful Logout Button */}
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
