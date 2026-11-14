import { supabase } from '@/lib/supabase-client';
import { readJson, readError } from './password-recovery-http';

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

export async function adminHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('session_expired');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
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

