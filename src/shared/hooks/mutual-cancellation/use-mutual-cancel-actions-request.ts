import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  interpretMutualCancelMutationResult,
  normalizeCancelRole,
  type MutualCancelRole,
  type PostCommitExpectationLock,
} from '../mutual-cancellation-helpers';
import {
  fetchWithSupabaseAuthRetry,
  POST_COMMIT_GRACE_MS,
} from './mutual-cancel-transport';

export interface UseMutualCancelActionsRequestParams {
  requestId?: string;
  role: MutualCancelRole;
  inFlightMutationsRef: React.MutableRefObject<number>;
  pendingFromRef: React.MutableRefObject<MutualCancelRole | null>;
  durationMinutesRef: React.MutableRefObject<number>;
  mutationEpochRef: React.MutableRefObject<number>;
  postCommitLockRef: React.MutableRefObject<PostCommitExpectationLock | null>;
  channelRef: React.MutableRefObject<ReturnType<typeof supabase.channel> | null>;
  toastRef: React.MutableRefObject<any>;
  setIsProcessing: (val: boolean) => void;
  setPendingRequestFrom: (val: MutualCancelRole | null) => void;
  applyCaptainFreeze: (duration?: number) => void;
  triggerCancelledConfirmedOnce: () => Promise<void>;
}

export function useMutualCancelActionsRequest({
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
}: UseMutualCancelActionsRequestParams) {
  const requestCancel = useCallback(async () => {
    if (!requestId || inFlightMutationsRef.current > 0) return;

    const prevPending = pendingFromRef.current;
    const duration = durationMinutesRef.current;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current += 1;
    setIsProcessing(true);
    setPendingRequestFrom(role);

    try {
      const { res, data } = await fetchWithSupabaseAuthRetry('/api/trip/mutual-cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId, action: 'REQUEST', cancelledByRole: role, tripDurationMinutes: duration }),
        requireAuthForInitialTry: true,
      });

      const outcome = interpretMutualCancelMutationResult(Boolean(res?.ok), data);
      if (!outcome.ok) {
        const closedStatus = String(data?.status || '').toUpperCase();
        if (
          closedStatus === 'CANCELLED' ||
          data?.message === 'trip_already_closed' ||
          data?.error === 'trip_already_closed'
        ) {
          setPendingRequestFrom(null);
          applyCaptainFreeze(duration);
          await triggerCancelledConfirmedOnce();
          return;
        }

        const confirmedBy = normalizeCancelRole(data?.cancel_requested_by);
        if (confirmedBy) {
          postCommitLockRef.current = { expectedPendingFrom: confirmedBy, untilMs: Date.now() + POST_COMMIT_GRACE_MS };
          setPendingRequestFrom(confirmedBy);
          return;
        }

        setPendingRequestFrom(prevPending);
        toastRef.current({
          variant: 'destructive',
          title: 'تعذر إرسال طلب إيقاف الرحلة',
          description: outcome.errorCode === 'authentication_required'
            ? 'يرجى تحديث الصفحة أو إعادة تسجيل الدخول ثم المحاولة مرة أخرى.'
            : 'حدث خطأ أثناء إرسال الطلب للخادم، يرجى المحاولة مرة أخرى.',
        });
        return;
      }

      if (outcome.isClosed) {
        setPendingRequestFrom(null);
        if (outcome.terminalStatus === 'CANCELLED') {
          applyCaptainFreeze(duration);
          await triggerCancelledConfirmedOnce();
        }
        return;
      }

      const confirmedBy = outcome.cancelRequestedBy ?? role;
      postCommitLockRef.current = { expectedPendingFrom: confirmedBy, untilMs: Date.now() + POST_COMMIT_GRACE_MS };
      setPendingRequestFrom(confirmedBy);

      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'REQUEST_CANCEL',
            payload: { fromRole: role, tripDurationMinutes: duration, timestamp: Date.now() },
          });
        } catch (bErr) {
          console.warn('[useTripMutualCancellation] broadcast failed:', bErr);
        }
      }

      toastRef.current({
        title: 'تم إرسال طلب إلغاء الرحلة',
        description: role === 'captain'
          ? 'بانتظار موافقة الراكب على إلغاء الرحلة.'
          : 'بانتظار موافقة الكابتن على إلغاء الرحلة.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] requestCancel error:', err);
      setPendingRequestFrom(prevPending);
      toastRef.current({
        variant: 'destructive',
        title: 'تعذر إرسال طلب إيقاف الرحلة',
        description: 'تحقق من اتصال الإنترنت ثم حاول مرة أخرى.',
      });
    } finally {
      inFlightMutationsRef.current = Math.max(0, inFlightMutationsRef.current - 1);
      setIsProcessing(false);
    }
  }, [applyCaptainFreeze, requestId, role, triggerCancelledConfirmedOnce]);

  const acceptCancel = useCallback(async () => {
    if (!requestId || inFlightMutationsRef.current > 0) return;

    const duration = durationMinutesRef.current;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current += 1;
    setIsProcessing(true);

    try {
      const { res, data } = await fetchWithSupabaseAuthRetry('/api/trip/mutual-cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId, action: 'ACCEPT', cancelledByRole: role, tripDurationMinutes: duration }),
        requireAuthForInitialTry: true,
      });

      const outcome = interpretMutualCancelMutationResult(Boolean(res?.ok), data);
      if (!outcome.ok) {
        const closedStatus = String(data?.status || '').toUpperCase();
        if (
          closedStatus === 'CANCELLED' ||
          data?.message === 'trip_already_closed' ||
          data?.error === 'trip_already_closed'
        ) {
          applyCaptainFreeze(duration);
          await triggerCancelledConfirmedOnce();
          setPendingRequestFrom(null);
          toastRef.current({
            title: 'تم إلغاء الرحلة بالتوافق',
            description: 'تم إلغاء الرحلة بالتوافق المشترك.',
            variant: 'default',
            duration: 5000,
          });
          return;
        }

        toastRef.current({
          title: 'فشل إلغاء الرحلة',
          description: outcome.errorCode === 'authentication_required'
            ? 'يرجى تسجيل الدخول مجدداً ثم المحاولة.'
            : 'حدث خطأ أثناء إلغاء الرحلة، يرجى المحاولة مرة أخرى.',
          variant: 'destructive',
        });
        return;
      }

      applyCaptainFreeze(duration);

      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'ACCEPT_CANCEL',
            payload: { fromRole: role, tripDurationMinutes: duration, timestamp: Date.now() },
          });
        } catch {}
      }

      await triggerCancelledConfirmedOnce();
      setPendingRequestFrom(null);
      toastRef.current({
        title: 'تم إلغاء الرحلة بالتوافق',
        description: 'تم إلغاء الرحلة بالتوافق المشترك.',
        variant: 'default',
        duration: 5000,
      });
    } catch (err) {
      console.error('[useTripMutualCancellation] acceptCancel error:', err);
      toastRef.current({
        title: 'فشل إلغاء الرحلة',
        description: 'حدث خطأ أثناء إلغاء الرحلة، يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      inFlightMutationsRef.current = Math.max(0, inFlightMutationsRef.current - 1);
      setIsProcessing(false);
    }
  }, [applyCaptainFreeze, requestId, role, triggerCancelledConfirmedOnce]);

  return { requestCancel, acceptCancel };
}
