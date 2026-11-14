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
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
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
    if (!cleanPhone) return { ok: false, message: t('phoneHint') };
    if (!cleanPhone.startsWith('+')) {
      return { ok: false, message: tv('phoneMissingCountryCode') || t('phoneHint') };
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
  }, [values.phone, values.countryIso, errors.phone, t, tv]);

  const checkEmailUniqueness = React.useCallback(
    async (emailToTest: string) => {
      const cleanEmail = emailToTest.trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return true;
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data: availability, error } = await supabase.rpc('check_captain_identity_available', {
          p_email: cleanEmail,
        });
        if (!error && availability?.email_taken) {
          setErrors((current) => ({
            ...current,
            email: tv('emailDuplicate') || 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.',
          }));
          return false;
        }
      } catch (err) {
        console.warn('Email uniqueness check error:', err);
      }
      return true;
    },
    [tv]
  );

  const checkPhoneUniqueness = React.useCallback(
    async (phoneToTest: string) => {
      const cleanPhone = phoneToTest.trim();
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      if (!cleanPhone || digitsOnly.length < 8) return true;
      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data: availability, error } = await supabase.rpc('check_captain_identity_available', {
          p_phone: cleanPhone,
        });
        if (!error && availability?.phone_taken) {
          setErrors((current) => ({
            ...current,
            phone: tv('phoneDuplicate') || 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر.',
          }));
          return false;
        }
      } catch (err) {
        console.warn('Phone uniqueness check error:', err);
      }
      return true;
    },
    [tv]
  );

  React.useEffect(() => {
    const cleanPhone = values.phone.trim();
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || digitsOnly.length < 8) return;

    const timer = setTimeout(() => {
      void checkPhoneUniqueness(cleanPhone);
    }, 400);

    return () => clearTimeout(timer);
  }, [values.phone, checkPhoneUniqueness]);

  React.useEffect(() => {
    const cleanEmail = values.email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;

    const timer = setTimeout(() => {
      void checkEmailUniqueness(cleanEmail);
    }, 400);

    return () => clearTimeout(timer);
  }, [values.email, checkEmailUniqueness]);

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
    handleFieldChange,
    handleCountryChange,
    checkEmailUniqueness,
    checkPhoneUniqueness,
    handleContinueClick,
  };
}
