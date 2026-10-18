import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  verifyAdminCaller,
  getAdminRank,
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '@/lib/admin-auth-verifier';

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }

  const callerRank = getAdminRank(admin);
  if (callerRank !== 'GENERAL_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: المشرف العام فقط يملك صلاحية تعديل رتب المشرفين' },
      { status: 403 }
    );
  }

  try {
    const { targetAdminId, newRank } = await req.json();

    if (!targetAdminId || !['GENERAL_ADMIN', 'ASSISTANT_ADMIN'].includes(newRank)) {
      return NextResponse.json(
        { success: false, error: 'معرف المشرف والرتبة المطلوبة محددة بشكل غير صحيح' },
        { status: 400 }
      );
    }

    if (targetAdminId === PRIMARY_SOVEREIGN_ADMIN_ID) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن تعديل رتبة المشرف العام الأساسي للنظام' },
        { status: 400 }
      );
    }

    // Verify target user is an admin
    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, role')
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

    // 1. Update profiles table
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({
        rank_audit_log: [rankAuditValue],
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetAdminId);

    if (updateErr) throw updateErr;

    // 2. Update auth user metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(targetAdminId, {
        user_metadata: {
          admin_rank: newRank,
          updated_at_epoch: Date.now(),
        },
      });
    } catch (authMetaErr) {
      console.warn('[UpdateAdminRank] Warning updating auth metadata:', authMetaErr);
    }

    return NextResponse.json({
      success: true,
      targetAdminId,
      newRank,
      admin_rank_label: newRank === 'GENERAL_ADMIN' ? 'مشرف عام' : 'مشرف مساعد',
    });
  } catch (error: any) {
    console.error('[UpdateAdminRank] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'فشل تحديث رتبة المشرف' },
      { status: 500 }
    );
  }
}

