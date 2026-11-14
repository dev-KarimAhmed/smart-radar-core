import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type { CountryRow, DistrictRow, GovernorateRow } from './profile-shared';
import { normalizeRows } from './profile-shared';

export function useProfileGeography() {
  const { toast } = useToast();
  const t = useTranslations('profileTab');

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);

  const [countryId, setCountryId] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [districtId, setDistrictId] = useState('');

  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((country) => String(country.id) === countryId) || null,
    [countries, countryId],
  );
  const selectedGovernorate = useMemo(
    () => governorates.find((governorate) => String(governorate.id) === governorateId) || null,
    [governorates, governorateId],
  );
  const selectedDistrict = useMemo(
    () => districts.find((district) => String(district.id) === districtId) || null,
    [districts, districtId],
  );

  const isLocationLoading = isLoadingCountries || isLoadingGovernorates || isLoadingDistricts;

  useEffect(() => {
    let active = true;
    const selectedCountryId = Number(countryId);

    setGovernorates([]);
    setDistricts([]);

    if (!Number.isInteger(selectedCountryId) || selectedCountryId <= 0) {
      return;
    }

    async function loadGovernorates() {
      setIsLoadingGovernorates(true);
      try {
        const { data, error } = await supabase
          .from('governorates')
          .select('*')
          .eq('country_id', selectedCountryId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setGovernorates(normalizeRows<GovernorateRow>(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Profile Governorates]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: t('govLoadErrorTitle'),
            description: t('govLoadErrorDesc'),
          });
        }
      } finally {
        if (active) setIsLoadingGovernorates(false);
      }
    }

    void loadGovernorates();

    return () => {
      active = false;
    };
  }, [countryId, toast, t]);

  useEffect(() => {
    let active = true;
    const selectedGovernorateId = Number(governorateId);

    setDistricts([]);

    if (!Number.isInteger(selectedGovernorateId) || selectedGovernorateId <= 0) {
      return;
    }

    async function loadDistricts() {
      setIsLoadingDistricts(true);
      try {
        const { data, error } = await supabase
          .from('districts')
          .select('*')
          .eq('governorate_id', selectedGovernorateId)
          .order('id', { ascending: true });
        if (error) throw error;
        if (active) setDistricts(normalizeRows<DistrictRow>(data));
      } catch (error) {
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Profile Districts]', error);
        if (active) {
          toast({
            variant: 'destructive',
            title: t('districtLoadErrorTitle'),
            description: t('districtLoadErrorDesc'),
          });
        }
      } finally {
        if (active) setIsLoadingDistricts(false);
      }
    }

    void loadDistricts();

    return () => {
      active = false;
    };
  }, [governorateId, toast, t]);

  const handleCountryChange = (value: string) => {
    setCountryId(value);
    setGovernorateId('');
    setDistrictId('');
  };

  const handleGovernorateChange = (value: string) => {
    setGovernorateId(value);
    setDistrictId('');
  };

  return {
    countries,
    setCountries,
    governorates,
    districts,
    countryId,
    setCountryId,
    governorateId,
    setGovernorateId,
    districtId,
    setDistrictId,
    isLoadingCountries,
    setIsLoadingCountries,
    isLoadingGovernorates,
    isLoadingDistricts,
    isLocationLoading,
    selectedCountry,
    selectedGovernorate,
    selectedDistrict,
    handleCountryChange,
    handleGovernorateChange,
  };
}
