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

async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Asks for recovery. The answer is deliberately identical whether or not the phone is
 * registered, so callers must not branch on it — there is nothing to branch on.
 */
export async function requestPasswordRecovery(phone: string) {
  const response = await fetch('/api/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  const payload = await response.json() as { success?: boolean; message?: string; error?: string };
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'تعذّر إرسال طلب الاسترجاع.');
  }
  return payload.message ?? '';
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
export async function completeEmailRecovery(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
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
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) throw new Error(error.message);
}

export async function listPasswordResetRequests(status = 'PENDING') {
  const response = await fetch(`/api/password-reset/requests?status=${encodeURIComponent(status)}`, {
    headers: await adminHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readError(response, 'تعذّر تحميل طلبات الاسترجاع.'));
  }
  const payload = await response.json() as { requests?: PasswordResetRequestRow[] };
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
  return await response.json() as { token: string; expiresAt: string; expiresInMinutes: number };
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
