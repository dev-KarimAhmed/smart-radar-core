import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  interpretMutualCancelMutationResult,
  type MutualCancelRole,
  type PostCommitExpectationLock,
} from '../mutual-cancellation-helpers';
import {
  fetchWithSupabaseAuthRetry,
  POST_COMMIT_GRACE_MS,
} from './mutual-cancel-transport';

export interface UseMutualCancelActionsResolutionParams {
  requestId?: string;
  role: MutualCancelRole;
  inFlightMutationsRef: React.MutableRefObject<number>;
  pendingFromRef: React.MutableRefObject<MutualCancelRole | null>;
  mutationEpochRef: React.MutableRefObject<number>;
  postCommitLockRef: React.MutableRefObject<PostCommitExpectationLock | null>;
  channelRef: React.MutableRefObject<ReturnType<typeof supabase.channel> | null>;
  toastRef: React.MutableRefObject<any>;
  setIsProcessing: (val: boolean) => void;
  setPendingRequestFrom: (val: MutualCancelRole | null) => void;
  applyCaptainFreeze: () => void;
  triggerCancelledConfirmedOnce: () => Promise<void>;
}

export function useMutualCancelActionsResolution({
  requestId,
  role,
  inFlightMutationsRef,
  pendingFromRef,
  mutationEpochRef,
  postCommitLockRef,
  channelRef,
  toastRef,
  setIsProcessing,
  setPendingRequestFrom,
  applyCaptainFreeze,
  triggerCancelledConfirmedOnce,
}: UseMutualCancelActionsResolutionParams) {
  const declineCancel = useCallback(async () => {
    if (!requestId || inFlightMutationsRef.current > 0) return;

    const prevPending = pendingFromRef.current;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current += 1;
    setIsProcessing(true);
    setPendingRequestFrom(null);

    try {
      const { res, data } = await fetchWithSupabaseAuthRetry('/api/trip/mutual-cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId, action: 'DECLINE', cancelledByRole: role }),
        requireAuthForInitialTry: true,
      });

      const outcome = interpretMutualCancelMutationResult(Boolean(res?.ok), data);
      if (!outcome.ok) {
        setPendingRequestFrom(prevPending);
        toastRef.current({
          variant: 'destructive',
          title: 'تعذر رفض طلب الإلغاء',
          description: 'حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى.',
        });
        return;
      }

      if (outcome.isClosed) {
        if (outcome.terminalStatus === 'CANCELLED') {
          applyCaptainFreeze();
          await triggerCancelledConfirmedOnce();
        }
        return;
      }

      postCommitLockRef.current = { expectedPendingFrom: null, untilMs: Date.now() + POST_COMMIT_GRACE_MS };

      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'DECLINE_CANCEL',
            payload: { fromRole: role, timestamp: Date.now() },
          });
        } catch {}
      }

      toastRef.current({
        title: 'تم رفض طلب الإلغاء',
        description: 'تستمر الرحلة بشكل طبيعي.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] declineCancel error:', err);
      setPendingRequestFrom(prevPending);
    } finally {
      inFlightMutationsRef.current = Math.max(0, inFlightMutationsRef.current - 1);
      setIsProcessing(false);
    }
  }, [applyCaptainFreeze, requestId, role, triggerCancelledConfirmedOnce]);

  const revokeCancel = useCallback(async () => {
    if (!requestId || inFlightMutationsRef.current > 0) return;

    const prevPending = pendingFromRef.current;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current += 1;
    setIsProcessing(true);
    setPendingRequestFrom(null);

    try {
      const { res, data } = await fetchWithSupabaseAuthRetry('/api/trip/mutual-cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId, action: 'REVOKE', cancelledByRole: role }),
        requireAuthForInitialTry: true,
      });

      const outcome = interpretMutualCancelMutationResult(Boolean(res?.ok), data);
      if (!outcome.ok) {
        setPendingRequestFrom(prevPending);
        toastRef.current({
          variant: 'destructive',
          title: 'تعذر التراجع عن طلب الإلغاء',
          description: 'حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى.',
        });
        return;
      }

      if (outcome.isClosed) {
        if (outcome.terminalStatus === 'CANCELLED') {
          applyCaptainFreeze();
          await triggerCancelledConfirmedOnce();
        }
        return;
      }

      postCommitLockRef.current = { expectedPendingFrom: null, untilMs: Date.now() + POST_COMMIT_GRACE_MS };

      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'REVOKE_CANCEL',
            payload: { fromRole: role, timestamp: Date.now() },
          });
        } catch {}
      }

      toastRef.current({
        title: 'تم التراجع عن طلب الإلغاء',
        description: 'تستمر الرحلة كالمعتاد.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] revokeCancel error:', err);
      setPendingRequestFrom(prevPending);
    } finally {
      inFlightMutationsRef.current = Math.max(0, inFlightMutationsRef.current - 1);
      setIsProcessing(false);
    }
  }, [applyCaptainFreeze, requestId, role, triggerCancelledConfirmedOnce]);

  return { declineCancel, revokeCancel };
}
