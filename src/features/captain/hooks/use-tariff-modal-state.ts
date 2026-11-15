'use client';

import React from 'react';
import type { User } from '@/core/types';
import type { CaptainTariff, CaptainTariffSaveResult, MarketAverageTariff } from './use-price-per-km-setup';
import { toInputValue } from '../components/tariff/tariff-modal-styles';
import { resolveDefaultPricingMode } from '../components/tariff/tariff-helpers';

interface UseTariffModalStateProps {
  user: User | null;
  rank: string;
  isSilver: boolean;
  isArabic: boolean;
  marketAverage?: MarketAverageTariff | null;
  initialTariff?: { baseFare: number | null; pricePerKm: number | null; pricePerMin: number | null; includedKm?: number; pricingMode?: 'FREE' | 'APP' | 'TAXI' | null };
  onSave: (value: CaptainTariff) => Promise<CaptainTariffSaveResult>;
  t: (key: string, values?: any) => string;
}

export function useTariffModalState({
  user,
  isSilver,
  isArabic,
  marketAverage,
  initialTariff,
  onSave,
  t,
}: UseTariffModalStateProps) {
  const defaultModeFromAccount = React.useMemo<'FREE' | 'APP' | 'TAXI'>(() => {
    return resolveDefaultPricingMode(user, initialTariff?.pricingMode);
  }, [user, initialTariff?.pricingMode]);

  const [setupMode, setSetupMode] = React.useState<'FREE' | 'APP' | 'TAXI'>(defaultModeFromAccount);

  React.useEffect(() => {
    setSetupMode(defaultModeFromAccount);
  }, [defaultModeFromAccount]);

  const [baseFare, setBaseFare] = React.useState(toInputValue(initialTariff?.baseFare));
  const [pricePerKm, setPricePerKm] = React.useState(toInputValue(initialTariff?.pricePerKm));
  const [pricePerMin, setPricePerMin] = React.useState(toInputValue(initialTariff?.pricePerMin));
  const [includedKm, setIncludedKm] = React.useState(toInputValue(initialTariff?.includedKm ?? 0));
  const numIncludedKm = parseFloat(includedKm) || 0;
  const numBaseFare = parseFloat(baseFare) || 0;
  const shortDistanceTotal = Math.round(numIncludedKm * numBaseFare * 100) / 100;
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [shortDistancesError, setShortDistancesError] = React.useState('');
  const [isShortDistancesOpen, setIsShortDistancesOpen] = React.useState(false);
  const [isSilverWarningModalOpen, setIsSilverWarningModalOpen] = React.useState(false);
  const [isSilverConfirmed, setIsSilverConfirmed] = React.useState(false);

  const handleStepPricePerKm = (delta: number) => {
    const current = parseFloat(pricePerKm) || 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setPricePerKm(next.toFixed(2));
    setIsSilverConfirmed(false);
  };

  const handleStepPricePerMin = (delta: number) => {
    const current = parseFloat(pricePerMin) || 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setPricePerMin(next.toFixed(2));
    setIsSilverConfirmed(false);
  };

  const handleStepIncludedKm = (delta: number) => {
    const current = parseFloat(includedKm) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setIncludedKm(next.toString());
  };

  const handleStepBaseFare = (delta: number) => {
    const current = parseFloat(baseFare) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setBaseFare(next.toFixed(2));
  };

  const executeFreeSave = async (
    parsedBaseFare: number,
    parsedPricePerKm: number,
    parsedPricePerMin: number,
    parsedIncludedKm: number,
  ) => {
    setIsSaving(true);
    try {
      const result = await onSave({
        baseFare: parsedBaseFare,
        pricePerKm: parsedPricePerKm,
        pricePerMin: parsedPricePerMin,
        includedKm: parsedIncludedKm,
        pricingMode: 'FREE',
      });
      if (!result.saved && result.reason === 'base_fare_below_market_minimum') {
        setIsShortDistancesOpen(true);
        setShortDistancesError(t('tariffModalBaseFareTooLow', { min: result.minBaseFare.toFixed(2) }));
      } else if (!result.saved) {
        setError(t('pricePerKmModalError'));
      }
    } catch {
      setError(t('pricePerKmModalError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFixedModeSave = async (mode: 'APP' | 'TAXI') => {
    setIsSaving(true);
    try {
      const parsedBaseFare = Number(baseFare);
      const parsedPricePerKm = Number(pricePerKm);
      const parsedPricePerMin = Number(pricePerMin);
      const parsedIncludedKm = Number(includedKm);
      const result = await onSave({
        baseFare: Number.isFinite(parsedBaseFare) && parsedBaseFare >= 0 ? parsedBaseFare : 0,
        pricePerKm: Number.isFinite(parsedPricePerKm) && parsedPricePerKm > 0 ? parsedPricePerKm : 0.25,
        pricePerMin: Number.isFinite(parsedPricePerMin) && parsedPricePerMin >= 0 ? parsedPricePerMin : 0.05,
        includedKm: Number.isFinite(parsedIncludedKm) && parsedIncludedKm >= 0 ? parsedIncludedKm : 0,
        pricingMode: mode,
      });
      if (!result.saved) setError(t('pricePerKmModalError'));
    } catch {
      setError(t('pricePerKmModalError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) event.preventDefault();
    setError('');
    setShortDistancesError('');

    if (!setupMode) {
      setError(isArabic ? 'يرجى اختيار نمط التسعير أولاً' : 'Please select a pricing mode first');
      return;
    }

    if (setupMode === 'APP' || setupMode === 'TAXI') {
      await handleFixedModeSave(setupMode);
      return;
    }

    const parsedBaseFare = Number(baseFare);
    const parsedPricePerKm = Number(pricePerKm);
    const parsedPricePerMin = Number(pricePerMin);
    const parsedIncludedKm = Number(includedKm);

    if (!Number.isFinite(parsedBaseFare) || parsedBaseFare < 0) {
      setIsShortDistancesOpen(true);
      setShortDistancesError(isArabic ? 'يرجى إدخال قيمة صحيحة لفتحة العداد' : 'Please enter a valid base fare');
      return;
    }

    if (!Number.isFinite(parsedIncludedKm) || parsedIncludedKm < 0) {
      setIsShortDistancesOpen(true);
      setShortDistancesError(t('tariffModalIncludedKmInvalid'));
      return;
    }

    if (!Number.isFinite(parsedPricePerKm) || parsedPricePerKm <= 0) {
      setError(t('pricePerKmModalInvalid'));
      return;
    }

    if (!Number.isFinite(parsedPricePerMin) || parsedPricePerMin < 0) {
      setError(t('tariffModalPerMinInvalid'));
      return;
    }

    if (isSilver && marketAverage) {
      if (parsedPricePerKm > marketAverage.perKm || parsedPricePerMin > marketAverage.perMin) {
        setError(t('tariffSilverMaxError'));
        return;
      }
      if (!isSilverConfirmed && (parsedPricePerKm < marketAverage.perKm * 0.85 || parsedPricePerMin < marketAverage.perMin * 0.85)) {
        setIsSilverWarningModalOpen(true);
        return;
      }
    }

    await executeFreeSave(parsedBaseFare, parsedPricePerKm, parsedPricePerMin, parsedIncludedKm);
  };

  return {
    setupMode,
    setSetupMode,
    baseFare,
    setBaseFare,
    pricePerKm,
    setPricePerKm,
    pricePerMin,
    setPricePerMin,
    includedKm,
    setIncludedKm,
    numIncludedKm,
    numBaseFare,
    shortDistanceTotal,
    isSaving,
    error,
    setError,
    shortDistancesError,
    isShortDistancesOpen,
    setIsShortDistancesOpen,
    isSilverWarningModalOpen,
    setIsSilverWarningModalOpen,
    isSilverConfirmed,
    setIsSilverConfirmed,
    handleStepPricePerKm,
    handleStepPricePerMin,
    handleStepIncludedKm,
    handleStepBaseFare,
    executeFreeSave,
    handleSave,
  };
}
