'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, MapPin, Minus, Plus, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { useCaptainProfessionalAd } from '../hooks/use-captain-professional-ad';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { cn } from '@/lib/utils';

const styles = {
  style103_1: "mx-auto max-w-3xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl",
  style104_2: "flex items-start justify-between gap-4",
  style106_3: "text-xs font-black text-[#14B8A6]",
  style107_4: "mt-1 text-2xl font-black",
  style108_5: "mt-2 text-sm leading-6 text-slate-400",
  style110_6: "rounded-2xl border border-white/10 p-3 text-slate-300 hover:bg-white/10",
  style111_7: "h-5 w-5",
  style115_8: "mt-5 rounded-2xl border border-slate-800 bg-black/45 p-4",
  style116_9: "text-xs text-slate-400",
  style117_10: "mt-1 text-xl font-black",
  style118_11: "mt-4 grid gap-3 sm:grid-cols-3",
  style125_12: "mt-5 rounded-2xl border border-[#14B8A6]/20 bg-[#0B2A2A]/25 p-4",
  style126_13: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  style128_14: "inline-flex items-center gap-2 text-sm font-black text-[#14B8A6]",
  style129_15: "h-4 w-4",
  style132_16: "mt-2 text-sm leading-6 text-slate-300",
  style141_17: "rounded-2xl border border-white/10 bg-black/35 p-3 text-start sm:min-w-48",
  style142_18: "text-xs font-bold text-slate-400",
  style143_19: "mt-1 text-xl font-black text-white",
  style145_20: "mt-1 text-xs font-bold text-[#14B8A6]",
  style156_21: "mt-3 rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 py-3 text-sm font-black text-[#5eead4] hover:bg-[#14B8A6]/15",
  style163_22: "mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4",
  style164_23: "text-sm font-black text-emerald-200",
  style165_24: "mt-3 flex items-center gap-3",
  style169_25: "rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10",
  style171_26: "h-5 w-5",
  style177_27: "min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-4 text-center text-2xl font-black text-white outline-none focus:border-emerald-400",
  style182_28: "rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10",
  style184_29: "h-5 w-5",
  style187_30: "mt-3 rounded-2xl border border-white/10 bg-black/30 p-3",
  style188_31: "flex items-center justify-between gap-3 text-sm",
  style189_32: "font-bold text-slate-400",
  style190_33: "text-xl font-black text-white",
  style192_34: "mt-1 text-xs text-slate-500",
  style201_35: "mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3 text-sm font-bold text-amber-200",
  style202_36: "mt-0.5 h-4 w-4 shrink-0",
  style208_37: "mt-3 flex items-start gap-2 rounded-2xl border border-red-500/45 bg-red-500/10 p-3 text-sm font-bold text-red-200",
  style209_38: "mt-0.5 h-4 w-4 shrink-0",
  style215_39: "mt-5 flex flex-col gap-3 sm:flex-row",
  style219_40: "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:cursor-not-allowed disabled:opacity-60",
  style221_41: "h-5 w-5 animate-spin",
  style221_42: "h-5 w-5",
  style224_43: "rounded-2xl border border-white/10 px-5 py-4 font-bold text-slate-300 hover:bg-white/10",
  style234_44: "rounded-xl border border-white/10 bg-white/[0.03] p-3",
  style235_45: "text-xs text-slate-500",
  style236_46: "mt-1 font-black text-white",
  fareTestBadge: "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black",
  fareTestBadgeNormal: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
  fareTestBadgeAmber: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
  fareTestBadgeCrimson: "bg-red-500/15 text-red-200 ring-1 ring-red-400/30",
  fareTestBadgeIcon: "h-3.5 w-3.5",
  inputLocked: "cursor-not-allowed opacity-50",
  professionalAdCard: "mt-3 h-[280px] rounded-[28px]",
} as const;


type CaptainTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';

type CaptainTierData = {
  tier: CaptainTier;
  rating: number;
};

interface BiddingProposalSheetProps {
  language: 'ar' | 'en';
  request: Trip;
  currency: string;
  isSubmitting: boolean;
  onSubmit: (price: number) => void;
  onIgnore: () => void;
}

export function BiddingProposalSheet({
  request,
  currency,
  isSubmitting,
  onSubmit,
  onIgnore,
}: BiddingProposalSheetProps) {
  const t = useTranslations('captainBidding');
  const pickupT = useTranslations('captainPickup');
  const baseFare = Number(request.offerPrice || 0);
  const [captainTierData, setCaptainTierData] = React.useState<CaptainTierData>({ tier: 'SILVER', rating: 5 });
  const premiumFactor = getTierPremiumFactor(captainTierData.tier);
  const maxIncreaseAmount = roundMoney(baseFare * premiumFactor);
  const maxTierPrice = roundMoney(Math.max(baseFare + maxIncreaseAmount, 1));
  const tierLabel = t(`tierLabels.${captainTierData.tier}`);
  const [increaseAmount, setIncreaseAmount] = React.useState(0);
  const normalizedIncreaseAmount = Number.isFinite(increaseAmount) ? increaseAmount : 0;
  const finalOfferPrice = roundMoney(baseFare + normalizedIncreaseAmount);

  React.useEffect(() => {
    setIncreaseAmount(0);
  }, [request.id]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadCaptainTier() {
      const { data: authData } = await supabase.auth.getUser();
      const captainId = authData.user?.id;
      if (!captainId) return;

      const [{ data: profile }, { data: captainProfile }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', captainId).maybeSingle(),
        supabase.from('captain_profiles').select('*').eq('id', captainId).maybeSingle(),
      ]);

      if (cancelled) return;

      const rating = Number(
        firstValue(
          profile?.trust_score,
          profile?.rating,
          profile?.rating_value,
          captainProfile?.trust_score,
          captainProfile?.rating,
        ) ?? 5,
      );
      const tier = normalizeCaptainTier(
        firstValue(
          captainProfile?.tier,
          captainProfile?.rank,
          captainProfile?.driver_rank,
          captainProfile?.captain_rank,
          captainProfile?.membership_tier,
          profile?.tier,
          profile?.rank,
          profile?.driver_rank,
          profile?.captain_rank,
          profile?.membership_tier,
        ),
        rating,
      );

      setCaptainTierData({ tier, rating: Number.isFinite(rating) ? rating : 5 });
    }

    void loadCaptainTier();

    return () => {
      cancelled = true;
    };
  }, []);

  const step = Math.max(0.25, roundMoney(Math.max(maxIncreaseAmount, baseFare * 0.01, 1) / 10));
  const minIncreaseAmount = baseFare > 1 ? roundMoney(-(baseFare - 1)) : 0;

  // Tier-based ceiling: how much a captain of this rank may charge ABOVE the server base fare.
  const isTierAmber = maxIncreaseAmount > 0 && normalizedIncreaseAmount > maxIncreaseAmount * 0.8 && normalizedIncreaseAmount <= maxIncreaseAmount;
  const isTierBlocked = normalizedIncreaseAmount > maxIncreaseAmount;

  // Fare_test anti-dumping brake: how far BELOW the server base fare the offer sits (5km/10min-style
  // reference deviation matrix from RadarAntiCheatKernel.enforceMarketBrakes — 10% amber, 15% crimson).
  const marketBrake = baseFare > 0 ? RadarAntiCheatKernel.enforceMarketBrakes(finalOfferPrice, baseFare) : { status: 'NORMAL' as const };
  const isDumpingAmber = marketBrake.status === 'AMBER_WARNING';
  const isDumpingBlocked = marketBrake.status === 'CRIMSON_BLOCK';
  const dumpingDeviationRatio = baseFare > 0 ? Math.max(0, (baseFare - finalOfferPrice) / baseFare) : 0;
  const dumpingDeviationPercent = Math.round(dumpingDeviationRatio * 1000) / 10;
  const professionalAd = useCaptainProfessionalAd(dumpingDeviationRatio, isDumpingBlocked);

  const isAmberDeviation = isTierAmber || isDumpingAmber;
  const isBlockedDeviation = isTierBlocked || isDumpingBlocked;
  const canSubmit = Number.isFinite(finalOfferPrice) && finalOfferPrice > 0 && !isSubmitting && !isBlockedDeviation;

  return (
    <section className={styles.style103_1}>
      <div className={styles.style104_2}>
        <div>
          <p className={styles.style106_3}>{t('badge')}</p>
          <h1 className={styles.style107_4}>{t('title')}</h1>
          <p className={styles.style108_5}>{t('subtitle')}</p>
        </div>
        <button onClick={onIgnore} className={styles.style110_6} aria-label={t('ignore')}>
          <X className={styles.style111_7} />
        </button>
      </div>

      <div className={styles.style115_8}>
        <p className={styles.style116_9}>{t('destination')}</p>
        <h2 className={styles.style117_10}>{request.dropoff || t('unknownDestination')}</h2>
        <div className={styles.style118_11}>
          <Info label={t('h3')} value={request.h3Index ? request.h3Index.slice(-8).toUpperCase() : '-'} />
          <Info
            label={t('distance')}
            value={request.estimatedDistance != null ? `${request.estimatedDistance} km` : pickupT('distanceUnavailable')}
          />
          <Info label={t('serverFare')} value={`${baseFare.toFixed(2)} ${currency}`} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-black text-cyan-200">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {pickupT('pickupLocation')}
            </p>
            <p className="mt-1 truncate text-sm font-black text-white">
              {request.pickupLabel || pickupT('pickupLocation')}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {request.pickupLocationIsApproximate ? pickupT('pickupApproximate') : pickupT('pickupExact')}
            </p>
          </div>
          {request.pickupGoogleMapsUrl ? (
            <a
              href={request.pickupGoogleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-400/25 px-3 py-2 text-xs font-black text-cyan-200 transition hover:border-cyan-300 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {pickupT('openPickupMap')}
            </a>
          ) : null}
        </div>
      </div>

      <div className={styles.style125_12}>
        <div className={styles.style126_13}>
          <div>
            <p className={styles.style128_14}>
              <Sparkles className={styles.style129_15} />
              {t('tierPremium')}
            </p>
            <p className={styles.style132_16}>
              {premiumFactor > 0
                ? t('tierPremiumDescription', { tier: tierLabel, percent: Math.round(premiumFactor * 100) })
                : t('noTierPremium', { tier: tierLabel })}
            </p>
          </div>

          <div className={styles.style141_17}>
            <p className={styles.style142_18}>{t('maxIncrease')}</p>
            <p className={styles.style143_19}>{maxIncreaseAmount.toFixed(2)} {currency}</p>
            {premiumFactor > 0 ? (
              <p className={styles.style145_20}>
                {t('maxFinalPrice')}: {maxTierPrice.toFixed(2)} {currency}
              </p>
            ) : null}
          </div>
        </div>

        {premiumFactor > 0 ? (
          <button
            type="button"
            onClick={() => setIncreaseAmount(maxIncreaseAmount)}
            className={styles.style156_21}
          >
            {t('applyMaxIncrease')}
          </button>
        ) : null}
      </div>

      <div className={styles.style163_22}>
        <label className={styles.style164_23}>{t('increaseAmount')}</label>
        <div className={styles.style165_24}>
          <button
            type="button"
            onClick={() => setIncreaseAmount((value) => Math.max(minIncreaseAmount, roundMoney(value - step)))}
            disabled={isBlockedDeviation}
            className={cn(styles.style169_25, isBlockedDeviation ? styles.inputLocked : '')}
          >
            <Minus className={styles.style171_26} />
          </button>
          <input
            value={Number(increaseAmount).toString()}
            onChange={(event) => setIncreaseAmount(Number(event.target.value))}
            disabled={isBlockedDeviation}
            inputMode="decimal"
            className={cn(styles.style177_27, isBlockedDeviation ? styles.inputLocked : '')}
          />
          <button
            type="button"
            onClick={() => setIncreaseAmount((value) => roundMoney(value + step))}
            disabled={isBlockedDeviation}
            className={cn(styles.style182_28, isBlockedDeviation ? styles.inputLocked : '')}
          >
            <Plus className={styles.style184_29} />
          </button>
        </div>
        <div className={styles.style187_30}>
          <div className={styles.style188_31}>
            <span className={styles.style189_32}>{t('finalOffer')}</span>
            <strong className={styles.style190_33}>{finalOfferPrice.toFixed(2)} {currency}</strong>
          </div>
          <p className={styles.style192_34}>
            {t('finalFormula', {
              base: baseFare.toFixed(2),
              adjustment: `${normalizedIncreaseAmount >= 0 ? '+' : ''}${normalizedIncreaseAmount.toFixed(2)}`,
              currency,
            })}
          </p>
          <span className={cn(
            styles.fareTestBadge,
            isDumpingBlocked ? styles.fareTestBadgeCrimson : isDumpingAmber ? styles.fareTestBadgeAmber : styles.fareTestBadgeNormal,
          )}>
            {isDumpingBlocked || isDumpingAmber ? (
              <AlertTriangle className={styles.fareTestBadgeIcon} />
            ) : (
              <CheckCircle2 className={styles.fareTestBadgeIcon} />
            )}
            {isDumpingBlocked
              ? t('fareTestCrimsonBadge')
              : isDumpingAmber
                ? t('fareTestAmberBadge', { percent: dumpingDeviationPercent })
                : t('fareTestNormalBadge')}
          </span>
        </div>

        {isTierAmber ? (
          <div className={styles.style201_35}>
            <AlertTriangle className={styles.style202_36} />
            {t('tierAmberWarning')}
          </div>
        ) : null}

        {isTierBlocked ? (
          <div className={styles.style208_37}>
            <AlertTriangle className={styles.style209_38} />
            {t('tierCrimsonBlock')}
          </div>
        ) : null}

        {isDumpingAmber ? (
          <div className={styles.style201_35}>
            <AlertTriangle className={styles.style202_36} />
            {t('dumpingAmberWarning')}
          </div>
        ) : null}

        {isDumpingBlocked ? (
          <div className={styles.style208_37}>
            <AlertTriangle className={styles.style209_38} />
            {t('dumpingCrimsonBlock')}
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
      </div>

      <div className={styles.style215_39}>
        <button
          onClick={() => onSubmit(finalOfferPrice)}
          disabled={!canSubmit}
          className={styles.style219_40}
        >
          {isSubmitting ? <Loader2 className={styles.style221_41} /> : <Send className={styles.style221_42} />}
          {t('submit')}
        </button>
        <button onClick={onIgnore} className={styles.style224_43}>
          {t('ignore')}
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.style234_44}>
      <p className={styles.style235_45}>{label}</p>
      <p className={styles.style236_46}>{value}</p>
    </div>
  );
}

function getTierPremiumFactor(tier: CaptainTier) {
  if (tier === 'PLATINUM') return 0.2;
  if (tier === 'GOLD') return 0.1;
  if (tier === 'BRONZE') return 0.05;
  return 0;
}

function normalizeCaptainTier(value: unknown, rating = 5): CaptainTier {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  if (normalized.includes('SILVER') || normalized.includes('فض')) return 'SILVER';
  if (rating >= 4.9) return 'PLATINUM';
  if (rating >= 4.7) return 'GOLD';
  if (rating >= 4.4) return 'SILVER';
  return 'BRONZE';
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}
