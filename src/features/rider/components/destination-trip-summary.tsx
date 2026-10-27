'use client';

import React from 'react';
import {
  Clock,
  Loader2,
  Lock,
  Minus,
  Navigation,
  Plus,
  Route,
  Users,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { RiderLocation } from './rider-map';
import { DestinationSummaryCard } from './destination-summary-card';

const styles = {
  dataError: "rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200",
  passengerRow: "flex items-center justify-between rounded-xl border border-white/8 bg-[#0B1220] p-3 shadow-lg shadow-black/15 transition-colors",
  passengerRowAttention: "border-amber-500/40 bg-amber-500/[0.04]",
  passengerLabelWrap: "flex items-center gap-2.5",
  passengerTextCol: "flex flex-col text-start",
  passengerRequiredBadge: "text-[10px] font-bold text-amber-400 animate-pulse",
  passengerIcon: "flex h-8 w-8 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#14F5D5]",
  passengerIconGlyph: "h-4 w-4",
  passengerLabel: "text-xs font-black text-white",
  stepper: "flex items-center gap-2.5 rounded-lg border border-white/8 bg-black/30 p-1",
  stepperButton: "flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer",
  stepperIcon: "h-3.5 w-3.5",
  stepperValue: "w-6 text-center font-mono text-sm font-black text-white",
  stepperValueZero: "text-amber-400 font-black",
  stepperIncrement: "flex h-8 w-8 items-center justify-center rounded-md border border-[#14B8A6]/30 bg-[#14B8A6]/15 text-[#14F5D5] transition hover:bg-[#14B8A6]/25 active:scale-95 cursor-pointer",
  stepperIncrementPrompt: "border-amber-400/50 bg-amber-400/20 text-amber-300 shadow-sm shadow-amber-500/20",
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
  isLocationDisabled?: boolean;
  onEnableLocation?: () => void;
  onSendRequest: (passengerCount?: number) => void;
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
  isLocationDisabled = false,
  onEnableLocation,
  onSendRequest,
}: DestinationTripSummaryProps) {
  const locationCopy = useTranslations('location');
  const t = useTranslations('riderView');
  const locale = useLocale();
  const isArabic = locale === 'ar';

  const isPassengerCountZero = riderCount <= 0;
  const isSubmitDisabled =
    isSendingRideRequest ||
    isServerFareLoading ||
    !hasDestinationOptions ||
    !selectedDestinationHasCoords ||
    !hasServerEstimatedFare ||
    isSameLocation ||
    isPassengerCountZero;

  return (
    <>
      {destinationDataError ? (
        <div className={styles.dataError}>
          {destinationDataError}
        </div>
      ) : null}

      {/* 1. ملخص الرحلة (Trip Summary Card) */}
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

      {/* Step 4: Page 5 - Hidden pre-request scan row per client requirement (حذف الحقول / إخفاء) */}

      {/* 2. عدد الركاب (Passenger Stepper) */}
      <div className={cn(styles.passengerRow, isPassengerCountZero && styles.passengerRowAttention)}>
        <div className={styles.passengerLabelWrap}>
          <span className={styles.passengerIcon}>
            <Users className={styles.passengerIconGlyph} />
          </span>
          <div className={styles.passengerTextCol}>
            <span className={styles.passengerLabel}>{locationCopy('passengers_label')}</span>
            {isPassengerCountZero ? (
              <span className={styles.passengerRequiredBadge}>
                {locationCopy('passengers_required')}
              </span>
            ) : null}
          </div>
        </div>
        <div className={styles.stepper}>
          <button
            type="button"
            onClick={() => setRiderCount((current) => Math.max(0, current - 1))}
            disabled={riderCount <= 0}
            className={styles.stepperButton}
            aria-label="-"
          >
            <Minus className={styles.stepperIcon} />
          </button>
          <output className={cn(styles.stepperValue, isPassengerCountZero && styles.stepperValueZero)} aria-live="polite">
            {riderCount}
          </output>
          <button
            type="button"
            onClick={() => setRiderCount((current) => Math.min(6, current + 1))}
            className={cn(styles.stepperIncrement, isPassengerCountZero && styles.stepperIncrementPrompt)}
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

      {/* 3. اطلب الآن (Submit Button) */}
      <div className={styles.submitWrapper}>
        {isLocationDisabled ? (
          <button
            type="button"
            onClick={onEnableLocation}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black transition-all active:scale-[0.99] cursor-pointer shadow-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-400/30"
          >
            <Lock className="h-5 w-5" />
            <span>{isArabic ? 'تفعيل إذن الموقع لبدء الطلب' : 'Enable Location to Request'}</span>
          </button>
        ) : (
          <button
            onClick={() => onSendRequest(riderCount)}
            disabled={isSubmitDisabled}
            className={cn(
              styles.submitButton,
              isSubmitDisabled ? styles.submitButtonDisabled : styles.submitButtonEnabled,
            )}
          >
            {isSendingRideRequest ? (
              <Loader2 className={styles.submitButtonLoadingIcon} />
            ) : (
              <Navigation className={styles.submitButtonIcon} />
            )}
            {isSendingRideRequest
              ? t('request.sending')
              : isSameLocation
              ? t('panel.whereTo')
              : isPassengerCountZero
              ? t('request.selectPassengersFirst')
              : t('request.now')}
          </button>
        )}
      </div>
    </>
  );
}
