'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  getRefreshedSupabaseAuthHeaders,
  getSupabaseAuthHeaders,
} from '@/shared/services/supabase-auth-headers';
import { useToast } from '@/hooks/use-toast';
import {
  setCaptainCancelCooldown,
  clearCaptainCancelCooldown,
  calculateRemainingCooldown,
} from '@/features/captain/services/captain-cancel-cooldown';
import {
  interpretMutualCancelMutationResult,
  type MutualCancelRole,
  normalizeCancelRole,
  type PostCommitExpectationLock,
  resolveRealtimeRideRequestUpdate,
  shouldAcceptServerSyncResult,
} from './mutual-cancellation-helpers';

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

const POST_COMMIT_GRACE_MS = 2500;

function playAlertSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {});
  } catch {}
}

async function fetchWithSupabaseAuthRetry(
  url: string,
  options: { method?: 'GET' | 'POST'; body?: string; requireAuthForInitialTry?: boolean } = {},
): Promise<{ res: Response | null; data: Record<string, unknown> | null }> {
  const baseHeaders: Record<string, string> = options.method === 'POST'
    ? { 'Content-Type': 'application/json' }
    : {};
  let authHeaders = await getSupabaseAuthHeaders(baseHeaders);
  if (options.requireAuthForInitialTry && !authHeaders.Authorization) {
    authHeaders = await getRefreshedSupabaseAuthHeaders(baseHeaders);
    if (!authHeaders.Authorization) {
      return { res: null, data: { success: false, error: 'authentication_required' } };
    }
  }

  let res = await fetch(url, {
    method: options.method || 'GET',
    headers: authHeaders,
    body: options.body,
  });

  if (res.status === 401) {
    const refreshedHeaders = await getRefreshedSupabaseAuthHeaders(baseHeaders);
    if (refreshedHeaders.Authorization) {
      res = await fetch(url, {
        method: options.method || 'GET',
        headers: refreshedHeaders,
        body: options.body,
      });
    }
  }

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { res, data };
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

  // Stabilize callback and dynamic values to prevent tearing down channel on each render
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

  // Notify the counterparty exactly once per incoming request regardless of transport
  // (Realtime broadcast, server httpSend, postgres_changes, GET poll, RLS fallback, or initial prop).
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

  // Initial and periodic sync with server database (SSOT)
  const syncServerStatus = useCallback(async (targetId: string) => {
    if (inFlightMutationsRef.current > 0) return;
    const pollEpoch = mutationEpochRef.current;

    try {
      let serverStatus: unknown;
      let serverCancelRequestedBy: unknown;
      let resolved = false;

      const { res, data } = await fetchWithSupabaseAuthRetry(
        `/api/trip/mutual-cancel?requestId=${encodeURIComponent(targetId)}`,
        { method: 'GET', requireAuthForInitialTry: true },
      );
      if (res?.ok && data?.success) {
        serverStatus = data.status;
        serverCancelRequestedBy = data.cancel_requested_by;
        resolved = true;
      } else {
        // Fallback read under RLS if API auth headers or endpoint failed transiently
        const { data: rowData, error: rowErr } = await supabase
          .from('ride_requests')
          .select('id, status, cancel_requested_by')
          .eq('id', targetId)
          .maybeSingle();

        if (!rowErr && rowData) {
          const row = rowData as Record<string, unknown>;
          serverStatus = row.status;
          serverCancelRequestedBy = row.cancel_requested_by;
          resolved = true;
        }
      }

      if (!resolved) return;

      const decision = shouldAcceptServerSyncResult({
        pollEpoch,
        currentEpoch: mutationEpochRef.current,
        inFlightMutations: inFlightMutationsRef.current,
        serverStatus,
        serverCancelRequestedBy,
        postCommitLock: postCommitLockRef.current,
        nowMs: Date.now(),
      });

      if (!decision.accept) return;

      if (decision.terminalStatus === 'CANCELLED') {
        setPendingRequestFrom(null);
        applyCaptainFreeze();
        await triggerCancelledConfirmedOnce();
        return;
      }

      if (decision.terminalStatus === 'COMPLETED') {
        setPendingRequestFrom(null);
        return;
      }

      const requestedBy = decision.nextPendingFrom;
      setPendingRequestFrom(requestedBy ?? null);
    } catch {
      // Ignore background network errors
    }
  }, [applyCaptainFreeze, triggerCancelledConfirmedOnce]);

  useEffect(() => {
    let isEffectActive = true;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current = 0;
    postCommitLockRef.current = null;
    confirmedCancelHandledRef.current = false;
    lastNotifiedCounterpartyRef.current = null;
    lastResolutionToastRef.current = null;

    if (!requestId) {
      setPendingRequestFrom(null);
      return;
    }

    // 1. Immediate sync from server
    void syncServerStatus(requestId);

    // 2. Setup stable channel (created ONCE per requestId and role)
    const channelName = `trip-mutual-cancel-${requestId}`;

    // Clean up any lingering channel with same name first
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

    // 3. Periodic safety poll (every 3 seconds) + immediate sync on foreground/network resume
    const pollInterval = setInterval(() => {
      void syncServerStatus(requestId);
    }, 3000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncServerStatus(requestId);
      }
    };
    const onFocus = () => {
      void syncServerStatus(requestId);
    };
    const onOnline = () => {
      void syncServerStatus(requestId);
    };
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

  const requestCancel = useCallback(async () => {
    if (!requestId || inFlightMutationsRef.current > 0) return;

    const prevPending = pendingFromRef.current;
    const duration = durationMinutesRef.current;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current += 1;
    setIsProcessing(true);
    setPendingRequestFrom(role);

    try {
      // 1. Persist to server FIRST (SSOT database) so polls & peer never see stale null state
      const { res, data } = await fetchWithSupabaseAuthRetry('/api/trip/mutual-cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId, action: 'REQUEST', cancelledByRole: role, tripDurationMinutes: duration }),
        requireAuthForInitialTry: true,
      });

      const outcome = interpretMutualCancelMutationResult(Boolean(res?.ok), data);
      if (!outcome.ok) {
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

      // 2. Broadcast immediately after DB persistence succeeds for zero-latency alert
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
      // 1. Execute server-side cancellation via mutual-cancel API endpoint FIRST
      const { res, data } = await fetchWithSupabaseAuthRetry('/api/trip/mutual-cancel', {
        method: 'POST',
        body: JSON.stringify({ requestId, action: 'ACCEPT', cancelledByRole: role, tripDurationMinutes: duration }),
        requireAuthForInitialTry: true,
      });

      const outcome = interpretMutualCancelMutationResult(Boolean(res?.ok), data);
      if (!outcome.ok) {
        toastRef.current({
          title: 'فشل إلغاء الرحلة',
          description: 'حدث خطأ أثناء إلغاء الرحلة، يرجى المحاولة مرة أخرى.',
          variant: 'destructive',
        });
        return;
      }

      // 2. If captain, activate freeze equal to REMAINING trip duration
      applyCaptainFreeze(duration);

      // 3. Broadcast agreement to other party after DB confirms CANCELLED
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'ACCEPT_CANCEL',
            payload: { fromRole: role, tripDurationMinutes: duration, timestamp: Date.now() },
          });
        } catch {}
      }

      // 4. Trigger caller's confirmed callback cleanly once
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

  const declineCancel = useCallback(async () => {
    if (!requestId || inFlightMutationsRef.current > 0) return;

    const prevPending = pendingFromRef.current;
    mutationEpochRef.current += 1;
    inFlightMutationsRef.current += 1;
    setIsProcessing(true);
    setPendingRequestFrom(null);

    try {
      // Persist decline to server (clears cancel_requested_by)
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
      // Persist revoke to server (clears cancel_requested_by)
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

  return {
    pendingRequestFrom,
    isProcessing,
    requestCancel,
    acceptCancel,
    declineCancel,
    revokeCancel,
  };
}
