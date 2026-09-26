'use client';

import React from 'react';
import {
  Clock,
  Loader2,
  Minus,
  Navigation,
  Plus,
  Route,
  Search,
  Users,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { RiderLocation } from './rider-map';
import { DestinationSummaryCard } from './destination-summary-card';

const styles = {
  dataError: "rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200",
  scanRow: "grid grid-cols-12 gap-2.5",
  scanCard: "col-span-8 flex items-center gap-2.5 rounded-xl border border-[#14B8A6]/25 bg-[#0B1220] p-3 shadow-lg shadow-black/15 min-w-0",
  scanIconWrapper: "relative flex h-9 w-9 shrink-0 items-center justify-center",
  scanPing1: "absolute h-8 w-8 animate-ping rounded-full border border-[#14B8A6]/50",
  scanPing2: "absolute h-5 w-5 animate-ping rounded-full border border-[#14F5D5]/40 [animation-delay:180ms]",
  scanPulse: "absolute h-5 w-5 animate-pulse rounded-full bg-[#14B8A6]/20",
  scanIcon: "relative z-10 h-4 w-4 text-[#14F5D5]",
  scanText: "min-w-0 text-start",
  scanTitle: "text-xs font-black text-white leading-snug",
  captainCountCard: "col-span-4 flex flex-col items-center justify-center rounded-xl border border-[#14B8A6]/25 bg-[#0B1220] p-2 text-center shadow-lg shadow-black/15 min-w-0",
  captainCountIconWrap: "flex h-6 w-6 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]",
  captainCountIcon: "h-3.5 w-3.5",
  captainCountLabel: "mt-1 line-clamp-2 text-[9px] font-black leading-tight text-slate-300",
  captainCountValue: "mt-0.5 font-mono text-base sm:text-lg font-black text-[#14F5D5]",
  passengerRow: "flex items-center justify-between rounded-xl border border-white/8 bg-[#0B1220] p-3 shadow-lg shadow-black/15",
  passengerLabelWrap: "flex items-center gap-2.5",
  passengerIcon: "flex h-8 w-8 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]",
  passengerIconGlyph: "h-4 w-4",
  passengerLabel: "text-xs font-black text-white",
  stepper: "flex items-center gap-2.5 rounded-lg border border-white/8 bg-black/30 p-1",
  stepperButton: "flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
  stepperIcon: "h-3.5 w-3.5",
  stepperValue: "w-6 text-center font-mono text-sm font-black text-white",
  stepperIncrement: "flex h-8 w-8 items-center justify-center rounded-md border border-[#14B8A6]/30 bg-[#14B8A6]/15 text-[#14F5D5] transition hover:bg-[#14B8A6]/25 active:scale-95 cursor-pointer",
  fareError: "rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200",
  submitWrapper: "pt-1",
  submitButton: "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black transition-all active:scale-[0.99] cursor-pointer shadow-xl",
  submitButtonDisabled: "border border-slate-700 bg-slate-800 text-slate-400 cursor-not-allowed opacity-50",
  submitButtonEnabled: "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#2DD4BF] shadow-[#14B8A6]/20",
  submitButtonLoadingIcon: "h-5 w-5 animate-spin",
  submitButtonIcon: "h-5 w-5",
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
  isCaptainScanPreviewActive = true,
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
