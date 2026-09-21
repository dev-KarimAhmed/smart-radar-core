import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Minus, Plus, AlertTriangle, Loader2, Send, Sparkles } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { type PricingMode } from './bidding-pricing-selector';

const styles = {
  style163_22: 'mt-6 space-y-5',
  style164_23: 'block text-sm font-semibold text-slate-200',
  style165_24: 'flex items-center gap-3',
  style169_25: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors active:scale-95',
  style171_26: 'h-5 w-5',
  style177_27: 'h-12 w-full min-w-0 flex-1 rounded-xl bg-slate-900/50 px-4 text-center text-xl font-mono font-bold text-white shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dir-ltr',
  style182_28: 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors active:scale-95',
  style184_29: 'h-5 w-5',
  style187_30: 'mt-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-teal-900/20 to-slate-900/60 p-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]',
  style188_31: 'flex items-center justify-between',
  style189_32: 'text-sm font-bold text-emerald-100',
  style190_33: 'text-2xl font-mono font-black text-emerald-400 tracking-tight dir-ltr',
  style192_34: 'text-[13px] text-slate-400/90 mt-2 leading-relaxed',
  style201_35: 'mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300',
  style202_36: 'h-4 w-4',
  style208_37: 'mt-2 flex items-center gap-1.5 text-[13px] text-amber-400',
  style209_38: 'h-4 w-4',
  style215_39: 'mt-6 grid grid-cols-[1fr,auto] gap-3 sm:mt-8',
  submitWrap: 'block w-full',
  style219_40: 'flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-[15px] font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  style221_41: 'h-5 w-5 animate-spin',
  style221_42: 'h-5 w-5',
  style224_43: 'flex items-center justify-center rounded-2xl bg-slate-800 px-6 py-4 text-[15px] font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white active:scale-[0.98]',
  inputLocked: 'opacity-50 pointer-events-none',
  professionalAdCard: 'mt-4 w-full shadow-md rounded-2xl border border-white/5 overflow-hidden',
} as const;

interface BiddingOfferStepperProps {
  language: string;
  currency: string;
  pricingMode: PricingMode | null;
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
  professionalAd: any; // Ad type
  MARKET_FLOOR_FACTOR: number;
  floorPrice: number;
  handleApplyFloorPrice: () => void;
  waitSecondsInput: string;
  setWaitSecondsInput: React.Dispatch<React.SetStateAction<string>>;
  MIN_OFFER_WAIT_SECONDS: number;
  MAX_OFFER_WAIT_SECONDS?: number;
  parsedWaitSeconds: number;
  isWaitSecondsValid: boolean;
  onSubmit: (price: number, waitSecs: number, mode?: PricingMode) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  existingOffer: any;
  onIgnore: () => void;
  roundMoney: (val: number) => number;
}

export function BiddingOfferStepper({
  language,
  currency,
  pricingMode,
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
  MARKET_FLOOR_FACTOR,
  floorPrice,
  handleApplyFloorPrice,
  waitSecondsInput,
  setWaitSecondsInput,
  MIN_OFFER_WAIT_SECONDS,
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

  if (pricingMode === null) return null;

  return (
    <div className={styles.style163_22}>
      {pricingMode === 'FREE' && (
        <>
          <label className={styles.style164_23}>{t('increaseAmount')}</label>
          <div className={styles.style165_24}>
            <button
              type="button"
              onClick={() => setIncreaseAmount((value: any) => Math.max(minIncreaseAmount, roundMoney((Number(value) || 0) - step)))}
              disabled={isMinusDisabled}
              className={cn(styles.style169_25, isMinusDisabled ? styles.inputLocked : '')}
            >
              <Minus className={styles.style171_26} />
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
              className={styles.style177_27}
            />
            <button
              type="button"
              onClick={() => setIncreaseAmount((value: any) => roundMoney((Number(value) || 0) + step))}
              disabled={isPlusDisabled}
              className={cn(styles.style182_28, isPlusDisabled ? styles.inputLocked : '')}
            >
              <Plus className={styles.style184_29} />
            </button>
          </div>
        </>
      )}
      <div className={styles.style187_30}>
        <div className={styles.style188_31}>
          <span className={styles.style189_32}>{t('finalOffer')}</span>
          <strong className={styles.style190_33}>{finalOfferPrice.toFixed(2)} {currency}</strong>
        </div>
        <p className={styles.style192_34}>
          {pricingMode === 'APP' ? (
            <span>
              {normalizedAppPrice > 0 ? (
                t('appEnteredPrice', { price: finalOfferPrice.toFixed(2), currency })
              ) : (
                t('enterAppPriceHint')
              )}
            </span>
          ) : pricingMode === 'TAXI' ? (
            <span>
              {t('taxiMeterTripPrice', { price: finalOfferPrice.toFixed(2), currency })}
            </span>
          ) : normalizedIncreaseAmount === 0 ? (
            <span>
              {t('matchesCalculatedMeter')}
            </span>
          ) : (
            <>
              <span>{t('offerDetailsPrefix')}</span>
              <span dir="ltr" className="inline-block font-mono text-slate-300">
                {baseFare.toFixed(2)} {currency} {normalizedIncreaseAmount >= 0 ? '+' : '-'} {Math.abs(normalizedIncreaseAmount).toFixed(2)} {currency} = {finalOfferPrice.toFixed(2)} {currency}
              </span>
            </>
          )}
        </p>
      </div>

      {isTierAmber && !isAboveBand ? (
        <div className={styles.style201_35}>
          <AlertTriangle className={styles.style202_36} />
          {t('tierAmberWarning', { limit: Math.round(premiumFactor * 100) })}
        </div>
      ) : null}

      {isDumpingAmber ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-amber-950/15 to-black/40 p-3.5 text-xs font-bold text-amber-200 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1 leading-relaxed">
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
        <div className="mt-4 overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-red-950/20 to-black/60 p-4 text-rose-200 shadow-xl shadow-rose-950/30">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-rose-300">
                {t('dumpingCrimsonBlockTitle')}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-rose-200/85">
                {t('dumpingCrimsonBlockDesc', {
                  limit: Math.round(MARKET_FLOOR_FACTOR * 100),
                })}
              </p>
            </div>
          </div>

          {marketFare > 0 ? (
            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                <span className="block text-[11px] font-bold text-amber-300/90">
                  {t('breakdownMarket')}
                </span>
                <strong className="mt-1 block font-mono text-sm font-black text-amber-300" dir="ltr">
                  {marketFare.toFixed(2)} {currency}
                </strong>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5">
                <span className="block text-[11px] font-bold text-rose-300/90">
                  {t('breakdownFloor')}
                </span>
                <strong className="mt-1 block font-mono text-sm font-black text-rose-200" dir="ltr">
                  {floorPrice.toFixed(2)} {currency}
                </strong>
              </div>

              <div className="col-span-2 rounded-xl border border-white/10 bg-black/40 p-2.5 sm:col-span-1">
                <span className="block text-[11px] font-bold text-slate-400">
                  {t('currentOfferFare')}
                </span>
                <strong className="mt-1 block font-mono text-sm font-black text-rose-400 line-through decoration-rose-500" dir="ltr">
                  {finalOfferPrice.toFixed(2)} {currency}
                </strong>
              </div>
            </div>
          ) : null}

          {floorPrice > 0 ? (
            <button
              type="button"
              onClick={handleApplyFloorPrice}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/20 py-2.5 px-3 text-xs font-black text-rose-200 transition hover:bg-rose-500/30 active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
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

      <div className={styles.style163_22}>
        <label className={styles.style164_23}>{t('waitSecondsLabel')}</label>
        <div className={styles.style165_24}>
          <button
            type="button"
            onClick={() => setWaitSecondsInput((current: any) => {
              const value = Number(current);
              const next = (Number.isFinite(value) ? value : MIN_OFFER_WAIT_SECONDS) - 1;
              return String(Math.max(MIN_OFFER_WAIT_SECONDS, next));
            })}
            disabled={parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS}
            className={cn(styles.style169_25, parsedWaitSeconds <= MIN_OFFER_WAIT_SECONDS ? styles.inputLocked : '')}
          >
            <Minus className={styles.style171_26} />
          </button>
          <input
            value={waitSecondsInput}
            onChange={(event) => setWaitSecondsInput(event.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            className={styles.style177_27}
          />
          <button
            type="button"
            onClick={() => setWaitSecondsInput((current: any) => {
              const value = Number(current);
              const next = (Number.isFinite(value) ? value : MIN_OFFER_WAIT_SECONDS) + 1;
              return String(Math.max(MIN_OFFER_WAIT_SECONDS, next));
            })}
            className={styles.style182_28}
          >
            <Plus className={styles.style184_29} />
          </button>
        </div>
        <p className={styles.style192_34}>{t('waitSecondsHint')}</p>
        {!isWaitSecondsValid ? (
          <div className={styles.style208_37}>
            <AlertTriangle className={styles.style209_38} />
            {t('waitSecondsMin', { min: MIN_OFFER_WAIT_SECONDS })}
          </div>
        ) : null}
      </div>

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

      <div className={styles.style215_39}>
        <span
          className={styles.submitWrap}
          title={!isWaitSecondsValid ? t('waitSecondsMin', { min: MIN_OFFER_WAIT_SECONDS }) : undefined}
        >
          <button
            onClick={() => onSubmit(finalOfferPrice, parsedWaitSeconds, pricingMode || undefined)}
            disabled={!canSubmit}
            className={styles.style219_40}
          >
            {isSubmitting ? <Loader2 className={styles.style221_41} /> : <Send className={styles.style221_42} />}
            {existingOffer ? t('updateOffer') : t('submit')}
          </button>
        </span>
        <button onClick={onIgnore} className={styles.style224_43}>
          {t('ignore')}
        </button>
      </div>
    </div>
  );
}
