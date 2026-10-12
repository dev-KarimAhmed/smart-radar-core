import type { Request } from 'express';

/**
 * Server-side identity verification for Supabase-authenticated callers.
 *
 * server.ts already had one of these — verifyFirebaseIdToken — and used it properly on the
 * money endpoints: verify the token, look the caller up, check their role. But auth moved to
 * Supabase, so a captain or admin signing in today holds a SUPABASE access token and has no
 * Firebase ID token at all. Any endpoint still guarded only by the Firebase path is
 * effectively unguarded for real users, and endpoints written after the move were given no
 * guard at all.
 *
 * Never trust a role sent in a request body. `/api/generate-magic-link` accepted
 * `actorRole` from `req.body` (and then did not even read it), so anyone who could reach the
 * endpoint could mint a login link for any delegate id. That is what this closes.
 */

interface VerifiedCaller {
  userId: string;
  role: string;
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url: url.replace(/\/$/, ''), anonKey };
}

/** The bearer token the browser holds, taken only from the Authorization header. */
export function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * Asks Supabase who this token belongs to. The token is never decoded locally — an
 * unverified JWT payload is attacker-controlled text, and checking the signature ourselves
 * would mean holding the JWT secret here.
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

/**
 * The caller's role, read from public.profiles on the server. Deliberately NOT read from the
 * JWT's user_metadata: that is writable by the user through auth.updateUser, so a role
 * claimed there is a role the user granted themselves.
 */
export async function readCallerRole(userId: string, accessToken: string): Promise<string | null> {
  const config = supabaseConfig();
  if (!config) return null;

  try {
    const response = await fetch(
      `${config.url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`,
      {
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return null;

    const [row] = (await response.json()) as Array<{ role?: unknown }>;
    return typeof row?.role === 'string' ? row.role.toUpperCase() : null;
  } catch (error) {
    console.error('[supabase-identity] role lookup failed:', error);
    return null;
  }
}

/**
 * Verifies the caller and checks their role against `allowedRoles`.
 *
 * Returns a discriminated result rather than throwing so each route can phrase its own
 * refusal, and so a 401 (who are you?) stays distinguishable from a 403 (not allowed).
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

  const role = await readCallerRole(userId, accessToken);
  if (!role) {
    return { ok: false, status: 403, error: 'تعذّر التحقق من صلاحيتك.' };
  }

  const wanted = allowedRoles.map((value) => value.toUpperCase());
  if (!wanted.includes(role)) {
    return { ok: false, status: 403, error: 'غير مصرح لك بتنفيذ هذه العملية.' };
  }

  return { ok: true, caller: { userId, role }, accessToken };
}
