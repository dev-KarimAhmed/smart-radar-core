import crypto from 'node:crypto';
import type { Request } from 'express';
import { getClientIp, getSafeAppOrigin } from '../../shared/server/api-auth-guard';

export const TOKEN_TTL_MINUTES = 30;
export const MIN_PASSWORD_LENGTH = 8;

export function serviceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ''), serviceKey };
}

export function serviceHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function phoneDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function clientIp(req: Request) {
  const ip = getClientIp(req);
  if (ip !== 'unknown') return ip;
  return req.socket.remoteAddress || null;
}

export async function auditReset(
  config: { url: string; serviceKey: string },
  entry: Record<string, unknown>
) {
  try {
    await fetch(`${config.url}/rest/v1/password_reset_audit`, {
      method: 'POST',
      headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=minimal' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    console.error('[password-reset] AUDIT WRITE FAILED', entry.action, error);
  }
}

export async function findAuthUserByPhone(
  config: { url: string; serviceKey: string },
  digits: string
): Promise<{ id: string; email: string | null } | null> {
  if (!digits) return null;

  const response = await fetch(`${config.url}/rest/v1/rpc/find_account_by_phone`, {
    method: 'POST',
    headers: serviceHeaders(config.serviceKey),
    body: JSON.stringify({ p_phone_digits: digits }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;

  const [row] = (await response.json()) as Array<{ user_id?: string; email?: string | null }>;
  if (!row?.user_id) return null;

  return { id: row.user_id, email: row.email?.trim() || null };
}

export async function findAuthUserByEmail(
  config: { url: string; serviceKey: string },
  email: string
): Promise<{ id: string; email: string | null; phone: string | null } | null> {
  if (!email) return null;

  const response = await fetch(`${config.url}/rest/v1/rpc/find_account_by_email`, {
    method: 'POST',
    headers: serviceHeaders(config.serviceKey),
    body: JSON.stringify({ p_email: email }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;

  const [row] = (await response.json()) as Array<{ user_id?: string; phone?: string | null; email?: string | null }>;
  if (!row?.user_id) return null;

  return { id: row.user_id, phone: row.phone?.trim() || null, email: row.email?.trim() || null };
}

export function resolveAppOrigin(req: Request): string {
  return getSafeAppOrigin(req);
}
