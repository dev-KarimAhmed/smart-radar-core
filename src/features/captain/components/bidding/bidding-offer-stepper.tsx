import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Minus, Plus, AlertTriangle, Loader2, Send, Sparkles, ClipboardPaste } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { type PricingMode } from './bidding-pricing-selector';

const styles = {
  container: 'mt-4 space-y-3',
  biddingGrid: 'grid grid-cols-1 sm:grid-cols-3 gap-2.5',

  // Card 1: App price / input / paste
  card: 'flex flex-col justify-between rounded-2xl border border-teal-500/25 bg-[#071318]/90 p-3 shadow-md',
  cardHeader: 'flex items-center justify-between gap-1 mb-2',
  cardTitle: 'text-[11px] font-black text-teal-300 truncate',
  pasteBtn: 'inline-flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/20 px-2 py-1 text-[10px] font-black text-teal-200 transition hover:bg-teal-500/30 active:scale-95',
  pasteIcon: 'h-3 w-3 text-teal-300',
  inputWrapper: 'relative',
  cardInput: 'w-full rounded-xl border border-teal-500/30 bg-black/60 px-3 py-2 text-center text-lg font-black font-mono text-white outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 dir-ltr',
  currencyBadge: 'absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none',
  cardHint: 'mt-1.5 text-center text-[10px] font-medium text-slate-400 truncate',

  // Stepper for Free Mode in Card 1
  stepperRow: 'flex items-center justify-center gap-1.5',
  stepperBtn: 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-800 text-slate-200 transition hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
  stepperIcon: 'h-3.5 w-3.5',
  stepperInput: 'h-9 w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-black/50 text-center text-base font-black font-mono text-white outline-none focus:border-teal-400 dir-ltr',

  // Card 2: Final Offer Price
  finalCard: 'flex flex-col justify-between rounded-2xl border border-emerald-500/25 bg-[#071714]/90 p-3 text-center shadow-md',
  finalTitle: 'text-[11px] font-black text-emerald-300 mb-1',
  finalPriceRow: 'my-auto py-1 flex items-baseline justify-center gap-1',
  finalPriceValue: 'text-2xl font-black font-mono text-white tracking-tight dir-ltr',
  finalPriceCurrency: 'text-xs font-black text-emerald-400',
  finalSubtitle: 'text-[10px] font-medium text-slate-400 truncate',

  // Card 3: Offer Duration
  durationCard: 'flex flex-col justify-between rounded-2xl border border-cyan-500/25 bg-[#0b1424]/90 p-3 text-center shadow-md',
  durationTitle: 'text-[11px] font-black text-cyan-300 mb-1',
  durationStepperRow: 'my-auto flex items-center justify-center gap-2 py-0.5',
  durationBtn: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:pointer-events-none',
  durationBtnIcon: 'h-3.5 w-3.5',
  durationValue: 'w-10 text-center text-xl font-black font-mono text-white dir-ltr',
  durationInput: 'w-12 bg-transparent text-center text-xl font-black font-mono text-white outline-none focus:ring-1 focus:ring-cyan-400 rounded dir-ltr',
  durationSubtitle: 'text-[10px] font-medium text-slate-400',

  // Warnings
  amberWarningBox: 'flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300',
  warningIcon: 'h-4 w-4 shrink-0',
  dumpingAmberBox: 'overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-amber-950/15 to-black/40 p-3 text-xs font-bold text-amber-200 shadow-lg',
  dumpingAmberInner: 'flex items-start gap-2.5',
  dumpingAmberIcon: 'mt-0.5 h-4 w-4 shrink-0 text-amber-400',
  dumpingAmberText: 'min-w-0 flex-1 leading-relaxed',
  dumpingBlockBox: 'overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-red-950/20 to-black/60 p-3.5 text-rose-200 shadow-xl shadow-rose-950/30',
  dumpingBlockHeader: 'flex items-start gap-3',
  dumpingBlockIconWrap: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-300',
  dumpingBlockIcon: 'h-5 w-5',
  dumpingBlockContent: 'min-w-0 flex-1',
  dumpingBlockTitle: 'text-xs font-black text-rose-300',
  dumpingBlockDesc: 'mt-0.5 text-[11px] leading-relaxed text-rose-200/85',
  dumpingStatsGrid: 'mt-2.5 grid grid-cols-3 gap-2',
  dumpingStatItemMarket: 'rounded-xl border border-amber-500/30 bg-amber-500/10 p-2',
  dumpingStatLabelMarket: 'block text-[10px] font-bold text-amber-300/90',
  dumpingStatValueMarket: 'mt-0.5 block font-mono text-xs font-black text-amber-300 dir-ltr',
  dumpingStatItemFloor: 'rounded-xl border border-rose-500/30 bg-rose-500/10 p-2',
  dumpingStatLabelFloor: 'block text-[10px] font-bold text-rose-300/90',
  dumpingStatValueFloor: 'mt-0.5 block font-mono text-xs font-black text-rose-200 dir-ltr',
  dumpingStatItemCurrent: 'rounded-xl border border-white/10 bg-black/40 p-2',
  dumpingStatLabelCurrent: 'block text-[10px] font-bold text-slate-400',
  dumpingStatValueCurrent: 'mt-0.5 block font-mono text-xs font-black text-rose-400 line-through decoration-rose-500 dir-ltr',
  applyFloorBtn: 'mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 py-2 px-3 text-xs font-black text-rose-200 transition hover:bg-rose-500/30 active:scale-[0.99]',
  sparklesIcon: 'h-3.5 w-3.5 text-amber-300',

  // Actions row
  actionsRow: 'flex items-center gap-2.5 pt-1',
  submitWrap: 'flex-1',
  submitBtn: 'w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#14F5D5] via-[#14B8A6] to-[#0d9488] py-3.5 px-4 font-black text-[#031518] shadow-lg shadow-[#14B8A6]/20 transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm',
  submitIcon: 'h-4 w-4',
  submitSpinner: 'h-4 w-4 animate-spin',
  ignoreBtn: 'rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition shrink-0',
  professionalAdCard: 'mt-3 w-full shadow-md rounded-2xl border border-white/5 overflow-hidden',
  inputLocked: 'opacity-40 pointer-events-none',
} as const;

export interface BiddingOfferStepperProps {
  language: string;
  currency: string;
  pricingMode: PricingMode | null;
  appPrice?: string;
  setAppPrice?: (val: string) => void;
  increaseAmount: number | string;
  setIncreaseAmount: React.Dispatch<React.SetStateAction<number | string>>;
  minIncreaseAmount: number;
  step: number;
  isMinusDisabled: boolean;
  isPlusDisabled: boolean;
  finalOfferPrice: number;
  normalizedAppPrice: number;
  baseFare: number;
  normalizedIncreaseAmount: number;
  isTierAmber: boolean;
  isAboveBand: boolean;
  premiumFactor: number;
  isDumpingAmber: boolean;
  marketFare: number;
  marketDifference: number;
  marketDifferencePercent: number;
  isDumpingBlocked: boolean;
  professionalAd: any;
  MARKET_FLOOR_FACTOR: number;
  floorPrice: number;
  handleApplyFloorPrice: () => void;
  waitSecondsInput: string;
  setWaitSecondsInput: React.Dispatch<React.SetStateAction<string>>;
  MIN_OFFER_WAIT_SECONDS: number;
  DEFAULT_OFFER_WAIT_SECONDS?: number;
  MAX_OFFER_WAIT_SECONDS: number;
  parsedWaitSeconds: number;
  isWaitSecondsValid: boolean;
  onSubmit: (price: number, waitSecs: number, mode?: PricingMode) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  existingOffer: any;
  onIgnore: () => void;
  roundMoney: (val: number) => number;
  isSmartApp?: boolean;
}

export function BiddingOfferStepper({
  currency,
  pricingMode,
  appPrice = '',
  setAppPrice,
  increaseAmount,
  setIncreaseAmount,
  minIncreaseAmount,
  step,
  isMinusDisabled,
  isPlusDisabled,
  finalOfferPrice,
  normalizedAppPrice,
  baseFare,
  normalizedIncreaseAmount,
  isTierAmber,
  isAboveBand,
  premiumFactor,
  isDumpingAmber,
  marketFare,
  marketDifference,
  marketDifferencePercent,
  isDumpingBlocked,
  professionalAd,
  floorPrice,
  handleApplyFloorPrice,
  waitSecondsInput,
  setWaitSecondsInput,
  MIN_OFFER_WAIT_SECONDS,
  DEFAULT_OFFER_WAIT_SECONDS = 90,
  MAX_OFFER_WAIT_SECONDS,
  parsedWaitSeconds,
  isWaitSecondsValid,
  onSubmit,
  canSubmit,
  isSubmitting,
  existingOffer,
  onIgnore,
  roundMoney,
}: BiddingOfferStepperProps) {
  const t = useTranslations('captainBidding');

  const handlePastePrice = React.useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.replace(/,/g, '.');
        const match = cleaned.match(/\d+(?:\.\d+)?/);
        if (match && setAppPrice) {
          setAppPrice(match[0]);
        }
      }
    } catch {
      // Clipboard denied or unsupported - fail silently
    }
  }, [setAppPrice]);

  if (pricingMode === null) return null;

  return (
    <div className={styles.container}>
      {/* 3-Box Grid: [الصق سعر التطبيق] | [السعر النهائي] | [مدة العرض] */}
      <div className={styles.biddingGrid}>
        {/* Card 1: Paste App Price / Fare Adjustment */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              {pricingMode === 'APP'
                ? t('pasteAppPrice')
                : pricingMode === 'TAXI'
                ? t('pricingModeTaxi')
                : t('increaseAmount')}
            </span>
            {pricingMode === 'APP' && (
              <button
                type="button"
                onClick={() => void handlePastePrice()}
                className={styles.pasteBtn}
                title={t('pasteAction')}
              >
                <ClipboardPaste className={styles.pasteIcon} />
                <span>{t('pasteAction')}</span>
              </button>
            )}
          </div>

          {pricingMode === 'APP' || pricingMode === 'TAXI' ? (
            <div className={styles.inputWrapper}>
              <input
                type="number"
                step="0.01"
                min="0.1"
                inputMode="decimal"
                value={appPrice}
                onChange={(e) => setAppPrice?.(e.target.value)}
                placeholder={marketFare > 0 ? marketFare.toFixed(2) : '0.00'}
                className={styles.cardInput}
                autoFocus
              />
              <span className={styles.currencyBadge}>{currency}</span>
            </div>
          ) : (
            <div className={styles.stepperRow}>
              <button
                type="button"
                onClick={() => setIncreaseAmount((value: any) => Math.max(minIncreaseAmount, roundMoney((Number(value) || 0) - step)))}
                disabled={isMinusDisabled}
                className={cn(styles.stepperBtn, isMinusDisabled ? styles.inputLocked : '')}
              >
                <Minus className={styles.stepperIcon} />
              </button>
              <input
                value={increaseAmount.toString()}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                    setIncreaseAmount(val);
                  }
                }}
                inputMode="decimal"
                className={styles.stepperInput}
              />
              <button
                type="button"
                onClick={() => setIncreaseAmount((value: any) => roundMoney((Number(value) || 0) + step))}
                disabled={isPlusDisabled}
                className={cn(styles.stepperBtn, isPlusDisabled ? styles.inputLocked : '')}
              >
                <Plus className={styles.stepperIcon} />
              </button>
            </div>
          )}

          <span className={styles.cardHint}>
            {pricingMode === 'APP'
              ? (normalizedAppPrice > 0 ? `${normalizedAppPrice.toFixed(2)} ${currency}` : t('appModeHint'))
              : pricingMode === 'TAXI'
              ? t('taxiModeHint')
              : `${baseFare.toFixed(2)} ${currency}`}
          </span>
        </div>

        {/* Card 2: Final Offer Price */}
        <div className={styles.finalCard}>
          <span className={styles.finalTitle}>{t('finalOffer')}</span>
          <div className={styles.finalPriceRow}>
            <strong className={styles.finalPriceValue}>
              {finalOfferPrice.toFixed(2)}
            </strong>
            <span className={styles.finalPriceCurrency}>{currency}</span>
          </div>
          <span className={styles.finalSubtitle}>
            {pricingMode === 'APP' && normalizedAppPrice <= 0
              ? t('enterAppPriceHint')
              : t('tripFareLabel')}
          </span>
        </div>

        {/* Card 3: Offer Duration */}
        <div className={styles.durationCard}>
          <span className={styles.durationTitle}>{t('offerDurationShort')}</span>
          <div className={styles.durationStepperRow}>
            <button
              type="button"
              onClick={() => setWaitSecondsInput((current: any) => {
                const value = Number(current);
                const next = (Number.isFinite(value) ? value : DEFAULT_OFFER_WAIT_SECONDS) - 5;
                return String(Math.max(MIN_OFFER_WAIT_SECONDS, next));
              })}
              disabled={parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS}
              className={cn(styles.durationBtn, parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
            >
              <Minus className={styles.durationBtnIcon} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={waitSecondsInput}
              onChange={(event) => {
                const val = event.target.value.replace(/[^0-9]/g, '');
                setWaitSecondsInput(val);
              }}
              onBlur={() => {
                const val = Number(waitSecondsInput);
                if (!Number.isFinite(val) || val < MIN_OFFER_WAIT_SECONDS) {
                  setWaitSecondsInput(String(DEFAULT_OFFER_WAIT_SECONDS));
                }
              }}
              className={styles.durationInput}
            />
            <button
              type="button"
              onClick={() => setWaitSecondsInput((current: any) => {
                const value = Number(current);
                const next = (Number.isFinite(value) ? value : DEFAULT_OFFER_WAIT_SECONDS) + 5;
                return String(Math.min(MAX_OFFER_WAIT_SECONDS, Math.max(MIN_OFFER_WAIT_SECONDS, next)));
              })}
              disabled={parsedWaitSeconds >= MAX_OFFER_WAIT_SECONDS}
              className={cn(styles.durationBtn, parsedWaitSeconds >= MAX_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
            >
              <Plus className={styles.durationBtnIcon} />
            </button>
          </div>
          <span className={styles.durationSubtitle}>{t('secondsUnit')}</span>
        </div>
      </div>

      {/* Warnings */}
      {isTierAmber && !isAboveBand ? (
        <div className={styles.amberWarningBox}>
          <AlertTriangle className={styles.warningIcon} />
          <span>{t('tierAmberWarning', { limit: Math.round(premiumFactor * 100) })}</span>
        </div>
      ) : null}

      {isDumpingAmber ? (
        <div className={styles.dumpingAmberBox}>
          <div className={styles.dumpingAmberInner}>
            <AlertTriangle className={styles.dumpingAmberIcon} />
            <div className={styles.dumpingAmberText}>
              {t('dumpingAmberCalculationWarning', {
                offer: finalOfferPrice.toFixed(2),
                market: marketFare.toFixed(2),
                difference: marketDifference.toFixed(2),
                percent: marketDifferencePercent,
                currency,
              })}
            </div>
          </div>
        </div>
      ) : null}

      {isDumpingBlocked ? (
        <div className={styles.dumpingBlockBox}>
          <div className={styles.dumpingBlockHeader}>
            <div className={styles.dumpingBlockIconWrap}>
              <AlertTriangle className={styles.dumpingBlockIcon} />
            </div>
            <div className={styles.dumpingBlockContent}>
              <h4 className={styles.dumpingBlockTitle}>
                {t('dumpingCrimsonBlockTitle')}
              </h4>
              <p className={styles.dumpingBlockDesc}>
                {t('dumpingCrimsonBlockDesc', {
                  limit: Math.round(15),
                })}
              </p>
            </div>
          </div>

          {marketFare > 0 ? (
            <div className={styles.dumpingStatsGrid}>
              <div className={styles.dumpingStatItemMarket}>
                <span className={styles.dumpingStatLabelMarket}>
                  {t('breakdownMarket')}
                </span>
                <strong className={styles.dumpingStatValueMarket}>
                  {marketFare.toFixed(2)} {currency}
                </strong>
              </div>

              <div className={styles.dumpingStatItemFloor}>
                <span className={styles.dumpingStatLabelFloor}>
                  {t('breakdownFloor')}
                </span>
                <strong className={styles.dumpingStatValueFloor}>
                  {floorPrice.toFixed(2)} {currency}
                </strong>
              </div>

              <div className={styles.dumpingStatItemCurrent}>
                <span className={styles.dumpingStatLabelCurrent}>
                  {t('currentOfferFare')}
                </span>
                <strong className={styles.dumpingStatValueCurrent}>
                  {finalOfferPrice.toFixed(2)} {currency}
                </strong>
              </div>
            </div>
          ) : null}

          {floorPrice > 0 ? (
            <button
              type="button"
              onClick={handleApplyFloorPrice}
              className={styles.applyFloorBtn}
            >
              <Sparkles className={styles.sparklesIcon} />
              <span>
                {t('applyMinimumAllowedPrice', {
                  price: floorPrice.toFixed(2),
                  currency,
                })}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      {isDumpingBlocked && professionalAd ? (
        <AdDisplayCard
          ad={professionalAd}
          showHeart={false}
          badgeText={t('professionalAdBadge')}
          ctaText={professionalAd.buttonText}
          className={styles.professionalAdCard}
          onOpen={(event: React.MouseEvent) => {
            event.stopPropagation();
            window.open(professionalAd.actionUrl, '_blank');
          }}
        />
      ) : null}

      {/* Action Buttons: [تقديم العرض] & [تجاهل] */}
      <div className={styles.actionsRow}>
        <span
          className={styles.submitWrap}
          title={!isWaitSecondsValid ? t('waitSecondsRange', { min: MIN_OFFER_WAIT_SECONDS, max: MAX_OFFER_WAIT_SECONDS }) : undefined}
        >
          <button
            type="button"
            onClick={() => onSubmit(finalOfferPrice, parsedWaitSeconds, pricingMode || undefined)}
            disabled={!canSubmit}
            className={styles.submitBtn}
          >
            {isSubmitting ? <Loader2 className={styles.submitSpinner} /> : <Send className={styles.submitIcon} />}
            <span>{existingOffer ? t('updateOffer') : t('submit')}</span>
          </button>
        </span>
        <button type="button" onClick={onIgnore} className={styles.ignoreBtn}>
          {t('ignore')}
        </button>
      </div>
    </div>
  );
}
