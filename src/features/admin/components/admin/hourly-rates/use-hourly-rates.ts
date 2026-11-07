'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import type {
  CountryItem,
  GovernorateItem,
  DistrictItem,
  CustomRatesMatrix,
} from './hourly-rates-types';

export function useHourlyRates() {
  const t = useTranslations('hourlyRates');
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [customRates, setCustomRates] = useState<CustomRatesMatrix>({ governorates: {}, districts: {} });

  const [selectedCountryId, setSelectedCountryId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'custom_only' | 'default_only'>('all');
  const [expandedGovs, setExpandedGovs] = useState<Record<number, boolean>>({});

  const [localGovInputs, setLocalGovInputs] = useState<Record<number, string>>({});
  const [localDistInputs, setLocalDistInputs] = useState<Record<number, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadRatesData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/hourly-rates');
      const data = await res.json();

      if (data?.success) {
        setCountries(data.countries || []);
        setGovernorates(data.governorates || []);
        setDistricts(data.districts || []);
        setCustomRates(data.customRates || { governorates: {}, districts: {} });

        const initialGovInputs: Record<number, string> = {};
        for (const g of data.governorates || []) {
          const customVal = data.customRates?.governorates?.[String(g.id)];
          if (customVal !== undefined && customVal !== null) {
            initialGovInputs[g.id] = String(customVal);
          }
        }
        setLocalGovInputs(initialGovInputs);

        const initialDistInputs: Record<number, string> = {};
        for (const d of data.districts || []) {
          const customVal = data.customRates?.districts?.[String(d.id)];
          if (customVal !== undefined && customVal !== null) {
            initialDistInputs[d.id] = String(customVal);
          }
        }
        setLocalDistInputs(initialDistInputs);
      }
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

  const activeCountry = useMemo(() => {
    return (
      countries.find((c) => c.id === selectedCountryId) ||
      countries[0] || {
        id: 1,
        country_code: 'JO',
        name_ar: 'الأردن',
        name_en: 'Jordan',
        currency_ar: 'د.أ',
        currency_en: 'JOD',
        radar_hour_price: 1,
      }
    );
  }, [countries, selectedCountryId]);

  const countryDefaultPrice = activeCountry.radar_hour_price || 1;

  const toggleGovExpanded = (govId: number) => {
    setExpandedGovs((prev) => ({ ...prev, [govId]: !prev[govId] }));
  };

  const expandAllGovs = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    for (const g of governorates) {
      next[g.id] = expand;
    }
    setExpandedGovs(next);
  };

  const handleSaveGovRate = async (govId: number, currency: string) => {
    const rawVal = localGovInputs[govId]?.trim();
    const numVal = rawVal ? Number(rawVal) : null;

    if (numVal !== null && (isNaN(numVal) || numVal <= 0)) {
      toast({
        title: t('toastInvalidPriceTitle'),
        description: t('toastInvalidPriceDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingKey(`gov-${govId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_single_rate',
          targetType: 'governorate',
          targetId: govId,
          hourPrice: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates };
        if (numVal === null) {
          delete nextGovs[String(govId)];
        } else {
          nextGovs[String(govId)] = numVal;
        }
        return { ...prev, governorates: nextGovs };
      });

      toast({
        title: t('toastGovSavedTitle'),
        description: t('toastGovSavedDesc', {
          price: numVal !== null ? `${numVal} ${currency}` : `${countryDefaultPrice} ${currency}`,
        }),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message || t('toastGenericError'),
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetGovRate = async (govId: number) => {
    try {
      setSavingKey(`reset-gov-${govId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reset_governorate',
          governorateId: govId,
          resetDistricts: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setLocalGovInputs((prev) => {
        const next = { ...prev };
        delete next[govId];
        return next;
      });

      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates };
        delete nextGovs[String(govId)];
        return { ...prev, governorates: nextGovs };
      });

      toast({
        title: t('toastGovResetTitle'),
        description: t('toastGovResetDesc'),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleApplyToAllDistricts = async (govId: number, currency: string) => {
    const rawVal = localGovInputs[govId]?.trim();
    const numVal = rawVal ? Number(rawVal) : countryDefaultPrice;

    if (isNaN(numVal) || numVal <= 0) {
      toast({
        title: t('toastInvalidPriceTitle'),
        description: t('toastInvalidPriceDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingKey(`apply-all-${govId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'apply_to_governorate_districts',
          governorateId: govId,
          hourPrice: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      const relatedDists = districts.filter((d) => d.governorate_id === govId);
      setLocalDistInputs((prev) => {
        const next = { ...prev };
        for (const d of relatedDists) {
          next[d.id] = String(numVal);
        }
        return next;
      });

      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates, [String(govId)]: numVal };
        const nextDists = { ...prev.districts };
        for (const d of relatedDists) {
          nextDists[String(d.id)] = numVal;
        }
        return { governorates: nextGovs, districts: nextDists };
      });

      setExpandedGovs((prev) => ({ ...prev, [govId]: true }));

      toast({
        title: t('toastApplyAllTitle'),
        description: t('toastApplyAllDesc', { price: numVal, currency, count: relatedDists.length }),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveDistrictRate = async (distId: number, currency: string) => {
    const rawVal = localDistInputs[distId]?.trim();
    const numVal = rawVal ? Number(rawVal) : null;

    if (numVal !== null && (isNaN(numVal) || numVal <= 0)) {
      toast({
        title: t('toastInvalidPriceTitle'),
        description: t('toastInvalidPriceDesc'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingKey(`dist-${distId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_single_rate',
          targetType: 'district',
          targetId: distId,
          hourPrice: numVal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setCustomRates((prev) => {
        const nextDists = { ...prev.districts };
        if (numVal === null) {
          delete nextDists[String(distId)];
        } else {
          nextDists[String(distId)] = numVal;
        }
        return { ...prev, districts: nextDists };
      });

      toast({
        title: t('toastDistSavedTitle'),
        description: t('toastDistSavedDesc', { price: numVal !== null ? `${numVal} ${currency}` : currency }),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetDistrictRate = async (distId: number) => {
    try {
      setSavingKey(`reset-dist-${distId}`);
      const res = await adminFetch('/api/admin/hourly-rates', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_single_rate',
          targetType: 'district',
          targetId: distId,
          hourPrice: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('toastGenericError'));
      }

      setLocalDistInputs((prev) => {
        const next = { ...prev };
        delete next[distId];
        return next;
      });

      setCustomRates((prev) => {
        const nextDists = { ...prev.districts };
        delete nextDists[String(distId)];
        return { ...prev, districts: nextDists };
      });

      toast({
        title: t('toastDistResetTitle'),
        description: t('toastDistResetDesc'),
      });
    } catch (err: any) {
      toast({
        title: t('toastGenericError'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  const filteredGovernorates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const countryGovs = governorates.filter((g) => g.country_id === selectedCountryId);

    return countryGovs.filter((gov) => {
      const govDists = districts.filter((d) => d.governorate_id === gov.id);
      const hasGovCustom = customRates.governorates[String(gov.id)] !== undefined;
      const hasAnyDistCustom = govDists.some((d) => customRates.districts[String(d.id)] !== undefined);

      if (filterMode === 'custom_only' && !hasGovCustom && !hasAnyDistCustom) {
        return false;
      }
      if (filterMode === 'default_only' && (hasGovCustom || hasAnyDistCustom)) {
        return false;
      }

      if (!q) return true;

      const govMatch = gov.name_ar.toLowerCase().includes(q) || gov.name_en.toLowerCase().includes(q);
      if (govMatch) return true;

      const distMatch = govDists.some(
        (d) => d.name_ar.toLowerCase().includes(q) || d.name_en.toLowerCase().includes(q)
      );
      return distMatch;
    });
  }, [governorates, districts, selectedCountryId, searchQuery, filterMode, customRates]);

  const totalGovsInCountry = governorates.filter((g) => g.country_id === selectedCountryId).length;
  const totalDistsInCountry = districts.filter((d) => {
    const g = governorates.find((gov) => gov.id === d.governorate_id);
    return g?.country_id === selectedCountryId;
  }).length;

  const totalCustomZones = useMemo(() => {
    const govIds = new Set(governorates.filter((g) => g.country_id === selectedCountryId).map((g) => String(g.id)));
    const customGovCount = Object.keys(customRates.governorates).filter((id) => govIds.has(id)).length;

    const distIds = new Set(
      districts
        .filter((d) => {
          const g = governorates.find((gov) => gov.id === d.governorate_id);
          return g?.country_id === selectedCountryId;
        })
        .map((d) => String(d.id))
    );
    const customDistCount = Object.keys(customRates.districts).filter((id) => distIds.has(id)).length;

    return customGovCount + customDistCount;
  }, [governorates, districts, selectedCountryId, customRates]);

  return {
    t,
    loading,
    countries,
    governorates,
    districts,
    customRates,
    selectedCountryId,
    setSelectedCountryId,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    expandedGovs,
    localGovInputs,
    setLocalGovInputs,
    localDistInputs,
    setLocalDistInputs,
    savingKey,
    activeCountry,
    countryDefaultPrice,
    toggleGovExpanded,
    expandAllGovs,
    handleSaveGovRate,
    handleResetGovRate,
    handleApplyToAllDistricts,
    handleSaveDistrictRate,
    handleResetDistrictRate,
    filteredGovernorates,
    totalGovsInCountry,
    totalDistsInCountry,
    totalCustomZones,
  };
}
