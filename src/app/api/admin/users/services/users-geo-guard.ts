import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getAdminGeoScope,
  hasAdminPermission,
  isEntityWithinGeoScope,
  isGeoScopeRestricted,
} from '@/lib/admin-auth-verifier';
import type { AdminUsersQueryFilters } from './users-query-builder';

export interface ScopedQueryResult {
  blocked: boolean;
  filters: AdminUsersQueryFilters;
}

export function applyAdminGeoToUserFilters(admin: any, filters: AdminUsersQueryFilters): ScopedQueryResult {
  const scope = getAdminGeoScope(admin);
  if (!isGeoScopeRestricted(scope)) {
    return { blocked: false, filters };
  }

  const nextFilters: AdminUsersQueryFilters = { ...filters };

  if (scope.countryId !== null) {
    if (filters.countryId && filters.countryId !== 'ALL' && Number(filters.countryId) !== scope.countryId) {
      return { blocked: true, filters: nextFilters };
    }
    nextFilters.countryId = String(scope.countryId);
  }

  if (scope.governorateId !== null) {
    if (filters.governorateId && filters.governorateId !== 'ALL' && Number(filters.governorateId) !== scope.governorateId) {
      return { blocked: true, filters: nextFilters };
    }
    nextFilters.governorateId = String(scope.governorateId);
  }

  if (scope.districtId !== null) {
    if (filters.districtId && filters.districtId !== 'ALL' && Number(filters.districtId) !== scope.districtId) {
      return { blocked: true, filters: nextFilters };
    }
    nextFilters.districtId = String(scope.districtId);
  }

  return { blocked: false, filters: nextFilters };
}

export function getRequiredPermissionForUserAction(
  action: string,
  targetRole?: 'CAPTAIN' | 'RIDER'
): string | null {
  switch (action) {
    case 'topup_minutes':
    case 'adjust_balance':
    case 'bulk_topup':
      return 'captains.topup';
    case 'update_language':
    case 'update_tier':
      return 'captains.tier_lang';
    case 'force_clear_trip':
      return 'captains.security';
    case 'reset_penalties':
      return 'riders.security';
    case 'simulate_rider_activity':
    case 'run_inactivity_check':
      return 'riders.simulation';
    case 'update_status':
      return targetRole === 'RIDER' ? 'riders.security' : 'captains.security';
    case 'send_message':
    case 'bulk_send_message':
      return targetRole === 'RIDER' ? 'riders.message' : 'captains.message';
    default:
      return null;
  }
}

export async function resolveAndAuthorizeUserMutation(
  admin: any,
  body: any
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { action, userId } = body || {};
  const effectiveUserId = userId || body?.riderId;
  const targetIds: string[] = [];

  if (typeof effectiveUserId === 'string' && effectiveUserId.trim()) {
    targetIds.push(effectiveUserId.trim());
  }
  if (Array.isArray(body?.targetIds)) {
    for (const id of body.targetIds) {
      if (typeof id === 'string' && id.trim()) targetIds.push(id.trim());
    }
  }

  let inferredRole: 'CAPTAIN' | 'RIDER' | undefined =
    body?.targetRole === 'RIDER' || body?.role === 'RIDER' || body?.riderId
      ? 'RIDER'
      : body?.targetRole === 'CAPTAIN' || body?.role === 'CAPTAIN'
        ? 'CAPTAIN'
        : undefined;

  let targetProfiles: Array<{
    id: string;
    role: string;
    country_id: number | null;
    governorate_id: number | null;
    district_id: number | null;
    phone: string | null;
  }> = [];

  if (targetIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, role, country_id, governorate_id, district_id, phone')
      .in('id', targetIds.slice(0, 100));
    targetProfiles = data || [];
    if (!inferredRole && targetProfiles[0]?.role) {
      inferredRole = targetProfiles[0].role.toUpperCase() === 'RIDER' ? 'RIDER' : 'CAPTAIN';
    }
  }

  const requiredPerm = getRequiredPermissionForUserAction(action, inferredRole);
  if (requiredPerm && !hasAdminPermission(admin, requiredPerm)) {
    return {
      ok: false,
      status: 403,
      error: 'غير مصرح: لا تملك الصلاحية الفرعية اللازمة لتنفيذ هذا الإجراء.',
    };
  }

  const scope = getAdminGeoScope(admin);
  if (isGeoScopeRestricted(scope)) {
    if (action === 'run_inactivity_check') {
      return { ok: true };
    }
    if (action === 'bulk_topup' || action === 'bulk_send_message') {
      if (targetIds.length === 0) {
        return {
          ok: false,
          status: 403,
          error: 'غير مصرح للمشرف المقيد جغرافياً بإرسال حملات شاملة خارج نطاقه.',
        };
      }
    }
    for (const profile of targetProfiles) {
      if (!isEntityWithinGeoScope(scope, profile)) {
        return {
          ok: false,
          status: 403,
          error: 'غير مصرح: المستخدم المستهدف يقع خارج النطاق الجغرافي المصرح لك.',
        };
      }
    }
  }

  return { ok: true };
}
