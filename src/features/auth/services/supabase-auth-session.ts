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

export async function checkAccountInUse(supabase: any, identifier: string, currentDeviceId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const isEmail = identifier.includes('@');
  const cleanId = isEmail
    ? identifier.trim().toLowerCase()
    : identifier.trim().replace(/\D/g, '');

  if (!cleanId) return false;

  const channelName = (isEmail ? 'user-session-email-' : 'user-session-phone-') + cleanId;

  return new Promise((resolve) => {
    let resolved = false;

    const channel = supabase.channel(channelName);

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          void supabase.removeChannel(channel);
        } catch {}
        resolve(false);
      }
    }, 650);

    channel.on('broadcast', { event: 'session_active' }, (payload: any) => {
      const foreignDeviceId = payload.payload?.deviceId;
      if (foreignDeviceId && foreignDeviceId !== currentDeviceId && !resolved) {
        resolved = true;
        clearTimeout(timer);
        try {
          void supabase.removeChannel(channel);
        } catch {}
        resolve(true);
      }
    });

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'check_active_session',
          payload: { deviceId: currentDeviceId },
        });
      }
    });
  });
}

export async function checkAccountInUseByPhone(supabase: any, phone: string, currentDeviceId: string): Promise<boolean> {
  return checkAccountInUse(supabase, phone, currentDeviceId);
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
