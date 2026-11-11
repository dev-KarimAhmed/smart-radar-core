'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
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
import { MarketStatusIndicator } from './market-status-indicator';
import { styles } from './tariff/tariff-modal-styles';
import { SilverRankWarningModal } from './tariff/silver-rank-warning-modal';
import { ShortDistancesSection } from './tariff/short-distances-section';
import { FreePricingComparisonGrid } from './tariff/free-pricing-comparison-grid';
import { PricingModeSelector } from './tariff/pricing-mode-selector';
import { PricingModeNoticeCards } from './tariff/pricing-mode-notice-cards';

export interface PricePerKmSetupModalProps {
  direction: string;
  currency?: string;
  minBaseFare: number;
  minBaseFareSource?: 'captain_average' | 'country_seed';
  marketAverage?: MarketAverageTariff | null;
  marketIndicator?: CaptainMarketIndicator | null;
  initialTariff?: { baseFare: number | null; pricePerKm: number | null; pricePerMin: number | null; includedKm?: number; pricingMode?: 'FREE' | 'APP' | 'TAXI' | null };
  isCountryChange?: boolean;
  isActivationConfirm?: boolean;
  onClose?: () => void;
  onSave: (value: CaptainTariff) => Promise<CaptainTariffSaveResult>;
}

function toInputValue(value: number | null | undefined) {
  return value != null ? String(value) : '';
}

export function PricePerKmSetupModal({
  direction,
  currency,
  minBaseFare,
  minBaseFareSource = 'country_seed',
  marketAverage = null,
  marketIndicator = null,
  initialTariff,
  isCountryChange = false,
  isActivationConfirm = false,
  onClose,
  onSave,
}: PricePerKmSetupModalProps) {
  const tAuto = useTranslations('auto');
  const t = useTranslations('captainDashboard');
  const { user } = useAuth();
  const rank = user?.rank || 'Bronze';
  const isGoldOrPlatinum = rank === 'Gold' || rank === 'Platinum';
  const isSilver = rank === 'Silver';
  const isArabic = direction === 'rtl';

  const defaultModeFromAccount = React.useMemo<'FREE' | 'APP' | 'TAXI'>(() => {
    const rawAffiliationType = (user?.affiliation?.type || '').toLowerCase();
    const rawAffiliationName = (user?.affiliation?.name || '').toLowerCase();
    const vehicleType = String((user?.vehicle as any)?.type || (user?.vehicle as any)?.category || '').toUpperCase();

    const isIndependent = user?.subRole === 'independent'
      || rawAffiliationType === 'independent'
      || rawAffiliationName === 'independent'
      || vehicleType === 'INDEPENDENT'
      || vehicleType === 'FREE';
    if (isIndependent) return 'FREE';

    const isOfficeTaxi = rawAffiliationType === 'office-taxi'
      || rawAffiliationType === 'yellow-taxi'
      || rawAffiliationType === 'taxi'
      || rawAffiliationName === 'yellow-taxi'
      || vehicleType === 'TAXI';
    if (isOfficeTaxi) return 'TAXI';

    const isSmartApp = rawAffiliationType === 'smart-app'
      || rawAffiliationType === 'app'
      || rawAffiliationName === 'smart-app'
      || vehicleType === 'APP';
    if (isSmartApp) return 'APP';

    if (initialTariff?.pricingMode) {
      return initialTariff.pricingMode;
    }

    return 'FREE';
  }, [user, initialTariff?.pricingMode]);

  const [setupMode, setSetupMode] = React.useState<'FREE' | 'APP' | 'TAXI'>(
    initialTariff?.pricingMode || defaultModeFromAccount
  );

  React.useEffect(() => {
    setSetupMode(initialTariff?.pricingMode || defaultModeFromAccount);
  }, [defaultModeFromAccount, initialTariff?.pricingMode]);

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

  const currencyLabel = currency || t('jod');

  const handleStepPricePerKm = (delta: number) => {
    const current = parseFloat(pricePerKm) || 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setPricePerKm(String(next));
    setError('');
  };

  const handleStepPricePerMin = (delta: number) => {
    const current = parseFloat(pricePerMin) || 0;
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setPricePerMin(String(next));
    setError('');
  };

  const handleStepIncludedKm = (delta: number) => {
    const current = parseFloat(includedKm) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setIncludedKm(String(next));
    setShortDistancesError('');
  };

  const handleStepBaseFare = (delta: number) => {
    const current = parseFloat(baseFare) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setBaseFare(String(next));
    setShortDistancesError('');
  };

  const executeFreeSave = async (
    parsedBaseFare: number,
    parsedPricePerKm: number,
    parsedPricePerMin: number,
    parsedIncludedKm: number,
  ) => {
    setIsSaving(true);
    setError('');
    const result = await onSave({
      pricingMode: 'FREE',
      baseFare: parsedBaseFare,
      pricePerKm: parsedPricePerKm,
      pricePerMin: parsedPricePerMin,
      includedKm: parsedIncludedKm,
    });
    setIsSaving(false);
    if (!result.success && result.error) {
      if (result.error.field === 'baseFare') {
        setShortDistancesError(result.error.message);
      } else {
        setError(result.error.message);
      }
    } else if (result.success && onClose) {
      onClose();
    }
  };

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (setupMode === 'APP') {
      setIsSaving(true);
      setError('');
      const result = await onSave({
        pricingMode: 'APP',
        baseFare: 0.50,
        pricePerKm: 0.40,
        pricePerMin: 0.05,
        includedKm: 0,
      });
      setIsSaving(false);
      if (result.success && onClose) {
        onClose();
      } else if (!result.success && result.error) {
        setError(result.error.message);
      }
      return;
    }

    if (setupMode === 'TAXI') {
      setIsSaving(true);
      setError('');
      const result = await onSave({
        pricingMode: 'TAXI',
        baseFare: 0.35,
        pricePerKm: 0.25,
        pricePerMin: 0.03,
        includedKm: 0,
      });
      setIsSaving(false);
      if (result.success && onClose) {
        onClose();
      } else if (!result.success && result.error) {
        setError(result.error.message);
      }
      return;
    }

    const parsedBaseFare = Number(baseFare);
    const parsedPricePerKm = Number(pricePerKm);
    const parsedPricePerMin = Number(pricePerMin);
    const parsedIncludedKm = Number(includedKm);

    if (baseFare === '' || Number.isNaN(parsedBaseFare)) {
      setShortDistancesError(t('invalidBaseFare'));
      return;
    }
    if (pricePerKm === '' || Number.isNaN(parsedPricePerKm)) {
      setError(t('invalidPricePerKm'));
      return;
    }
    if (pricePerMin === '' || Number.isNaN(parsedPricePerMin)) {
      setError(t('invalidPricePerMin'));
      return;
    }
    if (parsedPricePerKm <= 0) {
      setError(t('pricePerKmGreaterThanZero'));
      return;
    }
    if (parsedPricePerMin < 0) {
      setError(t('pricePerMinNotNegative'));
      return;
    }
    if (parsedBaseFare < minBaseFare) {
      setShortDistancesError(
        t('baseFareBelowMinimum', {
          min: minBaseFare.toFixed(2),
          currency: currencyLabel,
        }),
      );
      return;
    }

    const avgKm = marketAverage?.pricePerKm ?? 0.35;
    const avgMin = marketAverage?.pricePerMin ?? 0.04;
    const isAboveMarket = parsedPricePerKm > avgKm || parsedPricePerMin > avgMin;

    if (isSilver && isAboveMarket && !isSilverConfirmed) {
      setIsSilverWarningModalOpen(true);
      return;
    }

    await executeFreeSave(parsedBaseFare, parsedPricePerKm, parsedPricePerMin, parsedIncludedKm);
  };

  return (
    <>
      <AlertDialog open>
        <AlertDialogContent
          className={styles.content}
          dir={direction}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label={t('closePriceSetup')}
              className={styles.closeButton}
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <AlertDialogHeader className="relative shrink-0 pb-2 min-w-0">
            <AlertDialogTitle className={cn(styles.title, onClose && 'pe-10')}>
              {isActivationConfirm
                ? t('confirmPricingBeforeActivation')
                : isCountryChange
                ? t('updatePricingForNewCountry')
                : t('setupYourPricing')}
            </AlertDialogTitle>
            <AlertDialogDescription className={styles.description}>
              {isActivationConfirm
                ? t('reviewOrAdjustPricing')
                : isCountryChange
                ? t('countryChangeNotice')
                : t('fullFreedomPricing')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 sm:space-y-3 pe-1 scrollbar-thin">
            {/* Banner: Battery warning for dynamic pricing */}
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-red-500/15 p-2.5 sm:p-3 text-start shadow-lg">
              <div className="flex items-center gap-2 font-black text-amber-300 text-xs sm:text-sm mb-0.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  {isArabic
<<<<<<< Updated upstream
                    ? 'تنبيه: استهلاك البطارية أثناء نشاط المراقبة'
                    : 'Battery consumption notice during monitoring activity'}
=======
                    ? 'تنبيه: استهلاك أعلى للبطارية أثناء التفعيل'
                    : 'Notice: Higher battery usage while online'}
>>>>>>> Stashed changes
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-bold">
                {isArabic
                  ? 'التتبع اللحظي للموقع أثناء بقائك متصلاً في الرادار يستهلك طاقة البطارية بمعدل أكبر.'
                  : 'Real-time location tracking consumes more battery power while your radar is active.'}
              </p>
            </div>

            {/* 3-Mode Selector */}
            <div className="text-center">
              <span className="block text-xs sm:text-sm font-black text-slate-300 mb-1.5">
                {isArabic ? 'اختر وسيلة نشاطك وقدم عرضك' : 'Choose activity mode and submit your offer'}
              </span>
              <PricingModeSelector
                setupMode={setupMode}
                isArabic={isArabic}
                onSelectMode={(mode) => {
                  setSetupMode(mode);
                  setError('');
                }}
              />
            </div>

            {/* Market Indicator */}
            <div className={styles.marketIndicatorWrap}>
              <MarketStatusIndicator indicator={marketIndicator} isArabic={isArabic} />
            </div>

            {/* APP / TAXI Notice Cards */}
            <PricingModeNoticeCards setupMode={setupMode} isArabic={isArabic} />

            {/* FREE Mode Fields */}
            {setupMode === 'FREE' && (
              <div className={styles.fields}>
                <ShortDistancesSection
                  isOpen={isShortDistancesOpen}
                  onToggle={() => setIsShortDistancesOpen((prev) => !prev)}
                  shortDistanceTotal={shortDistanceTotal}
                  currencyLabel={currencyLabel}
                  isArabic={isArabic}
                  baseFare={baseFare}
                  onBaseFareChange={(e) => {
                    setBaseFare(e.target.value);
                    setShortDistancesError('');
                  }}
                  onStepBaseFare={handleStepBaseFare}
                  includedKm={includedKm}
                  onIncludedKmChange={(e) => {
                    setIncludedKm(e.target.value);
                    setShortDistancesError('');
                  }}
                  onStepIncludedKm={handleStepIncludedKm}
                  error={shortDistancesError}
                />

                {isGoldOrPlatinum && (
                  <div className={styles.goldRankNotice}>
                    {isArabic
                      ? 'بصفتك كابتن برتبة مميزة (Gold / Platinum)، يمكنك تحديد أي سعر يناسبك وسيظهر عرضك في صدارة قائمة الركاب دائماً.'
                      : 'As a premium rank captain (Gold / Platinum), your offers are prioritized for riders regardless of price.'}
                  </div>
                )}

                {isSilver && (
                  <div className={styles.silverWarningLine}>
                    {isArabic
                      ? 'رتبتك حالياً (Silver): التسعير فوق متوسط السوق قد يؤخر قبول عروضك. حافظ على أسعار منافسة لرفع رتبتك.'
                      : 'Silver rank: pricing above market average may delay offer acceptance.'}
                  </div>
                )}

                {/* Comparison Grid */}
                <FreePricingComparisonGrid
                  isArabic={isArabic}
                  marketAverage={marketAverage}
                  pricePerKm={pricePerKm}
                  onPricePerKmChange={(e) => {
                    setPricePerKm(e.target.value);
                    setError('');
                  }}
                  onStepPricePerKm={handleStepPricePerKm}
                  pricePerMin={pricePerMin}
                  onPricePerMinChange={(e) => {
                    setPricePerMin(e.target.value);
                    setError('');
                  }}
                  onStepPricePerMin={handleStepPricePerMin}
                />

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-slate-400 space-y-1 text-start">
                  <p className="font-bold text-slate-300">
                    {isArabic ? 'كيف يتم احتساب الأجرة؟' : 'How is the fare calculated?'}
                  </p>
                  <p>
                    {isArabic
                      ? 'الأجرة = سعر فتح العداد + (المسافة الفعلية × سعر الكيلومتر) + (وقت الرحلة المقدر × سعر الدقيقة)'
                      : 'Fare = Base Fare + (Distance × Price/km) + (Duration × Price/min)'}
                  </p>
                </div>

                {error && <p className={styles.error}>{error}</p>}
              </div>
            )}
          </div>

          <AlertDialogFooter className={styles.footer}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className={styles.backButton}
              >
                {isArabic ? (
                  <>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                    <span>{t('backToRadar')}</span>
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span>{t('backToRadar')}</span>
                  </>
                )}
              </button>
            )}
            <AlertDialogAction
              onClick={handleSave}
              disabled={isSaving}
              className={styles.confirm}
            >
              {isSaving ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin shrink-0" />
                  <span>{t('saving')}</span>
                </>
              ) : isActivationConfirm ? (
                t('confirmAndActivate')
              ) : (
                t('saveTariff')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Silver Rank Alert Dialog */}
      <SilverRankWarningModal
        isOpen={isSilverWarningModalOpen}
        direction={direction}
        isArabic={isArabic}
        onCancel={() => setIsSilverWarningModalOpen(false)}
        onConfirm={async () => {
          setIsSilverWarningModalOpen(false);
          setIsSilverConfirmed(true);
          const parsedBaseFare = Number(baseFare);
          const parsedPricePerKm = Number(pricePerKm);
          const parsedPricePerMin = Number(pricePerMin);
          const parsedIncludedKm = Number(includedKm);
          await executeFreeSave(parsedBaseFare, parsedPricePerKm, parsedPricePerMin, parsedIncludedKm);
        }}
      />
    </>
  );
}
