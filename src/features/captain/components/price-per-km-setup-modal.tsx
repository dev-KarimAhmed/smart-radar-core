'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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

const styles = {
  content: 'border-emerald-500/25 bg-[#0B0F19] text-white shadow-2xl max-h-[85vh] overflow-y-auto',
  title: 'text-xl font-black text-white',
  description: 'text-sm leading-6 text-[#94A3B8] text-start',
  marketIndicatorWrap: 'mt-3',
  fields: 'mt-3 space-y-4',
  field: 'space-y-1.5',
  fieldLabel: 'block text-sm font-black text-white text-start',
  fieldHint: 'block text-xs leading-5 text-[#64748B] text-start',
  marketAverageLine: 'block text-sm font-black text-emerald-300 text-start',
  inputRow: 'flex items-stretch gap-2',
  input: 'w-full rounded-2xl border border-slate-800 bg-black/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400',
  currencyBadge: 'flex shrink-0 items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-sm font-black text-emerald-300',
  error: 'text-sm font-bold text-rose-400 text-start',
  footer: 'sm:justify-start',
  confirm: 'w-full bg-[#14B8A6] font-black text-[#06111f] hover:bg-[#14B8A6]/90 disabled:opacity-60',
  // A distinct bordered/tinted card of its own — kept visually separate from the per-km and
  // per-min fields below rather than reading as one continuous block of four fields.
  shortDistancesSection: 'rounded-2xl border border-emerald-500/25 bg-emerald-500/5',
  shortDistancesToggle: 'flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/10',
  shortDistancesToggleIcon: 'h-4 w-4 shrink-0 transition-transform duration-200',
  shortDistancesToggleIconOpen: 'rotate-180',
  shortDistancesFields: 'space-y-4 border-t border-emerald-500/15 p-4',
  shortDistancesError: 'text-sm font-bold text-rose-400 text-start',
  modeSelector: 'mt-3 mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-black/50 p-1.5 shadow-inner',
  modeButton: 'flex flex-col items-center justify-center rounded-xl py-2.5 px-3 text-center transition cursor-pointer',
  modeButtonActive: 'bg-[#14B8A6] text-[#06111f] shadow-lg shadow-[#14B8A6]/20 font-black',
  modeButtonInactive: 'text-slate-400 hover:bg-white/5 hover:text-white font-bold',
  modeButtonTitle: 'text-xs font-black sm:text-sm',
  modeButtonSubtitle: 'mt-0.5 text-[10px] leading-tight opacity-80',
  appNoticeCard: 'my-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-200 shadow-xl',
  appNoticeTitle: 'font-black text-base text-blue-300 mb-2 flex items-center gap-2',
  appNoticeBody: 'leading-relaxed text-xs sm:text-sm text-slate-300',
  goldRankNotice: 'mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-black text-amber-300 text-center leading-relaxed',
  comparisonGrid: 'grid grid-cols-3 gap-2 sm:gap-3 mb-4',
  comparisonCard: 'flex flex-col justify-between rounded-2xl border border-slate-800 bg-black/40 p-2 sm:p-3 text-center',
  comparisonCardAccent: 'flex flex-col justify-between rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/5 p-2 sm:p-3 text-center',
  comparisonCardHeader: 'text-[11px] sm:text-xs font-black text-slate-400 mb-2 pb-1.5 border-b border-white/5 whitespace-nowrap',
  comparisonCardHeaderAccent: 'text-[11px] sm:text-xs font-black text-[#14F5D5] mb-2 pb-1.5 border-b border-[#14B8A6]/20 whitespace-nowrap',
  comparisonCardRows: 'space-y-2 text-xs font-black text-white',
  comparisonCardRow: 'flex justify-between items-center gap-1 text-xs',
  comparisonCardLabel: 'text-[10px] sm:text-[11px] text-slate-400 whitespace-nowrap',
  comparisonCardValue: 'font-mono text-xs sm:text-sm font-black text-white',
  comparisonInputWrap: 'w-14 sm:w-16 shrink-0',
  miniInput: 'w-full rounded-lg border border-slate-700 bg-black/80 px-1 py-1 text-center font-mono text-xs font-bold text-white outline-none transition focus:border-emerald-400',
  silverWarningLine: 'mb-3 text-xs font-bold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-start',
  silverModalContent: 'border-rose-500/40 bg-[#0B0F19] text-white shadow-2xl max-w-md',
  silverModalTitle: 'text-lg font-black text-rose-300 text-start',
  silverModalDescription: 'text-xs leading-relaxed text-slate-300 text-start',
  silverModalFooter: 'mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end',
  silverModalCancel: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-bold',
  silverModalConfirm: 'bg-rose-600 hover:bg-rose-500 text-white text-xs font-black',
} as const;

interface PricePerKmSetupModalProps {
  direction: string;
  currency?: string;
  /** Lowest meter-opening charge this captain may set. */
  minBaseFare: number;
  /**
   * Where that floor came from. Named explicitly because "your country's approved minimum"
   * was being shown for a number actually derived from the captains' own prices — captains
   * read it as an official figure and asked support where it came from.
   */
  minBaseFareSource?: 'captain_average' | 'country_seed';
  /** Per-field market average, shown clearly under every input, not just the base fare. */
  marketAverage?: MarketAverageTariff | null;
  /** How crowded the local market is right now — rendered as a banner above the fields. */
  marketIndicator?: CaptainMarketIndicator | null;
  initialTariff?: { baseFare: number | null; pricePerKm: number | null; pricePerMin: number | null; includedKm?: number; pricingMode?: 'FREE' | 'APP' | null };
  isCountryChange?: boolean;
  /** The tariff is already set and this is the per-activation confirmation. */
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
  const isIndependent = user?.subRole === 'independent';
  const [setupMode, setSetupMode] = React.useState<'FREE' | 'APP' | null>(
    initialTariff?.pricingMode ?? (isIndependent ? 'FREE' : null)
  );

  React.useEffect(() => {
    if (initialTariff?.pricingMode) {
      setSetupMode(initialTariff.pricingMode);
    }
  }, [initialTariff?.pricingMode]);

  const [baseFare, setBaseFare] = React.useState(toInputValue(initialTariff?.baseFare));
  const [pricePerKm, setPricePerKm] = React.useState(toInputValue(initialTariff?.pricePerKm));
  const [pricePerMin, setPricePerMin] = React.useState(toInputValue(initialTariff?.pricePerMin));
  const [includedKm, setIncludedKm] = React.useState(toInputValue(initialTariff?.includedKm ?? 0));
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [shortDistancesError, setShortDistancesError] = React.useState('');
  const [isShortDistancesOpen, setIsShortDistancesOpen] = React.useState(false);
  const [isSilverWarningModalOpen, setIsSilverWarningModalOpen] = React.useState(false);
  const [isSilverConfirmed, setIsSilverConfirmed] = React.useState(false);

  const executeFreeSave = async (
    parsedBaseFare: number,
    parsedPricePerKm: number,
    parsedPricePerMin: number,
    parsedIncludedKm: number,
  ) => {
    setIsSaving(true);
    const result = await onSave({
      baseFare: parsedBaseFare,
      pricePerKm: parsedPricePerKm,
      pricePerMin: parsedPricePerMin,
      includedKm: parsedIncludedKm,
      pricingMode: 'FREE',
    });
    setIsSaving(false);
    if (!result.saved && result.reason === 'base_fare_below_market_minimum') {
      setIsShortDistancesOpen(true);
      setShortDistancesError(t('tariffModalBaseFareTooLow', { min: result.minBaseFare.toFixed(2) }));
    } else if (!result.saved) {
      setError(t('pricePerKmModalError'));
    }
  };

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setError('');
    setShortDistancesError('');

    if (!isIndependent && !setupMode) {
      setError(isArabic ? 'يرجى اختيار طريقة التسعير أولاً' : 'Please select a pricing mode first');
      return;
    }

    const parsedBaseFare = Number(baseFare);
    const parsedPricePerKm = Number(pricePerKm);
    const parsedPricePerMin = Number(pricePerMin);
    const parsedIncludedKm = Number(includedKm);

    if (setupMode === 'APP') {
      setIsSaving(true);
      const result = await onSave({
        baseFare: Number.isFinite(parsedBaseFare) && parsedBaseFare >= minBaseFare ? parsedBaseFare : minBaseFare,
        pricePerKm: Number.isFinite(parsedPricePerKm) && parsedPricePerKm > 0 ? parsedPricePerKm : 0.25,
        pricePerMin: Number.isFinite(parsedPricePerMin) && parsedPricePerMin >= 0 ? parsedPricePerMin : 0.05,
        includedKm: Number.isFinite(parsedIncludedKm) && parsedIncludedKm >= 0 ? parsedIncludedKm : 0,
        pricingMode: 'APP',
      });
      setIsSaving(false);
      if (!result.saved) {
        setError(t('pricePerKmModalError'));
      }
      return;
    }

    if (!Number.isFinite(parsedBaseFare) || parsedBaseFare < minBaseFare) {
      setIsShortDistancesOpen(true);
      setShortDistancesError(t('tariffModalBaseFareTooLow', { min: minBaseFare.toFixed(2) }));
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

    setIsSaving(true);
    const result = await onSave({
      baseFare: parsedBaseFare,
      pricePerKm: parsedPricePerKm,
      pricePerMin: parsedPricePerMin,
      includedKm: parsedIncludedKm,
      pricingMode: 'FREE',
    });
    setIsSaving(false);
    if (!result.saved && result.reason === 'base_fare_below_market_minimum') {
      setIsShortDistancesOpen(true);
      setShortDistancesError(t('tariffModalBaseFareTooLow', { min: result.minBaseFare.toFixed(2) }));
    } else if (!result.saved) {
      setError(t('pricePerKmModalError'));
    }
    await executeFreeSave(parsedBaseFare, parsedPricePerKm, parsedPricePerMin, parsedIncludedKm);
  };

  return (
    <AlertDialog open>
      <AlertDialogContent
        className={styles.content}
        dir={direction}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.title}>
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

        {marketIndicator ? (
          <div className={styles.marketIndicatorWrap}>
            <MarketStatusIndicator indicator={marketIndicator} size="full" />
          </div>
        ) : null}

        {/* Pricing Setup Mode Selector Tabs (Hidden for independent captains) */}
        {!isIndependent && (
          <div className={styles.modeSelector}>
            <button
              type="button"
              onClick={() => {
                setSetupMode('FREE');
                setError('');
              }}
              className={cn(
                styles.modeButton,
                setupMode === 'FREE' ? styles.modeButtonActive : styles.modeButtonInactive
              )}
            >
              <span className={styles.modeButtonTitle}>
                {isArabic ? tAuto('key_8993e183') : 'Free Pricing'}
              </span>
              <span className={styles.modeButtonSubtitle}>
                {t('tariffFreePriceSubtitle')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupMode('APP');
                setError('');
              }}
              className={cn(
                styles.modeButton,
                setupMode === 'APP' ? styles.modeButtonActive : styles.modeButtonInactive
              )}
            >
              <span className={styles.modeButtonTitle}>
                {isArabic ? tAuto('key_02958076') : 'App Pricing'}
              </span>
              <span className={styles.modeButtonSubtitle}>
                {t('tariffAppPriceSubtitle')}
              </span>
            </button>
          </div>
        )}

        {setupMode === 'APP' && (
          <div className={styles.appNoticeCard}>
            <p className={styles.appNoticeTitle}>
              <span>📱</span>
              <span>{isArabic ? tAuto('key_b2d7fc61') : 'Official Operator Tariff Commitment'}</span>
            </p>
            <p className={styles.appNoticeBody}>
              {isArabic
                ? tAuto('key_94359bb8')
                : 'You are operating under your licensed operator tariff (Yellow Taxi, Uber, Careem, etc.). Riders will see that you operate via your registered operator.'}
            </p>
          </div>
        )}

        {/* Bottom Tariff Fields: Hidden until "FREE" mode is selected (or automatically shown for independent captains) */}
        {(setupMode === 'FREE' || isIndependent) && (
          <div className={styles.fields}>
          <div className={styles.shortDistancesSection}>
            <button
              type="button"
              onClick={() => setIsShortDistancesOpen((current) => !current)}
              className={styles.shortDistancesToggle}
              aria-expanded={isShortDistancesOpen}
            >
              {t('tariffModalShortDistancesToggle')}
              <ChevronDown className={cn(styles.shortDistancesToggleIcon, isShortDistancesOpen ? styles.shortDistancesToggleIconOpen : '')} />
            </button>

            {isShortDistancesOpen ? (
            <div className={styles.shortDistancesFields}>
              {shortDistancesError ? <p className={styles.shortDistancesError}>{shortDistancesError}</p> : null}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{t('tariffModalBaseFareLabel')}</label>
                <span className={styles.marketAverageLine}>
                  {t('tariffModalMarketFloor', { min: minBaseFare.toFixed(2), currency: currency || '' })}
                </span>
                <span className={styles.fieldHint}>{t('tariffModalBaseFareHint')}</span>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={minBaseFare}
                    step="0.01"
                    value={baseFare}
                    onChange={(event) => setBaseFare(event.target.value)}
                    placeholder={minBaseFare.toFixed(2)}
                    disabled={isSaving}
                    className={styles.input}
                    autoFocus
                  />
                  {currency ? <span className={styles.currencyBadge}>{currency}</span> : null}
                </div>
              </div>

              {/* Sits directly under the opening charge because it qualifies it: this is the
                  distance that charge already covers. */}
              <div className={styles.field}>
                <label className={styles.fieldLabel}>{t('tariffModalIncludedKmLabel')}</label>
                {marketAverage ? (
                  <span className={styles.marketAverageLine}>
                    {t('tariffModalMarketAverageKm', { avg: marketAverage.includedKm.toFixed(1) })}
                  </span>
                ) : null}
                <span className={styles.fieldHint}>{t('tariffModalIncludedKmHint')}</span>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={includedKm}
                    onChange={(event) => setIncludedKm(event.target.value)}
                    placeholder="0"
                    disabled={isSaving}
                    className={styles.input}
                  />
                  <span className={styles.currencyBadge}>{t('tariffModalKmUnit')}</span>
                </div>
              </div>
            </div>
            ) : null}
          </div>

          {isGoldOrPlatinum ? (
            <div className={styles.goldRankNotice}>
              {t('tariffGoldBonusNotice')}
            </div>
          ) : null}

          {isSilver && marketAverage && (Number(pricePerKm) < marketAverage.perKm * 0.85 || Number(pricePerMin) < marketAverage.perMin * 0.85) ? (
            <div className={styles.silverWarningLine}>
              {t('tariffSilverReduceWarning')}
            </div>
          ) : null}

          {/* 3 Horizontal Columns: Market Average, Current Price, Update Price */}
          <div className={styles.comparisonGrid}>
            {/* Column 1: Market Average */}
            <div className={styles.comparisonCard}>
              <h4 className={styles.comparisonCardHeader}>{t('tariffMarketAverage')}</h4>
              <div className={styles.comparisonCardRows}>
                <div className={styles.comparisonCardRow}>
                  <span className={styles.comparisonCardLabel}>{t('tariffPerKmShort')}</span>
                  <span className={styles.comparisonCardValue}>{marketAverage?.perKm?.toFixed(2) || '0.00'}</span>
                </div>
                <div className={styles.comparisonCardRow}>
                  <span className={styles.comparisonCardLabel}>{t('tariffPerMinShort')}</span>
                  <span className={styles.comparisonCardValue}>{marketAverage?.perMin?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Current Price */}
            <div className={styles.comparisonCard}>
              <h4 className={styles.comparisonCardHeader}>{t('tariffCurrentPrice')}</h4>
              <div className={styles.comparisonCardRows}>
                <div className={styles.comparisonCardRow}>
                  <span className={styles.comparisonCardLabel}>{t('tariffPerKmShort')}</span>
                  <span className={styles.comparisonCardValue}>{initialTariff?.pricePerKm?.toFixed(2) || '0.00'}</span>
                </div>
                <div className={styles.comparisonCardRow}>
                  <span className={styles.comparisonCardLabel}>{t('tariffPerMinShort')}</span>
                  <span className={styles.comparisonCardValue}>{initialTariff?.pricePerMin?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Column 3: Update Price */}
            <div className={styles.comparisonCardAccent}>
              <h4 className={styles.comparisonCardHeaderAccent}>{t('tariffUpdatePrice')}</h4>
              <div className={styles.comparisonCardRows}>
                <div className={styles.comparisonCardRow}>
                  <span className={styles.comparisonCardLabel}>{t('tariffPerKmShort')}</span>
                  <div className={styles.comparisonInputWrap}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={pricePerKm}
                      onChange={(event) => {
                        setPricePerKm(event.target.value);
                        setIsSilverConfirmed(false);
                      }}
                      placeholder={marketAverage?.perKm?.toFixed(2) || '0.00'}
                      disabled={isSaving}
                      className={styles.miniInput}
                    />
                  </div>
                </div>
                <div className={styles.comparisonCardRow}>
                  <span className={styles.comparisonCardLabel}>{t('tariffPerMinShort')}</span>
                  <div className={styles.comparisonInputWrap}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={pricePerMin}
                      onChange={(event) => {
                        setPricePerMin(event.target.value);
                        setIsSilverConfirmed(false);
                      }}
                      placeholder="0.00"
                      disabled={isSaving}
                      className={styles.miniInput}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
         </div>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}

        <AlertDialogFooter className={styles.footer}>
          {onClose ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
            >
              {isArabic ? tAuto('key_b9568e86') : 'Cancel'}
            </button>
          ) : null}
          <AlertDialogAction disabled={isSaving} onClick={handleSave} className={styles.confirm}>
            {isSaving
              ? t('pricePerKmModalSaving')
              : isActivationConfirm
                ? t('tariffModalConfirmAction')
                : t('pricePerKmModalSave')}
          </AlertDialogAction>
        </AlertDialogFooter>

        {/* Silver Rank Discount Confirmation Dialog */}
        {isSilverWarningModalOpen && (
          <AlertDialog open>
            <AlertDialogContent className={styles.silverModalContent} dir={direction}>
              <AlertDialogHeader>
                <AlertDialogTitle className={styles.silverModalTitle}>
                  {t('tariffSilverModalTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription className={styles.silverModalDescription}>
                  {t('tariffSilverModalBody')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={styles.silverModalFooter}>
                <AlertDialogCancel
                  onClick={() => setIsSilverWarningModalOpen(false)}
                  className={styles.silverModalCancel}
                >
                  {t('tariffSilverModalCancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setIsSilverWarningModalOpen(false);
                    setIsSilverConfirmed(true);
                    await executeFreeSave(
                      Number(baseFare),
                      Number(pricePerKm),
                      Number(pricePerMin),
                      Number(includedKm),
                    );
                  }}
                  className={styles.silverModalConfirm}
                >
                  {t('tariffSilverModalConfirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
