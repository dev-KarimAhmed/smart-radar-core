import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  verifyAdminCaller,
  getAdminRank,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '@/lib/admin-auth-verifier';
import { ALL_SECTOR_IDS, AdminSectorId } from '@/features/admin/lib/admin-permissions';

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
    const { adminId, allowedSectors, adminRank } = await req.json();

    if (!adminId) {
      return NextResponse.json({ success: false, error: 'معرف المشرف مطلوب' }, { status: 400 });
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

    let targetRank = adminRank;
    if (!targetRank) {
      targetRank = getAdminRank(targetProfile);
    }

    const finalSectors: AdminSectorId[] = targetRank === 'GENERAL_ADMIN'
      ? [...ALL_SECTOR_IDS]
      : (Array.isArray(allowedSectors)
          ? allowedSectors.filter((s: string) => ALL_SECTOR_IDS.includes(s as AdminSectorId))
          : ['captains', 'riders']);

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

    return NextResponse.json({
      success: true,
      adminId,
      adminRank: targetRank,
      allowedSectors: finalSectors,
      message: 'تم تحديث صلاحيات القطاعات للمشرف بنجاح.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'فشل تحديث الصلاحيات' }, { status: 500 });
  }
}

