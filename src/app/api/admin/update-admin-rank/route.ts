import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidUuid } from '@/shared/server/api-auth-guard';
import {
  requireAdminAccess,
  invalidateAdminCache,
  ALL_SECTOR_IDS,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '@/lib/admin-auth-verifier';

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { requireGeneralAdmin: true });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.status === 403 ? 'غير مصرح: المشرف العام فقط يملك صلاحية تعديل رتب المشرفين' : access.error },
      { status: access.status }
    );
  }
  const { admin } = access;

  try {
    const { targetAdminId, newRank } = await req.json();

    if (!isValidUuid(targetAdminId) || !['GENERAL_ADMIN', 'ASSISTANT_ADMIN'].includes(newRank)) {
      return NextResponse.json(
        { success: false, error: 'معرف المشرف والرتبة المطلوبة محددة بشكل غير صحيح' },
        { status: 400 }
      );
    }

    if (targetAdminId === PRIMARY_SOVEREIGN_ADMIN_ID || targetAdminId === admin.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل رتبة المشرف العام الأساسي أو حسابك الحالي' },
        { status: 400 }
      );
    }

    // Verify target user is an admin
    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, role, rank_audit_log, allowed_sectors')
      .eq('id', targetAdminId)
      .maybeSingle();

    if (profileErr || !targetProfile || String(targetProfile.role).toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'المشرف المستهدف غير موجود' },
        { status: 404 }
      );
    }

    if (targetProfile.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل رتبة المشرف العام الأساسي للنظام' },
        { status: 400 }
      );
    }

    const rankAuditValue = newRank === 'GENERAL_ADMIN' ? 'RANK_GENERAL_ADMIN' : 'RANK_ASSISTANT_ADMIN';
    const preservedAudit = Array.isArray(targetProfile.rank_audit_log)
      ? targetProfile.rank_audit_log.filter((r: string) => r !== 'RANK_GENERAL_ADMIN' && r !== 'RANK_ASSISTANT_ADMIN')
      : [];
    preservedAudit.push(rankAuditValue);

    const updatedSectors = newRank === 'GENERAL_ADMIN'
      ? [...ALL_SECTOR_IDS]
      : (Array.isArray(targetProfile.allowed_sectors) && targetProfile.allowed_sectors.length > 0 && targetProfile.allowed_sectors.length < ALL_SECTOR_IDS.length
          ? targetProfile.allowed_sectors
          : ['captains', 'riders']);

    // 1. Update profiles table
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        rank_audit_log: preservedAudit,
        allowed_sectors: updatedSectors,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetAdminId);

    if (updateErr) throw updateErr;

    // 2. Update auth user metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(targetAdminId, {
        user_metadata: {
          admin_rank: newRank,
          allowed_sectors: updatedSectors,
          updated_at_epoch: Date.now(),
        },
      });
    } catch (authMetaErr) {
      console.warn('[UpdateAdminRank] Warning updating auth metadata:', authMetaErr);
    }

    invalidateAdminCache(targetAdminId);

    return NextResponse.json({
      success: true,
      targetAdminId,
      newRank,
      allowedSectors: updatedSectors,
      admin_rank_label: newRank === 'GENERAL_ADMIN' ? 'مشرف عام' : 'مشرف مساعد',
    });
  } catch (error: any) {
    console.error('[UpdateAdminRank] error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل تحديث رتبة المشرف' },
      { status: 500 }
    );
  }
}

