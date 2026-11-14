'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import {
  setCaptainCancelCooldown,
  clearCaptainCancelCooldown,
  calculateRemainingCooldown,
} from '@/features/captain/services/captain-cancel-cooldown';
import {
  type MutualCancelRole,
  normalizeCancelRole,
  type PostCommitExpectationLock,
} from './mutual-cancellation-helpers';
import { playAlertSound } from './mutual-cancellation/mutual-cancel-transport';
import { useMutualCancelSubscription } from './mutual-cancellation/use-mutual-cancel-subscription';
import { useMutualCancelActions } from './mutual-cancellation/use-mutual-cancel-actions';
import { useMutualCancelServerSync } from './mutual-cancellation/use-mutual-cancel-server-sync';

export interface UseTripMutualCancellationProps {
  requestId?: string;
  role: MutualCancelRole;
  tripDurationMinutes?: number;
  startedAtMs?: number | string | Date | null;
  acceptedAtMs?: number | string | Date | null;
  arrivedAtMs?: number | string | Date | null;
  pickupEtaMinutes?: number | null;
  scheduledEndTime?: number | string | Date | null;
  initialCancelRequestedBy?: MutualCancelRole | null;
  onCancelledConfirmed?: () => Promise<void> | void;
}

export interface UseTripMutualCancellationReturn {
  pendingRequestFrom: MutualCancelRole | null;
  isProcessing: boolean;
  requestCancel: () => Promise<void>;
  acceptCancel: () => Promise<void>;
  declineCancel: () => Promise<void>;
  revokeCancel: () => Promise<void>;
}

export function useTripMutualCancellation({
  requestId,
  role,
  tripDurationMinutes = 20,
  startedAtMs = null,
  acceptedAtMs = null,
  arrivedAtMs = null,
  pickupEtaMinutes = null,
  scheduledEndTime = null,
  initialCancelRequestedBy = null,
  onCancelledConfirmed,
}: UseTripMutualCancellationProps): UseTripMutualCancellationReturn {
  const { toast } = useToast();
  const normalizedInitialCancelBy = normalizeCancelRole(initialCancelRequestedBy);
  const [pendingRequestFrom, setPendingRequestFrom] = useState<MutualCancelRole | null>(
    normalizedInitialCancelBy
  );
  const pendingFromRef = useRef<MutualCancelRole | null>(pendingRequestFrom);
  useEffect(() => {
    pendingFromRef.current = pendingRequestFrom;
  }, [pendingRequestFrom]);

  const mutationEpochRef = useRef(0);
  const inFlightMutationsRef = useRef(0);
  const postCommitLockRef = useRef<PostCommitExpectationLock | null>(null);
  const confirmedCancelHandledRef = useRef(false);
  const lastNotifiedCounterpartyRef = useRef<MutualCancelRole | null>(null);
  const lastResolutionToastRef = useRef<{ event: 'DECLINE_CANCEL' | 'REVOKE_CANCEL'; atMs: number } | null>(null);

  const lastInitialRef = useRef<MutualCancelRole | null>(normalizedInitialCancelBy);
  useEffect(() => {
    if (inFlightMutationsRef.current > 0) {
      lastInitialRef.current = normalizedInitialCancelBy;
      return;
    }

    const lock = postCommitLockRef.current;
    if (lock && Date.now() < lock.untilMs && normalizedInitialCancelBy !== lock.expectedPendingFrom) {
      lastInitialRef.current = normalizedInitialCancelBy;
      return;
    }

    if (normalizedInitialCancelBy) {
      setPendingRequestFrom(normalizedInitialCancelBy);
    } else if (lastInitialRef.current !== null) {
      setPendingRequestFrom(null);
    }
    lastInitialRef.current = normalizedInitialCancelBy;
  }, [normalizedInitialCancelBy]);

  const [isProcessing, setIsProcessing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const onCancelledConfirmedRef = useRef(onCancelledConfirmed);
  useEffect(() => {
    onCancelledConfirmedRef.current = onCancelledConfirmed;
  }, [onCancelledConfirmed]);

  const durationMinutesRef = useRef(tripDurationMinutes);
  useEffect(() => {
    durationMinutesRef.current = Math.max(1, Math.round(Number(tripDurationMinutes) || 20));
  }, [tripDurationMinutes]);

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const startedAtMsRef = useRef(startedAtMs);
  useEffect(() => {
    startedAtMsRef.current = startedAtMs;
  }, [startedAtMs]);

  const acceptedAtMsRef = useRef(acceptedAtMs);
  useEffect(() => {
    acceptedAtMsRef.current = acceptedAtMs;
  }, [acceptedAtMs]);

  const arrivedAtMsRef = useRef(arrivedAtMs);
  useEffect(() => {
    arrivedAtMsRef.current = arrivedAtMs;
  }, [arrivedAtMs]);

  const pickupEtaMinutesRef = useRef(pickupEtaMinutes);
  useEffect(() => {
    pickupEtaMinutesRef.current = pickupEtaMinutes;
  }, [pickupEtaMinutes]);

  const scheduledEndTimeRef = useRef(scheduledEndTime);
  useEffect(() => {
    scheduledEndTimeRef.current = scheduledEndTime;
  }, [scheduledEndTime]);

  const applyCaptainFreeze = useCallback((durationMins?: number) => {
    if (role !== 'captain') return;
    const duration = durationMins && durationMins > 0 ? durationMins : durationMinutesRef.current;
    const { remainingMinutes, remainingSeconds, scheduledEndTimeMs } = calculateRemainingCooldown({
      totalTripMinutes: duration,
      startedAtMs: startedAtMsRef.current,
      acceptedAtMs: acceptedAtMsRef.current,
      arrivedAtMs: arrivedAtMsRef.current,
      pickupEtaMinutes: pickupEtaMinutesRef.current,
      scheduledEndTime: scheduledEndTimeRef.current,
      cancellationTime: Date.now(),
    });
    if (remainingSeconds > 0) {
      setCaptainCancelCooldown(remainingMinutes, remainingSeconds, scheduledEndTimeMs);
    } else {
      clearCaptainCancelCooldown();
    }
  }, [role]);

  const triggerCancelledConfirmedOnce = useCallback(async () => {
    if (confirmedCancelHandledRef.current) return;
    confirmedCancelHandledRef.current = true;
    try {
      if (onCancelledConfirmedRef.current) {
        await onCancelledConfirmedRef.current();
      }
    } catch {
      confirmedCancelHandledRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (pendingRequestFrom && pendingRequestFrom !== role) {
      if (lastNotifiedCounterpartyRef.current !== pendingRequestFrom) {
        lastNotifiedCounterpartyRef.current = pendingRequestFrom;
        playAlertSound();
        toastRef.current({
          title: role === 'captain' ? 'الراكب يطلب إلغاء الرحلة' : 'الكابتن يطلب إلغاء الرحلة',
          description: 'يتطلب الإلغاء موافقة الطرفين. يرجى تأكيد أو رفض الطلب.',
          variant: 'warning',
          duration: 8000,
        });
      }
    } else {
      lastNotifiedCounterpartyRef.current = null;
    }
  }, [pendingRequestFrom, role]);

  const { syncServerStatus } = useMutualCancelServerSync({
    inFlightMutationsRef,
    mutationEpochRef,
    postCommitLockRef,
    setPendingRequestFrom,
    applyCaptainFreeze,
    triggerCancelledConfirmedOnce,
  });

  useMutualCancelSubscription({
    requestId,
    role,
    channelRef,
    mutationEpochRef,
    inFlightMutationsRef,
    postCommitLockRef,
    confirmedCancelHandledRef,
    lastResolutionToastRef,
    toastRef,
    setPendingRequestFrom,
    applyCaptainFreeze,
    triggerCancelledConfirmedOnce,
    syncServerStatus,
  });

  const { requestCancel, acceptCancel, declineCancel, revokeCancel } = useMutualCancelActions({
    requestId,
    role,
    inFlightMutationsRef,
    pendingFromRef,
    durationMinutesRef,
    mutationEpochRef,
    postCommitLockRef,
    channelRef,
    toastRef,
    setIsProcessing,
    setPendingRequestFrom,
    applyCaptainFreeze,
    triggerCancelledConfirmedOnce,
  });

  return {
    pendingRequestFrom,
    isProcessing,
    requestCancel,
    acceptCancel,
    declineCancel,
    revokeCancel,
  };
}

export * from './mutual-cancellation/mutual-cancel-transport';
export * from './mutual-cancellation/use-mutual-cancel-subscription';
export * from './mutual-cancellation/use-mutual-cancel-actions';
export * from './mutual-cancellation/use-mutual-cancel-server-sync';
