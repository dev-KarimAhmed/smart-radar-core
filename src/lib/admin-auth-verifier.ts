import { supabaseAdmin } from './supabase-admin';
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

  // Primary sovereign admin or dev default is always GENERAL_ADMIN
  if (
    admin.id === PRIMARY_SOVEREIGN_ADMIN_ID ||
    admin.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE ||
    admin.id === 'dev-admin-001'
  ) {
    return 'GENERAL_ADMIN';
  }

  // Explicit property
  if (admin.admin_rank === 'GENERAL_ADMIN') return 'GENERAL_ADMIN';
  if (admin.admin_rank === 'ASSISTANT_ADMIN') return 'ASSISTANT_ADMIN';

  // Check rank_audit_log array
  const auditLog = admin.rank_audit_log;
  if (Array.isArray(auditLog)) {
    if (auditLog.includes('RANK_GENERAL_ADMIN')) return 'GENERAL_ADMIN';
    if (auditLog.includes('RANK_ASSISTANT_ADMIN')) return 'ASSISTANT_ADMIN';
  }

  // Check user_metadata
  const metaRank = admin.user_metadata?.admin_rank;
  if (metaRank === 'GENERAL_ADMIN') return 'GENERAL_ADMIN';
  if (metaRank === 'ASSISTANT_ADMIN') return 'ASSISTANT_ADMIN';

  return 'ASSISTANT_ADMIN';
}

interface CachedAdmin {
  admin: any;
  expiresAt: number;
}

// In-memory cache to make admin verification instantaneous (< 1ms)
const adminCache = new Map<string, CachedAdmin>();

export async function verifyAdminCaller(req: Request) {
  const isDev = process.env.NODE_ENV !== 'production';

  const authHeader = req.headers.get('authorization') || '';
  const adminIdHeader = req.headers.get('x-admin-id') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || adminIdHeader.trim();

  // 1. If in development and no token or mock dev token was sent, resolve the sovereign admin
  if (isDev && (!token || token === 'dev-admin-001' || token.startsWith('dev-'))) {
    const cachedDev = adminCache.get('__dev_admin__');
    if (cachedDev && cachedDev.expiresAt > Date.now()) {
      return cachedDev.admin;
    }

    try {
      const { data: defaultAdmin } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'ADMIN')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultAdmin) {
        adminCache.set('__dev_admin__', { admin: defaultAdmin, expiresAt: Date.now() + 5 * 60 * 1000 });
        return defaultAdmin;
      }
    } catch (err) {
      console.warn('[Admin Verifier] Dev default admin fetch error:', err);
    }

    // Dev fallback object if DB query had an issue
    return { id: 'dev-admin-001', role: 'ADMIN', full_name: 'مشرف التطوير' };
  }

  if (!token) return null;

  // 2. Check in-memory cache for this token
  const cached = adminCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.admin;
  }

  // 3. If token is a UUID (admin profile ID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
  if (isUuid) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', token)
        .maybeSingle();

      if (profile && String(profile.role).toUpperCase() === 'ADMIN') {
        adminCache.set(token, { admin: profile, expiresAt: Date.now() + 5 * 60 * 1000 });
        return profile;
      }
    } catch (err) {
      console.warn('[Admin Verifier] UUID lookup error:', err);
    }
  }

  // 4. If token is a JWT (3 dot-separated base64 segments)
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payloadRaw = Buffer.from(parts[1], 'base64').toString('utf8');
      const payload = JSON.parse(payloadRaw);

      if (payload && payload.sub) {
        // Fast role check in JWT metadata
        const roleInMeta = String(payload.user_metadata?.role || payload.app_metadata?.role || '').toUpperCase();
        if (roleInMeta === 'ADMIN') {
          const adminObj = {
            id: payload.sub,
            role: 'ADMIN',
            admin_rank: getAdminRank({ id: payload.sub, phone: payload.phone, user_metadata: payload.user_metadata }),
            user_metadata: payload.user_metadata,
            email: payload.email,
            phone: payload.phone,
            full_name: payload.user_metadata?.full_name || 'مشرف معتمد',
          };
          adminCache.set(token, { admin: adminObj, expiresAt: Date.now() + 5 * 60 * 1000 });
          return adminObj;
        }

        // Check profiles table for this payload.sub
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', payload.sub)
          .maybeSingle();

        if (profile && String(profile.role).toUpperCase() === 'ADMIN') {
          adminCache.set(token, { admin: profile, expiresAt: Date.now() + 5 * 60 * 1000 });
          return profile;
        }
      }
    } catch (jwtErr) {
      console.warn('[Admin Verifier] JWT decode error:', jwtErr);
    }
  }

  // 5. Fallback to Supabase Auth API with 1200ms timeout guard (production only)
  if (!isDev && token && token.length > 20) {
    try {
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const authPromise = supabaseAdmin.auth.getUser(token).then(({ data, error }) => {
        if (error || !data?.user) return null;
        return data.user;
      });

      const user = await Promise.race([authPromise, timeoutPromise]);

      if (user) {
        const roleInMeta = String(user.user_metadata?.role || user.app_metadata?.role || '').toUpperCase();
        if (roleInMeta === 'ADMIN') {
          adminCache.set(token, { admin: user, expiresAt: Date.now() + 5 * 60 * 1000 });
          return user;
        }

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && String(profile.role).toUpperCase() === 'ADMIN') {
          adminCache.set(token, { admin: profile, expiresAt: Date.now() + 5 * 60 * 1000 });
          return profile;
        }
      }
    } catch (err) {
      console.warn('[Admin Verifier] Supabase auth fallback error:', err);
    }
  }

  // In development, if all else failed, immediately permit sovereign admin (< 1ms)
  if (isDev) {
    const cachedDev = adminCache.get('__dev_admin__');
    if (cachedDev && cachedDev.expiresAt > Date.now()) {
      return cachedDev.admin;
    }

    const { data: defaultAdmin } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'ADMIN')
      .limit(1)
      .maybeSingle();

    if (defaultAdmin) {
      adminCache.set('__dev_admin__', { admin: defaultAdmin, expiresAt: Date.now() + 5 * 60 * 1000 });
      return defaultAdmin;
    }
    return { id: 'dev-admin-001', role: 'ADMIN', full_name: 'مشرف التطوير' };
  }

  return null;
}

