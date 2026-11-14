import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  type MutualCancelRole,
  normalizeCancelRole,
  type PostCommitExpectationLock,
  resolveRealtimeRideRequestUpdate,
} from '../mutual-cancellation-helpers';
import { POST_COMMIT_GRACE_MS } from './mutual-cancel-transport';

export interface UseMutualCancelSubscriptionParams {
  requestId?: string;
  role: MutualCancelRole;
  channelRef: React.MutableRefObject<ReturnType<typeof supabase.channel> | null>;
  mutationEpochRef: React.MutableRefObject<number>;
  inFlightMutationsRef: React.MutableRefObject<number>;
  postCommitLockRef: React.MutableRefObject<PostCommitExpectationLock | null>;
  confirmedCancelHandledRef: React.MutableRefObject<boolean>;
  lastResolutionToastRef: React.MutableRefObject<{ event: 'DECLINE_CANCEL' | 'REVOKE_CANCEL'; atMs: number } | null>;
  toastRef: React.MutableRefObject<any>;
  setPendingRequestFrom: (val: MutualCancelRole | null) => void;
  applyCaptainFreeze: (durationMins?: number) => void;
  triggerCancelledConfirmedOnce: () => Promise<void>;
  syncServerStatus: (targetId: string) => Promise<void>;
}

export function useMutualCancelSubscription({
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
}: UseMutualCancelSubscriptionParams): void {
  useEffect(() => {
    let isEffectActive = true;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current = 0;
    postCommitLockRef.current = null;
    confirmedCancelHandledRef.current = false;
    lastResolutionToastRef.current = null;

    if (!requestId) {
      setPendingRequestFrom(null);
      return;
    }

    void syncServerStatus(requestId);

    const channelName = `trip-mutual-cancel-${requestId}`;
    try {
      const existing = supabase.getChannels().find(
        (c) => c.topic === `realtime:${channelName}` || c.topic === channelName
      );
      if (existing) {
        void supabase.removeChannel(existing);
      }
    } catch {}

    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false } },
    });

    channel
      .on('broadcast', { event: 'REQUEST_CANCEL' }, (payload) => {
        if (!isEffectActive) return;
        const fromRole = normalizeCancelRole(payload.payload?.fromRole);
        if (fromRole && fromRole !== role) {
          mutationEpochRef.current += 1;
          postCommitLockRef.current = { expectedPendingFrom: fromRole, untilMs: Date.now() + POST_COMMIT_GRACE_MS };
          setPendingRequestFrom(fromRole);
        }
      })
      .on('broadcast', { event: 'DECLINE_CANCEL' }, (payload) => {
        if (!isEffectActive) return;
        const fromRole = normalizeCancelRole(payload.payload?.fromRole);
        if (fromRole && fromRole !== role) {
          mutationEpochRef.current += 1;
          postCommitLockRef.current = { expectedPendingFrom: null, untilMs: Date.now() + POST_COMMIT_GRACE_MS };
          setPendingRequestFrom(null);
          const nowMs = Date.now();
          const prevToast = lastResolutionToastRef.current;
          if (!prevToast || prevToast.event !== 'DECLINE_CANCEL' || nowMs - prevToast.atMs >= 4000) {
            lastResolutionToastRef.current = { event: 'DECLINE_CANCEL', atMs: nowMs };
            toastRef.current({
              title: 'تم رفض طلب إلغاء الرحلة',
              description: role === 'captain'
                ? 'رفض الراكب طلب الإلغاء، وتستمر الرحلة كالمعتاد.'
                : 'رفض الكابتن طلب الإلغاء، وتستمر الرحلة كالمعتاد.',
              variant: 'default',
              duration: 6000,
            });
          }
        }
      })
      .on('broadcast', { event: 'REVOKE_CANCEL' }, (payload) => {
        if (!isEffectActive) return;
        const fromRole = normalizeCancelRole(payload.payload?.fromRole);
        if (fromRole && fromRole !== role) {
          mutationEpochRef.current += 1;
          postCommitLockRef.current = { expectedPendingFrom: null, untilMs: Date.now() + POST_COMMIT_GRACE_MS };
          setPendingRequestFrom(null);
          const nowMs = Date.now();
          const prevToast = lastResolutionToastRef.current;
          if (!prevToast || prevToast.event !== 'REVOKE_CANCEL' || nowMs - prevToast.atMs >= 4000) {
            lastResolutionToastRef.current = { event: 'REVOKE_CANCEL', atMs: nowMs };
            toastRef.current({
              title: 'تراجع عن طلب الإلغاء',
              description: role === 'captain'
                ? 'تراجع الراكب عن طلب إلغاء الرحلة.'
                : 'تراجع الكابتن عن طلب إلغاء الرحلة.',
              variant: 'default',
              duration: 5000,
            });
          }
        }
      })
      .on('broadcast', { event: 'ACCEPT_CANCEL' }, async (payload) => {
        if (!isEffectActive) return;
        mutationEpochRef.current += 1;
        setPendingRequestFrom(null);
        if (role === 'captain') {
          const payloadMinutes = Number(payload.payload?.tripDurationMinutes);
          applyCaptainFreeze(payloadMinutes > 0 ? payloadMinutes : undefined);
        }
        await triggerCancelledConfirmedOnce();
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          if (!isEffectActive) return;
          const decision = resolveRealtimeRideRequestUpdate({
            newRow: payload.new as Record<string, unknown> | undefined,
            inFlightMutations: inFlightMutationsRef.current,
            postCommitLock: postCommitLockRef.current,
            nowMs: Date.now(),
          });

          if (decision.kind === 'ignore') return;

          if (decision.kind === 'terminal') {
            setPendingRequestFrom(null);
            if (decision.status === 'CANCELLED') {
              applyCaptainFreeze();
              void triggerCancelledConfirmedOnce();
            }
            return;
          }

          setPendingRequestFrom(decision.nextPendingFrom ?? null);
        }
      )
      .subscribe((status, err) => {
        if (!isEffectActive) return;
        if (status === 'SUBSCRIBED') {
          void syncServerStatus(requestId);
        } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && process.env.NODE_ENV !== 'production') {
          console.warn('[useTripMutualCancellation] Realtime subscription notice:', status, err);
        }
      });

    channelRef.current = channel;

    const pollInterval = setInterval(() => {
      void syncServerStatus(requestId);
    }, 3000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncServerStatus(requestId);
    };
    const onFocus = () => void syncServerStatus(requestId);
    const onOnline = () => void syncServerStatus(requestId);

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      isEffectActive = false;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [applyCaptainFreeze, requestId, role, syncServerStatus, triggerCancelledConfirmedOnce]);
}
