'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  clearPendingCaptainReferral,
  storePendingCaptainReferral,
  removeReferralParamFromUrl,
} from '@/features/referral/services/captain-referral';
import {
  useSupabaseCountries,
  getCountryIsoCode,
  type SupabaseCountryRow,
} from '../use-supabase-countries';
import {
  useSupabaseGovernorates,
  useSupabaseDistricts,
} from '../use-supabase-locations';
import { useDetectedCountryCode } from '../use-detected-country-code';
import {
  getLocationLabel,
  getDemoPhoneForCountry,
} from '../../utils/registration-helpers';
import type {
  AuthMode,
  LocationOption,
  PersonalRegistrationState,
} from '../../types/registration-context-types';

interface UseRegistrationLocationsParams {
  personal: PersonalRegistrationState;
  setPersonal: React.Dispatch<React.SetStateAction<PersonalRegistrationState>>;
  authMode: AuthMode;
  lang: 'ar' | 'en';
  tAuto: (key: string) => string;
}

export function useRegistrationLocations({
  personal,
  setPersonal,
  authMode,
  lang,
  tAuto,
}: UseRegistrationLocationsParams) {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<SupabaseCountryRow | null>(null);
  const detectedCountryCode = useDetectedCountryCode();

  const { countryRows, loading: countriesLoading } = useSupabaseCountries({
    onError: () =>
      toast({
        variant: 'destructive',
        title: tAuto('key_2a3ac6a0'),
        description: tAuto('key_4a1a36ba'),
      }),
  });

  const countryIdNum = Number(personal.country) || null;
  const governorateIdNum = Number(personal.gov) || null;

  const { governorateRows, loading: governoratesLoading } = useSupabaseGovernorates(countryIdNum, {
    onError: () =>
      toast({
        variant: 'destructive',
        title: tAuto('key_64ee8ed7'),
        description: tAuto('key_4966bf15'),
      }),
  });

  const { districtRows, loading: districtsLoading } = useSupabaseDistricts(governorateIdNum, {
    onError: () =>
      toast({
        variant: 'destructive',
        title: tAuto('key_ae97e002'),
        description: tAuto('key_9a947721'),
      }),
  });

  const locationDataLoading = countriesLoading || governoratesLoading || districtsLoading;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const isLoginRoute = window.location.pathname.includes('/login');
        if (isLoginRoute) {
          clearPendingCaptainReferral();
          removeReferralParamFromUrl();
          window.sessionStorage.removeItem('radar_newly_registered_referral');
          return;
        }
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref') || params.get('captain');
        if (ref && ref.trim()) {
          storePendingCaptainReferral(ref.trim());
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (authMode === 'login') {
      clearPendingCaptainReferral();
      removeReferralParamFromUrl();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('radar_newly_registered_referral');
      }
    }
  }, [authMode]);

  useEffect(() => {
    const countryId = Number(personal.country);
    setSelectedCountry(countryRows.find((country) => country.id === countryId) || null);
  }, [countryRows, personal.country]);

  useEffect(() => {
    if (personal.country || !detectedCountryCode || countryRows.length === 0) return;
    const detectedCountry = countryRows.find((country) => getCountryIsoCode(country) === detectedCountryCode);
    if (!detectedCountry) return;
    setPersonal((current) =>
      current.country ? current : { ...current, country: String(detectedCountry.id), gov: '', district: '' },
    );
  }, [countryRows, detectedCountryCode, personal.country, setPersonal]);

  useEffect(() => {
    setPersonal((current) => (current.gov || current.district ? { ...current, gov: '', district: '' } : current));
  }, [personal.country, setPersonal]);

  useEffect(() => {
    setPersonal((current) => (current.district ? { ...current, district: '' } : current));
  }, [personal.gov, setPersonal]);

  const countries = useMemo<LocationOption[]>(
    () =>
      countryRows.map((country) => ({
        id: String(country.id),
        label: getLocationLabel(country, 'ar'),
        labelEn: getLocationLabel(country, 'en'),
        value: String(country.id),
      })),
    [countryRows],
  );

  const governorates = useMemo<LocationOption[]>(
    () =>
      governorateRows.map((governorate) => ({
        id: String(governorate.id),
        label: getLocationLabel(governorate, 'ar'),
        labelEn: getLocationLabel(governorate, 'en'),
        value: String(governorate.id),
      })),
    [governorateRows],
  );

  const districts = useMemo<LocationOption[]>(
    () =>
      districtRows.map((district) => ({
        id: String(district.id),
        label: getLocationLabel(district, 'ar'),
        labelEn: getLocationLabel(district, 'en'),
        value: String(district.id),
      })),
    [districtRows],
  );

  const phonePlaceholder = useMemo(() => getDemoPhoneForCountry(selectedCountry), [selectedCountry]);
  const phoneValidationHint =
    lang === 'ar'
      ? tAuto('key_1a0de9e5')
      : "Write your number in your country's local format, or international format if you prefer";

  return {
    selectedCountry,
    countryRows,
    governorateRows,
    districtRows,
    locationDataLoading,
    countries,
    governorates,
    districts,
    phonePlaceholder,
    phoneValidationHint,
  };
}
