'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import type { CaptainTariff, CaptainTariffSaveResult, MarketAverageTariff } from '../hooks/use-price-per-km-setup';
import type { CaptainMarketIndicator } from '../hooks/use-captain-market-indicator';
import { tariffModalStyles as styles } from './tariff/tariff-modal-styles';
import { useTariffModalState } from '../hooks/use-tariff-modal-state';
import { TariffModeSelector } from './tariff/tariff-mode-selector';
import { TariffShortDistancesSection } from './tariff/tariff-short-distances-section';
import { TariffComparisonGrid } from './tariff/tariff-comparison-grid';
import { TariffSilverWarningModal } from './tariff/tariff-silver-warning-modal';

export interface PricePerKmSetupModalProps {
  direction: string;
  currency?: string;
  minBaseFare: number;
  minBaseFareSource?: 'captain_average' | 'country_seed';
  marketAverage?: MarketAverageTariff | null;
  marketIndicator?: CaptainMarketIndicator | null;
  initialTariff?: {
    baseFare: number | null;
    pricePerKm: number | null;
    pricePerMin: number | null;
    includedKm?: number;
    pricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  };
  isCountryChange?: boolean;
  isActivationConfirm?: boolean;
  onClose?: () => void;
  onSave: (value: CaptainTariff) => Promise<CaptainTariffSaveResult>;
}

export function PricePerKmSetupModal({
  direction,
  currency,
  minBaseFare,
  marketAverage = null,
  marketIndicator = null,
  initialTariff,
  isCountryChange = false,
  isActivationConfirm = false,
  onClose,
  onSave,
}: PricePerKmSetupModalProps) {
  const t = useTranslations('captainDashboard');
  const { user } = useAuth();
  const rank = user?.rank || 'Bronze';
  const isGoldOrPlatinum = rank === 'Diamond' || rank === 'Gold' || rank === 'Platinum';
  const isSilver = rank === 'Silver';
  const isArabic = direction === 'rtl';

  const state = useTariffModalState({
    user,
    rank,
    isSilver,
    isArabic,
    marketAverage,
    initialTariff,
    onSave,
    t,
  });

  return (
    <AlertDialog open>
      <AlertDialogContent
        className={styles.content}
        dir={direction}
        onEscapeKeyDown={(event) => {
          if (onClose && !state.isSaving) {
            onClose();
          } else {
            event.preventDefault();
          }
        }}
      >
        <AlertDialogHeader className="relative shrink-0 pb-1">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              disabled={state.isSaving}
              aria-label={t('tariffModalClose')}
              title={t('tariffModalClose')}
              className={styles.closeButton}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">{t('tariffModalClose')}</span>
            </button>
          ) : null}
          <AlertDialogTitle className={cn(styles.title, onClose && 'pe-10')}>
            {isCountryChange
              ? t('pricePerKmModalCountryChangeTitle')
              : isActivationConfirm
                ? t('tariffModalConfirmTitle')
                : t('tariffModalTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className={styles.description}>
            {isCountryChange
              ? t('pricePerKmModalCountryChangeBody')
              : isActivationConfirm
                ? t('tariffModalConfirmBody')
                : t('tariffModalBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pl-1 scrollbar-thin">
          <TariffModeSelector
            isArabic={isArabic}
            setupMode={state.setupMode}
            setSetupMode={state.setSetupMode}
            setError={state.setError}
            marketIndicator={marketIndicator}
            t={t}
          />

          {state.setupMode === 'FREE' && (
            <div className={styles.fields}>
              <TariffShortDistancesSection
                isArabic={isArabic}
                currency={currency}
                minBaseFare={minBaseFare}
                marketAverage={marketAverage}
                isShortDistancesOpen={state.isShortDistancesOpen}
                setIsShortDistancesOpen={state.setIsShortDistancesOpen}
                shortDistanceTotal={state.shortDistanceTotal}
                shortDistancesError={state.shortDistancesError}
                includedKm={state.includedKm}
                setIncludedKm={state.setIncludedKm}
                handleStepIncludedKm={state.handleStepIncludedKm}
                baseFare={state.baseFare}
                setBaseFare={state.setBaseFare}
                handleStepBaseFare={state.handleStepBaseFare}
                isSaving={state.isSaving}
                t={t}
              />

              <TariffComparisonGrid
                isGoldOrPlatinum={isGoldOrPlatinum}
                isSilver={isSilver}
                isArabic={isArabic}
                marketAverage={marketAverage}
                initialTariff={initialTariff}
                baseFare={state.baseFare}
                pricePerKm={state.pricePerKm}
                setPricePerKm={state.setPricePerKm}
                pricePerMin={state.pricePerMin}
                setPricePerMin={state.setPricePerMin}
                handleStepPricePerKm={state.handleStepPricePerKm}
                handleStepPricePerMin={state.handleStepPricePerMin}
                setIsSilverConfirmed={state.setIsSilverConfirmed}
                isSaving={state.isSaving}
                t={t}
              />
            </div>
          )}

          {state.error ? <p className={styles.error}>{state.error}</p> : null}
        </div>

        <AlertDialogFooter className="shrink-0 pt-3 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              disabled={state.isSaving}
              className={styles.backButton}
            >
              {isArabic ? (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span>{t('tariffModalBack')}</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('tariffModalBack')}</span>
                </>
              )}
            </button>
          ) : null}
          <AlertDialogAction
            disabled={state.isSaving}
            onClick={state.handleSave}
            className={cn(styles.confirm, onClose ? 'sm:flex-1' : 'w-full')}
          >
            {state.isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#06111f]" />
            ) : (
              <span>{isArabic ? 'تأكيد وبدء العمل' : t('tariffModalConfirmAction')}</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>

        <TariffSilverWarningModal
          isOpen={state.isSilverWarningModalOpen}
          direction={direction}
          isSaving={state.isSaving}
          onCancel={() => state.setIsSilverWarningModalOpen(false)}
          onConfirm={async () => {
            state.setIsSilverWarningModalOpen(false);
            state.setIsSilverConfirmed(true);
            await state.executeFreeSave(
              Number(state.baseFare),
              Number(state.pricePerKm),
              Number(state.pricePerMin),
              Number(state.includedKm)
            );
          }}
          t={t}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

export * from './tariff/tariff-modal-styles';
export * from './tariff/tariff-helpers';
export * from './tariff/tariff-mode-selector';
export * from './tariff/tariff-short-distances-section';
export * from './tariff/tariff-comparison-grid';
export * from './tariff/tariff-silver-warning-modal';
