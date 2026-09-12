'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
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
  onSave,
}: PricePerKmSetupModalProps) {
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
          <div className="mt-3 mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-black/50 p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setSetupMode('FREE');
                setError('');
              }}
              className={cn(
                'rounded-xl py-3 px-3 text-xs font-black transition sm:text-sm',
                setupMode === 'FREE'
                  ? 'bg-[#14B8A6] text-[#06111f] shadow-lg shadow-[#14B8A6]/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              {isArabic ? 'أسعار حرة' : 'Free Pricing'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupMode('APP');
                setError('');
              }}
              className={cn(
                'rounded-xl py-3 px-3 text-xs font-black transition sm:text-sm',
                setupMode === 'APP'
                  ? 'bg-[#14B8A6] text-[#06111f] shadow-lg shadow-[#14B8A6]/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              {isArabic ? 'أسعار التطبيق' : 'App Pricing'}
            </button>
          </div>
        )}

        {setupMode === 'APP' && (
          <div className="my-4 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-200 shadow-xl">
            <p className="font-black text-base text-blue-300 mb-2 flex items-center gap-2">
              <span>📱</span>
              <span>{isArabic ? 'الالتزام بتسعيرة الشركة المشغلة' : 'Official Operator Tariff Commitment'}</span>
            </p>
            <p className="leading-relaxed text-xs sm:text-sm text-slate-300">
              {isArabic
                ? 'أنت تعمل الآن ضمن سعر الشركة المشغلة لك وترخيص المزاولة (تكسي أصفر، أوبر، كريم... إلخ). ويظهر للراكب أن هذا السائق يعمل من خلال الشركة المشغلة له.'
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
          <div className="mb-4 rounded-xl border border-slate-800 bg-black/40 p-3">
             <h4 className="text-sm font-bold text-slate-400 mb-2">{t('tariffCurrentPrice')}</h4>
             <div className="flex justify-between items-center gap-4 text-sm font-black text-white px-2">
               <span>{t('tariffPerKmShort')} : {initialTariff?.pricePerKm?.toFixed(2) || '0.00'} {currency}</span>
               <span>{t('tariffPerMinShort')} : {initialTariff?.pricePerMin?.toFixed(2) || '0.00'} {currency}</span>
             </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-800 bg-black/40 p-3">
             <h4 className="text-sm font-bold text-slate-400 mb-2">{t('tariffMarketAverage')}</h4>
             <div className="flex justify-between items-center gap-4 text-sm font-black text-white px-2">
               <span>{t('tariffPerKmShort')} : {marketAverage?.perKm?.toFixed(2) || '0.00'} {currency}</span>
               <span>{t('tariffPerMinShort')} : {marketAverage?.perMin?.toFixed(2) || '0.00'} {currency}</span>
             </div>
          </div>

          <div className="mb-4 space-y-3">
             <h4 className="text-sm font-black text-emerald-400 mb-4">{t('tariffUpdatePrice')}</h4>
             
             {isGoldOrPlatinum ? (
               <div className="mb-3 text-xs font-bold text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                 {t('tariffGoldBonusNotice')}
               </div>
             ) : null}

             {isSilver && marketAverage && (Number(pricePerKm) < marketAverage.perKm * 0.85 || Number(pricePerMin) < marketAverage.perMin * 0.85) ? (
               <div className="mb-3 text-xs font-bold text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                 {t('tariffSilverReduceWarning')}
               </div>
             ) : null}

             <div className={styles.field}>
               <div className={styles.inputRow}>
                 <span className="flex w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-black/60 text-sm font-black text-slate-300">
                   {t('tariffPerKmShort')}
                 </span>
                 <input
                   type="number"
                   inputMode="decimal"
                   min="0"
                   step="0.01"
                   value={pricePerKm}
                   onChange={(event) => setPricePerKm(event.target.value)}
                   placeholder={t('pricePerKmModalPlaceholder')}
                   disabled={isSaving}
                   className={styles.input}
                 />
               </div>
             </div>

             <div className={styles.field}>
               <div className={styles.inputRow}>
                 <span className="flex w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-black/60 text-sm font-black text-slate-300">
                   {t('tariffPerMinShort')}
                 </span>
                 <input
                   type="number"
                   inputMode="decimal"
                   min="0"
                   step="0.01"
                   value={pricePerMin}
                   onChange={(event) => setPricePerMin(event.target.value)}
                   placeholder="0.00"
                   disabled={isSaving}
                   className={styles.input}
                 />
               </div>
             </div>
          </div>
         </div>
        )}

        {error ? <p className={styles.error}>{error}</p> : null}

        <AlertDialogFooter className={styles.footer}>
          <AlertDialogAction disabled={isSaving} onClick={handleSave} className={styles.confirm}>
            {isSaving
              ? t('pricePerKmModalSaving')
              : isActivationConfirm
                ? t('tariffModalConfirmAction')
                : t('pricePerKmModalSave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
