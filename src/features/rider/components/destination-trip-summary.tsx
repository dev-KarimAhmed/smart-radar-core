'use client';

import React from 'react';
import { Loader2, Minus, Navigation, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { RiderLocation } from './rider-map';
import { DestinationSummaryCard } from './destination-summary-card';

const styles = {
  passengerRow: "flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111827]/80 p-3",
  passengerLabelWrap: "flex min-w-0 items-center gap-2.5",
  passengerIcon: "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/12 text-[#14F5D5]",
  passengerIconGlyph: "h-4 w-4",
  passengerLabel: "text-xs font-black text-slate-200",
  stepper: "flex h-10 items-center rounded-xl border border-white/10 bg-black/30 p-1",
  stepperButton: "flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-30",
  stepperIcon: "h-4 w-4",
  stepperValue: "w-10 text-center font-mono text-sm font-black text-white",
  stepperIncrement: "flex h-8 w-8 items-center justify-center rounded-lg text-[#14F5D5] transition hover:bg-[#14B8A6]/12",
  dataError: "rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold leading-relaxed text-amber-100",
  fareError: "rounded-2xl border border-red-500/30 bg-red-950/30 p-3 text-xs font-bold leading-relaxed text-red-100",
  sameLocationError: "text-xs font-bold text-red-500 text-center py-1 animate-pulse",
  submitWrapper: "pt-1",
  submitButton: "flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl bg-[#14B8A6] px-6 py-6 text-xl font-black text-[#0A0F1D] shadow-2xl shadow-[#14B8A6]/30 transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1D]",
  submitButtonDisabled: "cursor-not-allowed bg-gray-700 text-gray-400",
  submitButtonEnabled: "cursor-pointer bg-[#14B8A6] text-[#0A0F1D] hover:bg-[#2DD4BF] hover:shadow-[0_22px_48px_rgba(20,184,166,0.32)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
  submitButtonLoadingIcon: "h-5 w-5 animate-spin",
  submitButtonIcon: "h-5 w-5",
} as const;

export interface DestinationTripSummaryProps {
  riderCount: number;
  setRiderCount: (updater: (current: number) => number) => void;
  destinationDataError: string | null;
  destinationReady: boolean;
  isServerFareLoading: boolean;
  isDestinationPinMoving: boolean;
  destinationLabel: string;
  selectedDestinationCoords: RiderLocation | null;
  hasDestinationCoordsAnchor: boolean;
  serverFareLabel: string;
  isRouteEstimateLoading: boolean;
  estimatedDurationMinutes: number | null;
  estimatedDistanceKm: number | null;
  nearbyCaptainCount: number;
  serverFareError: string | null;
  isSameLocation: boolean;
  isSendingRideRequest: boolean;
  hasDestinationOptions: boolean;
  selectedDestinationHasCoords: boolean;
  hasServerEstimatedFare: boolean;
  onSendRequest: () => void;
}

export function DestinationTripSummary({
  riderCount,
  setRiderCount,
  destinationDataError,
  destinationReady,
  isServerFareLoading,
  isDestinationPinMoving,
  destinationLabel,
  selectedDestinationCoords,
  hasDestinationCoordsAnchor,
  serverFareLabel,
  isRouteEstimateLoading,
  estimatedDurationMinutes,
  estimatedDistanceKm,
  nearbyCaptainCount,
  serverFareError,
  isSameLocation,
  isSendingRideRequest,
  hasDestinationOptions,
  selectedDestinationHasCoords,
  hasServerEstimatedFare,
  onSendRequest,
}: DestinationTripSummaryProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');

  return (
    <>
      <div className={styles.passengerRow}>
        <div className={styles.passengerLabelWrap}>
          <span className={styles.passengerIcon}>
            <Users className={styles.passengerIconGlyph} />
          </span>
          <span className={styles.passengerLabel}>{locationCopy('passengers_label')}</span>
        </div>
        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => setRiderCount((current) => Math.max(1, current - 1))}
            disabled={riderCount <= 1}
            className={styles.stepperButton}
            aria-label="-"
          >
            <Minus className={styles.stepperIcon} />
          </button>
          <output className={styles.stepperValue} aria-live="polite">
            {riderCount}
          </output>
          <button
            type="button"
            onClick={() => setRiderCount((current) => current + 1)}
            className={styles.stepperIncrement}
            aria-label="+"
          >
            <Plus className={styles.stepperIcon} />
          </button>
        </div>
      </div>

      {destinationDataError ? (
        <div className={styles.dataError}>
          {destinationDataError}
        </div>
      ) : null}

      <DestinationSummaryCard
        destinationReady={destinationReady}
        isServerFareLoading={isServerFareLoading}
        isDestinationPinMoving={isDestinationPinMoving}
        destinationLabel={destinationLabel}
        selectedDestinationCoords={selectedDestinationCoords}
        hasDestinationCoordsAnchor={hasDestinationCoordsAnchor}
        serverFareLabel={serverFareLabel}
        isRouteEstimateLoading={isRouteEstimateLoading}
        estimatedDurationMinutes={estimatedDurationMinutes}
        estimatedDistanceKm={estimatedDistanceKm}
        nearbyCaptainCount={nearbyCaptainCount}
      />

      {serverFareError && (
        <div className={styles.fareError}>
          {serverFareError}
        </div>
      )}

      {isSameLocation && (
        <div className={styles.sameLocationError}>
          {t('destination.sameLocationError')}
        </div>
      )}

      <div className={styles.submitWrapper}>
        <button
          onClick={onSendRequest}
          disabled={
            isSendingRideRequest ||
            isServerFareLoading ||
            !hasDestinationOptions ||
            !selectedDestinationHasCoords ||
            !hasServerEstimatedFare ||
            isSameLocation
          }
          className={cn(
            styles.submitButton,
            isSameLocation ? styles.submitButtonDisabled : styles.submitButtonEnabled,
          )}
        >
          {isSendingRideRequest ? <Loader2 className={styles.submitButtonLoadingIcon} /> : <Navigation className={styles.submitButtonIcon} />}
          {isSendingRideRequest ? t('request.sending') : t('request.now')}
        </button>
      </div>
    </>
  );
}
