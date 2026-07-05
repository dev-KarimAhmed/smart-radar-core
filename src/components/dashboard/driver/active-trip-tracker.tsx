'use client';

import React from 'react';
import { CheckCircle2, Loader2, Navigation, Phone, ShieldAlert } from 'lucide-react';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from './captain-state-machine';

interface ActiveTripTrackerProps {
  language: 'ar' | 'en';
  request: Trip;
  rider: User | null;
  step: CaptainTripStep;
  isCompleting: boolean;
  onArrived: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
}

export function ActiveTripTracker({
  language,
  request,
  rider,
  step,
  isCompleting,
  onArrived,
  onStartTrip,
  onCompleteTrip,
}: ActiveTripTrackerProps) {
  const copy = activeCopy[language];

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black text-[#14B8A6]">{copy.badge}</p>
          <h1 className="mt-1 text-2xl font-black">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{copy.subtitle}</p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
          {copy.steps[step] || copy.steps.ACCEPTED}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-black/45 p-4">
          <p className="text-xs text-slate-400">{copy.destination}</p>
          <h2 className="mt-1 text-xl font-black">{request.dropoff || copy.unknownDestination}</h2>
          <p className="mt-2 font-mono text-xs text-slate-500">H3: {request.h3Index ? request.h3Index.slice(-8).toUpperCase() : '-'}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-black/45 p-4">
          <p className="text-xs text-slate-400">{copy.rider}</p>
          <h2 className="mt-1 text-xl font-black">{rider?.name || copy.riderFallback}</h2>
          {rider?.phone ? (
            <a href={`tel:${rider.phone}`} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-3 py-2 text-sm font-bold text-emerald-300">
              <Phone className="h-4 w-4" />
              {copy.callRider}
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StepButton
          active={step === 'ACCEPTED'}
          done={['ARRIVED', 'STARTED'].includes(step)}
          disabled={isCompleting || step !== 'ACCEPTED'}
          icon={isCompleting && step === 'ACCEPTED' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
          label={copy.arrived}
          onClick={onArrived}
        />
        <StepButton
          active={step === 'ARRIVED'}
          done={step === 'STARTED'}
          disabled={isCompleting || step !== 'ARRIVED'}
          icon={isCompleting && step === 'ARRIVED' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          label={copy.start}
          onClick={onStartTrip}
        />
        <StepButton
          active={step === 'STARTED'}
          disabled={isCompleting || step !== 'STARTED'}
          icon={isCompleting && step === 'STARTED' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5" />}
          label={copy.complete}
          onClick={onCompleteTrip}
        />
      </div>
    </section>
  );
}

function StepButton({
  active,
  done,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  done?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${
        done
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
          : active
            ? 'border-[#14B8A6] bg-[#14B8A6] text-[#06111f]'
            : 'border-white/10 bg-white/[0.03] text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const activeCopy = {
  ar: {
    badge: 'رحلة نشطة',
    title: 'متابعة الرحلة',
    subtitle: 'تم قبول عرضك من الخادم. اتبع الخطوات بالترتيب، ولن تتغير حالة الرحلة إلا بعد تأكيد قاعدة البيانات.',
    destination: 'الوجهة',
    unknownDestination: 'وجهة غير محددة',
    rider: 'الراكب',
    riderFallback: 'راكب',
    callRider: 'اتصال بالراكب',
    arrived: 'وصلت لنقطة الركوب',
    start: 'بدء الرحلة',
    complete: 'إنهاء الرحلة',
    steps: {
      IDLE: 'جاهز',
      OFFER_SUBMITTED: 'تم إرسال العرض',
      ACCEPTED: 'مقبولة',
      ARRIVED: 'وصلت',
      STARTED: 'جارية',
      COMPLETED: 'مكتملة',
    },
  },
  en: {
    badge: 'Active trip',
    title: 'Trip tracker',
    subtitle: 'Your offer was accepted by the server. Follow the steps in order; trip state changes only after database confirmation.',
    destination: 'Destination',
    unknownDestination: 'Unknown destination',
    rider: 'Rider',
    riderFallback: 'Rider',
    callRider: 'Call rider',
    arrived: 'Arrived at pickup',
    start: 'Start trip',
    complete: 'Complete trip',
    steps: {
      IDLE: 'Ready',
      OFFER_SUBMITTED: 'Offer submitted',
      ACCEPTED: 'Accepted',
      ARRIVED: 'Arrived',
      STARTED: 'In progress',
      COMPLETED: 'Completed',
    },
  },
} as const;
