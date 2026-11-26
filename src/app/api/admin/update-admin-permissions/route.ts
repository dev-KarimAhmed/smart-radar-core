import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  ALL_SECTOR_IDS,
  ALL_SUB_PERMISSION_IDS,
  AdminSectorId,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
  UNRESTRICTED_GEO_SCOPE,
  getAdminRank,
  invalidateAdminCache,
  verifyAdminCaller,
} from '@/lib/admin-auth-verifier';
import {
  deriveSectorsFromPermissions,
  encodeAdminScopeAndPermsIntoAudit,
  getAllSubPermissionIdsForSectors,
  normalizeGeoScope,
} from '@/features/admin/lib/admin-permissions';

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  const callerRank = getAdminRank(admin);
  if (callerRank !== 'GENERAL_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: المشرف العام فقط يملك صلاحية تعديل صلاحيات القطاعات' },
      { status: 403 }
    );
  }

  try {
    const { adminId, allowedSectors, allowedPermissions, geoScope, adminRank } = await req.json();

    if (!adminId) {
      return NextResponse.json({ success: false, error: 'معرف المشرف مطلوب' }, { status: 400 });
    }

    if (adminId === PRIMARY_SOVEREIGN_ADMIN_ID) {
      return NextResponse.json({ success: false, error: 'لا يمكن تعديل صلاحيات المشرف العام السيادي الأساسي' }, { status: 403 });
    }

    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, role, rank_audit_log, allowed_sectors, country_id, governorate_id, district_id')
      .eq('id', adminId)
      .eq('role', 'ADMIN')
      .maybeSingle();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ success: false, error: 'المشرف غير موجود' }, { status: 404 });
    }

    if (targetProfile.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE) {
      return NextResponse.json({ success: false, error: 'لا يمكن تعديل صلاحيات المشرف العام السيادي الأساسي' }, { status: 403 });
    }

    const targetRank = adminRank || getAdminRank(targetProfile);

    const requestedSectors: AdminSectorId[] = Array.isArray(allowedSectors)
      ? allowedSectors.filter((s: string) => ALL_SECTOR_IDS.includes(s as AdminSectorId))
      : ['captains', 'riders'];

    const finalPermissions: string[] =
      targetRank === 'GENERAL_ADMIN'
        ? [...ALL_SUB_PERMISSION_IDS]
        : Array.isArray(allowedPermissions)
          ? allowedPermissions.filter((p: string) => ALL_SUB_PERMISSION_IDS.includes(p))
          : getAllSubPermissionIdsForSectors(requestedSectors);

    const derivedSectors = deriveSectorsFromPermissions(finalPermissions) as AdminSectorId[];
    const finalSectors: AdminSectorId[] =
      targetRank === 'GENERAL_ADMIN'
        ? [...ALL_SECTOR_IDS]
        : derivedSectors.length > 0
          ? derivedSectors
          : requestedSectors;

    const finalGeoScope = targetRank === 'GENERAL_ADMIN' ? { ...UNRESTRICTED_GEO_SCOPE } : normalizeGeoScope(geoScope);
    const rankAuditValue = targetRank === 'GENERAL_ADMIN' ? 'RANK_GENERAL_ADMIN' : 'RANK_ASSISTANT_ADMIN';
    const nextAudit = encodeAdminScopeAndPermsIntoAudit(
      targetProfile.rank_audit_log,
      rankAuditValue,
      finalGeoScope,
      finalPermissions
    );

    const profileUpdatePayload: Record<string, any> = {
      allowed_sectors: finalSectors,
      rank_audit_log: nextAudit,
      updated_at: new Date().toISOString(),
    };
    if (finalGeoScope.countryId) {
      profileUpdatePayload.country_id = finalGeoScope.countryId;
      profileUpdatePayload.governorate_id = finalGeoScope.governorateId ?? 1;
      profileUpdatePayload.district_id = finalGeoScope.districtId ?? 1;
    }

    const { error: profileUpdateErr } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', adminId);

    if (profileUpdateErr) throw profileUpdateErr;

    try {
      const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(adminId);
      const prevMeta = existingAuth?.user?.user_metadata || {};
      await supabaseAdmin.auth.admin.updateUserById(adminId, {
        user_metadata: {
          ...prevMeta,
          admin_rank: targetRank,
          allowed_sectors: finalSectors,
          allowed_permissions: finalPermissions,
          geo_scope: finalGeoScope,
        },
      });
    } catch (metaErr) {
      console.warn('[update-admin-permissions] user metadata update warn:', metaErr);
    }

    invalidateAdminCache(adminId);

    return NextResponse.json({
      success: true,
      adminId,
      adminRank: targetRank,
      allowedSectors: finalSectors,
      allowedPermissions: finalPermissions,
      geoScope: finalGeoScope,
      message: 'تم تحديث الصلاحيات والنطاق الجغرافي للمشرف بنجاح.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'فشل تحديث الصلاحيات' }, { status: 500 });
  }
}
