import type { Session } from '@supabase/supabase-js';
import {
  clearSupabaseAuthStorage,
  shouldRememberSupabaseSession,
} from './supabase-auth-storage';

export const AUTH_TOKEN_STORAGE_KEY = 'radar_supabase_access_token';

export function cacheSupabaseSession(session: Session | null) {
  if (typeof window === 'undefined') return;

  if (session?.access_token) {
    const targetStorage = shouldRememberSupabaseSession() ? localStorage : sessionStorage;
    const otherStorage = shouldRememberSupabaseSession() ? sessionStorage : localStorage;
    targetStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.access_token);
    otherStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export function clearSupabaseSessionCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearSupabaseAuthStorage();
}

export async function checkAccountInUse(
  supabase: any,
  identifier: string,
  currentDeviceId: string,
): Promise<boolean> {
  if (typeof window === 'undefined' || !supabase || !identifier || !currentDeviceId) return false;
  const isEmail = identifier.includes('@');
  const cleanId = isEmail
    ? identifier.trim().toLowerCase()
    : identifier.trim().replace(/\D/g, '');

  if (!cleanId) return false;

  const channelsToCheck = [
    (isEmail ? 'user-session-email-' : 'user-session-phone-') + cleanId,
  ];
  if (!isEmail) {
    const rawClean = identifier.trim().replace(/[\s()-]/g, '');
    if (rawClean && rawClean !== cleanId) {
      channelsToCheck.push('user-session-phone-' + rawClean);
    }
  }

  return new Promise((resolve) => {
    let resolved = false;
    const channels: any[] = [];
    let waitTimer: any = null;

    const cleanup = () => {
      if (!resolved) resolved = true;
      if (waitTimer) clearTimeout(waitTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      channels.forEach((ch) => {
        try {
          void supabase.removeChannel(ch);
        } catch {}
      });
    };

    // Overall safety timer (max 2 seconds)
    const safetyTimer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 2000);

    const onSessionActive = (payload: any) => {
      const foreignDeviceId = payload?.payload?.deviceId || payload?.deviceId;
      if (foreignDeviceId && foreignDeviceId !== currentDeviceId && !resolved) {
        cleanup();
        resolve(true);
      }
    };

    channelsToCheck.forEach((channelName) => {
      const ch = supabase.channel(channelName);
      channels.push(ch);

      ch.on('broadcast', { event: 'session_active' }, onSessionActive);

      ch.subscribe((status: string) => {
        if (status === 'SUBSCRIBED' && !resolved) {
          void ch.send({
            type: 'broadcast',
            event: 'check_active_session',
            payload: { deviceId: currentDeviceId },
          });

          if (!waitTimer) {
            waitTimer = setTimeout(() => {
              if (!resolved) {
                cleanup();
                resolve(false);
              }
            }, 800);
          }
        }
      });
    });
  });
}

export async function checkAccountInUseByPhone(supabase: any, phone: string, currentDeviceId: string): Promise<boolean> {
  return checkAccountInUse(supabase, phone, currentDeviceId);
}

export function broadcastSessionTakeover(
  supabase: any,
  userId: string,
  phone: string | null | undefined,
  email: string | null | undefined,
  currentDeviceId: string,
): void {
  if (typeof window === 'undefined' || !supabase || !currentDeviceId) return;

  const channelNames: string[] = [];
  if (userId) channelNames.push('user-session-' + userId);

  if (phone) {
    const digits = phone.trim().replace(/\D/g, '');
    if (digits) channelNames.push('user-session-phone-' + digits);
    const rawClean = phone.trim().replace(/[\s()-]/g, '');
    if (rawClean && rawClean !== digits) channelNames.push('user-session-phone-' + rawClean);
  }

  if (email && email.includes('@')) {
    channelNames.push('user-session-email-' + email.trim().toLowerCase());
  }

  channelNames.forEach((chName) => {
    const ch = supabase.channel(chName);
    ch.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        void ch.send({
          type: 'broadcast',
          event: 'session_takeover',
          payload: { deviceId: currentDeviceId },
        });
        setTimeout(() => {
          try {
            void supabase.removeChannel(ch);
          } catch {}
        }, 1200);
      }
    });
  });
}

export async function verifyEmailOtpCode(params: {
  code: string;
  email?: string;
  phone?: string;
  userId?: string;
}): Promise<{ success: boolean; alreadyConfirmed?: boolean; userId?: string; email?: string; phone?: string; error?: string; message?: string }> {
  const response = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  let resData: any = null;
  try {
    resData = await response.json();
  } catch {
    throw new Error('حدث خطأ في استجابة الخادم أثناء التحقق من الكود.');
  }

  if (!response.ok || !resData?.success) {
    throw new Error(resData?.error || 'كود التفعيل غير صحيح أو انتهت صلاحيته.');
  }

  return resData;
}
