'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { AlertOctagon, CheckCircle2, Clock, ExternalLink, Loader2, Lock, MapPin, Navigation, Phone, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';

import { cn } from '@/lib/utils';
import { useTripCountdown } from '@/shared/hooks/use-trip-countdown';
import { getServerTime } from '@/lib/server-time';
import { useTripMutualCancellation } from '@/shared/hooks/use-trip-mutual-cancellation';
import { isMapsLink } from '@/shared/services/google-maps-location';

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
  style55_15: "mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-[#10B981] to-teal-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer",
  style56_16: "h-4 w-4 stroke-[2.5] text-slate-950",
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
  style95_1: "mt-4 grid gap-4 md:grid-cols-3",
  style96_1: "rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-4",
  style97_1: "flex items-center gap-1.5 text-xs font-black text-[#14F5D5]",
  style98_1: "h-3.5 w-3.5",
  style99_1: "mt-1 text-xl font-black",
  style100_1: "rounded-2xl border border-slate-800 bg-black/45 p-4",
  style101_1: "flex items-center gap-1.5 text-xs text-slate-400",
  style102_1: "h-3.5 w-3.5",
  style103_1: "mt-1 text-xl font-black font-mono",
  style103_2: "mt-1 text-xl font-black font-mono text-amber-300",
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
  handshakeAt?: number | null;
  isFullScreen?: boolean;
  onArrived: () => void;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onCancelTrip: () => void;
}

function playSystemNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {
      // Browser autoplay restriction handling
    });
  } catch {
    // Ignore audio constructor errors
  }
}

function useHandshakeCountdown(handshakeAt: number | null, step: CaptainTripStep) {
  const expiresAt = handshakeAt ? handshakeAt + SOVEREIGN_CONSTANTS.TRIP_FORGOTTEN_GRACE_MIN * 60 * 1000 : null;
  const [remainingMs, setRemainingMs] = React.useState(() => (expiresAt ? Math.max(0, expiresAt - getServerTime()) : 0));
  const alertedRef = React.useRef(false);

  React.useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return;
    }
    const update = () => {
      const rem = Math.max(0, expiresAt - getServerTime());
      setRemainingMs(rem);
      if (rem === 0 && step !== 'STARTED' && !alertedRef.current) {
        alertedRef.current = true;
        playSystemNotificationSound();
      }
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt, step]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds, isRunningLow: remainingMs > 0 && remainingMs <= 5 * 60 * 1000 };
}
// Hooks usePickupEtaTimer and useTripCountdownTimer have been replaced by useTripCountdown

export function ActiveTripTracker({
  language,
  request,
  rider,
  step,
  isCompleting,
  isCancelling,
  currency,
  driverLocation,
  handshakeAt = null,
  isFullScreen = false,
  onArrived,
  onStartTrip,
  onCompleteTrip,
  onCancelTrip,
}: ActiveTripTrackerProps) {
  const t = useTranslations('captainActiveTrip');
  const pickupT = useTranslations('captainPickup');

  const countdown = useTripCountdown({
    status: step === 'STARTED' ? 'in_progress' : (step === 'ARRIVED' ? 'arrived' : 'accepted'),
    acceptedAtMs: request.acceptedAtMs || handshakeAt || undefined,
    arrivedAtMs: request.arrivedAtMs,
    startedAtMs: request.startedAtMs,
    pickupEtaMinutes: request.pickup_eta_minutes,
    tripDurationMinutes: request.estimatedTime,
    tripDistanceKm: request.estimatedDistance,
  });

  const [alertedPickup, setAlertedPickup] = React.useState(false);
  const [alertedTrip, setAlertedTrip] = React.useState(false);

  React.useEffect(() => {
    if (countdown.phase === 'TO_PICKUP' && countdown.isOverdue && !alertedPickup) {
      setAlertedPickup(true);
      playSystemNotificationSound();
    }
    if (countdown.phase === 'ON_TRIP' && countdown.isOverdue && !alertedTrip) {
      setAlertedTrip(true);
      playSystemNotificationSound();
    }
  }, [countdown.phase, countdown.isOverdue, alertedPickup, alertedTrip]);

  const pickupDisplay = countdown.phase === 'TO_PICKUP' ? countdown.display : '0:00';
  const pickupIsZero = countdown.phase === 'TO_PICKUP' && countdown.isOverdue;
  const pickupIsArrived = ['ARRIVED', 'STARTED'].includes(step);
  
  const tripDisplay = countdown.phase === 'ON_TRIP' ? countdown.display : '0:00';

  useHandshakeCountdown(handshakeAt, step);
  const [isConfirmingCancel, setIsConfirmingCancel] = React.useState(false);
  const pickupLocation = request.exactPickupCoords || request.obfuscatedPickupCoords || request.pickupCoords || null;
  const isEnRouteToDropoff = step === 'STARTED';

  const tripDurationMinutes = Math.max(
    1,
    Number(request.estimatedTime) > 0
      ? Math.round(Number(request.estimatedTime))
      : Number(request.estimatedDistance) > 0
        ? Math.max(5, Math.round(Number(request.estimatedDistance) * 2.5))
        : (countdown.totalSeconds > 0 ? Math.round(countdown.totalSeconds / 60) : 20)
  );
  const totalTripSeconds = tripDurationMinutes * 60;

  let elapsedTripSeconds = 0;
  if (step === 'STARTED') {
    if (countdown.phase === 'ON_TRIP' && countdown.hasCountdown) {
      elapsedTripSeconds = countdown.isOverdue
        ? totalTripSeconds + countdown.overdueSeconds
        : Math.max(0, countdown.totalSeconds - countdown.remainingSeconds);
    } else if (request.startedAtMs) {
      elapsedTripSeconds = Math.max(0, Math.floor((getServerTime() - request.startedAtMs) / 1000));
    }
  }

  const completionFraction = totalTripSeconds > 0 ? (elapsedTripSeconds / totalTripSeconds) : 0;
  const isTripNinetyPercentComplete = step === 'STARTED' && (countdown.isOverdue || completionFraction >= 0.9);
  const remainingSecondsUntilNinety = Math.max(0, Math.ceil(totalTripSeconds * 0.9 - elapsedTripSeconds));
  const remainingMinutesUntilNinety = Math.ceil(remainingSecondsUntilNinety / 60);

  const dropoffCoords = request.dropoffCoords;
  const rawDropoff = request.dropoff?.trim();
  const isDropoffRawLink = Boolean(rawDropoff && isMapsLink(rawDropoff));

  const destinationGoogleMapsUrl = isDropoffRawLink
    ? rawDropoff
    : ((request as any).dropoffGoogleMapsUrl || (dropoffCoords?.lat && dropoffCoords?.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${dropoffCoords.lat},${dropoffCoords.lng}${driverLocation?.lat && driverLocation?.lng ? `&origin=${driverLocation.lat},${driverLocation.lng}` : ''}`
      : rawDropoff
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(rawDropoff)}${driverLocation?.lat && driverLocation?.lng ? `&origin=${driverLocation.lat},${driverLocation.lng}` : ''}`
        : null));

  const rawPickup = request.pickupLabel?.trim();
  const isPickupRawLink = Boolean(rawPickup && isMapsLink(rawPickup));

  const pickupGoogleMapsUrl = request.pickupGoogleMapsUrl
    ? request.pickupGoogleMapsUrl
    : isPickupRawLink
      ? rawPickup
      : (pickupLocation?.lat && pickupLocation?.lng
        ? `https://www.google.com/maps/dir/?api=1&destination=${pickupLocation.lat},${pickupLocation.lng}${driverLocation?.lat && driverLocation?.lng ? `&origin=${driverLocation.lat},${driverLocation.lng}` : ''}`
        : null);

  const handleStartTrip = () => {
    if (destinationGoogleMapsUrl) {
      try {
        window.open(destinationGoogleMapsUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('[ActiveTripTracker] Failed to open Google Maps on start:', e);
      }
    }
    onStartTrip();
  };

  const mutualCancel = useTripMutualCancellation({
    requestId: request.id,
    role: 'captain',
    tripDurationMinutes,
    initialCancelRequestedBy: request.cancel_requested_by,
    onCancelledConfirmed: onCancelTrip,
  });

  return (
    <section className={styles.style32_1}>
      <div className={styles.style33_2}>
        <div>
          <p className={styles.style35_3}>{t('badge')}</p>
          <h1 className={styles.style36_4}>{t('title')}</h1>
          <p className={styles.style37_5}>
            {step === 'ACCEPTED'
              ? (language === 'ar' ? 'توجه إلى موقع الالتقاء بالراكب، ثم اضغط على زر تأكيد الوصول فور بلوغك النقطة.' : 'Navigate to the rendezvous point and confirm your arrival.')
              : step === 'ARRIVED'
                ? (language === 'ar' ? 'أنت الآن في نقطة الالتقاء. بانتظار صعود الراكب بالمركبة للبدء.' : 'You have arrived. Waiting for the rider to board, then start the trip.')
                : (language === 'ar' ? 'الرحلة جارية نحو الوجهة. انطلق بأمان وفق مسار الخريطة المعتمد.' : 'Trip is in progress. Drive safely to destination.')}
          </p>
        </div>
        <span className={styles.style39_6}>
          {t(`steps.${step}`)}
        </span>
      </div>

      <div className={styles.style44_7}>
        <div className={styles.style45_8}>
          <div className="flex items-center justify-between gap-2">
            <p className={styles.style46_9}>{t('destination')}</p>
            {destinationGoogleMapsUrl && (step === 'STARTED' || step === 'ARRIVED') && (
              <a
                href={destinationGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{language === 'ar' ? 'فتح مسار الخريطة' : 'Open in Maps'}</span>
              </a>
            )}
          </div>
          <h2 className={styles.style47_10}>{request.dropoff || t('unknownDestination')}</h2>
        </div>

        {/* Rider Card: Shows Call button ONLY when ACCEPTED; When ARRIVED or STARTED, shows rider name ONLY */}
        <div className={styles.style51_12}>
          <p className={styles.style52_13}>{step === 'ACCEPTED' ? t('rider') : (language === 'ar' ? 'الراكب' : 'Rider')}</p>
          <h2 className={styles.style53_14}>{rider?.name || request.riderName || t('riderFallback')}</h2>
          {step === 'ACCEPTED' && (rider?.phone || request.riderPhone || (request as any).riderPhoneNumber) ? (
            <a href={`tel:${rider?.phone || request.riderPhone || (request as any).riderPhoneNumber}`} className={styles.style55_15}>
              <Phone className={styles.style56_16} />
              <span>{t('callRider')}</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* Rendezvous Card (كارد موقع الالتقاء): Visible ONLY when ACCEPTED; disappears immediately when arrived */}
      {step === 'ACCEPTED' && (
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
            {pickupGoogleMapsUrl ? (
              <a
                href={pickupGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pickupCardLink}
              >
                <ExternalLink className={styles.pickupCardLinkIcon} aria-hidden="true" />
                {pickupT('openPickupMap')}
              </a>
            ) : null}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className={cn("mt-4 grid gap-4", step === 'STARTED' ? "md:grid-cols-3" : "md:grid-cols-2")}>
        <div className={styles.style96_1}>
          <p className={styles.style97_1}>
            <Lock className={styles.style98_1} />
            {t('frozenPrice')}
          </p>
          <p className={styles.style99_1}>{Number(request.offerPrice || 0).toFixed(2)} {currency}</p>
        </div>

        {step === 'ACCEPTED' && (
          <div className={cn(styles.style100_1, pickupIsZero && !pickupIsArrived && 'border-amber-500/50 bg-amber-500/10')}>
            <p className={cn(styles.style101_1, pickupIsZero && !pickupIsArrived && 'text-amber-300')}>
              <Clock className={styles.style102_1} />
              {t('pickupEta')}
            </p>
            <p className={cn(styles.style103_1, pickupIsZero && !pickupIsArrived && 'text-amber-300 animate-pulse')}>
              {pickupDisplay}
            </p>
          </div>
        )}

        {step === 'ARRIVED' && (
          <div className={cn(styles.style100_1, 'border-emerald-500/30 bg-emerald-500/10')}>
            <p className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {language === 'ar' ? 'حالة التواجد' : 'Status'}
            </p>
            <p className="mt-1 text-sm sm:text-base font-black text-white">
              {t('arrivedStatus')}
            </p>
          </div>
        )}

        {step === 'STARTED' && (
          <>
            <div className={styles.style100_1}>
              <p className={styles.style101_1}>
                <Clock className={styles.style102_1} />
                {t('tripElapsed')}
              </p>
              <p className={styles.style103_1}>
                {tripDisplay}
              </p>
            </div>
            <div className={styles.style100_1}>
              <p className={styles.style101_1}>
                <Navigation className={styles.style102_1} />
                {language === 'ar' ? 'المدة التقديرية' : 'Estimated Time'}
              </p>
              <p className={styles.style103_1}>
                {tripDurationMinutes} {language === 'ar' ? 'دقيقة' : 'min'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Focused Action Steps (اي خطوة تنتهي تختفي تلقائياً) */}
      <div className="mt-5">
        {/* STEP 1: ACCEPTED -> Only show 'وصلت لنقطة الركوب' */}
        {step === 'ACCEPTED' && (
          <button
            type="button"
            onClick={onArrived}
            disabled={isCompleting}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:brightness-110 active:scale-[0.98] py-4 text-base font-black text-slate-950 shadow-[0_4px_24px_rgba(20,245,213,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5 stroke-[2.5]" />}
            <span>{t('arrived')}</span>
          </button>
        )}

        {/* STEP 2: ARRIVED -> 'وصلت' disappeared! Only show 'بدء الرحلة' which opens Google Maps on click */}
        {step === 'ARRIVED' && (
          <button
            type="button"
            onClick={handleStartTrip}
            disabled={isCompleting}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:brightness-110 active:scale-[0.98] py-4 text-base font-black text-slate-950 shadow-[0_4px_24px_rgba(20,245,213,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />}
            <span>{t('start')}</span>
          </button>
        )}

        {/* STEP 3: STARTED -> 'بدء الرحلة' disappeared! */}
        {step === 'STARTED' && (
          <div>
            {!isTripNinetyPercentComplete ? (
              /* Case 3A: Under 90% -> Explanatory card with progress bar */
              <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-black/50 p-4 sm:p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      <Clock className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{t('tripInProgressTitle')}</h3>
                      <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                        {t('tripNinetyNotice')}
                      </p>
                    </div>
                  </div>

                  {destinationGoogleMapsUrl && (
                    <a
                      href={destinationGoogleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-black text-cyan-200 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{t('openDestinationMap')}</span>
                    </a>
                  )}
                </div>

                {/* Progress bar to 90% */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>{t('tripMinutesRemaining', { minutes: remainingMinutesUntilNinety })}</span>
                    <span className="font-mono text-cyan-300">{Math.min(90, Math.round(completionFraction * 100))}% / 90%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, (completionFraction / 0.9) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Case 3B: Reached 90% -> Complete Trip button */
              <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={onCompleteTrip}
                  disabled={isCompleting}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 active:scale-[0.98] py-4 text-base font-black text-slate-950 shadow-[0_4px_24px_rgba(16,185,129,0.45)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCompleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldAlert className="h-5 w-5 stroke-[2.5]" />}
                  <span>{t('complete')}</span>
                </button>
                <p className="text-center text-xs text-emerald-300/80 font-bold">
                  {t('tripReadyToCompleteNotice')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.cancelSection}>
        {mutualCancel.pendingRequestFrom === 'rider' ? (
          <div className="space-y-3 rounded-2xl border-2 border-rose-500/50 bg-rose-950/40 p-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
              <AlertOctagon className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{language === 'ar' ? 'المستخدم يطلب إلغاء هذه الرحلة!' : 'Rider requested trip cancellation!'}</span>
            </div>
            <p className="text-xs text-rose-100/90 leading-relaxed">
              {language === 'ar'
                ? 'طلب المستخدم إلغاء الرحلة بالتوافق المشترك. هل توافق على إلغاء الرحلة؟'
                : 'The rider requested mutual cancellation. Do you agree to cancel?'}
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                disabled={mutualCancel.isProcessing || isCancelling}
                onClick={mutualCancel.acceptCancel}
                className="h-10 flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white transition cursor-pointer disabled:opacity-50"
              >
                {mutualCancel.isProcessing || isCancelling
                  ? (language === 'ar' ? 'جاري الإلغاء...' : 'Cancelling...')
                  : (language === 'ar' ? 'موافق على الإلغاء' : 'Accept Cancel')}
              </button>
              <button
                type="button"
                disabled={mutualCancel.isProcessing || isCancelling}
                onClick={mutualCancel.declineCancel}
                className="h-10 flex-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                {language === 'ar' ? 'رفض الإلغاء' : 'Decline'}
              </button>
            </div>
          </div>
        ) : mutualCancel.pendingRequestFrom === 'captain' ? (
          <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              <span>{language === 'ar' ? 'تم إرسال طلب إلغاء الرحلة... بانتظار موافقة المستخدم' : 'Cancellation requested... waiting for rider'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'يتطلب إلغاء الرحلة موافقة الطرفين. جاري انتظار رد المستخدم.'
                : 'Cancellation requires mutual agreement. Waiting for rider response.'}
            </p>
            <button
              type="button"
              disabled={mutualCancel.isProcessing}
              onClick={mutualCancel.revokeCancel}
              className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
            >
              {language === 'ar' ? 'تراجع عن طلب الإلغاء' : 'Revoke Request'}
            </button>
          </div>
        ) : !isConfirmingCancel ? (
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
            <p className={styles.cancelConfirmText}>
              {language === 'ar'
                ? 'يتطلب إلغاء الرحلة موافقة المستخدم. هل تود إرسال طلب الإلغاء؟'
                : 'Cancelling requires mutual agreement. Send cancellation request?'}
            </p>
            <div className={styles.cancelConfirmActions}>
              <button
                type="button"
                disabled={isCancelling || mutualCancel.isProcessing}
                onClick={async () => {
                  setIsConfirmingCancel(false);
                  await mutualCancel.requestCancel();
                }}
                className={styles.cancelConfirmButton}
              >
                {language === 'ar' ? 'إرسال طلب الإلغاء' : 'Send Request'}
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

