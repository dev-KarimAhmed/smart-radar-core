import React from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Pencil, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BiddingTariffComparisonProps {
  language: 'ar' | 'en';
  currency: string;
  tierLabel: string;
  rankIncreaseFactor: number;
  premiumFactor: number;
  bandHeadroom: number;
  isGoldOrPlatinum: boolean;
  isSilver: boolean;
  isWithinBaseFare: boolean;
  marketBaseFare: number;
  marketPerKm: number;
  marketPerMin: number;
  currentBaseFare: number;
  currentPerKm: number;
  currentPerMin: number;
  offerBaseFare: number;
  offerPerKm: number;
  offerPerMin: number;
  isDumpingAmber: boolean;
  dumpingDeviationRatio: number;
  riderPreference: 'FREE' | 'APP' | 'TAXI' | null | undefined;
  pricingMode: 'FREE' | 'APP' | 'TAXI' | null;
  setPricingMode: (mode: 'FREE' | 'APP' | 'TAXI') => void;
  onEditTariff?: () => void;
}

const styles = {
  container: "mt-5 rounded-2xl border border-[#14B8A6]/20 bg-[#0B2A2A]/25 p-4",
  header: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  tierPremiumTitle: "inline-flex items-center gap-2 text-sm font-black text-[#14B8A6]",
  tierPremiumIcon: "h-4 w-4",
  tierPremiumDesc: "mt-2 text-sm leading-6 text-slate-300",
  maxIncreaseContainer: "flex items-center justify-between rounded-xl border border-[#14B8A6]/30 bg-black/40 px-4 py-3 sm:flex-col sm:items-end sm:justify-center sm:border-none sm:bg-transparent sm:p-0",
  maxIncreaseLabel: "text-xs font-bold text-slate-400 sm:mb-1",
  maxIncreaseValue: "font-mono text-lg font-black text-white sm:text-base",
  
  goldBanner: "mt-3 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-2.5 text-center text-xs sm:text-sm font-black text-[#5eead4] shadow-md",
  withinBaseBanner: "mt-3 rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-3 text-center text-xs font-bold text-[#5eead4]",
  silverWarning: "mt-3 rounded-xl border border-rose-500/25 bg-rose-950/20 p-3 text-xs font-bold leading-relaxed text-rose-200",
  
  pricingModeContainer: "mt-5 border-t border-white/5 pt-5",
  riderPrefBadge: "mb-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300",
  riderPrefIcon: "h-3.5 w-3.5",
  noPrefBadge: "mb-3 flex items-center justify-center gap-2 rounded-lg bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-300",
  noPrefIcon: "h-3.5 w-3.5 opacity-70",
  pricingButtonsGrid: "grid grid-cols-2 gap-2 sm:grid-cols-4",
  pricingBtnBase: "rounded-xl border px-3 py-2 text-xs font-black transition-all",
  pricingBtnActive: "border-teal-500 bg-teal-500/20 text-teal-300",
  pricingBtnInactive: "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
  pricingBtnDisabled: "opacity-50 grayscale cursor-not-allowed",
} as const;

export function BiddingTariffComparison({
  language,
  currency,
  tierLabel,
  rankIncreaseFactor,
  premiumFactor,
  bandHeadroom,
  isGoldOrPlatinum,
  isSilver,
  isWithinBaseFare,
  marketBaseFare,
  marketPerKm,
  marketPerMin,
  currentBaseFare,
  currentPerKm,
  currentPerMin,
  offerBaseFare,
  offerPerKm,
  offerPerMin,
  isDumpingAmber,
  dumpingDeviationRatio,
  riderPreference,
  pricingMode,
  setPricingMode,
  onEditTariff,
}: BiddingTariffComparisonProps) {
  const t = useTranslations('captainBidding');

  return (
    <>
      <div className={styles.header}>
        <div>
          <p className={styles.tierPremiumTitle}>
            <Sparkles className={styles.tierPremiumIcon} />
            {t('tierPremium')}
          </p>

          <p className={styles.tierPremiumDesc}>
            {rankIncreaseFactor > 0
              ? t('tierPremiumDescription', {
                tier: tierLabel,
                rankPercent: Math.round(rankIncreaseFactor * 100),
                warnPercent: Math.round(premiumFactor * 100),
              })
              : t('noTierPremium', {
                tier: tierLabel,
                warnPercent: Math.round(premiumFactor * 100),
              })}
          </p>
        </div>

        <div className={styles.maxIncreaseContainer}>
          <p className={styles.maxIncreaseLabel}>{t('maxIncrease')}</p>
          <p className={styles.maxIncreaseValue}>{bandHeadroom.toFixed(2)} {currency}</p>
        </div>
      </div>

      {isGoldOrPlatinum && (
        <div className={styles.goldBanner}>
          {t('goldBannerMessage', {
            tier: tierLabel,
            percent: Math.round(rankIncreaseFactor * 100),
          })}
        </div>
      )}

      {isWithinBaseFare ? (
        <div className={styles.withinBaseBanner}>
          {t('withinBaseBanner')}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center dir-rtl">
          {/* Column 1: Market Avg */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-2 sm:p-3">
            <h4 className="text-[11px] sm:text-xs font-black text-slate-400 mb-2 truncate">
              {t('marketAvgLabel')}
            </h4>
            <div className="space-y-1.5 text-xs font-black text-slate-200">
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('baseFareLabel')}</span>
                <span className="font-mono text-teal-400">{marketBaseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('perKmLabel')}</span>
                <span className="font-mono text-teal-400">{marketPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('perMinLabel')}</span>
                <span className="font-mono text-teal-400">{marketPerMin.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Current Tariff */}
          <div className="rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 p-2 sm:p-3 relative group">
            <div className="flex items-center justify-between mb-2 gap-1">
              <h4 className="text-[11px] sm:text-xs font-black text-[#5eead4] truncate">
                {t('yourTariff')}
              </h4>
              {onEditTariff ? (
                <button
                  type="button"
                  onClick={onEditTariff}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#14B8A6] hover:text-[#5eead4] hover:underline transition-colors shrink-0"
                  title={t('editCurrentTariff')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>{t('editBtn')}</span>
                </button>
              ) : null}
            </div>
            <div className="space-y-1.5 text-xs font-black text-white">
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('baseFareLabel')}</span>
                <span className="font-mono text-[#5eead4]">{currentBaseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('perKmLabel')}</span>
                <span className="font-mono text-[#5eead4]">{currentPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('perMinLabel')}</span>
                <span className="font-mono text-[#5eead4]">{currentPerMin.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Offer Tariff */}
          <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-2 sm:p-3">
            <h4 className="text-[11px] sm:text-xs font-black text-emerald-300 mb-2 truncate">
              {t('offerTariff')}
            </h4>
            <div className="space-y-1.5 text-xs font-black text-white">
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('baseFareLabel')}</span>
                <span className="font-mono text-emerald-300">{offerBaseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('perKmLabel')}</span>
                <span className="font-mono text-emerald-300">{offerPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-1 text-[11px] sm:text-xs">
                <span className="text-slate-400">{t('perMinLabel')}</span>
                <span className="font-mono text-emerald-300">{offerPerMin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSilver && (isDumpingAmber || dumpingDeviationRatio > 0.15) && (
        <div className={styles.silverWarning}>
          {t('silverWarning')}
        </div>
      )}

      <div className={styles.pricingModeContainer}>
        {riderPreference ? (
          <div className={styles.riderPrefBadge}>
            <Lock className={styles.riderPrefIcon} />
            <span>
              {t('pricingModeLockedByRider', {
                mode: t(
                  riderPreference === 'APP'
                    ? 'appPriceMode'
                    : riderPreference === 'TAXI'
                    ? 'taxiMeterMode'
                    : 'freePriceMode'
                ),
              })}
            </span>
          </div>
        ) : (
          <div className={styles.noPrefBadge}>
            <Sparkles className={styles.noPrefIcon} />
            <span>{t('riderNoPreference')}</span>
          </div>
        )}
        <div className={styles.pricingButtonsGrid}>
          <button
            type="button"
            disabled={!!riderPreference}
            onClick={() => setPricingMode('FREE')}
            className={cn(
              styles.pricingBtnBase,
              pricingMode === 'FREE'
                ? styles.pricingBtnActive
                : styles.pricingBtnInactive,
              riderPreference && riderPreference !== 'FREE' && styles.pricingBtnDisabled
            )}
          >
            {t('freePriceMode')}
          </button>
          <button
            type="button"
            disabled={!!riderPreference}
            onClick={() => setPricingMode('APP')}
            className={cn(
              styles.pricingBtnBase,
              pricingMode === 'APP'
                ? styles.pricingBtnActive
                : styles.pricingBtnInactive,
              riderPreference && riderPreference !== 'APP' && styles.pricingBtnDisabled
            )}
          >
            {t('appPriceMode')}
          </button>
          <button
            type="button"
            disabled={!!riderPreference}
            onClick={() => setPricingMode('TAXI')}
            className={cn(
              styles.pricingBtnBase,
              pricingMode === 'TAXI'
                ? styles.pricingBtnActive
                : styles.pricingBtnInactive,
              riderPreference && riderPreference !== 'TAXI' && styles.pricingBtnDisabled
            )}
          >
            {t('taxiMeterMode')}
          </button>
        </div>
      </div>
    </>
  );
}
