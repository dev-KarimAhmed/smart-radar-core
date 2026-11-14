'use client';

import React from 'react';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';
import { SOVEREIGN_CONSTANTS } from '@/core/constants/sovereign-protocols';
import { useTripCountdown } from '@/shared/hooks/use-trip-countdown';
import { getServerTime } from '@/lib/server-time';
import { useTripMutualCancellation } from '@/shared/hooks/use-trip-mutual-cancellation';
import { isMapsLink } from '@/shared/services/google-maps-location';
import { supabase } from '@/lib/supabase-client';
import { playSystemNotificationSound } from '../components/active-trip/active-trip-styles';

export function useHandshakeCountdown(handshakeAt: number | null, step: CaptainTripStep) {
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

interface UseActiveTripTrackerProps {
  language: 'ar' | 'en';
  request: Trip;
  rider: User | null;
  step: CaptainTripStep;
  driverLocation: { lat: number; lng: number } | null;
  handshakeAt?: number | null;
  onStartTrip: () => void;
  onCancelTrip: () => void | Promise<void>;
  onMutualCancelConfirmed?: () => void | Promise<void>;
}

export function useActiveTripTracker({
  language,
  request,
  rider,
  step,
  driverLocation,
  handshakeAt = null,
  onStartTrip,
  onCancelTrip,
  onMutualCancelConfirmed,
}: UseActiveTripTrackerProps) {
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
    const channel = supabase.channel(channelName, { config: { broadcast: { ack: false } } });
    channel.on('broadcast', { event: 'RIDER_TRACKING_ACTIVE' }, () => {
      setRiderTrackingActive(true);
    }).subscribe();

    return () => { void supabase.removeChannel(channel); };
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
    onCancelledConfirmed: onMutualCancelConfirmed || onCancelTrip,
  });

  return {
    pickupDisplay,
    pickupIsZero,
    pickupIsArrived,
    tripDisplay,
    tripDurationMinutes,
    isConfirmingCancel,
    setIsConfirmingCancel,
    isTripNinetyPercentComplete,
    completionFraction,
    remainingMinutesUntilNinety,
    destinationGoogleMapsUrl,
    pickupGoogleMapsUrl,
    handleStartTrip,
    whatsappArrivalUrl,
    phoneCallUrl,
    riderTrackingActive,
    mutualCancel,
  };
}
