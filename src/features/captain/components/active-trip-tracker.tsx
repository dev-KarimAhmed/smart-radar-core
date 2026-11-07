'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';
import { cn } from '@/lib/utils';
import { useTripCountdown } from '@/shared/hooks/use-trip-countdown';
import { getServerTime } from '@/lib/server-time';
import { useTripMutualCancellation } from '@/shared/hooks/use-trip-mutual-cancellation';
import { isMapsLink } from '@/shared/services/google-maps-location';
import { supabase } from '@/lib/supabase-client';
import { styles } from './active-trip/active-trip-tracker-styles';
import { playSystemNotificationSound, useHandshakeCountdown } from './active-trip/active-trip-helpers';
import { ActiveTripPickupCard } from './active-trip/active-trip-pickup-card';
import { ActiveTripStepFlow } from './active-trip/active-trip-step-flow';
import { ActiveTripCancellationSection } from './active-trip/active-trip-cancellation-section';

const PickupNavigationMap = dynamic(
  () => import('./pickup-navigation-map').then((m) => m.PickupNavigationMap),
  { ssr: false },
);

export interface ActiveTripTrackerProps {
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

  const rawRiderPhone = rider?.phone || request.riderPhone || (request as any).riderPhoneNumber || '';
  const cleanPhone = rawRiderPhone.replace(/\D/g, '');
  const arrivalWhatsappMsg = language === 'ar'
    ? 'مرحباً، أنا الكابتن ووصلت إلى نقطة الالتقاء وأنا بانتظارك في المركبة'
    : 'Hello, I have arrived at the pickup location and I am waiting for you in the vehicle.';
  const whatsappArrivalUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(arrivalWhatsappMsg)}`
    : null;
  const phoneCallUrl = cleanPhone ? `tel:${cleanPhone}` : null;

  const [riderTrackingActive, setRiderTrackingActive] = React.useState(false);

  React.useEffect(() => {
    if (!request?.id) return;
    const channelName = `trip-tracking-${request.id}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false } },
    });
    channel
      .on('broadcast', { event: 'RIDER_TRACKING_ACTIVE' }, () => {
        setRiderTrackingActive(true);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [request?.id]);

  const mutualCancel = useTripMutualCancellation({
    requestId: request.id,
    role: 'captain',
    tripDurationMinutes,
    startedAtMs: request.startedAtMs,
    acceptedAtMs: request.acceptedAtMs,
    arrivedAtMs: request.arrivedAtMs,
    pickupEtaMinutes: request.pickup_eta_minutes,
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
            {step === 'ARRIVED' ? t('stepArrivedDesc') : t('stepAcceptedDesc')}
          </p>
        </div>
        <span className={styles.style39_6}>
          {language === 'ar' ? 'الرحلة جارية' : 'In Progress'}
        </span>
      </div>

      {/* Main Details Grid */}
      <div className={styles.style44_7}>
        <div className={styles.style45_8}>
          <div className="flex items-center justify-between gap-2">
            <p className={styles.style46_9}>{t('rider')}</p>
            {phoneCallUrl ? (
              <a
                href={phoneCallUrl}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <span>{language === 'ar' ? 'اتصال بالراكب' : 'Call rider'}</span>
              </a>
            ) : null}
          </div>
          <p className={styles.style47_10}>{rider?.name || request.riderName || t('anonymousRider')}</p>
          {rider?.phone ? (
            <p className={styles.style48_11}>{rider.phone}</p>
          ) : request.riderPhone ? (
            <p className={styles.style48_11}>{request.riderPhone}</p>
          ) : null}
        </div>

        <div className={styles.style51_12}>
          <p className={styles.style52_13}>{t('destination')}</p>
          <p className={styles.style53_14}>{request.dropoff || t('unknownDestination')}</p>
          {destinationGoogleMapsUrl ? (
            <a
              href={destinationGoogleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.style55_15}
            >
              <ExternalLink className={styles.style56_16} />
              <span>{t('openMapsNavigation')}</span>
            </a>
          ) : null}
        </div>
      </div>

      {riderTrackingActive && (
        <div className={styles.trackingNotice}>
          <div className={styles.trackingNoticeIconWrap}>
            <ShieldAlert className={styles.trackingNoticeIcon} />
          </div>
          <div className={styles.trackingNoticeContent}>
            <p className={styles.trackingNoticeTitle}>
              {language === 'ar' ? 'الراكب يتابع وصولك الآن على شاشة التتبع' : 'Rider is actively tracking your location'}
            </p>
            <p className={styles.trackingNoticeBody}>
              {language === 'ar' ? 'تم فتح شاشة مراقبة الرحلة المباشرة لدى الراكب.' : 'Live trip tracking active on rider side.'}
            </p>
          </div>
        </div>
      )}

      {/* Pickup Card & Stats */}
      <ActiveTripPickupCard
        step={step}
        request={request}
        pickupT={pickupT}
        t={t}
        pickupGoogleMapsUrl={pickupGoogleMapsUrl}
        currency={currency}
        pickupIsZero={pickupIsZero}
        pickupIsArrived={pickupIsArrived}
        pickupDisplay={pickupDisplay}
        language={language}
        tripDisplay={tripDisplay}
        tripDurationMinutes={tripDurationMinutes}
      />

      {/* In-app navigation map */}
      <div className={cn("mt-4", isFullScreen && "hidden")}>
        <PickupNavigationMap
          driverLocation={driverLocation}
          targetLocation={isEnRouteToDropoff ? (dropoffCoords || null) : pickupLocation}
          targetLabel={isEnRouteToDropoff ? (request.dropoff || 'الوجهة') : (request.pickupLabel || pickupT('pickupLocation'))}
          isApproaching={pickupIsZero}
          mode={isEnRouteToDropoff ? 'dropoff' : 'pickup'}
        />
      </div>

      {/* Action Steps Flow */}
      <ActiveTripStepFlow
        step={step}
        language={language}
        request={request}
        currency={currency}
        tripDurationMinutes={tripDurationMinutes}
        isCompleting={isCompleting}
        isCancelling={isCancelling}
        whatsappArrivalUrl={whatsappArrivalUrl ?? undefined}
        phoneCallUrl={phoneCallUrl ?? undefined}
        destinationGoogleMapsUrl={destinationGoogleMapsUrl ?? undefined}
        isTripNinetyPercentComplete={isTripNinetyPercentComplete}
        remainingMinutesUntilNinety={remainingMinutesUntilNinety}
        completionFraction={completionFraction}
        onArrived={onArrived}
        onStartTrip={handleStartTrip}
        onCompleteTrip={onCompleteTrip}
        onOpenCancelConfirm={() => setIsConfirmingCancel(true)}
        t={t}
      />

      {/* Cancellation Section */}
      <ActiveTripCancellationSection
        language={language}
        step={step}
        isConfirmingCancel={isConfirmingCancel}
        setIsConfirmingCancel={setIsConfirmingCancel}
        isCompleting={isCompleting}
        isCancelling={isCancelling}
        mutualCancel={mutualCancel}
        onCancelTrip={onCancelTrip}
        t={t}
      />
    </section>
  );
}
