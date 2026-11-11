import crypto from 'node:crypto';
import { getServerSupabaseAdmin } from '@/shared/server/api-auth-guard';
import {
  ADMIN_SECTORS,
  ALL_SECTOR_IDS,
  AdminSectorId,
  getAdminAllowedSectors,
  hasAdminSectorAccess,
} from '@/features/admin/lib/admin-permissions';

export type AdminRank = 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';

export const PRIMARY_SOVEREIGN_ADMIN_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
export const PRIMARY_SOVEREIGN_ADMIN_PHONE = '+201551981922';

export {
  ADMIN_SECTORS,
  ALL_SECTOR_IDS,
  getAdminAllowedSectors,
  hasAdminSectorAccess,
};
export type { AdminSectorId };

export function getAdminRank(admin: any): AdminRank {
  if (!admin) return 'ASSISTANT_ADMIN';

  if (
    admin.id === PRIMARY_SOVEREIGN_ADMIN_ID ||
    admin.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE ||
    admin.admin_rank === 'GENERAL_ADMIN'
  ) {
    return 'GENERAL_ADMIN';
  }

  const auditLog = admin.rank_audit_log;
  if (Array.isArray(auditLog)) {
    if (auditLog.includes('RANK_GENERAL_ADMIN')) return 'GENERAL_ADMIN';
    if (auditLog.includes('RANK_ASSISTANT_ADMIN')) return 'ASSISTANT_ADMIN';
  }

  return 'ASSISTANT_ADMIN';
}

interface CachedAdmin {
  admin: Record<string, any>;
  expiresAt: number;
}

const ADMIN_CACHE_TTL_MS = 60_000;
const ADMIN_CACHE_MAX_SIZE = 200;
const adminCache = new Map<string, CachedAdmin>();

function hashCacheKey(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function invalidateAdminCache(userId?: string): void {
  if (!userId) {
    adminCache.clear();
    return;
  }
  for (const [key, entry] of adminCache) {
    if (entry.admin?.id === userId) {
      adminCache.delete(key);
    }
  }
}

function readBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return null;
  const token = match[1]?.trim() || '';
  return token.length >= 20 ? token : null;
}

export async function verifyAdminCaller(req: Request): Promise<Record<string, any> | null> {
  const token = readBearerToken(req);
  if (!token) return null;

  const cacheKey = hashCacheKey(token);
  const now = Date.now();
  const cached = adminCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.admin;
  }

  try {
    const supabaseAdmin = getServerSupabaseAdmin();
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4_000));
    const authPromise = supabaseAdmin.auth.getUser(token).then(({ data, error }) => {
      if (error || !data?.user) return null;
      return data.user;
    });

    const user = await Promise.race([authPromise, timeoutPromise]);
    if (!user?.id) return null;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status, full_name, phone, email, serial_id, allowed_sectors, rank_audit_log, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) return null;

    const profileStatus = String(profile.status || 'ACTIVE').toUpperCase();
    if (profileStatus === 'BANNED' || profileStatus === 'SUSPENDED') {
      return null;
    }

    const profileRole = String(profile.role || '').toUpperCase();
    const isAdminRole = profileRole === 'ADMIN' || profile.id === PRIMARY_SOVEREIGN_ADMIN_ID;
    if (!isAdminRole) {
      return null;
    }

    const enrichedAdmin: Record<string, any> = {
      ...profile,
      role: 'ADMIN',
      admin_rank: getAdminRank(profile),
    };

    if (adminCache.size >= ADMIN_CACHE_MAX_SIZE) {
      for (const [k, v] of adminCache) {
        if (v.expiresAt <= now) adminCache.delete(k);
      }
      if (adminCache.size >= ADMIN_CACHE_MAX_SIZE) {
        adminCache.clear();
      }
    }

    adminCache.set(cacheKey, {
      admin: enrichedAdmin,
      expiresAt: now + ADMIN_CACHE_TTL_MS,
    });

    return enrichedAdmin;
  } catch (err) {
    console.warn('[Admin Verifier] Token or profile verification error:', err);
    return null;
  }
}

export async function requireAdminAccess(
  req: Request,
  options: { sector?: AdminSectorId; requireGeneralAdmin?: boolean } = {},
): Promise<
  | { ok: true; admin: Record<string, any>; rank: AdminRank }
  | { ok: false; status: 401 | 403; error: string }
> {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized: Valid administrator session is required.',
    };
  }

  const rank = getAdminRank(admin);
  if (options.requireGeneralAdmin && rank !== 'GENERAL_ADMIN') {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: This action requires GENERAL_ADMIN privileges.',
    };
  }

  if (options.sector && !hasAdminSectorAccess(admin, options.sector)) {
    return {
      ok: false,
      status: 403,
      error: `Forbidden: Administrator lacks access to sector '${options.sector}'.`,
    };
  }

  return { ok: true, admin, rank };
}