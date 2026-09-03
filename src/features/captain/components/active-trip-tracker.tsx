'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AlertOctagon, CheckCircle2, ExternalLink, Loader2, Lock, MapPin, Navigation, Phone, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';
import { useTripCountdown } from '@/shared/hooks/use-trip-countdown';

import { cn } from '@/lib/utils';

// MapLibre GL touches browser-only APIs at import time, so this must load
// client-side only — same reason RadarMapView is dynamic-imported in
// captain-view.tsx. Without this, the surrounding UI (badge, recenter button)
// renders fine but the map itself silently never initializes.
const PickupNavigationMap = dynamic(
  () => import('./pickup-navigation-map').then((m) => m.PickupNavigationMap),
  { ssr: false },
);
const styles = {
  style32_1: "mx-auto max-w-4xl rounded-3xl border border-emerald-500/20 bg-[#05080f] p-5 text-white shadow-2xl",
  // Trip focus mode: the card is the whole screen, so it stretches to fill its flex parent
  // instead of sitting as a block with empty space under it.
  rootFullScreen: "flex w-full flex-1 flex-col rounded-3xl border border-emerald-500/20 bg-[#05080f] p-4 text-white shadow-2xl sm:p-5",
  // Pushes the step buttons and cancel to the bottom of a full-height card — the captain is
  // driving, and the action they need is under their thumb rather than mid-screen.
  actionsPinnedToBottom: "mt-auto pt-5",
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
  style90_1: "mt-5",
  style95_1: "mt-4 grid gap-4 md:grid-cols-2",
  countdownCard: "rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.07] p-4",
  countdownCardOverdue: "rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4",
  countdownLabel: "flex items-center gap-1.5 text-xs font-black text-cyan-200",
  countdownLabelOverdue: "flex items-center gap-1.5 text-xs font-black text-amber-200",
  countdownIcon: "h-3.5 w-3.5",
  countdownValue: "mt-1 font-mono text-xl font-black text-white",
  countdownValueOverdue: "mt-1 font-mono text-xl font-black text-amber-300",
  countdownValueIdle: "mt-1 font-mono text-xl font-black text-slate-500",
  style96_1: "rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-4",
  style97_1: "flex items-center gap-1.5 text-xs font-black text-[#14F5D5]",
  style98_1: "h-3.5 w-3.5",
  style99_1: "mt-1 text-xl font-black",
  pickupCard: "mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4",
  pickupCardRow: "flex items-start justify-between gap-3",
  pickupCardInfo: "min-w-0",
  pickupCardLabel: "flex items-center gap-1.5 text-xs font-black text-cyan-200",
  pickupCardIcon: "h-4 w-4",
  pickupCardValue: "mt-1 truncate text-sm font-black text-white",
  pickupCardHint: "mt-1 text-xs text-slate-400",
  pickupCardLink: "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-400/25 px-3 py-2 text-xs font-black text-cyan-200 transition hover:border-cyan-300 hover:text-white",
  pickupCardLinkIcon: "h-3.5 w-3.5",
  cancelSection: "mt-3",
  cancelButton: "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-55",
  cancelIcon: "h-4 w-4",
  cancelConfirmWrap: "space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4",
  cancelConfirmText: "text-center text-xs font-bold leading-relaxed text-red-200",
  cancelConfirmActions: "flex gap-2.5",
  cancelConfirmButton: "h-10 flex-1 rounded-lg bg-red-600 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-55",
  cancelBackButton: "h-10 flex-1 rounded-lg border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10",
} as const;


interface ActiveTripTrackerProps {
  language: 'ar' | 'en';
  request: Trip;
  rider: User | null;
  step: CaptainTripStep;
  isCompleting: boolean;
  isCancelling: boolean;
  currency: string;
  driverLocation: { lat: number; lng: number } | null;
  /** Rendered as the captain's whole screen with the dashboard tabs hidden. */
  isFullScreen?: boolean;
  onArrived: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onCancelTrip: () => void;
}

export function ActiveTripTracker({
  language,
  request,
  rider,
  step,
  isCompleting,
  isCancelling,
  currency,
  driverLocation,
  isFullScreen = false,
  onArrived,
  onStartTrip,
  onCompleteTrip,
  onCancelTrip,
}: ActiveTripTrackerProps) {
  const t = useTranslations('captainActiveTrip');
  const pickupT = useTranslations('captainPickup');
  const [isConfirmingCancel, setIsConfirmingCancel] = React.useState(false);
  const pickupLocation = request.exactPickupCoords || request.obfuscatedPickupCoords || request.pickupCoords || null;
  // Once the trip is actually started, the captain is driving the rider to
  // the destination — the map should track toward the dropoff, not the
  // pickup point they already reached.
  const isEnRouteToDropoff = step === 'STARTED';
  const navigationTarget = isEnRouteToDropoff ? (request.dropoffCoords || null) : pickupLocation;
  const navigationMode = isEnRouteToDropoff ? 'dropoff' : 'pickup';

  /**
   * The same countdown the rider is looking at, from the same server anchors.
   *
   * The captain's only timer used to be the forgotten-trip grace window, which counts down
   * from a fixed 30 minutes and says nothing about how long this leg should take. The step
   * is passed as the status because it is already synced from the request's status in
   * captain-view and is the value the buttons act on — deriving the phase from anything else
   * could put the timer and the buttons in different phases.
   */
  const countdown = useTripCountdown({
    status: step === 'STARTED' ? 'TRIP_ACTIVE' : step === 'ARRIVED' ? 'ARRIVED' : 'ACCEPTED',
    acceptedAtMs: request.acceptedAtMs,
    arrivedAtMs: request.arrivedAtMs,
    startedAtMs: request.startedAtMs,
    pickupEtaMinutes: request.pickupEtaMinutes,
    tripDurationMinutes: request.estimatedTime,
    tripDistanceKm: request.estimatedDistance,
  });

  const countdownLabel = countdown.phase === 'AT_PICKUP'
    ? t('countdownAtPickup')
    : !countdown.hasCountdown
      ? t('countdownUnavailable')
      : countdown.isOverdue
        ? (countdown.phase === 'ON_TRIP' ? t('countdownOvertime') : t('countdownLatePickup'))
        : (countdown.phase === 'ON_TRIP' ? t('countdownOnTrip') : t('countdownToPickup'));

  return (
    <section className={isFullScreen ? styles.rootFullScreen : styles.style32_1}>
      <div className={styles.style33_2}>
        <div>
          <p className={styles.style35_3}>{t('badge')}</p>
          <h1 className={styles.style36_4}>{t('title')}</h1>
          <p className={styles.style37_5}>{t('subtitle')}</p>
        </div>
        <span className={styles.style39_6}>
          {t(`steps.${step}`)}
        </span>
      </div>

      <div className={styles.style44_7}>
        <div className={styles.style45_8}>
          <p className={styles.style46_9}>{t('destination')}</p>
          <h2 className={styles.style47_10}>{request.dropoff || t('unknownDestination')}</h2>
          <p className={styles.style48_11}>H3: {request.h3Index ? request.h3Index.slice(-8).toUpperCase() : '-'}</p>
        </div>

        <div className={styles.style51_12}>
          <p className={styles.style52_13}>{t('rider')}</p>
          <h2 className={styles.style53_14}>{rider?.name || t('riderFallback')}</h2>
          {rider?.phone ? (
            <a href={`tel:${rider.phone}`} className={styles.style55_15}>
              <Phone className={styles.style56_16} />
              {t('callRider')}
            </a>
          ) : null}
        </div>
      </div>

      <div className={styles.pickupCard}>
        <div className={styles.pickupCardRow}>
          <div className={styles.pickupCardInfo}>
            <p className={styles.pickupCardLabel}>
              <MapPin className={styles.pickupCardIcon} aria-hidden="true" />
              {pickupT('pickupLocation')}
            </p>
            <p className={styles.pickupCardValue}>
              {request.pickupLabel || pickupT('pickupLocation')}
            </p>
            <p className={styles.pickupCardHint}>
              {request.pickupLocationIsApproximate ? pickupT('pickupApproximate') : pickupT('pickupExact')}
            </p>
          </div>
          {request.pickupGoogleMapsUrl ? (
            <a
              href={request.pickupGoogleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.pickupCardLink}
            >
              <ExternalLink className={styles.pickupCardLinkIcon} aria-hidden="true" />
              {pickupT('openPickupMap')}
            </a>
          ) : null}
        </div>
      </div>

      <div className={styles.style95_1}>
        <div className={styles.style96_1}>
          <p className={styles.style97_1}>
            <Lock className={styles.style98_1} />
            {t('frozenPrice')}
          </p>
          <p className={styles.style99_1}>{Number(request.offerPrice || 0).toFixed(2)} {currency}</p>
        </div>

        {/* The trip's own clock: time to reach the rider, then time left in the trip.
            Separate from the card beside it, which is the grace window before the server
            purges a forgotten trip — a completely different deadline that was previously the
            only timer here, so the captain had no idea how long either leg should take. */}
        <div
          className={countdown.isOverdue ? styles.countdownCardOverdue : styles.countdownCard}
          role="timer"
          aria-label={countdownLabel}
        >
          <p className={countdown.isOverdue ? styles.countdownLabelOverdue : styles.countdownLabel}>
            <Navigation className={styles.countdownIcon} />
            {countdownLabel}
          </p>
          {/* dir=ltr so an RTL run does not move the '+' to the far side of "+3:30". */}
          <p
            className={countdown.isOverdue
              ? styles.countdownValueOverdue
              : countdown.hasCountdown || countdown.phase === 'AT_PICKUP'
                ? styles.countdownValue
                : styles.countdownValueIdle}
            dir="ltr"
          >
            {countdown.display}
          </p>
        </div>

      </div>

      {/* <div className={styles.style90_1}>
        <PickupNavigationMap
          language={language}
          driverLocation={driverLocation}
          pickupLocation={navigationTarget}
          mode={navigationMode}
        />
      </div> */}

      <div className={cn(styles.style63_17, isFullScreen && styles.actionsPinnedToBottom)}>
        <StepButton
          active={step === 'ACCEPTED'}
          done={['ARRIVED', 'STARTED'].includes(step)}
          disabled={isCompleting || step !== 'ACCEPTED'}
          icon={isCompleting && step === 'ACCEPTED' ? <Loader2 className={styles.style68_18} /> : <Navigation className={styles.style68_19} />}
          label={t('arrived')}
          onClick={onArrived}
        />
        <StepButton
          active={step === 'ARRIVED'}
          done={step === 'STARTED'}
          disabled={isCompleting || step !== 'ARRIVED'}
          icon={isCompleting && step === 'ARRIVED' ? <Loader2 className={styles.style76_20} /> : <CheckCircle2 className={styles.style76_21} />}
          label={t('start')}
          onClick={onStartTrip}
        />
        <StepButton
          active={step === 'STARTED'}
          disabled={isCompleting || step !== 'STARTED'}
          icon={isCompleting && step === 'STARTED' ? <Loader2 className={styles.style83_22} /> : <ShieldAlert className={styles.style83_23} />}
          label={t('complete')}
          onClick={onCompleteTrip}
        />
      </div>

      <div className={styles.cancelSection}>
        {!isConfirmingCancel ? (
          <button
            type="button"
            disabled={isCompleting || isCancelling}
            onClick={() => setIsConfirmingCancel(true)}
            className={styles.cancelButton}
          >
            <AlertOctagon className={styles.cancelIcon} />
            {t('cancelTrip')}
          </button>
        ) : (
          <div className={styles.cancelConfirmWrap}>
            <p className={styles.cancelConfirmText}>{t('cancelConfirmText')}</p>
            <div className={styles.cancelConfirmActions}>
              <button
                type="button"
                disabled={isCancelling}
                onClick={onCancelTrip}
                className={styles.cancelConfirmButton}
              >
                {isCancelling ? t('cancelling') : t('confirmCancelButton')}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setIsConfirmingCancel(false)}
                className={styles.cancelBackButton}
              >
                {t('cancelBackButton')}
              </button>
            </div>
          </div>
        )}
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

