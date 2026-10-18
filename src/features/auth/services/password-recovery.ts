import { supabase } from '@/lib/supabase-client';

/**
 * Client side of password recovery. Every call goes to the Express routes in
 * src/server/api/password-reset.ts — the service_role key that actually changes a password
 * lives only on the server, and nothing here can or should reach it.
 */

export interface PasswordResetRequestRow {
  id: string;
  claimed_phone: string;
  profile_id: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  verification_note: string | null;
  token_expires_at: string | null;
}

async function adminHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('session_expired');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Reads a JSON body without assuming there is one.
 *
 * These endpoints live on the Express server that wraps Next. When Express has not picked up
 * a route — most often because server.ts changed and the dev server was not restarted, since
 * tsx does not reload it — the request falls through to Next, which answers with an HTML 404
 * page. Calling response.json() on that throws `Unexpected token '<', "<!DOCTYPE "...`, which
 * tells the person staring at it nothing at all.
 */
async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(
      response.status === 404
        ? 'خدمة استرداد كلمة المرور غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الدعم.'
        : 'استجابة غير متوقعة من الخادم. يرجى المحاولة لاحقاً.',
    );
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const payload = await readJson<{ error?: string }>(response);
    return payload.error || fallback;
  } catch (error) {
    // A non-JSON body already carries the clearer explanation from readJson; a JSON body
    // without an `error` key falls back to the caller's message.
    return error instanceof Error ? error.message : fallback;
  }
}

/**
 * Asks for recovery. The answer is deliberately identical whether or not the phone is
 * registered, so callers must not branch on it — there is nothing to branch on.
 */
export async function requestPasswordRecovery(phone: string, email?: string) {
  const response = await fetch('/api/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // The email is a confirmation the server checks against the address already on the
    // account. It is never where the link gets sent — see the endpoint for why.
    body: JSON.stringify({ phone, email: email?.trim() || undefined }),
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
import { getAuthRedirectUrl } from '@/lib/utils';

export async function setRecoveryEmail(email: string) {
  const { error } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
  );
  if (error) throw new Error(error.message);
}

export async function listPasswordResetRequests(status = 'PENDING') {
  const response = await fetch(`/api/password-reset/requests?status=${encodeURIComponent(status)}`, {
    headers: await adminHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'تعذّر تحميل طلبات الاسترجاع.'));
  }
  const payload = await readJson<{ requests?: PasswordResetRequestRow[] }>(response);
  return payload.requests ?? [];
}

/** Returns the one-time token. It is shown once and never retrievable again. */
export async function issuePasswordResetToken(requestId: string, verificationNote: string) {
  const response = await fetch('/api/password-reset/issue', {
    method: 'POST',
    headers: await adminHeaders(),
    body: JSON.stringify({ requestId, verificationNote }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'تعذّر إصدار رمز الاسترجاع.'));
  }
  return await readJson<{ token: string; expiresAt: string; expiresInMinutes: number }>(response);
}

export async function rejectPasswordResetRequest(requestId: string, reason: string) {
  const response = await fetch('/api/password-reset/reject', {
    method: 'POST',
    headers: await adminHeaders(),
    body: JSON.stringify({ requestId, reason }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'تعذّر رفض الطلب.'));
  }
}
