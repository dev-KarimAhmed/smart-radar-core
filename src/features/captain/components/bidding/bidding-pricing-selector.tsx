import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import React from 'react';
import { Minus, Plus, AlertTriangle, Loader2, Send } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';

// Pricing Selector styles
const styles = {
  freeModeNotice: 'text-sm text-center text-teal-200/80 mt-4 leading-relaxed tracking-wide',
  appModeContainer: 'mt-3 space-y-2 rounded-xl bg-slate-900/40 p-3 border border-slate-700/50 shadow-inner',
  appModeHeader: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
  appModeTitle: 'text-sm font-semibold text-slate-100',
  appModeHint: 'text-xs text-slate-400 mt-1 leading-relaxed',
  marketAvgBadge: 'rounded-lg border border-teal-400/30 bg-teal-500/15 px-3 py-1.5 text-xs font-black text-teal-300 self-start sm:self-center',
  taxiModeContainer: 'mt-3 space-y-2 rounded-xl bg-slate-900/40 p-3 border border-slate-700/50 shadow-inner',
  taxiModeNotice: 'text-sm font-medium text-amber-200',
  taxiModeHint: 'text-xs text-slate-400 mt-1 leading-relaxed',
  meterDetails: 'mt-6 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-5',
  meterDetailsHeader: 'flex items-center justify-between mb-3',
  meterDetailsTitle: 'text-sm font-bold text-slate-200',
  meterBadgeCovered: 'inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  meterDetailsHint: 'text-xs text-slate-400 leading-relaxed',
  meterFormula: 'text-[13px] leading-relaxed mb-3 break-words',
  meterDetailsRoute: 'text-xs text-slate-400 leading-relaxed',
  breakdownList: 'mt-4 sm:mt-5 space-y-2 sm:space-y-2.5 rounded-xl bg-slate-900/30 p-3 sm:p-4 border border-slate-800/50',
  breakdownRow: 'flex justify-between items-center text-sm',
  breakdownRowAccent: 'pt-2 mt-2 border-t border-slate-700/50',
  breakdownLabel: 'text-slate-400',
  breakdownValue: 'font-mono font-semibold text-slate-200',
  aboveBandWarning: 'mt-4 text-xs font-medium text-amber-300/90 leading-relaxed text-center px-4',
  style156_21: 'mt-4 w-full rounded-lg bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors',
  formulaInner: 'inline-flex items-center gap-1.5 flex-wrap justify-center font-mono text-sm leading-relaxed tracking-wide',
  formulaTotal: 'font-extrabold text-emerald-400',
  formulaOperator: 'text-slate-400',
  formulaPart: 'whitespace-nowrap',
  marketLabel: 'text-slate-300',
  marketValue: 'inline-block font-mono font-bold text-amber-300 mx-1.5 me-2',
  limitValue: 'inline-block font-mono text-slate-200',
} as const;

export type PricingMode = 'FREE' | 'APP' | 'TAXI';
export type RiderPreference = 'FREE' | 'APP' | 'TAXI' | null;

interface BiddingPricingSelectorProps {
  language: string;
  currency: string;
  pricingMode: PricingMode | null;
  appPrice: string;
  setAppPrice: (val: string) => void;
  marketFare: number;
  baseFare: number;
  isCoveredInBaseFare: boolean;
  meterDetails: any;
  captainMeterFare: number;
  premiumFactor: number;
  ceilingPrice: number;
  floorPrice: number;
  MARKET_FLOOR_FACTOR: number;
  normalizedIncreaseAmount: number;
  isMeterOffMarket: boolean;
  bandHeadroom: number;
  setIncreaseAmount: (val: number) => void;
  isAboveBand: boolean;
  aboveBandPercent: number;
}

export function BiddingPricingSelector({
  language,
  currency,
  pricingMode,
  appPrice,
  setAppPrice,
  marketFare,
  baseFare,
  isCoveredInBaseFare,
  meterDetails,
  captainMeterFare,
  premiumFactor,
  ceilingPrice,
  floorPrice,
  MARKET_FLOOR_FACTOR,
  normalizedIncreaseAmount,
  isMeterOffMarket,
  bandHeadroom,
  setIncreaseAmount,
  isAboveBand,
  aboveBandPercent,
}: BiddingPricingSelectorProps) {
  const t = useTranslations('captainBidding');

  return (
    <>
      {pricingMode === 'FREE' && (
        <div className={styles.freeModeNotice}>
          {t('companyPriceNotice')}
        </div>
      )}

      {pricingMode === 'APP' && (
        <div className={styles.appModeContainer}>
          <div className={styles.appModeHeader}>
            <div>
              <p className={styles.appModeTitle}>{t('appModeInputNotice')}</p>
              <p className={styles.appModeHint}>{t('appModeInputHint')}</p>
            </div>
            {marketFare > 0 && (
              <div className={styles.marketAvgBadge}>
                {t('marketAvgValue', { marketFare: marketFare.toFixed(2), currency })}
              </div>
            )}
          </div>
        </div>
      )}

      {pricingMode === 'TAXI' && (
        <div className={styles.taxiModeContainer}>
          <div className={styles.taxiModeNotice}>
            🚕 {t('taxiModeNotice')}
          </div>
          <p className={styles.taxiModeHint}>
            {t('taxiModeHint')}
          </p>
        </div>
      )}

      {pricingMode === 'FREE' && (
        <>
          <div className={styles.meterDetails}>
            <div className={styles.meterDetailsHeader}>
              <p className={styles.meterDetailsTitle}>{t('meterCalculationTitle')}</p>
              {isCoveredInBaseFare ? (
                <span className={styles.meterBadgeCovered}>
                  {t('coveredInBaseFare')}
                </span>
              ) : null}
            </div>
            {isCoveredInBaseFare ? (
              <p className={styles.meterDetailsHint}>
                {t('coveredInBaseFareHint', {
                  baseFare: (meterDetails?.baseFare ?? baseFare).toFixed(2),
                  currency,
                })}
              </p>
            ) : meterDetails ? (
              <>
                <p className={styles.meterFormula} dir="ltr">
                  <span className={styles.formulaInner} dir="ltr">
                    <strong className={styles.formulaTotal}>{captainMeterFare.toFixed(2)} {currency}</strong>
                    <span className={styles.formulaOperator}>=</span>
                    <span>{meterDetails.baseFare.toFixed(2)} {currency}</span>
                    <span className={styles.formulaOperator}>+</span>
                    <span className={styles.formulaPart}>({meterDetails.billableKm.toFixed(2)} <bdi>{t('kmUnit')}</bdi> × {meterDetails.perKm.toFixed(2)} {currency})</span>
                    <span className={styles.formulaOperator}>+</span>
                    <span className={styles.formulaPart}>({meterDetails.estimatedMinutes.toFixed(1)} <bdi>{t('minUnit')}</bdi> × {meterDetails.perMin.toFixed(2)} {currency})</span>
                  </span>
                </p>
                <p className={styles.meterDetailsRoute}>
                  {t('meterCalculationRoute', {
                    roadKm: meterDetails.roadKm.toFixed(2),
                    includedKm: meterDetails.includedKm.toFixed(2),
                    billableKm: meterDetails.billableKm.toFixed(2),
                    minutes: meterDetails.estimatedMinutes.toFixed(1),
                  })}
                </p>
              </>
            ) : (
              <p className={styles.meterDetailsHint}>{t('meterCalculationSource')}</p>
            )}
            {marketFare > 0 && (
              <>
                <p className={styles.meterFormula}>
                  <span className={styles.marketLabel}>{t('marketReference')}</span>
                  <span dir="ltr" className={styles.marketValue}>
                    = {marketFare.toFixed(2)} {currency}
                  </span>
                </p>
                <p className={styles.meterDetailsRoute}>
                  <span>{t('warningLimit')}: </span>
                  <span dir="ltr" className={styles.limitValue}>
                    {marketFare.toFixed(2)} + ({marketFare.toFixed(2)} × {Math.round(premiumFactor * 100)}%) = {ceilingPrice.toFixed(2)} {currency}
                  </span>
                </p>
                <p className={styles.meterDetailsRoute}>
                  <span>{t('lowestAllowedOffer')}: </span>
                  <span dir="ltr" className={styles.limitValue}>
                    {marketFare.toFixed(2)} - ({marketFare.toFixed(2)} × {Math.round(MARKET_FLOOR_FACTOR * 100)}%) = {floorPrice.toFixed(2)} {currency}
                  </span>
                </p>
              </>
            )}
          </div>

          <dl className={styles.breakdownList}>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>{t('breakdownMeter')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>{captainMeterFare.toFixed(2)} {currency}</dd>
            </div>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>{t('breakdownMarket')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>
                {marketFare > 0 ? `${marketFare.toFixed(2)} ${currency}` : t('breakdownMarketUnknown')}
              </dd>
            </div>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>
                {t('breakdownWarnLine', { percent: Math.round(premiumFactor * 100) })}
              </dt>
              <dd dir="ltr" className={styles.breakdownValue}>{ceilingPrice.toFixed(2)} {currency}</dd>
            </div>
            <div className={styles.breakdownRow}>
              <dt className={styles.breakdownLabel}>{t('breakdownFloor')}</dt>
              <dd dir="ltr" className={styles.breakdownValue}>{floorPrice.toFixed(2)} {currency}</dd>
            </div>
            {normalizedIncreaseAmount !== 0 && (
              <div className={cn(styles.breakdownRow, styles.breakdownRowAccent)}>
                <dt className={styles.breakdownLabel}>{t('breakdownYourIncrease')}</dt>
                <dd dir="ltr" className={styles.breakdownValue}>
                  {normalizedIncreaseAmount >= 0 ? '+' : '−'}{Math.abs(normalizedIncreaseAmount).toFixed(2)} {currency}
                </dd>
              </div>
            )}
          </dl>

          {isMeterOffMarket ? (
            <p className={styles.aboveBandWarning}>
              {t('meterOffMarket', {
                meter: baseFare.toFixed(2),
                market: marketFare.toFixed(2),
                currency,
              })}
            </p>
          ) : null}

          {bandHeadroom > 0 ? (
            <button
              type="button"
              onClick={() => setIncreaseAmount(bandHeadroom)}
              className={styles.style156_21}
            >
              {t('applyMaxIncrease')}
            </button>
          ) : null}

          {isAboveBand && !isMeterOffMarket ? (
            <p className={styles.aboveBandWarning}>
              {t('aboveBandWarning', {
                percent: aboveBandPercent,
                limit: Math.round(premiumFactor * 100),
              })}
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
