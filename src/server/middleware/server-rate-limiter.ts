import express from 'express';
import path from 'path';
import fs from 'fs';

// Helper to load firebase config securely on the server
export const getFirebaseApiKey = (): string => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const rawData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(rawData);
    return config.apiKey || '';
  } catch (err) {
    console.error("Failed to read firebase-applet-config.json:", err);
    return '';
  }
};

// Secure Server-Authoritative Identity Verification via Google Identity Toolkit
export async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  if (!idToken) return null;
  try {
    const apiKey = getFirebaseApiKey();
    if (!apiKey) return null;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) return null;
    const data = (await response.json()) as any;
    if (data && data.users && data.users.length > 0) {
      return data.users[0].localId; // Verified UID
    }
  } catch (err) {
    console.error("[Token Verification Error]:", err);
  }
  return null;
}

// Real-time IP-based Sliding Window Rate Limiter (Zone B)
const rateLimitMap = new Map<string, { timestamps: number[]; resetAt: number }>();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute
const MAX_RATE_LIMIT_BUCKETS = 10_000;

const SAFE_IP_PATTERN = /^[a-zA-Z0-9.:_-]{3,64}$/;

function readHeaderString(req: express.Request, name: string): string {
  const val = req.headers[name];
  if (Array.isArray(val)) return String(val[0] ?? '').trim();
  return typeof val === 'string' ? val.trim() : '';
}

export function extractExpressClientIp(req: express.Request): string {
  const railwayIp = readHeaderString(req, 'x-railway-client-ip');
  if (railwayIp && SAFE_IP_PATTERN.test(railwayIp)) return railwayIp;

  const envoyIp = readHeaderString(req, 'x-envoy-external-address');
  if (envoyIp && SAFE_IP_PATTERN.test(envoyIp)) return envoyIp;

  const forwarded = readHeaderString(req, 'x-forwarded-for');
  if (forwarded) {
    // Take rightmost proxy-appended hop so client-supplied left-hand values cannot spoof IPs
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    const rightmost = hops[hops.length - 1];
    if (rightmost && SAFE_IP_PATTERN.test(rightmost)) return rightmost;
  }

  const realIp = readHeaderString(req, 'x-real-ip');
  if (realIp && SAFE_IP_PATTERN.test(realIp)) return realIp;

  const remote = req.socket?.remoteAddress || 'unknown-ip';
  return remote;
}

export function createScopedRateLimiter(
  scope: string,
  maxRequests: number = MAX_REQUESTS_PER_WINDOW,
  windowMs: number = LIMIT_WINDOW_MS,
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = extractExpressClientIp(req);
    const key = `${scope}:${ip}`;
    const now = Date.now();
    const cutoff = now - windowMs;

    let tracker = rateLimitMap.get(key);
    if (!tracker) {
      tracker = { timestamps: [], resetAt: now + windowMs };
      rateLimitMap.set(key, tracker);
    }

    tracker.timestamps = tracker.timestamps.filter((t) => t > cutoff);
    tracker.resetAt = now + windowMs;

    if (tracker.timestamps.length >= maxRequests) {
      const oldest = tracker.timestamps[0] ?? now;
      const retryAfterSeconds = Math.ceil(Math.max(1_000, oldest + windowMs - now) / 1_000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      console.warn(`[Sovereign Core Shield] Scope ${scope} IP Blocked owing to Flood Attempt: ${ip}`);
      return res.status(429).json({
        success: false,
        error: 'تهديد حركي: تم تجاوز حد الطلبات المسموح به لحماية الموارد السحابية المعزولة.'
      });
    }

    tracker.timestamps.push(now);

    if (rateLimitMap.size > MAX_RATE_LIMIT_BUCKETS) {
      for (const [storedKey, bucket] of rateLimitMap) {
        if (bucket.resetAt <= now) {
          rateLimitMap.delete(storedKey);
        }
        if (rateLimitMap.size <= MAX_RATE_LIMIT_BUCKETS * 0.8) break;
      }
    }

    next();
  };
}

export const rateLimiterMiddleware = createScopedRateLimiter(
  'express-api',
  MAX_REQUESTS_PER_WINDOW,
  LIMIT_WINDOW_MS,
);

// Synchronous Execution Locks on Backend to eliminate "The Ghost Command Syndrome" (SSOT Protection)
const activeBackendLocks = new Set<string>();

export const acquireBackendLock = (key: string): boolean => {
  if (activeBackendLocks.has(key)) return false;
  activeBackendLocks.add(key);
  return true;
};

export const releaseBackendLock = (key: string) => {
  activeBackendLocks.delete(key);
};
