'use client';

import React from 'react';
import { RatingModal } from '@/components/dashboard/shared/rating-modal';
import { supabase } from '@/lib/supabase-client';
import type { RiderMachineAction, RiderMachineState } from '../state/rider-state-machine';
import { toCaptainOfferRank } from '../services/rider-offer-fields';
import { EmergencyContactDialog } from './emergency-contact-dialog';

// Pure composition component — both children own their full styling; every
// .tsx file must still declare a styles object per this repo's convention.
const styles = {} as const;

export interface RiderModalsProps {
  isArabic: boolean;
  state: RiderMachineState;
  dispatch: React.Dispatch<RiderMachineAction>;
  userId: string | undefined;
  onExitRequestFlow?: () => void;
  onRatingSuccess: () => void;
  showEmergencyContactDialog: boolean;
  setShowEmergencyContactDialog: (open: boolean) => void;
  onAddEmergencyNumber: () => void;
}

/** The rating modal (shown after a trip completes) and the emergency-contact dialog. */
export function RiderModals({
  isArabic,
  state,
  dispatch,
  userId,
  onExitRequestFlow,
  onRatingSuccess,
  showEmergencyContactDialog,
  setShowEmergencyContactDialog,
  onAddEmergencyNumber,
}: RiderModalsProps) {
  return (
    <>
      {state.screen === 'RATING_MODAL' && state.completedTrip?.captainId && state.requestId && userId && (
        <RatingModal
          isOpen={true}
          onClose={() => {
            dispatch({ type: 'SUBMIT_RATING' });
            onExitRequestFlow?.();
          }}
          tripId={state.requestId}
          captainId={state.completedTrip.captainId}
          reviewerId={userId}
          supabase={supabase}
          captainName={state.completedTrip.captainName}
          captainPhone={state.completedTrip.captainPhone}
          captainRank={toCaptainOfferRank(
            state.completedTrip.captain?.tier ||
              state.completedTrip.captain?.rank ||
              state.completedTrip.captain?.captain_rank,
          )}
          vehicleInfo={[state.completedTrip.vehicleType, state.completedTrip.vehiclePlate].filter(Boolean).join(' - ')}
          finalPrice={state.completedTrip.finalPrice}
          onSuccess={() => {
            onRatingSuccess();
            dispatch({ type: 'SUBMIT_RATING' });
            onExitRequestFlow?.();
          }}
        />
      )}

      <EmergencyContactDialog
        isArabic={isArabic}
        open={showEmergencyContactDialog}
        onOpenChange={setShowEmergencyContactDialog}
        onAddNumber={onAddEmergencyNumber}
      />
    </>
  );
}
