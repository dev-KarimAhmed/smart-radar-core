import crypto from 'node:crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

let _serverAdminClient: SupabaseClient | null = null;

export interface VerifiedCallerUser {
  id: string;
  role: string;
  status: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  serialId: string | null;
  allowedSectors: string[] | null;
  rankAuditLog: string[] | null;
  rawUser: User;
  profile: Record<string, unknown>;
}

const DEFAULT_ALLOWED_ORIGINS = [
  'https://smart-radar-core-production-8d61.up.railway.app',
  'https://bynkcom.com',
  'https://www.bynkcom.com',
];

function readEnvTrimmed(name: string): string {
  return (process.env[name] || '').trim();
}

export function getServerSupabaseAdmin(): SupabaseClient {
  if (_serverAdminClient) return _serverAdminClient;

  const url = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = readEnvTrimmed('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error('[security] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  _serverAdminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _serverAdminClient;
}

export function createEphemeralSupabaseAnonClient(): SupabaseClient {
  const url = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = readEnvTrimmed('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error('[security] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getHeaderValue(req: { headers: Headers | Record<string, unknown> }, name: string): string {
  const headers = req?.headers;
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') {
    return ((headers as Headers).get(name) || '').trim();
  }
  const rec = headers as Record<string, unknown>;
  const direct = rec[name] ?? rec[name.toLowerCase()];
  if (Array.isArray(direct)) return String(direct[0] ?? '').trim();
  return typeof direct === 'string' ? direct.trim() : '';
}

export function extractBearerToken(req: { headers: Headers | Record<string, unknown> }): string | null {
  const auth = getHeaderValue(req, 'authorization');
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) return null;
  const token = match[1]?.trim() || '';
  return token.length > 0 ? token : null;
}

export function timingSafeCompare(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const digestB = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

interface RateLimitBucket {
  timestamps: number[];
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();
const RATE_LIMIT_MAX_BUCKETS = 10_000;

export function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  nowMs: number = Date.now(),
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const cutoff = nowMs - windowMs;
  let bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetAt <= cutoff) {
    bucket = { timestamps: [], resetAt: nowMs + windowMs };
  } else {
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);
    bucket.resetAt = nowMs + windowMs;
  }

  if (bucket.timestamps.length >= maxRequests) {
    rateLimitStore.set(key, bucket);
    const oldest = bucket.timestamps[0] ?? nowMs;
    const retryAfterMs = Math.max(1_000, oldest + windowMs - nowMs);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1_000),
    };
  }

  bucket.timestamps.push(nowMs);
  rateLimitStore.set(key, bucket);

  if (rateLimitStore.size > RATE_LIMIT_MAX_BUCKETS) {
    for (const [storedKey, storedBucket] of rateLimitStore) {
      if (storedBucket.resetAt <= nowMs) {
        rateLimitStore.delete(storedKey);
      }
      if (rateLimitStore.size <= RATE_LIMIT_MAX_BUCKETS * 0.8) break;
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - bucket.timestamps.length),
    retryAfterSeconds: 0,
  };
}

const SAFE_IP_PATTERN = /^[a-zA-Z0-9.:_-]{3,64}$/;
const POSTGRES_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && POSTGRES_UUID_PATTERN.test(value.trim());
}

export function isMissingRpcError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const rec = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof rec.code === 'string' ? rec.code.trim() : '';
  const msg = `${typeof rec.message === 'string' ? rec.message : ''} ${typeof rec.details === 'string' ? rec.details : ''}`;
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /could not find the function/i.test(msg) ||
    /function .* does not exist/i.test(msg)
  );
}

export function getClientIp(req: { headers: Headers | Record<string, unknown> }): string {
  const railwayIp = getHeaderValue(req, 'x-railway-client-ip');
  if (railwayIp && SAFE_IP_PATTERN.test(railwayIp)) return railwayIp;

  const envoyIp = getHeaderValue(req, 'x-envoy-external-address');
  if (envoyIp && SAFE_IP_PATTERN.test(envoyIp)) return envoyIp;

  const forwarded = getHeaderValue(req, 'x-forwarded-for');
  if (forwarded) {
    // Take the rightmost proxy-appended hop so a client-supplied X-Forwarded-For cannot spoof arbitrary IPs.
    const hops = forwarded.split(',').map((hop) => hop.trim()).filter(Boolean);
    const rightmost = hops[hops.length - 1];
    if (rightmost && SAFE_IP_PATTERN.test(rightmost)) return rightmost;
  }

  const realIp = getHeaderValue(req, 'x-real-ip');
  if (realIp && SAFE_IP_PATTERN.test(realIp)) return realIp;

  return 'unknown';
}

function parseOriginUrl(raw: string): URL | null {
  if (!raw) return null;
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (parsed.username || parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSafeAppOrigin(req?: { headers: Headers | Record<string, unknown> }): string {
  const configuredPrimary =
    readEnvTrimmed('NEXT_PUBLIC_APP_URL') ||
    readEnvTrimmed('APP_URL') ||
    readEnvTrimmed('NEXT_PUBLIC_SITE_URL') ||
    (readEnvTrimmed('RAILWAY_PUBLIC_DOMAIN') ? `https://${readEnvTrimmed('RAILWAY_PUBLIC_DOMAIN')}` : '');

  const configuredOrigin = parseOriginUrl(configuredPrimary)?.origin || '';
  const extraAllowed = readEnvTrimmed('ALLOWED_APP_ORIGINS')
    .split(',')
    .map((entry) => parseOriginUrl(entry.trim())?.hostname.toLowerCase())
    .filter((h): h is string => Boolean(h));

  const allowHosts = new Set<string>([
    ...DEFAULT_ALLOWED_ORIGINS.map((u) => new URL(u).hostname.toLowerCase()),
    ...extraAllowed,
  ]);
  if (configuredOrigin) {
    allowHosts.add(new URL(configuredOrigin).hostname.toLowerCase());
  }
  if (process.env.NODE_ENV !== 'production') {
    allowHosts.add('localhost');
    allowHosts.add('127.0.0.1');
  }

  if (req) {
    const originHeader = parseOriginUrl(getHeaderValue(req, 'origin'));
    if (originHeader && allowHosts.has(originHeader.hostname.toLowerCase())) {
      return originHeader.origin;
    }

    const fwdHost = getHeaderValue(req, 'x-forwarded-host').split(',')[0]?.trim() || '';
    const hostHeader = fwdHost || getHeaderValue(req, 'host').split(',')[0]?.trim() || '';
    const hostUrl = hostHeader ? parseOriginUrl(hostHeader) : null;
    if (hostUrl && allowHosts.has(hostUrl.hostname.toLowerCase())) {
      const isLocal = hostUrl.hostname === 'localhost' || hostUrl.hostname === '127.0.0.1';
      const proto = isLocal && process.env.NODE_ENV !== 'production' ? 'http' : 'https';
      return `${proto}://${hostUrl.host}`;
    }
  }

  if (configuredOrigin) return configuredOrigin;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000';
  return DEFAULT_ALLOWED_ORIGINS[0];
}

export function getPurposeHmacKey(envVarName: string, purpose: string, secretOverride?: string): string {
  const override = secretOverride?.trim();
  if (override) return override;

  const dedicated = readEnvTrimmed(envVarName);
  if (dedicated) return dedicated;

  const serviceRoleKey = readEnvTrimmed('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    throw new Error(`[security] Missing ${envVarName} and SUPABASE_SERVICE_ROLE_KEY`);
  }

  return crypto
    .createHmac('sha256', serviceRoleKey)
    .update(`radar-sovereign-key:${purpose}`)
    .digest('hex');
}

export function hashOtpCode(code: string, userId: string, secretOverride?: string): string {
  const key = getPurposeHmacKey('OTP_HMAC_SECRET', 'email-otp', secretOverride);
  return crypto
    .createHmac('sha256', key)
    .update(`${userId}:${String(code).trim()}`)
    .digest('hex');
}

export function verifyOtpHash(
  code: string,
  userId: string,
  storedHash: string,
  secretOverride?: string,
): boolean {
  if (!storedHash || !code || !userId) return false;
  const computed = hashOtpCode(code, userId, secretOverride);
  return timingSafeCompare(computed, storedHash);
}

export function signTrackingToken(
  requestId: string,
  expiresAtMs: number,
  secretOverride?: string,
): string {
  const key = getPurposeHmacKey('TRACKING_TOKEN_SECRET', 'live-trip-tracking', secretOverride);
  const exp = Math.floor(expiresAtMs);
  const sig = crypto
    .createHmac('sha256', key)
    .update(`track:${requestId}:${exp}`)
    .digest('hex');
  return `${exp}.${sig}`;
}

export function verifyTrackingToken(
  requestId: string,
  token: string,
  secretOverride?: string,
  nowMs: number = Date.now(),
): { valid: boolean; reason?: string; expiresAtMs?: number } {
  if (!requestId || !token) return { valid: false, reason: 'missing_token' };
  const parts = String(token).trim().split('.');
  if (parts.length !== 2) return { valid: false, reason: 'malformed_token' };

  const exp = Number(parts[0]);
  const sig = parts[1] || '';
  if (!Number.isFinite(exp) || !/^[a-f0-9]{64}$/i.test(sig)) {
    return { valid: false, reason: 'malformed_token' };
  }
  if (exp < nowMs) {
    return { valid: false, reason: 'expired_token' };
  }

  const key = getPurposeHmacKey('TRACKING_TOKEN_SECRET', 'live-trip-tracking', secretOverride);
  const expectedSig = crypto
    .createHmac('sha256', key)
    .update(`track:${requestId}:${exp}`)
    .digest('hex');

  if (!timingSafeCompare(sig.toLowerCase(), expectedSig.toLowerCase())) {
    return { valid: false, reason: 'invalid_signature' };
  }

  return { valid: true, expiresAtMs: exp };
}

export function isValidStorageRelativePath(rawPath: string): boolean {
  if (!rawPath || typeof rawPath !== 'string') return false;
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed.length > 512) return false;
  if (trimmed.includes('..') || trimmed.includes('\\') || trimmed.includes('\0')) return false;
  if (trimmed.startsWith('/') || trimmed.includes('?') || trimmed.includes('#')) return false;
  return /^[a-zA-Z0-9._/-]+$/.test(trimmed);
}

export async function getVerifiedUser(
  req: { headers: Headers | Record<string, unknown> },
  options: { allowSuspended?: boolean } = {},
): Promise<VerifiedCallerUser | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  let adminClient: SupabaseClient;
  try {
    adminClient = getServerSupabaseAdmin();
  } catch {
    return null;
  }

  const { data: userData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !userData?.user) return null;

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, role, status, full_name, phone, email, serial_id, allowed_sectors, rank_audit_log')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  const role = String(profile.role || '').toUpperCase();
  const status = String(profile.status || 'ACTIVE').toUpperCase();
  if (status === 'BANNED') return null;
  if (status === 'SUSPENDED' && !options.allowSuspended) return null;

  return {
    id: userData.user.id,
    role,
    status,
    email: (profile.email as string | null) ?? userData.user.email ?? null,
    phone: (profile.phone as string | null) ?? userData.user.phone ?? null,
    fullName: (profile.full_name as string | null) ?? null,
    serialId: (profile.serial_id as string | null) ?? null,
    allowedSectors: Array.isArray(profile.allowed_sectors) ? (profile.allowed_sectors as string[]) : null,
    rankAuditLog: Array.isArray(profile.rank_audit_log) ? (profile.rank_audit_log as string[]) : null,
    rawUser: userData.user,
    profile: profile as Record<string, unknown>,
  };
}

