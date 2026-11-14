import crypto from 'node:crypto';

function readEnvTrimmed(name: string): string {
  return (process.env[name] || '').trim();
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
