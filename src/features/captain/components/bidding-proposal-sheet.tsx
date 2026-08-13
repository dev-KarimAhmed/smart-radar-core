'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Minus, Plus, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
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
  language,
  request,
  currency,
  isSubmitting,
  onSubmit,
  onIgnore,
}: BiddingProposalSheetProps) {
  const copy = bidCopy[language];
  const baseFare = Number(request.offerPrice || 0);
  const [captainTierData, setCaptainTierData] = React.useState<CaptainTierData>({ tier: 'SILVER', rating: 5 });
  const premiumFactor = getTierPremiumFactor(captainTierData.tier);
  const maxIncreaseAmount = roundMoney(baseFare * premiumFactor);
  const maxTierPrice = roundMoney(Math.max(baseFare + maxIncreaseAmount, 1));
  const tierLabel = getTierLabel(captainTierData.tier, language);
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
  const dumpingDeviationPercent = baseFare > 0 ? Math.max(0, Math.round(((baseFare - finalOfferPrice) / baseFare) * 1000) / 10) : 0;

  const isAmberDeviation = isTierAmber || isDumpingAmber;
  const isBlockedDeviation = isTierBlocked || isDumpingBlocked;
  const canSubmit = Number.isFinite(finalOfferPrice) && finalOfferPrice > 0 && !isSubmitting && !isBlockedDeviation;

  return (
    <section className={styles.style103_1}>
      <div className={styles.style104_2}>
        <div>
          <p className={styles.style106_3}>{copy.badge}</p>
          <h1 className={styles.style107_4}>{copy.title}</h1>
          <p className={styles.style108_5}>{copy.subtitle}</p>
        </div>
        <button onClick={onIgnore} className={styles.style110_6} aria-label={copy.ignore}>
          <X className={styles.style111_7} />
        </button>
      </div>

      <div className={styles.style115_8}>
        <p className={styles.style116_9}>{copy.destination}</p>
        <h2 className={styles.style117_10}>{request.dropoff || copy.unknownDestination}</h2>
        <div className={styles.style118_11}>
          <Info label={copy.h3} value={request.h3Index ? request.h3Index.slice(-8).toUpperCase() : '-'} />
          <Info label={copy.distance} value={`${request.estimatedDistance || 0} km`} />
          <Info label={copy.serverFare} value={`${baseFare.toFixed(2)} ${currency}`} />
        </div>
      </div>

      <div className={styles.style125_12}>
        <div className={styles.style126_13}>
          <div>
            <p className={styles.style128_14}>
              <Sparkles className={styles.style129_15} />
              {copy.tierPremium}
            </p>
            <p className={styles.style132_16}>
              {premiumFactor > 0
                ? copy.tierPremiumDescription
                    .replace('{tier}', tierLabel)
                    .replace('{percent}', String(Math.round(premiumFactor * 100)))
                : copy.noTierPremium.replace('{tier}', tierLabel)}
            </p>
          </div>

          <div className={styles.style141_17}>
            <p className={styles.style142_18}>{copy.maxIncrease}</p>
            <p className={styles.style143_19}>{maxIncreaseAmount.toFixed(2)} {currency}</p>
            {premiumFactor > 0 ? (
              <p className={styles.style145_20}>
                {copy.maxFinalPrice}: {maxTierPrice.toFixed(2)} {currency}
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
            {copy.applyMaxIncrease}
          </button>
        ) : null}
      </div>

      <div className={styles.style163_22}>
        <label className={styles.style164_23}>{copy.increaseAmount}</label>
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
            <span className={styles.style189_32}>{copy.finalOffer}</span>
            <strong className={styles.style190_33}>{finalOfferPrice.toFixed(2)} {currency}</strong>
          </div>
          <p className={styles.style192_34}>
            {copy.finalFormula
              .replace('{base}', baseFare.toFixed(2))
              .replace('{adjustment}', `${normalizedIncreaseAmount >= 0 ? '+' : ''}${normalizedIncreaseAmount.toFixed(2)}`)
              .replace('{currency}', currency)}
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
              ? copy.fareTestCrimsonBadge
              : isDumpingAmber
                ? copy.fareTestAmberBadge.replace('{percent}', String(dumpingDeviationPercent))
                : copy.fareTestNormalBadge}
          </span>
        </div>

        {isTierAmber ? (
          <div className={styles.style201_35}>
            <AlertTriangle className={styles.style202_36} />
            {copy.tierAmberWarning}
          </div>
        ) : null}

        {isTierBlocked ? (
          <div className={styles.style208_37}>
            <AlertTriangle className={styles.style209_38} />
            {copy.tierCrimsonBlock}
          </div>
        ) : null}

        {isDumpingAmber ? (
          <div className={styles.style201_35}>
            <AlertTriangle className={styles.style202_36} />
            {copy.dumpingAmberWarning}
          </div>
        ) : null}

        {isDumpingBlocked ? (
          <div className={styles.style208_37}>
            <AlertTriangle className={styles.style209_38} />
            {copy.dumpingCrimsonBlock}
          </div>
        ) : null}
      </div>

      <div className={styles.style215_39}>
        <button
          onClick={() => onSubmit(finalOfferPrice)}
          disabled={!canSubmit}
          className={styles.style219_40}
        >
          {isSubmitting ? <Loader2 className={styles.style221_41} /> : <Send className={styles.style221_42} />}
          {copy.submit}
        </button>
        <button onClick={onIgnore} className={styles.style224_43}>
          {copy.ignore}
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

const bidCopy = {
  ar: {
    badge: 'عرض سعر',
    title: 'تقديم عرض للراكب',
    subtitle: 'راجع الوجهة والسعر الأساسي، ثم أرسل عرضك. لن تبدأ الرحلة إلا بعد قبول الراكب من الخادم.',
    destination: 'الوجهة',
    unknownDestination: 'وجهة غير محددة',
    h3: 'خلية الطلب',
    distance: 'المسافة',
    serverFare: 'السعر الأساسي',
    offerAmount: 'قيمة العرض',
    increaseAmount: 'تعديل السعر (زيادة أو تخفيض)',
    tierPremium: 'زيادة اختيارية حسب رتبتك',
    tierPremiumDescription: 'رتبتك {tier} تسمح لك بزيادة من 1 إلى {percent}% فوق السعر الأساسي. اكتب قيمة الزيادة بنفسك.',
    noTierPremium: 'رتبتك الحالية {tier} لا تضيف زيادة اختيارية. يمكنك تقديم السعر الأساسي فقط.',
    suggestedPrice: 'السعر المقترح حسب الرتبة',
    maxIncrease: 'أقصى زيادة مسموحة',
    maxFinalPrice: 'أقصى عرض',
    applyTierPrice: 'تطبيق سعر الرتبة',
    applyMaxIncrease: 'استخدام أقصى زيادة',
    finalOffer: 'العرض النهائي',
    finalFormula: '{base} {adjustment} {currency}',
    tierAmberWarning: 'تنبيه: زيادتك تقترب من أقصى حد مسموح لرتبتك.',
    tierCrimsonBlock: 'لا يمكن تقديم العرض لأن الزيادة أعلى من الحد المسموح لرتبتك.',
    dumpingAmberWarning: 'تنبيه: عرضك أقل من السعر الأساسي بنسبة تؤثر على رتبتك وظهورك للركاب (اختبار Fare_test).',
    dumpingCrimsonBlock: 'تم قفل الإدخال: عرضك أقل من السعر الأساسي بأكثر من 15%، وهذا يُعد حرقاً للأسعار وغير مسموح (اختبار Fare_test).',
    fareTestNormalBadge: 'اختبار السعر: طبيعي',
    fareTestAmberBadge: 'اختبار السعر: تحذير ({percent}% أقل من الأساسي)',
    fareTestCrimsonBadge: 'اختبار السعر: محظور',
    submit: 'تقديم العرض',
    ignore: 'تجاهل',
  },
  en: {
    badge: 'Price offer',
    title: 'Submit an offer',
    subtitle: 'Review the destination and base fare, then send your offer. The trip only starts after server acceptance.',
    destination: 'Destination',
    unknownDestination: 'Unknown destination',
    h3: 'Request cell',
    distance: 'Distance',
    serverFare: 'Base fare',
    offerAmount: 'Offer amount',
    increaseAmount: 'Price adjustment (increase or discount)',
    tierPremium: 'Optional increase by your tier',
    tierPremiumDescription: 'Your {tier} tier allows an increase from 1 to {percent}% above the base fare. Type the increase amount yourself.',
    noTierPremium: 'Your current {tier} tier does not add an optional increase. You can submit the base fare only.',
    suggestedPrice: 'Tier suggested price',
    maxIncrease: 'Maximum allowed increase',
    maxFinalPrice: 'Maximum offer',
    applyTierPrice: 'Apply tier price',
    applyMaxIncrease: 'Use max increase',
    finalOffer: 'Final offer',
    finalFormula: '{base} {adjustment} {currency}',
    tierAmberWarning: 'Warning: your increase is approaching the maximum allowed for your tier.',
    tierCrimsonBlock: 'This offer is blocked because the increase is higher than your tier limit.',
    dumpingAmberWarning: 'Warning: your offer is below the base fare by enough to affect your rank and visibility to riders (Fare_test).',
    dumpingCrimsonBlock: 'Input locked: your offer is more than 15% below the base fare, which counts as price dumping and is not allowed (Fare_test).',
    fareTestNormalBadge: 'Fare test: normal',
    fareTestAmberBadge: 'Fare test: warning ({percent}% below base)',
    fareTestCrimsonBadge: 'Fare test: blocked',
    submit: 'Submit offer',
    ignore: 'Ignore',
  },
} as const;

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

function getTierLabel(tier: CaptainTier, language: 'ar' | 'en') {
  const labels = {
    ar: {
      PLATINUM: 'بلاتيني',
      GOLD: 'ذهبي',
      SILVER: 'فضي',
      BRONZE: 'برونزي',
    },
    en: {
      PLATINUM: 'Platinum',
      GOLD: 'Gold',
      SILVER: 'Silver',
      BRONZE: 'Bronze',
    },
  } as const;

  return labels[language][tier];
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}
