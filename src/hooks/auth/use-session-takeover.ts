import { useEffect, type MutableRefObject } from 'react';
import type { User as SovereignUser } from '@/core/types';

export { useProfileLanguageSync } from './use-profile-language-sync';

export function useSessionTakeover(
  user: SovereignUser | null,
  forceKickoutRef: MutableRefObject<() => Promise<void>>,
  toast: (options: { title: string; description?: string; variant?: any; duration?: number }) => void,
): void {
  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;
    let channel: any = null;
    let channelPhone: any = null;
    let channelPhoneDigits: any = null;
    let channelEmail: any = null;

    let deviceId = '';
    if (typeof window !== 'undefined') {
      try {
        deviceId = window.localStorage.getItem('radar_device_id') || '';
        if (!deviceId) {
          deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : (Date.now() + '-' + Math.random().toString(36).slice(2));
          window.localStorage.setItem('radar_device_id', deviceId);
        }
      } catch {
        deviceId = 'device-' + user.uid;
      }
    }

    // 1. Authoritative heartbeat to claim & verify active session
    const sendHeartbeat = async () => {
      if (!isMounted || !user?.uid || !deviceId) return;
      try {
        const res = await fetch('/api/auth/session/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, deviceId }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.conflict) {
            toast({
              variant: 'destructive',
              title: 'تم إنهاء الجلسة',
              description: 'تم تسجيل الدخول إلى هذا الحساب من جهاز آخر، تم إنهاء هذه الجلسة.',
              duration: 10000,
            });
            void forceKickoutRef.current();
          }
        }
      } catch {}
    };

    void sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendHeartbeat();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 2. Realtime broadcast channels for immediate zero-latency peer detection
    const phoneKey = user.phone ? user.phone.trim().replace(/[\s()-]/g, '') : '';
    const phoneDigits = user.phone ? user.phone.trim().replace(/\D/g, '') : '';
    const emailKey = (user as any).email ? String((user as any).email).trim().toLowerCase() : '';

    void import('@/lib/supabase-client').then(({ supabase }) => {
      if (!isMounted) return;

      const handleCheckActive = (payload: any, ch: any) => {
        const foreignDeviceId = payload?.payload?.deviceId || payload?.deviceId;
        if (foreignDeviceId && deviceId && foreignDeviceId !== deviceId) {
          void ch.send({
            type: 'broadcast',
            event: 'session_active',
            payload: { deviceId },
          });
        }
      };

      const handleForeignTakeover = (payload: any) => {
        const foreignDeviceId = payload?.payload?.deviceId || payload?.deviceId;
        if (foreignDeviceId && deviceId && foreignDeviceId !== deviceId) {
          toast({
            variant: 'destructive',
            title: 'تم تسجيل الدخول من جهاز آخر',
            description: 'تم تسجيل الدخول إلى هذا الحساب من جهاز آخر، تم إنهاء هذه الجلسة.',
            duration: 10000,
          });
          void forceKickoutRef.current();
        }
      };

      channel = supabase.channel('user-session-' + user.uid);
      channel.on('broadcast', { event: 'check_active_session' }, (payload: any) => handleCheckActive(payload, channel));
      channel.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
      channel.subscribe();

      if (phoneDigits) {
        channelPhoneDigits = supabase.channel('user-session-phone-' + phoneDigits);
        channelPhoneDigits.on('broadcast', { event: 'check_active_session' }, (payload: any) => handleCheckActive(payload, channelPhoneDigits));
        channelPhoneDigits.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
        channelPhoneDigits.subscribe();
      }

      if (phoneKey && phoneKey !== phoneDigits) {
        channelPhone = supabase.channel('user-session-phone-' + phoneKey);
        channelPhone.on('broadcast', { event: 'check_active_session' }, (payload: any) => handleCheckActive(payload, channelPhone));
        channelPhone.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
        channelPhone.subscribe();
      }

      if (emailKey) {
        channelEmail = supabase.channel('user-session-email-' + emailKey);
        channelEmail.on('broadcast', { event: 'check_active_session' }, (payload: any) => handleCheckActive(payload, channelEmail));
        channelEmail.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
        channelEmail.subscribe();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      void import('@/lib/supabase-client').then(({ supabase }) => {
        try {
          if (channel) supabase.removeChannel(channel);
          if (channelPhoneDigits) supabase.removeChannel(channelPhoneDigits);
          if (channelPhone) supabase.removeChannel(channelPhone);
          if (channelEmail) supabase.removeChannel(channelEmail);
        } catch {}
      });
    };
  }, [user?.uid, user?.phone, (user as any)?.email, toast, forceKickoutRef]);
}
