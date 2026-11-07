'use client';

import { useEffect, type MutableRefObject } from 'react';
import type { User as SovereignUser } from '@/core/types';
import { DASHBOARD_LANGUAGE_KEY, DASHBOARD_LANGUAGE_EVENT } from './use-dashboard-language';

interface SessionTakeoverOptions {
  user: SovereignUser | null;
  forceKickoutRef: MutableRefObject<() => Promise<void>>;
  toast: (props: { variant?: 'default' | 'destructive'; title?: string; description?: string; duration?: number }) => void;
}

export function useSessionTakeoverListener({ user, forceKickoutRef, toast }: SessionTakeoverOptions) {
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
          deviceId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Date.now() + '-' + Math.random().toString(36).slice(2);
          window.localStorage.setItem('radar_device_id', deviceId);
        }
      } catch {
        deviceId = 'device-' + user.uid;
      }
    }

    const phoneKey = user.phone ? user.phone.trim().replace(/[\s()-]/g, '') : '';
    const phoneDigits = user.phone ? user.phone.trim().replace(/\D/g, '') : '';
    const emailKey = (user as any).email ? String((user as any).email).trim().toLowerCase() : '';

    import('@/lib/supabase-client').then(({ supabase }) => {
      if (!isMounted) return;

      const handleCheckActive = (payload: any, ch: any) => {
        const foreignDeviceId = payload.payload?.deviceId;
        if (foreignDeviceId && deviceId && foreignDeviceId !== deviceId) {
          ch.send({
            type: 'broadcast',
            event: 'session_active',
            payload: { deviceId },
          });
        }
      };

      const handleForeignTakeover = (payload: any) => {
        const foreignDeviceId = payload.payload?.deviceId;
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
      channel.on('broadcast', { event: 'check_active_session' }, (payload: any) =>
        handleCheckActive(payload, channel)
      );
      channel.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
      channel.subscribe();

      if (phoneDigits) {
        channelPhoneDigits = supabase.channel('user-session-phone-' + phoneDigits);
        channelPhoneDigits.on('broadcast', { event: 'check_active_session' }, (payload: any) =>
          handleCheckActive(payload, channelPhoneDigits)
        );
        channelPhoneDigits.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
        channelPhoneDigits.subscribe();
      }

      if (phoneKey && phoneKey !== phoneDigits) {
        channelPhone = supabase.channel('user-session-phone-' + phoneKey);
        channelPhone.on('broadcast', { event: 'check_active_session' }, (payload: any) =>
          handleCheckActive(payload, channelPhone)
        );
        channelPhone.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
        channelPhone.subscribe();
      }

      if (emailKey) {
        channelEmail = supabase.channel('user-session-email-' + emailKey);
        channelEmail.on('broadcast', { event: 'check_active_session' }, (payload: any) =>
          handleCheckActive(payload, channelEmail)
        );
        channelEmail.on('broadcast', { event: 'session_takeover' }, handleForeignTakeover);
        channelEmail.subscribe();
      }
    });

    return () => {
      isMounted = false;
      import('@/lib/supabase-client').then(({ supabase }) => {
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

export function usePreferredLanguageSync(userId?: string | null) {
  useEffect(() => {
    if (!userId) return;

    const syncLanguageToProfile = async (targetLang: 'ar' | 'en') => {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        await supabase
          .from('profiles')
          .update({ preferred_language: targetLang })
          .eq('id', userId);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useAuth] Failed to sync preferred_language:', err);
        }
      }
    };

    const stored =
      typeof window !== 'undefined'
        ? (window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY) as 'ar' | 'en' | null)
        : null;
    if (stored === 'en' || stored === 'ar') {
      void syncLanguageToProfile(stored);
    }

    const handleLangChange = (event: Event) => {
      const detail = (event as CustomEvent<'ar' | 'en'>).detail;
      if (detail === 'en' || detail === 'ar') {
        void syncLanguageToProfile(detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(DASHBOARD_LANGUAGE_EVENT, handleLangChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(DASHBOARD_LANGUAGE_EVENT, handleLangChange);
      }
    };
  }, [userId]);
}
