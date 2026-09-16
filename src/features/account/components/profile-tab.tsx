import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { styles, labelFor } from './profile-tab/profile-shared';
import { useProfileState } from './profile-tab/use-profile-state';
import { ProfileHeaderCard } from './profile-tab/profile-header-card';
import { ProfileFormSection } from './profile-tab/profile-form-section';
import { BlockedCaptainsSection } from './profile-tab/blocked-captains-section';

export function ProfileTab() {
  const state = useProfileState();

  if (!state.user) {
    return (
      <div className={styles.style549_1}>
        <Card className={styles.style550_2}>
          <CardContent className={styles.style551_3}>{state.t('pleaseLogin')}</CardContent>
        </Card>
      </div>
    );
  }

  const rating = Number(state.profile?.rating ?? state.user?.rating ?? 5);
  const displayName = state.fullName || state.user?.name || 'مستخدم جديد';
  const displayPhone = state.phone || state.user?.phone || '';
  const displayRole = state.isSovereign ? state.t('roles.admin') : state.isCaptain ? state.t('roles.driver') : state.isPassenger ? state.t('roles.rider') : state.t('roles.user');
  
  const currency = state.isArabic
    ? state.selectedCountry?.currency_ar || state.selectedCountry?.currency_en || state.selectedCountry?.currency_code || state.user?.currencyAr || state.user?.currencyEn
    : state.selectedCountry?.currency_en || state.selectedCountry?.currency_code || state.selectedCountry?.currency_ar || state.user?.currencyEn || state.user?.currencyAr;

  const locationLabel = `${labelFor(state.selectedGovernorate, state.language) || state.t('notSet')} - ${labelFor(state.selectedDistrict, state.language) || state.t('notSet')}`;

  return (
    <div className={styles.style558_4}>
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

      {!state.isCaptain && (
        <BlockedCaptainsSection
          isArabic={state.isArabic}
          t={state.t}
          isLoadingBlocks={state.isLoadingBlocks}
          blockedCaptains={state.blockedCaptains}
          confirmingUnblockId={state.confirmingUnblockId}
          setConfirmingUnblockId={state.setConfirmingUnblockId}
          handleUnblockCaptain={state.handleUnblockCaptain}
        />
      )}

      <Button
        type="button"
        onClick={state.logout}
        variant="destructive"
        className={styles.style873_100}
      >
        {state.t('logout')}
      </Button>
    </div>
  );
}
