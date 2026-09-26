'use client';

import React from 'react';
import { Loader2, Minus, Navigation, Plus, Search, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
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
  scanRow: "grid grid-cols-12 gap-2.5",
  scanCard: "col-span-8 flex items-center gap-2.5 rounded-xl border border-[#14B8A6]/25 bg-[#0B1220] p-3 shadow-lg shadow-black/15 min-w-0",
  scanIconWrapper: "relative flex h-9 w-9 shrink-0 items-center justify-center",
  scanPing1: "absolute h-8 w-8 animate-ping rounded-full border border-[#14B8A6]/50",
  scanPing2: "absolute h-5 w-5 animate-ping rounded-full border border-[#14F5D5]/40 [animation-delay:180ms]",
  scanPulse: "absolute h-5 w-5 animate-pulse rounded-full bg-[#14B8A6]/20",
  scanIcon: "relative z-10 h-4 w-4 text-[#14F5D5]",
  scanText: "min-w-0 text-start",
  scanTitle: "text-xs font-black text-white leading-tight",
  scanSubtitle: "mt-0.5 text-[9px] leading-relaxed text-slate-400 line-clamp-1",
  captainCountCard: "col-span-4 flex flex-col items-center justify-center rounded-xl border border-[#14B8A6]/25 bg-[#0B1220] p-2 text-center shadow-lg shadow-black/15 min-w-0",
  captainCountIconWrap: "flex h-6 w-6 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]",
  captainCountIcon: "h-3.5 w-3.5",
  captainCountLabel: "mt-1 line-clamp-2 text-[9px] font-black leading-tight text-slate-300",
  captainCountValue: "mt-0.5 font-mono text-base sm:text-lg font-black text-[#14F5D5]",
} as const;

export interface DestinationTripSummaryProps {
  riderCount: number;
  setRiderCount: (updater: (current: number) => number) => void;
  pricingPreference?: 'APP' | 'TAXI' | 'FREE' | null;
  setPricingPreference?: (pref: 'APP' | 'TAXI' | 'FREE' | null) => void;
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
  isCaptainScanPreviewActive?: boolean;
  onSendRequest: () => void;
}

export function DestinationTripSummary({
  riderCount,
  setRiderCount,
  pricingPreference,
  setPricingPreference,
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
  isCaptainScanPreviewActive = false,
  onSendRequest,
}: DestinationTripSummaryProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');
  const locale = useLocale();
  const isArabic = locale === 'ar';

  return (
    <>
      {destinationDataError ? (
        <div className={styles.dataError}>
          {destinationDataError}
        </div>
      ) : null}

      {/* 1. ملخص الرحلة (Trip Summary Card) - ABOVE the scanning card */}
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

      {/* 2. جاري البحث عن سائقين + عدد السائقين المتاحين - SIDE BY SIDE */}
      {isCaptainScanPreviewActive ? (
        <div className={styles.scanRow}>
          <div className={styles.scanCard} role="status">
            <div className={styles.scanIconWrapper}>
              {nearbyCaptainCount === 0 ? (
                <>
                  <span className={styles.scanPing1} />
                  <span className={styles.scanPing2} />
                </>
              ) : null}
              <span className={styles.scanPulse} />
              <Search className={styles.scanIcon} />
            </div>
            <div className={styles.scanText}>
              <p className={styles.scanTitle}>
                {nearbyCaptainCount > 0
                  ? locationCopy('captains_found', { count: nearbyCaptainCount })
                  : locationCopy('status_scanning_captains')}
              </p>
              <p className={styles.scanSubtitle}>
                {locationCopy('captain_search_origin_helper')}
              </p>
            </div>
          </div>

          <div className={styles.captainCountCard} role="status">
            <span className={styles.captainCountIconWrap}>
              <Users className={styles.captainCountIcon} />
            </span>
            <span className={styles.captainCountLabel}>
              {locationCopy('nearby_captains_label')}
            </span>
            <strong className={styles.captainCountValue}>
              {nearbyCaptainCount}
            </strong>
          </div>
        </div>
      ) : null}

      {/* 3. عدد الركاب (Passenger Stepper) */}
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

      {serverFareError && (
        <div className={styles.fareError}>
          {serverFareError}
        </div>
      )}

      {/* 4. اطلب الآن (Submit Button) */}
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
          {isSendingRideRequest ? t('request.sending') : isSameLocation ? t('panel.whereTo') : t('request.now')}
        </button>
      </div>
    </>
  );
}
