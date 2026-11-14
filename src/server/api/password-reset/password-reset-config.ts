import crypto from 'crypto';
import type { Request } from 'express';

export const TOKEN_TTL_MINUTES = 30;
export const MIN_PASSWORD_LENGTH = 8;

export interface ServiceConfig {
  url: string;
  serviceKey: string;
}

export function serviceConfig(): ServiceConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ''), serviceKey };
}

export function serviceHeaders(serviceKey: string): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/** Stored hashed so a database dump does not hand over working reset links. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Phone numbers are compared as digits only. A captain who registered as +201234567890 will
 * type 01234567890 when they are locked out, and a recovery flow that fails on formatting is
 * a recovery flow that does not work.
 */
export function phoneDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0]!.trim();
  return req.socket.remoteAddress || null;
}

export async function auditReset(
  config: ServiceConfig,
  entry: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${config.url}/rest/v1/password_reset_audit`, {
      method: 'POST',
      headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=minimal' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    // Never fail the caller's request because the audit write failed, but do make the gap
    // loud: a recovery step that happened without a record is exactly what the audit exists
    // to prevent.
    console.error('[password-reset] AUDIT WRITE FAILED', entry.action, error);
  }
}

export function resolveAppOrigin(req: Request): string {
  const originHeader = req.headers['origin'];
  if (typeof originHeader === 'string' && originHeader.startsWith('http')) {
    return originHeader.replace(/\/$/, '');
  }

  const refererHeader = req.headers['referer'];
  if (typeof refererHeader === 'string' && refererHeader.startsWith('http')) {
    try {
      const url = new URL(refererHeader);
      return url.origin;
    } catch {
      // ignore
    }
  }

  const fwdHost = req.headers['x-forwarded-host'];
  const host = typeof fwdHost === 'string' ? fwdHost.split(',')[0].trim() : String(req.headers.host || '');
  if (host) {
    const fwdProto = req.headers['x-forwarded-proto'];
    const proto = typeof fwdProto === 'string' ? fwdProto.split(',')[0].trim() : (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://bynkcom.com';
}
