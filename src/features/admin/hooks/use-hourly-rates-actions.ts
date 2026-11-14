'use client';

import { useState } from 'react';
import type { useToast } from '@/hooks/use-toast';
import type {
  DistrictItem,
  CustomRatesMatrix,
} from '@/features/admin/types/hourly-rates';
import {
  saveSingleHourlyRate,
  resetGovernorateHourlyRate,
  applyHourlyRateToAllDistricts,
} from '@/features/admin/services/hourly-rates-service';

interface UseHourlyRatesActionsParams {
  districts: DistrictItem[];
  localGovInputs: Record<number, string>;
  setLocalGovInputs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  localDistInputs: Record<number, string>;
  setLocalDistInputs: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setCustomRates: React.Dispatch<React.SetStateAction<CustomRatesMatrix>>;
  countryDefaultPrice: number;
  currency: string;
  toast: ReturnType<typeof useToast>['toast'];
  t: (key: string, values?: any) => string;
}

export function useHourlyRatesActions({
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
}: UseHourlyRatesActionsParams) {
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleSaveGovRate = async (govId: number) => {
    const rawVal = localGovInputs[govId]?.trim();
    const numVal = rawVal ? Number(rawVal) : null;
    if (numVal !== null && (isNaN(numVal) || numVal <= 0)) {
      toast({ title: t('toastInvalidPriceTitle'), description: t('toastInvalidPriceDesc'), variant: 'destructive' });
      return;
    }
    try {
      setSavingKey(`gov-${govId}`);
      await saveSingleHourlyRate({ targetType: 'governorate', targetId: govId, hourPrice: numVal });
      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates };
        if (numVal === null) delete nextGovs[String(govId)];
        else nextGovs[String(govId)] = numVal;
        return { ...prev, governorates: nextGovs };
      });
      toast({
        title: t('toastGovSavedTitle'),
        description: t('toastGovSavedDesc', {
          price: numVal !== null ? `${numVal} ${currency}` : `${countryDefaultPrice} ${currency}`,
        }),
      });
    } catch (err: any) {
      toast({ title: t('toastGenericError'), description: err.message || t('toastGenericError'), variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetGovRate = async (govId: number) => {
    try {
      setSavingKey(`reset-gov-${govId}`);
      await resetGovernorateHourlyRate(govId);
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
      toast({ title: t('toastGovResetTitle'), description: t('toastGovResetDesc') });
    } catch (err: any) {
      toast({ title: t('toastGenericError'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleApplyToAllDistricts = async (govId: number) => {
    const rawVal = localGovInputs[govId]?.trim();
    const numVal = rawVal ? Number(rawVal) : countryDefaultPrice;
    if (isNaN(numVal) || numVal <= 0) {
      toast({ title: t('toastInvalidPriceTitle'), description: t('toastInvalidPriceDesc'), variant: 'destructive' });
      return;
    }
    try {
      setSavingKey(`apply-all-${govId}`);
      await applyHourlyRateToAllDistricts(govId, numVal);
      const relatedDists = districts.filter((d) => d.governorate_id === govId);
      setLocalDistInputs((prev) => {
        const next = { ...prev };
        for (const d of relatedDists) next[d.id] = String(numVal);
        return next;
      });
      setCustomRates((prev) => {
        const nextGovs = { ...prev.governorates, [String(govId)]: numVal };
        const nextDists = { ...prev.districts };
        for (const d of relatedDists) nextDists[String(d.id)] = numVal;
        return { governorates: nextGovs, districts: nextDists };
      });
      toast({
        title: t('toastApplyAllTitle'),
        description: t('toastApplyAllDesc', { price: numVal, currency, count: relatedDists.length }),
      });
    } catch (err: any) {
      toast({ title: t('toastGenericError'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveDistrictRate = async (distId: number) => {
    const rawVal = localDistInputs[distId]?.trim();
    const numVal = rawVal ? Number(rawVal) : null;
    if (numVal !== null && (isNaN(numVal) || numVal <= 0)) {
      toast({ title: t('toastInvalidPriceTitle'), description: t('toastInvalidPriceDesc'), variant: 'destructive' });
      return;
    }
    try {
      setSavingKey(`dist-${distId}`);
      await saveSingleHourlyRate({ targetType: 'district', targetId: distId, hourPrice: numVal });
      setCustomRates((prev) => {
        const nextDists = { ...prev.districts };
        if (numVal === null) delete nextDists[String(distId)];
        else nextDists[String(distId)] = numVal;
        return { ...prev, districts: nextDists };
      });
      toast({
        title: t('toastDistSavedTitle'),
        description: t('toastDistSavedDesc', { price: numVal !== null ? `${numVal} ${currency}` : currency }),
      });
    } catch (err: any) {
      toast({ title: t('toastGenericError'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleResetDistrictRate = async (distId: number) => {
    try {
      setSavingKey(`reset-dist-${distId}`);
      await saveSingleHourlyRate({ targetType: 'district', targetId: distId, hourPrice: null });
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
      toast({ title: t('toastDistResetTitle'), description: t('toastDistResetDesc') });
    } catch (err: any) {
      toast({ title: t('toastGenericError'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  return {
    savingKey,
    handleSaveGovRate,
    handleResetGovRate,
    handleApplyToAllDistricts,
    handleSaveDistrictRate,
    handleResetDistrictRate,
  };
}
