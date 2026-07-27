'use client';

import React from 'react';
import { CheckCircle2, Loader2, Navigation, Phone, ShieldAlert } from 'lucide-react';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';

import { cn } from '@/lib/utils';
const styles = {
  style32_1: "mx-auto max-w-4xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl",
  style33_2: "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
  style35_3: "text-xs font-black text-[#14B8A6]",
  style36_4: "mt-1 text-2xl font-black",
  style37_5: "mt-2 max-w-2xl text-sm leading-6 text-slate-400",
  style39_6: "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300",
  style44_7: "mt-5 grid gap-4 md:grid-cols-2",
  style45_8: "rounded-2xl border border-slate-800 bg-black/45 p-4",
  style46_9: "text-xs text-slate-400",
  style47_10: "mt-1 text-xl font-black",
  style48_11: "mt-2 font-mono text-xs text-slate-500",
  style51_12: "rounded-2xl border border-slate-800 bg-black/45 p-4",
  style52_13: "text-xs text-slate-400",
  style53_14: "mt-1 text-xl font-black",
  style55_15: "mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 px-3 py-2 text-sm font-bold text-emerald-300",
  style56_16: "h-4 w-4",
  style63_17: "mt-5 grid gap-3 md:grid-cols-3",
  style68_18: "h-5 w-5 animate-spin",
  style68_19: "h-5 w-5",
  style76_20: "h-5 w-5 animate-spin",
  style76_21: "h-5 w-5",
  style83_22: "h-5 w-5 animate-spin",
  style83_23: "h-5 w-5",
  style112_24: "flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-black transition disabled:cursor-not-allowed disabled:opacity-55",
  style114_25: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  style116_26: "border-[#14B8A6] bg-[#14B8A6] text-[#06111f]",
  style117_27: "border-white/10 bg-white/[0.03] text-slate-300",
} as const;


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
    <section className={styles.style32_1}>
      <div className={styles.style33_2}>
        <div>
          <p className={styles.style35_3}>{copy.badge}</p>
          <h1 className={styles.style36_4}>{copy.title}</h1>
          <p className={styles.style37_5}>{copy.subtitle}</p>
        </div>
        <span className={styles.style39_6}>
          {copy.steps[step] || copy.steps.ACCEPTED}
        </span>
      </div>

      <div className={styles.style44_7}>
        <div className={styles.style45_8}>
          <p className={styles.style46_9}>{copy.destination}</p>
          <h2 className={styles.style47_10}>{request.dropoff || copy.unknownDestination}</h2>
          <p className={styles.style48_11}>H3: {request.h3Index ? request.h3Index.slice(-8).toUpperCase() : '-'}</p>
        </div>

        <div className={styles.style51_12}>
          <p className={styles.style52_13}>{copy.rider}</p>
          <h2 className={styles.style53_14}>{rider?.name || copy.riderFallback}</h2>
          {rider?.phone ? (
            <a href={`tel:${rider.phone}`} className={styles.style55_15}>
              <Phone className={styles.style56_16} />
              {copy.callRider}
            </a>
          ) : null}
        </div>
      </div>

      <div className={styles.style63_17}>
        <StepButton
          active={step === 'ACCEPTED'}
          done={['ARRIVED', 'STARTED'].includes(step)}
          disabled={isCompleting || step !== 'ACCEPTED'}
          icon={isCompleting && step === 'ACCEPTED' ? <Loader2 className={styles.style68_18} /> : <Navigation className={styles.style68_19} />}
          label={copy.arrived}
          onClick={onArrived}
        />
        <StepButton
          active={step === 'ARRIVED'}
          done={step === 'STARTED'}
          disabled={isCompleting || step !== 'ARRIVED'}
          icon={isCompleting && step === 'ARRIVED' ? <Loader2 className={styles.style76_20} /> : <CheckCircle2 className={styles.style76_21} />}
          label={copy.start}
          onClick={onStartTrip}
        />
        <StepButton
          active={step === 'STARTED'}
          disabled={isCompleting || step !== 'STARTED'}
          icon={isCompleting && step === 'STARTED' ? <Loader2 className={styles.style83_22} /> : <ShieldAlert className={styles.style83_23} />}
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
      className={cn(styles.style112_24, done
          ? styles.style114_25
          : active
            ? styles.style116_26
            : styles.style117_27)}
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
