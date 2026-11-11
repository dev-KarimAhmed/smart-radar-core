import type { Request } from 'express';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { verifyFirebaseIdToken } from '../middleware/server-rate-limiter';

/**
 * Server-side identity verification for Supabase- and Firebase-authenticated callers.
 *
 * Never trust a role or userId sent in a request body. Always verify the bearer/ID token
 * against the identity provider and look up the authoritative role and account status.
 */

const PRIMARY_SOVEREIGN_ADMIN_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
const PRIMARY_SOVEREIGN_ADMIN_PHONE = '+201551981922';

export interface VerifiedCaller {
  userId: string;
  role: string;
  status: string;
  isGeneralAdmin: boolean;
  provider: 'supabase' | 'firebase';
}

interface ProfileIdentityRow {
  role?: unknown;
  status?: unknown;
  phone?: unknown;
  allowed_sectors?: unknown;
  rank_audit_log?: unknown;
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey, serviceKey };
}

/** The bearer token the browser holds, taken only from the Authorization header. */
export function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !/^Bearer\s+/i.test(header)) return null;
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

/**
 * Asks Supabase who this token belongs to. The token is never decoded locally — an
 * unverified JWT payload is attacker-controlled text.
 */
export async function verifySupabaseAccessToken(accessToken: string): Promise<string | null> {
  const config = supabaseConfig();
  if (!config || !accessToken) return null;

  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;

    const user = (await response.json()) as { id?: unknown };
    return typeof user.id === 'string' && user.id ? user.id : null;
  } catch (error) {
    console.error('[supabase-identity] token verification failed:', error);
    return null;
  }
}

export async function readCallerProfile(
  userId: string,
  accessToken: string,
): Promise<{ role: string; status: string; isGeneralAdmin: boolean } | null> {
  const config = supabaseConfig();
  if (!config) return null;

  try {
    const authBearer = config.serviceKey || accessToken;
    const apiKey = config.serviceKey || config.anonKey;
    const response = await fetch(
      `${config.url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,role,status,phone,allowed_sectors,rank_audit_log&limit=1`,
      {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${authBearer}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return null;

    const [row] = (await response.json()) as ProfileIdentityRow[];
    if (!row) return null;

    const role = typeof row.role === 'string' ? row.role.toUpperCase() : '';
    const status = typeof row.status === 'string' ? row.status.toUpperCase() : 'ACTIVE';
    if (!role || status === 'BANNED' || status === 'SUSPENDED') {
      return null;
    }

    const audit = Array.isArray(row.rank_audit_log) ? (row.rank_audit_log as unknown[]) : [];
    const isGeneralAdmin =
      userId === PRIMARY_SOVEREIGN_ADMIN_ID ||
      row.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE ||
      audit.includes('RANK_GENERAL_ADMIN');

    return { role, status, isGeneralAdmin };
  } catch (error) {
    console.error('[supabase-identity] role lookup failed:', error);
    return null;
  }
}

/**
 * The caller's role, read from public.profiles on the server.
 */
export async function readCallerRole(userId: string, accessToken: string): Promise<string | null> {
  const profile = await readCallerProfile(userId, accessToken);
  return profile?.role ?? null;
}

/**
 * Verifies the caller (Supabase Bearer token) and checks their role against `allowedRoles`.
 */
export async function requireRole(
  req: Request,
  allowedRoles: string[],
): Promise<
  | { ok: true; caller: VerifiedCaller; accessToken: string }
  | { ok: false; status: 401 | 403 | 503; error: string }
> {
  if (!supabaseConfig()) {
    // Fail closed. A missing config must never read as "no check required".
    return { ok: false, status: 503, error: 'التحقق من الهوية غير متاح حالياً.' };
  }

  const accessToken = readBearerToken(req);
  if (!accessToken) {
    return { ok: false, status: 401, error: 'المصادقة مطلوبة لتنفيذ هذه العملية.' };
  }

  const userId = await verifySupabaseAccessToken(accessToken);
  if (!userId) {
    return { ok: false, status: 401, error: 'رمز الجلسة غير صالح أو منتهي الصلاحية.' };
  }

  const profile = await readCallerProfile(userId, accessToken);
  if (!profile) {
    return { ok: false, status: 403, error: 'تعذّر التحقق من صلاحيتك أو أن الحساب موقوف.' };
  }

  const wanted = allowedRoles.map((value) => value.toUpperCase());
  const isPrimarySovereign = userId === PRIMARY_SOVEREIGN_ADMIN_ID && wanted.includes('ADMIN');
  if (!wanted.includes(profile.role) && !isPrimarySovereign) {
    return { ok: false, status: 403, error: 'غير مصرح لك بتنفيذ هذه العملية.' };
  }

  return {
    ok: true,
    caller: {
      userId,
      role: isPrimarySovereign ? 'ADMIN' : profile.role,
      status: profile.status,
      isGeneralAdmin: profile.isGeneralAdmin,
      provider: 'supabase',
    },
    accessToken,
  };
}

/**
 * Verifies either a Supabase Bearer access token or a legacy Firebase ID token (header or body.idToken),
 * checks active account status, and verifies role/ownership against authoritative records.
 */
export async function requireExpressRole(
  req: Request,
  allowedRoles: string[],
  options: { allowSelfId?: string } = {},
): Promise<
  | { ok: true; caller: VerifiedCaller }
  | { ok: false; status: 401 | 403 | 503; error: string }
> {
  const bearerToken = readBearerToken(req);
  const bodyToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
  const wanted = allowedRoles.map((value) => value.toUpperCase());

  if (!bearerToken && !bodyToken) {
    return { ok: false, status: 401, error: 'المصادقة الأمنية مطلوبة لتنفيذ هذه العملية.' };
  }

  if (bearerToken && supabaseConfig()) {
    const userId = await verifySupabaseAccessToken(bearerToken);
    if (userId) {
      const profile = await readCallerProfile(userId, bearerToken);
      if (!profile) {
        return { ok: false, status: 403, error: 'تعذّر التحقق من صلاحيتك أو أن الحساب موقوف.' };
      }

      const isSelf = Boolean(options.allowSelfId && userId === options.allowSelfId);
      const isPrimarySovereign = userId === PRIMARY_SOVEREIGN_ADMIN_ID && wanted.includes('ADMIN');
      if (!wanted.includes(profile.role) && !isPrimarySovereign && !isSelf) {
        return { ok: false, status: 403, error: 'غير مصرح لك بتنفيذ هذه العملية.' };
      }

      return {
        ok: true,
        caller: {
          userId,
          role: isPrimarySovereign ? 'ADMIN' : profile.role,
          status: profile.status,
          isGeneralAdmin: profile.isGeneralAdmin,
          provider: 'supabase',
        },
      };
    }
  }

  // Legacy Firebase ID token fallback: NEVER grants ADMIN/OWNER/DELEGATE roles (those require Supabase verification).
  // Permitted solely for explicit self-scoped non-admin actions where allowSelfId matches the verified Firebase UID.
  const candidateFirebaseToken = bodyToken || bearerToken || '';
  if (candidateFirebaseToken && options.allowSelfId) {
    const uid = await verifyFirebaseIdToken(candidateFirebaseToken);
    if (uid && uid === options.allowSelfId) {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (!userSnap.exists()) {
          return { ok: false, status: 403, error: 'تعذّر التحقق من ملف الحساب.' };
        }
        const data = userSnap.data() as Record<string, unknown>;
        const statusRaw = String(data.status || 'active').toUpperCase();
        if (data.isBanned === true || statusRaw === 'BANNED' || statusRaw === 'SUSPENDED') {
          return { ok: false, status: 403, error: 'هذا الحساب موقوف أو محظور.' };
        }
        return {
          ok: true,
          caller: {
            userId: uid,
            role: 'DRIVER',
            status: statusRaw,
            isGeneralAdmin: false,
            provider: 'firebase',
          },
        };
      } catch (err) {
        console.error('[supabase-identity] Firebase profile lookup failed:', err);
        return { ok: false, status: 503, error: 'تعذّر التحقق من الهوية حالياً.' };
      }
    }
  }

  return { ok: false, status: 401, error: 'رمز الجلسة غير صالح أو منتهي الصلاحية.' };
}
