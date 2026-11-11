import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidUuid } from '@/shared/server/api-auth-guard';
import {
  requireAdminAccess,
  getAdminRank,
  invalidateAdminCache,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '@/lib/admin-auth-verifier';
import { ALL_SECTOR_IDS, AdminSectorId } from '@/features/admin/lib/admin-permissions';

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { requireGeneralAdmin: true });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.status === 403 ? 'غير مصرح: المشرف العام فقط يملك صلاحية تعديل صلاحيات القطاعات' : access.error },
      { status: access.status }
    );
  }

  try {
    const { adminId, allowedSectors, adminRank } = await req.json();

    if (!isValidUuid(adminId)) {
      return NextResponse.json({ success: false, error: 'معرف المشرف غير صالح' }, { status: 400 });
    }

    // Protect primary sovereign admin from having permissions stripped
    if (adminId === PRIMARY_SOVEREIGN_ADMIN_ID) {
      return NextResponse.json({ success: false, error: 'لا يمكن تعديل صلاحيات المشرف العام السيادي الأساسي' }, { status: 403 });
    }

    // Fetch the target admin profile
    const { data: targetProfile, error: targetErr } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, role, rank_audit_log, allowed_sectors')
      .eq('id', adminId)
      .eq('role', 'ADMIN')
      .maybeSingle();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ success: false, error: 'المشرف غير موجود' }, { status: 404 });
    }

    if (targetProfile.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE) {
      return NextResponse.json({ success: false, error: 'لا يمكن تعديل صلاحيات المشرف العام السيادي الأساسي' }, { status: 403 });
    }

    let targetRank: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
    if (adminRank === 'GENERAL_ADMIN' || adminRank === 'ASSISTANT_ADMIN') {
      targetRank = adminRank;
    } else {
      targetRank = getAdminRank(targetProfile);
    }

    const filteredSectors: AdminSectorId[] = Array.isArray(allowedSectors)
      ? allowedSectors.filter((s: unknown): s is AdminSectorId => typeof s === 'string' && ALL_SECTOR_IDS.includes(s as AdminSectorId))
      : [];

    const finalSectors: AdminSectorId[] = targetRank === 'GENERAL_ADMIN'
      ? [...ALL_SECTOR_IDS]
      : (filteredSectors.length > 0 ? filteredSectors : ['captains', 'riders']);

    const rankAuditValue = targetRank === 'GENERAL_ADMIN' ? 'RANK_GENERAL_ADMIN' : 'RANK_ASSISTANT_ADMIN';
    const currentAudit = Array.isArray(targetProfile.rank_audit_log)
      ? targetProfile.rank_audit_log.filter((r: string) => r !== 'RANK_GENERAL_ADMIN' && r !== 'RANK_ASSISTANT_ADMIN')
      : [];
    currentAudit.push(rankAuditValue);

    // Update profiles table
    const { error: profileUpdateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        allowed_sectors: finalSectors,
        rank_audit_log: currentAudit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (profileUpdateErr) throw profileUpdateErr;

    // Update auth user metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(adminId, {
        user_metadata: {
          admin_rank: targetRank,
          allowed_sectors: finalSectors,
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
      message: 'تم تحديث صلاحيات القطاعات للمشرف بنجاح.',
    });
  } catch (error: any) {
    console.error('[update-admin-permissions] error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحديث الصلاحيات' }, { status: 500 });
  }
}

