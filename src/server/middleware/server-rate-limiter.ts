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
const rateLimitMap = new Map<string, { timestamps: number[] }>();
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute

export const rateLimiterMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();
  const now = Date.now();

  let tracker = rateLimitMap.get(ip);
  if (!tracker) {
    tracker = { timestamps: [] };
    rateLimitMap.set(ip, tracker);
  }

  // Filter out timestamps outside the active window
  tracker.timestamps = tracker.timestamps.filter(t => now - t < LIMIT_WINDOW_MS);

  if (tracker.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[Sovereign Core Shield] IP Blocked owing to Flood Attempt: ${ip}`);
    return res.status(429).json({
      success: false,
      error: 'تهديد حركي: تم تجاوز حد الطلبات المسموح به لحماية الموارد السحابية المعزولة.'
    });
  }

  tracker.timestamps.push(now);
  next();
};

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
