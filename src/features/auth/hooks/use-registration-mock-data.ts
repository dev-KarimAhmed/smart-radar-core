import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getCountryDialCode, type SupabaseCountryRow } from './use-supabase-countries';
import {
  normalizeGovernorates,
  normalizeDistricts,
  type SupabaseGovernorateRow,
  type SupabaseDistrictRow,
} from './use-supabase-locations';
import { getDemoPhoneForCountry } from '../utils/registration-helpers';
import type {
  AuthMode,
  PersonalRegistrationState,
  RegistrationRole,
} from '../types/registration-types';
import type { AffiliationType } from '@/core/types';

interface UseRegistrationMockDataProps {
  isStrictDevelopment: boolean;
  selectedCountry: SupabaseCountryRow | null;
  countryRows: SupabaseCountryRow[];
  governorateRows: SupabaseGovernorateRow[];
  districtRows: SupabaseDistrictRow[];
  personal: PersonalRegistrationState;
  setPersonal: React.Dispatch<React.SetStateAction<PersonalRegistrationState>>;
  setAuthMode: (mode: AuthMode) => void;
  setAuthPassword: (pw: string) => void;
  setRole: (role: RegistrationRole) => void;
  affiliation: AffiliationType | null;
  setAffiliation: (affiliation: any) => void;
  setVehicle: (vehicle: any) => void;
  toast: (opts: any) => void;
  tAuto: (key: string) => string;
}

export function useRegistrationMockData({
  isStrictDevelopment,
  selectedCountry,
  countryRows,
  governorateRows,
  districtRows,
  personal,
  setPersonal,
  setAuthMode,
  setAuthPassword,
  setRole,
  affiliation,
  setAffiliation,
  setVehicle,
  toast,
  tAuto,
}: UseRegistrationMockDataProps) {
  const fillRandomRegistrationData = useCallback(() => {
    if (!isStrictDevelopment) return;

    if (!selectedCountry || !personal.gov || districtRows.length === 0) {
      toast({
        variant: 'destructive',
        title: tAuto('key_4e1d745a'),
        description: tAuto('key_a041f296'),
      });
      return;
    }

    const dialCode = getCountryDialCode(selectedCountry);
    if (!dialCode) {
      toast({
        variant: 'destructive',
        title: tAuto('key_a644ed7b'),
        description: tAuto('key_912f6acb'),
      });
      return;
    }

    const randomDistrict = districtRows[Math.floor(Math.random() * districtRows.length)];
    const serial = String(Date.now()).slice(-6);
    const demoPhone = getDemoPhoneForCountry(selectedCountry);

    setAuthMode('register');
    setPersonal((current) => ({
      ...current,
      name: `مستخدم تجربة ${serial}`,
      phone: demoPhone,
      email: `test${serial}@example.com`,
      country: String(selectedCountry.id),
      gov: personal.gov,
      district: String(randomDistrict.id),
    }));
    setAuthPassword(`Test${serial}!`);

    toast({
      title: tAuto('key_294a26b3'),
      description: tAuto('key_38e7e080'),
    });
  }, [districtRows, isStrictDevelopment, personal.gov, selectedCountry, setAuthMode, setAuthPassword, setPersonal, tAuto, toast]);

  const fillCaptainRegistrationData = useCallback(async () => {
    const country =
      selectedCountry ||
      countryRows.find((row) => String(row.id) === personal.country) ||
      countryRows[0] ||
      null;

    let governorateOptions = governorateRows.filter((row) => row.country_id === country?.id);
    if (country && governorateOptions.length === 0) {
      const { data, error } = await supabase
        .from('governorates')
        .select('*')
        .eq('country_id', country.id)
        .order('id', { ascending: true });
      if (!error) {
        governorateOptions = normalizeGovernorates(data);
      }
    }

    const governorateId = Number(
      personal.gov && governorateOptions.some((row) => row.id === Number(personal.gov))
        ? personal.gov
        : governorateOptions[0]?.id,
    );

    let districtOptions = districtRows.filter((district) => district.governorate_id === governorateId);
    if (Number.isInteger(governorateId) && governorateId > 0 && districtOptions.length === 0) {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('governorate_id', governorateId)
        .order('id', { ascending: true });
      if (!error) {
        districtOptions = normalizeDistricts(data);
      }
    }

    const districtId = Number(
      personal.district && districtOptions.some((row) => row.id === Number(personal.district))
        ? personal.district
        : districtOptions[0]?.id,
    );

    if (!country || !Number.isInteger(governorateId) || !Number.isInteger(districtId)) {
      toast({
        variant: 'destructive',
        title: tAuto('key_7e63a867'),
        description: tAuto('key_f67ac42d'),
      });
      return;
    }

    const serial = String(Date.now()).slice(-6);
    const demoPhone = getDemoPhoneForCountry(country);
    const plateSuffix = serial.slice(-4);

    setAuthMode('register');
    setRole('driver');
    setAffiliation(affiliation || 'smart-app');
    setPersonal((current) => ({
      ...current,
      name: `Captain Test ${serial}`,
      phone: demoPhone,
      email: `captain${serial}@example.com`,
      country: String(country.id),
      gov: String(governorateId),
      district: String(districtId),
      verificationDoc: current.verificationDoc || 'dev-captain-license',
    }));
    setAuthPassword(`Captain${serial}!`);
    setVehicle((current: any) => ({
      ...current,
      make: 'Toyota Corolla',
      color: 'black',
      plate: `TEST-${plateSuffix}`,
      year: '2022',
      companyName: 'bynkcom',
      officeName: 'مكتب بينكم التجريبي',
      officePhone: demoPhone,
      sideId: `D-${plateSuffix}`,
    }));

    toast({
      title: tAuto('key_c3d38c4f'),
      description: tAuto('key_61287ae0'),
    });
  }, [
    affiliation,
    countryRows,
    districtRows,
    governorateRows,
    personal.country,
    personal.district,
    personal.gov,
    selectedCountry,
    setAffiliation,
    setAuthMode,
    setAuthPassword,
    setPersonal,
    setRole,
    setVehicle,
    tAuto,
    toast,
  ]);

  return {
    fillRandomRegistrationData,
    fillCaptainRegistrationData,
  };
}
