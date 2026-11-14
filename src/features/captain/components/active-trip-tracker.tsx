'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';
import { activeTripStyles as styles } from './active-trip/active-trip-styles';
import { useActiveTripTracker } from '../hooks/use-active-trip-tracker';
import { ActiveTripHeaderCard } from './active-trip/active-trip-header-card';
import { ActiveTripActionsPanel } from './active-trip/active-trip-actions-panel';
import { ActiveTripCancelSection } from './active-trip/active-trip-cancel-section';

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
  onCancelTrip: () => void | Promise<void>;
  onMutualCancelConfirmed?: () => void | Promise<void>;
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
  onArrived,
  onStartTrip,
  onCompleteTrip,
  onCancelTrip,
  onMutualCancelConfirmed,
}: ActiveTripTrackerProps) {
  const t = useTranslations('captainActiveTrip');
  const pickupT = useTranslations('captainPickup');

  const tracker = useActiveTripTracker({
    language,
    request,
    rider,
    step,
    driverLocation,
    handshakeAt,
    onStartTrip,
    onCancelTrip,
    onMutualCancelConfirmed,
  });

  return (
    <section className={styles.style32_1}>
      <ActiveTripHeaderCard
        language={language}
        request={request}
        rider={rider}
        step={step}
        destinationGoogleMapsUrl={tracker.destinationGoogleMapsUrl}
        pickupGoogleMapsUrl={tracker.pickupGoogleMapsUrl}
        pickupT={pickupT}
        riderTrackingActive={tracker.riderTrackingActive}
        currency={currency}
        pickupIsZero={tracker.pickupIsZero}
        pickupIsArrived={tracker.pickupIsArrived}
        pickupDisplay={tracker.pickupDisplay}
        tripDisplay={tracker.tripDisplay}
        tripDurationMinutes={tracker.tripDurationMinutes}
        t={t}
      />

      <ActiveTripActionsPanel
        step={step}
        language={language}
        request={request}
        currency={currency}
        tripDurationMinutes={tracker.tripDurationMinutes}
        whatsappArrivalUrl={tracker.whatsappArrivalUrl}
        phoneCallUrl={tracker.phoneCallUrl}
        handleStartTrip={tracker.handleStartTrip}
        destinationGoogleMapsUrl={tracker.destinationGoogleMapsUrl}
        isCompleting={isCompleting}
        isCancelling={isCancelling}
        isTripNinetyPercentComplete={tracker.isTripNinetyPercentComplete}
        completionFraction={tracker.completionFraction}
        remainingMinutesUntilNinety={tracker.remainingMinutesUntilNinety}
        onArrived={onArrived}
        onCompleteTrip={onCompleteTrip}
        setIsConfirmingCancel={tracker.setIsConfirmingCancel}
        t={t}
      />

      <ActiveTripCancelSection
        language={language}
        step={step}
        mutualCancel={tracker.mutualCancel}
        isConfirmingCancel={tracker.isConfirmingCancel}
        setIsConfirmingCancel={tracker.setIsConfirmingCancel}
        isCompleting={isCompleting}
        isCancelling={isCancelling}
        onCancelTrip={onCancelTrip}
        t={t}
      />
    </section>
  );
}

export function StepButton({
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
      className={cn(
        styles.style112_24,
        done ? styles.style114_25 : active ? styles.style116_26 : styles.style117_27
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export * from './active-trip/active-trip-styles';
export * from './active-trip/active-trip-header-card';
export * from './active-trip/active-trip-actions-panel';
export * from './active-trip/active-trip-cancel-section';
export * from '../hooks/use-active-trip-tracker';
