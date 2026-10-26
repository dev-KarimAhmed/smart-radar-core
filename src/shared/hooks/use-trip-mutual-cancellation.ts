'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { setCaptainCancelCooldown } from '@/features/captain/services/captain-cancel-cooldown';

export interface UseTripMutualCancellationProps {
  requestId?: string;
  role: 'rider' | 'captain';
  tripDurationMinutes?: number;
  onCancelledConfirmed?: () => Promise<void> | void;
}

export interface UseTripMutualCancellationReturn {
  pendingRequestFrom: 'rider' | 'captain' | null;
  isProcessing: boolean;
  requestCancel: () => Promise<void>;
  acceptCancel: () => Promise<void>;
  declineCancel: () => Promise<void>;
  revokeCancel: () => Promise<void>;
}

function playAlertSound() {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 1.0;
    void audio.play().catch(() => {});
  } catch {}
}

export function useTripMutualCancellation({
  requestId,
  role,
  tripDurationMinutes = 20,
  onCancelledConfirmed,
}: UseTripMutualCancellationProps): UseTripMutualCancellationReturn {
  const { toast } = useToast();
  const [pendingRequestFrom, setPendingRequestFrom] = useState<'rider' | 'captain' | null>(null);
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

  // Initial and periodic sync with server database (SSOT)
  const syncServerStatus = useCallback(async (targetId: string) => {
    try {
      const res = await fetch(`/api/trip/mutual-cancel?requestId=${encodeURIComponent(targetId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success) {
        const requestedBy = data.cancel_requested_by;
        if (requestedBy === 'captain' || requestedBy === 'rider') {
          setPendingRequestFrom((prev) => {
            if (prev !== requestedBy && requestedBy !== role) {
              playAlertSound();
            }
            return requestedBy;
          });
        } else {
          setPendingRequestFrom(null);
        }
      }
    } catch {
      // Ignore background network errors
    }
  }, [role]);

  useEffect(() => {
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
        const fromRole = payload.payload?.fromRole;
        if (fromRole && fromRole !== role) {
          setPendingRequestFrom(fromRole);
          playAlertSound();
          toastRef.current({
            title: role === 'captain' ? 'الراكب يطلب إلغاء الرحلة' : 'الكابتن يطلب إلغاء الرحلة',
            description: 'يتطلب الإلغاء موافقة الطرفين. يرجى تأكيد أو رفض الطلب.',
            variant: 'warning',
            duration: 8000,
          });
        }
      })
      .on('broadcast', { event: 'DECLINE_CANCEL' }, (payload) => {
        const fromRole = payload.payload?.fromRole;
        if (fromRole && fromRole !== role) {
          setPendingRequestFrom(null);
          toastRef.current({
            title: 'تم رفض طلب إلغاء الرحلة',
            description: role === 'captain'
              ? 'رفض الراكب طلب الإلغاء، وتستمر الرحلة كالمعتاد.'
              : 'رفض الكابتن طلب الإلغاء، وتستمر الرحلة كالمعتاد.',
            variant: 'default',
            duration: 6000,
          });
        }
      })
      .on('broadcast', { event: 'REVOKE_CANCEL' }, (payload) => {
        const fromRole = payload.payload?.fromRole;
        if (fromRole && fromRole !== role) {
          setPendingRequestFrom(null);
          toastRef.current({
            title: 'تراجع عن طلب الإلغاء',
            description: role === 'captain'
              ? 'تراجع الراكب عن طلب إلغاء الرحلة.'
              : 'تراجع الكابتن عن طلب إلغاء الرحلة.',
            variant: 'default',
            duration: 5000,
          });
        }
      })
      .on('broadcast', { event: 'ACCEPT_CANCEL' }, async (payload) => {
        setPendingRequestFrom(null);
        if (role === 'captain') {
          const payloadMinutes = Number(payload.payload?.tripDurationMinutes);
          const finalMinutes = payloadMinutes > 0 ? payloadMinutes : durationMinutesRef.current;
          setCaptainCancelCooldown(finalMinutes);
        }
        try {
          if (onCancelledConfirmedRef.current) {
            await onCancelledConfirmedRef.current();
          }
        } catch {}
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
          const newRow = payload.new as any;
          if (!newRow) return;

          const status = String(newRow.status || '').toUpperCase();
          if (status === 'CANCELLED' || status === 'COMPLETED') {
            setPendingRequestFrom(null);
            return;
          }

          const cancelBy = newRow.cancel_requested_by;
          if (cancelBy === 'captain' || cancelBy === 'rider') {
            setPendingRequestFrom((prev) => {
              if (prev !== cancelBy && cancelBy !== role) {
                playAlertSound();
              }
              return cancelBy;
            });
          } else {
            setPendingRequestFrom(null);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // 3. Periodic safety poll (every 3 seconds) for background reconciliation
    const pollInterval = setInterval(() => {
      void syncServerStatus(requestId);
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [requestId, role, syncServerStatus]);

  const requestCancel = useCallback(async () => {
    if (!requestId) return;
    setIsProcessing(true);
    setPendingRequestFrom(role);
    const duration = durationMinutesRef.current;

    try {
      // 1. Broadcast immediately for zero-latency alert
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

      // 2. Persist to server (SSOT database)
      await fetch('/api/trip/mutual-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'REQUEST', cancelledByRole: role, tripDurationMinutes: duration }),
      });

      toastRef.current({
        title: 'تم إرسال طلب إلغاء الرحلة',
        description: role === 'captain'
          ? 'بانتظار موافقة الراكب على إلغاء الرحلة.'
          : 'بانتظار موافقة الكابتن على إلغاء الرحلة.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] requestCancel error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [requestId, role]);

  const acceptCancel = useCallback(async () => {
    if (!requestId) return;
    setIsProcessing(true);
    const duration = durationMinutesRef.current;

    try {
      // 1. If captain, activate cooldown immediately for the cancelled trip's duration
      if (role === 'captain') {
        setCaptainCancelCooldown(duration);
      }

      // 2. Broadcast agreement to other party
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'ACCEPT_CANCEL',
            payload: { fromRole: role, tripDurationMinutes: duration, timestamp: Date.now() },
          });
        } catch {}
      }

      // 3. Execute server-side cancellation via mutual-cancel API endpoint
      try {
        await fetch('/api/trip/mutual-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, action: 'ACCEPT', cancelledByRole: role, tripDurationMinutes: duration }),
        });
      } catch (apiErr) {
        console.warn('[useTripMutualCancellation] api mutual-cancel error:', apiErr);
      }

      // 4. Trigger caller's confirmed callback
      if (onCancelledConfirmedRef.current) {
        await onCancelledConfirmedRef.current();
      }

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
      setIsProcessing(false);
    }
  }, [requestId, role]);

  const declineCancel = useCallback(async () => {
    if (!requestId) return;
    setIsProcessing(true);
    setPendingRequestFrom(null);

    try {
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'DECLINE_CANCEL',
            payload: { fromRole: role, timestamp: Date.now() },
          });
        } catch {}
      }

      // Persist decline to server (clears cancel_requested_by)
      await fetch('/api/trip/mutual-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'DECLINE', cancelledByRole: role }),
      });

      toastRef.current({
        title: 'تم رفض طلب الإلغاء',
        description: 'تستمر الرحلة بشكل طبيعي.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] declineCancel error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [requestId, role]);

  const revokeCancel = useCallback(async () => {
    if (!requestId) return;
    setIsProcessing(true);
    setPendingRequestFrom(null);

    try {
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'REVOKE_CANCEL',
            payload: { fromRole: role, timestamp: Date.now() },
          });
        } catch {}
      }

      // Persist revoke to server (clears cancel_requested_by)
      await fetch('/api/trip/mutual-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'REVOKE', cancelledByRole: role }),
      });

      toastRef.current({
        title: 'تم التراجع عن طلب الإلغاء',
        description: 'تستمر الرحلة كالمعتاد.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] revokeCancel error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [requestId, role]);

  return {
    pendingRequestFrom,
    isProcessing,
    requestCancel,
    acceptCancel,
    declineCancel,
    revokeCancel,
  };
}
