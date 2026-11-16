'use client';

import React from 'react';
import {
  styles,
  type CaptainPersonalStepProps,
  type CaptainPersonalValues,
} from './personal-step/personal-step-types';
import { useCaptainPersonalStep } from './personal-step/use-captain-personal-step';
import { PersonalIdentityFields } from './personal-step/personal-identity-fields';
import { PersonalContactFields } from './personal-step/personal-contact-fields';
import { PersonalLocationFields } from './personal-step/personal-location-fields';
import { PersonalSecurityFields } from './personal-step/personal-security-fields';

export type { CaptainPersonalValues } from './personal-step/personal-step-types';
export { styles as captainPersonalStepStyles } from './personal-step/personal-step-types';

export function CaptainPersonalStep({
  values,
  onChange,
  rememberMe,
  onRememberMeChange,
  onNext,
}: CaptainPersonalStepProps) {
  const {
    isArabic,
    errors,
    setErrors,
    showPassword,
    setShowPassword,
    isCheckingAvailability,
    countryOptions,
    countriesLoading,
    governorateOptions,
    governoratesLoading,
    districtOptions,
    districtsLoading,
    phoneValidation,
    phonePlaceholder,
    handleFieldChange,
    handleCountryChange,
    checkEmailUniqueness,
    checkPhoneUniqueness,
    handleContinueClick,
  } = useCaptainPersonalStep(values, onChange, onNext);

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      <PersonalIdentityFields values={values} errors={errors} onFieldChange={handleFieldChange} />

      <PersonalContactFields
        values={values}
        errors={errors}
        setErrors={setErrors}
        isArabic={isArabic}
        countryOptions={countryOptions}
        countriesLoading={countriesLoading}
        phoneValidation={phoneValidation}
        phonePlaceholder={phonePlaceholder}
        onCountryChange={handleCountryChange}
        onFieldChange={handleFieldChange}
        checkPhoneUniqueness={checkPhoneUniqueness}
        checkEmailUniqueness={checkEmailUniqueness}
      />

      <PersonalLocationFields
        values={values}
        errors={errors}
        governorateOptions={governorateOptions}
        governoratesLoading={governoratesLoading}
        districtOptions={districtOptions}
        districtsLoading={districtsLoading}
        onFieldChange={handleFieldChange}
      />

      <PersonalSecurityFields
        values={values}
        errors={errors}
        isArabic={isArabic}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        rememberMe={rememberMe}
        onRememberMeChange={onRememberMeChange}
        isCheckingAvailability={isCheckingAvailability}
        onFieldChange={handleFieldChange}
        onContinue={handleContinueClick}
      />
    </div>
  );
}
