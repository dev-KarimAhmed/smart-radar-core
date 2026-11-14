import { supabase } from '@/lib/supabase-client';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import { getAuthRedirectUrl } from '@/lib/utils';
import { readJson, readError } from './password-recovery-http';

export * from './password-recovery-admin';
export { readJson, readError };

/**
 * Asks for recovery. The answer is deliberately identical whether or not the phone is
 * registered, so callers must not branch on it — there is nothing to branch on.
 */
export async function requestPasswordRecovery(phone: string, email?: string) {
  if (isSaudiPhoneNumber(phone)) {
    throw new Error(SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected);
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Ignore in unauthenticated context
  }

  const currentLang = typeof window !== 'undefined'
    ? (window.localStorage.getItem('radar_dashboard_language') === 'en' ? 'en' : 'ar')
    : 'ar';

  const response = await fetch('/api/password-reset/request', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone,
      email: email?.trim() || undefined,
      lang: currentLang,
    }),
  });

  const payload = await readJson<{
    success?: boolean;
    message?: string;
    error?: string;
    emailSent?: boolean;
  }>(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'تعذّر إرسال طلب الاسترجاع.');
  }
  return {
    message: payload.message ?? '',
    emailSent: payload.emailSent ?? true,
  };
}

/** Redeems an admin-issued token. No session needed — the whole point is being locked out. */
export async function completePasswordReset(token: string, newPassword: string) {
  const response = await fetch('/api/password-reset/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'تعذّر تحديث كلمة المرور.'));
  }
}

/**
 * The email route lands the user here already carrying a recovery session, created by
 * Supabase from the link. Setting the password is then an ordinary authenticated update.
 */
export async function completeEmailRecovery(newPassword: string, fallbackToken?: string) {
  let tokenFromHash = fallbackToken || '';
  let refreshToken = '';

  if (typeof window !== 'undefined') {
    if (!tokenFromHash) {
      const hash = window.location.hash || '';
      if (hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
        tokenFromHash = hashParams.get('access_token') || '';
        refreshToken = hashParams.get('refresh_token') || '';
      }
    }
    if (!tokenFromHash) {
      tokenFromHash = window.sessionStorage.getItem('recovery_access_token') || '';
      refreshToken = window.sessionStorage.getItem('recovery_refresh_token') || '';
    }
  }

  if (tokenFromHash) {
    try {
      await supabase.auth.setSession({
        access_token: tokenFromHash,
        refresh_token: refreshToken || '',
      });
    } catch {
      // continue
    }
  }

  // 1. Try native client update
  let clientError: Error | null = null;
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error && data?.user) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('recovery_access_token');
        window.sessionStorage.removeItem('recovery_refresh_token');
      }
      return;
    }
    if (error) {
      clientError = error;
    }
  } catch (err) {
    clientError = err instanceof Error ? err : new Error(String(err));
  }

  // 2. Rescue fallback: If client session dropped ("Auth session missing"), rescue via server using the accessToken!
  let tokenToRescue = tokenFromHash;
  if (!tokenToRescue) {
    const { data: sessionData } = await supabase.auth.getSession();
    tokenToRescue = sessionData.session?.access_token || '';
  }

  if (tokenToRescue) {
    try {
      const rescueRes = await fetch('/api/password-reset/rescue-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: tokenToRescue, newPassword }),
      });
      if (rescueRes.ok) {
        const payload = (await rescueRes.json()) as { success?: boolean; error?: string };
        if (payload.success) {
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem('recovery_access_token');
            window.sessionStorage.removeItem('recovery_refresh_token');
          }
          return;
        }
        if (payload.error) {
          throw new Error(payload.error);
        }
      }
    } catch (rescueErr) {
      console.warn('[password-recovery] rescue endpoint failed:', rescueErr);
      if (rescueErr instanceof Error && !rescueErr.message.includes('fetch')) {
        throw rescueErr;
      }
    }
  }

  if (clientError) {
    throw new Error(
      clientError.message.includes('session missing')
        ? 'انتهت صلاحية جلسة الاستعادة أو الرابط. يرجى طلب رابط جديد من شاشة الدخول.'
        : clientError.message,
    );
  }
}

export async function hasRecoverySession() {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

/**
 * Adds or changes the recovery email on the signed-in account. Supabase sends a confirmation
 * to the new address; until it is confirmed the account keeps its old one, so the caller
 * must tell the user to go and confirm rather than reporting success outright.
 */
export async function setRecoveryEmail(email: string) {
  const { error } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
  );
  if (error) throw new Error(error.message);
}
