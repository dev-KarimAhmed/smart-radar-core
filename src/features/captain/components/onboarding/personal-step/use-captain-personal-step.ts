'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import {
  useSupabaseCountries,
  useSupabaseGovernorates,
  useSupabaseDistricts,
  useDetectedCountryCode,
  getCountryLabel,
  getCountryIsoCode,
  getGovernorateOrDistrictLabel,
} from '@/features/auth/contract';
import { getCaptainPersonalSchema } from '../../../lib/captain-registration-schema';
import { validateYupField, isYupSchemaValid, collectYupSchemaErrors } from '../../../lib/validate-field';
import { normalizePhoneForCountry, getDemoPhoneForCountry } from '@/features/auth/utils/registration-helpers';
import { useCaptainPersonalUniqueness } from './use-captain-personal-uniqueness';
import type { CaptainPersonalValues } from './personal-step-types';

export function useCaptainPersonalStep(
  values: CaptainPersonalValues,
  onChange: (values: CaptainPersonalValues) => void,
  onNext: () => void
) {
  const t = useTranslations('captainOnboarding.personal');
  const tv = useTranslations('captainOnboarding.validation');
  const { isArabic, language } = useDashboardLanguage();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = React.useState(false);

  const schema = React.useMemo(() => getCaptainPersonalSchema(tv), [tv]);

  const { countryRows, loading: countriesLoading } = useSupabaseCountries();
  const countryIdNum = Number(values.country) || null;
  const governorateIdNum = Number(values.governorate) || null;
  const { governorateRows, loading: governoratesLoading } = useSupabaseGovernorates(countryIdNum);
  const { districtRows, loading: districtsLoading } = useSupabaseDistricts(governorateIdNum);
  const detectedCountryCode = useDetectedCountryCode();

  const selectedCountry = React.useMemo(() => {
    if (values.country) {
      return countryRows.find((candidate) => String(candidate.id) === String(values.country)) || null;
    }
    if (detectedCountryCode && countryRows.length > 0) {
      return countryRows.find((row) => getCountryIsoCode(row) === detectedCountryCode) || null;
    }
    return null;
  }, [countryRows, values.country, detectedCountryCode]);

  const phonePlaceholder = React.useMemo(() => {
    const demoPhone = getDemoPhoneForCountry(selectedCountry);
    return isArabic ? `مثال: ${demoPhone}` : `Example: ${demoPhone}`;
  }, [selectedCountry, isArabic]);

  const countryOptions = React.useMemo(
    () => countryRows.map((row) => ({ value: String(row.id), label: getCountryLabel(row, language) })),
    [countryRows, language]
  );
  const governorateOptions = React.useMemo(
    () => governorateRows.map((row) => ({ value: String(row.id), label: getGovernorateOrDistrictLabel(row, language) })),
    [governorateRows, language]
  );
  const districtOptions = React.useMemo(
    () => districtRows.map((row) => ({ value: String(row.id), label: getGovernorateOrDistrictLabel(row, language) })),
    [districtRows, language]
  );

  const runFieldValidation = React.useCallback(
    async (field: string, nextValues: CaptainPersonalValues) => {
      const message = await validateYupField(schema, nextValues, field);
      setErrors((current) => ({ ...current, [field]: message }));
    },
    [schema]
  );

  const handleFieldChange = (field: keyof CaptainPersonalValues, value: string) => {
    const nextValues = { ...values, [field]: value };
    if (field === 'governorate') nextValues.district = '';
    onChange(nextValues);
    void runFieldValidation(field, nextValues);
    if (field === 'governorate') setErrors((current) => ({ ...current, district: '' }));
  };

  const handleCountryChange = (id: string) => {
    const row = countryRows.find((candidate) => String(candidate.id) === id);
    const nextValues = { ...values, country: id, countryIso: getCountryIsoCode(row), governorate: '', district: '' };
    onChange(nextValues);
    void runFieldValidation('country', nextValues);
    if (values.phone.trim()) void runFieldValidation('phone', nextValues);
  };

  React.useEffect(() => {
    if (values.country || !detectedCountryCode || countryRows.length === 0) return;
    const detected = countryRows.find((row) => getCountryIsoCode(row) === detectedCountryCode);
    if (!detected) return;
    onChange({ ...values, country: String(detected.id), countryIso: getCountryIsoCode(detected) });
  }, [detectedCountryCode, countryRows]);

  const phoneValidation = React.useMemo(() => {
    const cleanPhone = values.phone?.trim();
    const demoPhone = getDemoPhoneForCountry(selectedCountry);
    const countrySpecificHint = isArabic
      ? `يجب أن يبدأ برمز الدولة، مثل ${demoPhone}.`
      : `Must start with the country code, e.g. ${demoPhone}.`;

    if (!cleanPhone) return { ok: false, message: countrySpecificHint };
    if (!cleanPhone.startsWith('+')) {
      return {
        ok: false,
        message: isArabic
          ? `اكتب رقم الهاتف بصيغة دولية تبدأ برمز الدولة، مثل ${demoPhone}.`
          : `Write the phone number in international format starting with the country code, like ${demoPhone}.`,
      };
    }
    const res = normalizePhoneForCountry(cleanPhone, values.countryIso);
    if (!res.ok) {
      return { ok: false, message: res.message || tv('phoneInvalid') };
    }
    if (
      errors.phone &&
      errors.phone !== tv('phoneRequired') &&
      errors.phone !== tv('phoneMissingCountryCode') &&
      errors.phone !== tv('phoneInvalid')
    ) {
      return { ok: false, message: errors.phone };
    }
    return { ok: true, message: '' };
  }, [values.phone, values.countryIso, selectedCountry, isArabic, errors.phone, tv]);

  const { checkEmailUniqueness, checkPhoneUniqueness } = useCaptainPersonalUniqueness({
    phone: values.phone,
    email: values.email,
    tv,
    setErrors,
  });

  const isValid = isYupSchemaValid(schema, values);

  const handleContinueClick = async () => {
    if (!isValid) {
      setErrors(collectYupSchemaErrors(schema, values));
      return;
    }

    const cleanEmail = values.email?.trim().toLowerCase();
    if (!cleanEmail) {
      setErrors((current) => ({ ...current, email: tv('emailRequired') }));
      return;
    }

    const cleanPhone = values.phone?.trim();
    if (!cleanPhone) {
      setErrors((current) => ({ ...current, phone: tv('phoneRequired') }));
      return;
    }

    setIsCheckingAvailability(true);
    const [isEmailAvailable, isPhoneAvailable] = await Promise.all([
      checkEmailUniqueness(cleanEmail),
      checkPhoneUniqueness(cleanPhone),
    ]);
    setIsCheckingAvailability(false);

    if (!isEmailAvailable || !isPhoneAvailable) {
      return;
    }

    onNext();
  };

  return {
    t,
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
    selectedCountry,
    handleFieldChange,
    handleCountryChange,
    checkEmailUniqueness,
    checkPhoneUniqueness,
    handleContinueClick,
  };
}
