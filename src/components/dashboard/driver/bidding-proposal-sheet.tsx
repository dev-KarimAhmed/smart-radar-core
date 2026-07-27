'use client';

import React from 'react';
import { AlertTriangle, Loader2, Minus, Plus, Send, Sparkles, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { supabase } from '@/lib/supabase-client';

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
  const finalOfferPrice = roundMoney(baseFare + Math.max(0, normalizedIncreaseAmount));

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
  const isAmberDeviation = maxIncreaseAmount > 0 && normalizedIncreaseAmount > maxIncreaseAmount * 0.8 && normalizedIncreaseAmount <= maxIncreaseAmount;
  const isBlockedDeviation = normalizedIncreaseAmount < 0 || normalizedIncreaseAmount > maxIncreaseAmount;
  const canSubmit = Number.isFinite(finalOfferPrice) && finalOfferPrice > 0 && !isSubmitting && !isBlockedDeviation;

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-[#14B8A6]">{copy.badge}</p>
          <h1 className="mt-1 text-2xl font-black">{copy.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{copy.subtitle}</p>
        </div>
        <button onClick={onIgnore} className="rounded-2xl border border-white/10 p-3 text-slate-300 hover:bg-white/10" aria-label={copy.ignore}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-black/45 p-4">
        <p className="text-xs text-slate-400">{copy.destination}</p>
        <h2 className="mt-1 text-xl font-black">{request.dropoff || copy.unknownDestination}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Info label={copy.h3} value={request.h3Index ? request.h3Index.slice(-8).toUpperCase() : '-'} />
          <Info label={copy.distance} value={`${request.estimatedDistance || 0} km`} />
          <Info label={copy.serverFare} value={`${baseFare.toFixed(2)} ${currency}`} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#14B8A6]/20 bg-[#0B2A2A]/25 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#14B8A6]">
              <Sparkles className="h-4 w-4" />
              {copy.tierPremium}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {premiumFactor > 0
                ? copy.tierPremiumDescription
                    .replace('{tier}', tierLabel)
                    .replace('{percent}', String(Math.round(premiumFactor * 100)))
                : copy.noTierPremium.replace('{tier}', tierLabel)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-start sm:min-w-48">
            <p className="text-xs font-bold text-slate-400">{copy.maxIncrease}</p>
            <p className="mt-1 text-xl font-black text-white">{maxIncreaseAmount.toFixed(2)} {currency}</p>
            {premiumFactor > 0 ? (
              <p className="mt-1 text-xs font-bold text-[#14B8A6]">
                {copy.maxFinalPrice}: {maxTierPrice.toFixed(2)} {currency}
              </p>
            ) : null}
          </div>
        </div>

        {premiumFactor > 0 ? (
          <button
            type="button"
            onClick={() => setIncreaseAmount(maxIncreaseAmount)}
            className="mt-3 rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-4 py-3 text-sm font-black text-[#5eead4] hover:bg-[#14B8A6]/15"
          >
            {copy.applyMaxIncrease}
          </button>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4">
        <label className="text-sm font-black text-emerald-200">{copy.increaseAmount}</label>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIncreaseAmount((value) => Math.max(0, roundMoney(value - step)))}
            className="rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10"
          >
            <Minus className="h-5 w-5" />
          </button>
          <input
            value={Number(increaseAmount).toString()}
            onChange={(event) => setIncreaseAmount(Number(event.target.value))}
            inputMode="decimal"
            className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-4 text-center text-2xl font-black text-white outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => setIncreaseAmount((value) => roundMoney(value + step))}
            className="rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-bold text-slate-400">{copy.finalOffer}</span>
            <strong className="text-xl font-black text-white">{finalOfferPrice.toFixed(2)} {currency}</strong>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {copy.finalFormula
              .replace('{base}', baseFare.toFixed(2))
              .replace('{increase}', Math.max(0, normalizedIncreaseAmount).toFixed(2))
              .replace('{currency}', currency)}
          </p>
        </div>

        {isAmberDeviation ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3 text-sm font-bold text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {copy.amberWarning}
          </div>
        ) : null}

        {isBlockedDeviation ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-500/45 bg-red-500/10 p-3 text-sm font-bold text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {copy.crimsonBlock}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onSubmit(finalOfferPrice)}
          disabled={!canSubmit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-5 py-4 font-black text-[#06111f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {copy.submit}
        </button>
        <button onClick={onIgnore} className="rounded-2xl border border-white/10 px-5 py-4 font-bold text-slate-300 hover:bg-white/10">
          {copy.ignore}
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
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
    increaseAmount: 'قيمة الزيادة',
    tierPremium: 'زيادة اختيارية حسب رتبتك',
    tierPremiumDescription: 'رتبتك {tier} تسمح لك بزيادة من 1 إلى {percent}% فوق السعر الأساسي. اكتب قيمة الزيادة بنفسك.',
    noTierPremium: 'رتبتك الحالية {tier} لا تضيف زيادة اختيارية. يمكنك تقديم السعر الأساسي فقط.',
    suggestedPrice: 'السعر المقترح حسب الرتبة',
    maxIncrease: 'أقصى زيادة مسموحة',
    maxFinalPrice: 'أقصى عرض',
    applyTierPrice: 'تطبيق سعر الرتبة',
    applyMaxIncrease: 'استخدام أقصى زيادة',
    finalOffer: 'العرض النهائي',
    finalFormula: '{base} + {increase} {currency}',
    amberWarning: 'تنبيه: عرضك يبتعد عن توازن السوق المستهدف.',
    crimsonBlock: 'لا يمكن تقديم العرض لأن الزيادة أعلى من الحد المسموح لرتبتك.',
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
    increaseAmount: 'Increase amount',
    tierPremium: 'Optional increase by your tier',
    tierPremiumDescription: 'Your {tier} tier allows an increase from 1 to {percent}% above the base fare. Type the increase amount yourself.',
    noTierPremium: 'Your current {tier} tier does not add an optional increase. You can submit the base fare only.',
    suggestedPrice: 'Tier suggested price',
    maxIncrease: 'Maximum allowed increase',
    maxFinalPrice: 'Maximum offer',
    applyTierPrice: 'Apply tier price',
    applyMaxIncrease: 'Use max increase',
    finalOffer: 'Final offer',
    finalFormula: '{base} + {increase} {currency}',
    amberWarning: 'Warning: your offer is moving away from the target market balance.',
    crimsonBlock: 'This offer is blocked because the increase is higher than your tier limit.',
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
