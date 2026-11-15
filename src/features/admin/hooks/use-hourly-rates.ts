'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type {
  CountryItem,
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
} from '@/features/admin/types/hourly-rates';
import { fetchHourlyRatesData } from '@/features/admin/services/hourly-rates-service';
import { useHourlyRatesFilters } from './use-hourly-rates-filters';
import { useHourlyRatesActions } from './use-hourly-rates-actions';

export function useHourlyRates() {
  const t = useTranslations('hourlyRates');
  const { toast } = useToast();
  const { direction, isArabic } = useDashboardLanguage();

  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [customRates, setCustomRates] = useState<CustomRatesMatrix>({
    governorates: {},
    districts: {},
  });

  const [selectedCountryId, setSelectedCountryId] = useState<number>(1);
  const [localGovInputs, setLocalGovInputs] = useState<Record<number, string>>({});
  const [localDistInputs, setLocalDistInputs] = useState<Record<number, string>>({});

  const filters = useHourlyRatesFilters({
    governorates,
    districts,
    selectedCountryId,
    customRates,
  });

  const activeCountry = useMemo(() => {
    return countries.find((c) => c.id === selectedCountryId) || countries[0] || {
      id: 1,
      country_code: 'JO',
      name_ar: 'الأردن',
      name_en: 'Jordan',
      currency_ar: 'د.أ',
      currency_en: 'JOD',
      radar_hour_price: 1,
    };
  }, [countries, selectedCountryId]);

  const currency = isArabic ? activeCountry.currency_ar : (activeCountry.currency_en || 'JOD');
  const countryDefaultPrice = activeCountry.radar_hour_price || 1;

  const actions = useHourlyRatesActions({
    districts,
    localGovInputs,
    setLocalGovInputs,
    localDistInputs,
    setLocalDistInputs,
    setCustomRates,
    countryDefaultPrice,
    currency,
    toast,
    t,
  });

  const loadRatesData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchHourlyRatesData();
      setCountries(data.countries);
      setGovernorates(data.governorates);
      setDistricts(data.districts);
      setCustomRates(data.customRates);

      const initialGov: Record<number, string> = {};
      for (const g of data.governorates) {
        const val = data.customRates.governorates[String(g.id)];
        if (val !== undefined && val !== null) initialGov[g.id] = String(val);
      }
      setLocalGovInputs(initialGov);

      const initialDist: Record<number, string> = {};
      for (const d of data.districts) {
        const val = data.customRates.districts[String(d.id)];
        if (val !== undefined && val !== null) initialDist[d.id] = String(val);
      }
      setLocalDistInputs(initialDist);
    } catch (err) {
      console.error('[HourlyRatesPanel] load error:', err);
      toast({
        title: t('toastLoadErrorTitle'),
        description: t('toastLoadErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void loadRatesData();
  }, [loadRatesData]);

  return {
    t,
    isArabic,
    direction,
    loading,
    countries,
    governorates,
    districts,
    customRates,
    selectedCountryId,
    setSelectedCountryId,
    ...filters,
    localGovInputs,
    setLocalGovInputs,
    localDistInputs,
    setLocalDistInputs,
    activeCountry,
    currency,
    countryDefaultPrice,
    ...actions,
  };
}
