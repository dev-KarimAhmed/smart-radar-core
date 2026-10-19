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
  tripDurationMinutes = 15,
  onCancelledConfirmed,
}: UseTripMutualCancellationProps): UseTripMutualCancellationReturn {
  const { toast } = useToast();
  const [pendingRequestFrom, setPendingRequestFrom] = useState<'rider' | 'captain' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const durationMinutes = Math.max(1, Math.round(Number(tripDurationMinutes) || 15));

  useEffect(() => {
    if (!requestId) {
      setPendingRequestFrom(null);
      return;
    }

    const channelName = `trip-mutual-cancel-${requestId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { ack: false } },
    });

    channel
      .on('broadcast', { event: 'REQUEST_CANCEL' }, (payload) => {
        const fromRole = payload.payload?.fromRole;
        if (fromRole && fromRole !== role) {
          setPendingRequestFrom(fromRole);
          playAlertSound();
          toast({
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
          toast({
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
          toast({
            title: 'تراجع عن طلب الإلغاء',
            description: role === 'captain'
              ? 'تراجع الراكب عن طلب إلغاء الرحلة.'
              : 'تراجع الكابتن عن طلب إلغاء الرحلة.',
            variant: 'default',
            duration: 5000,
          });
        }
      })
      .on('broadcast', { event: 'ACCEPT_CANCEL' }, async () => {
        // Mutual cancellation confirmed by other party
        setPendingRequestFrom(null);
        if (role === 'captain') {
          setCaptainCancelCooldown(durationMinutes);
        }
        try {
          if (onCancelledConfirmed) {
            await onCancelledConfirmed();
          }
        } catch {}
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [requestId, role, durationMinutes, onCancelledConfirmed, toast]);

  const requestCancel = useCallback(async () => {
    if (!requestId || !channelRef.current) return;
    setPendingRequestFrom(role);
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'REQUEST_CANCEL',
        payload: { fromRole: role, timestamp: Date.now() },
      });
      toast({
        title: 'تم إرسال طلب إلغاء الرحلة',
        description: role === 'captain'
          ? 'بانتظار موافقة الراكب على إلغاء الرحلة.'
          : 'بانتظار موافقة الكابتن على إلغاء الرحلة.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] requestCancel send failed:', err);
    }
  }, [requestId, role, toast]);

  const acceptCancel = useCallback(async () => {
    if (!requestId) return;
    setIsProcessing(true);

    try {
      // 1. Broadcast agreement to other party
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'ACCEPT_CANCEL',
          payload: { fromRole: role, timestamp: Date.now() },
        });
      }

      // 2. If captain, activate cooldown for the cancelled trip's duration
      if (role === 'captain') {
        setCaptainCancelCooldown(durationMinutes);
      }

      // 3. Execute server-side cancellation via mutual-cancel API endpoint
      try {
        await fetch('/api/trip/mutual-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, cancelledByRole: role }),
        });
      } catch (apiErr) {
        console.warn('[useTripMutualCancellation] api mutual-cancel error:', apiErr);
      }

      // 4. Trigger caller's confirmed callback
      if (onCancelledConfirmed) {
        await onCancelledConfirmed();
      }

      setPendingRequestFrom(null);
      toast({
        title: 'تم إلغاء الرحلة بالتوافق',
        description: 'تم إلغاء الرحلة بالتوافق المشترك.',
        variant: 'default',
        duration: 5000,
      });
    } catch (err) {
      console.error('[useTripMutualCancellation] acceptCancel error:', err);
      toast({
        title: 'فشل إلغاء الرحلة',
        description: 'حدث خطأ أثناء إلغاء الرحلة، يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [requestId, role, durationMinutes, onCancelledConfirmed, toast]);

  const declineCancel = useCallback(async () => {
    if (!requestId || !channelRef.current) {
      setPendingRequestFrom(null);
      return;
    }
    setPendingRequestFrom(null);
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'DECLINE_CANCEL',
        payload: { fromRole: role, timestamp: Date.now() },
      });
      toast({
        title: 'تم رفض طلب الإلغاء',
        description: 'تستمر الرحلة بشكل طبيعي.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] declineCancel send failed:', err);
    }
  }, [requestId, role, toast]);

  const revokeCancel = useCallback(async () => {
    if (!requestId || !channelRef.current) {
      setPendingRequestFrom(null);
      return;
    }
    setPendingRequestFrom(null);
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'REVOKE_CANCEL',
        payload: { fromRole: role, timestamp: Date.now() },
      });
      toast({
        title: 'تم التراجع عن طلب الإلغاء',
        description: 'تستمر الرحلة كالمعتاد.',
        variant: 'default',
      });
    } catch (err) {
      console.warn('[useTripMutualCancellation] revokeCancel send failed:', err);
    }
  }, [requestId, role, toast]);

  return {
    pendingRequestFrom,
    isProcessing,
    requestCancel,
    acceptCancel,
    declineCancel,
    revokeCancel,
  };
}

