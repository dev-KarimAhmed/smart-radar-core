'use client';

import React from 'react';
import { AlertTriangle, Loader2, Minus, Plus, Send, X } from 'lucide-react';
import type { Trip } from '@/core/types';

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
  const [price, setPrice] = React.useState(() => Math.max(baseFare, 1));

  React.useEffect(() => {
    setPrice(Math.max(baseFare, 1));
  }, [baseFare, request.id]);

  const step = Math.max(0.25, Math.round(Math.max(baseFare, 1) * 0.05 * 100) / 100);
  const deviation = baseFare > 0 && Number.isFinite(price) ? Math.abs(price - baseFare) / baseFare : 0;
  const isAmberDeviation = deviation > 0.1 && deviation < 0.15;
  const isBlockedDeviation = deviation >= 0.15;
  const canSubmit = Number.isFinite(price) && price > 0 && !isSubmitting && !isBlockedDeviation;

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-500/20 bg-radar-abyss p-5 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-radar-teal">{copy.badge}</p>
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

      <div className="mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-950/10 p-4">
        <label className="text-sm font-black text-emerald-200">{copy.offerAmount}</label>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPrice((value) => Math.max(step, Math.round((value - step) * 100) / 100))}
            className="rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10"
          >
            <Minus className="h-5 w-5" />
          </button>
          <input
            value={Number(price).toString()}
            onChange={(event) => setPrice(Number(event.target.value))}
            inputMode="decimal"
            className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black px-4 py-4 text-center text-2xl font-black text-white outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => setPrice((value) => Math.round((value + step) * 100) / 100)}
            className="rounded-2xl border border-white/10 p-3 text-slate-200 hover:bg-white/10"
          >
            <Plus className="h-5 w-5" />
          </button>
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
          onClick={() => onSubmit(price)}
          disabled={!canSubmit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-radar-teal px-5 py-4 font-black text-radar-bg disabled:cursor-not-allowed disabled:opacity-60"
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
    amberWarning: 'تنبيه: عرضك يبتعد عن توازن السوق المستهدف.',
    crimsonBlock: 'لا يمكن تقديم هذا العرض لأنه يبتعد عن السعر الأساسي بنسبة 15% أو أكثر.',
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
    amberWarning: 'Warning: your offer is moving away from the target market balance.',
    crimsonBlock: 'This offer is blocked because it differs from the base fare by 15% or more.',
    submit: 'Submit offer',
    ignore: 'Ignore',
  },
} as const;
