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
      { success: false, error: 'غير مصرح: المشرف العام فقط يملك صلاحية حذف المشرفين' },
      { status: 403 }
    );
  }

  try {
    const { targetAdminId } = await req.json();

    if (!targetAdminId) {
      return NextResponse.json(
        { success: false, error: 'معرف المشرف المطلوب حذفه غير محدد' },
        { status: 400 }
      );
    }

    if (targetAdminId === PRIMARY_SOVEREIGN_ADMIN_ID) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف المشرف العام الأساسي للنظام' },
        { status: 400 }
      );
    }

    if (targetAdminId === admin.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الإداري الحالي' },
        { status: 400 }
      );
    }

    // Verify target exists and is an ADMIN
    const { data: targetProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, phone, role')
      .eq('id', targetAdminId)
      .maybeSingle();

    if (profileErr || !targetProfile || String(targetProfile.role).toUpperCase() !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'المشرف المستهدف غير موجود أو ليس برتبة مشرف' },
        { status: 404 }
      );
    }

    if (targetProfile.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE) {
      return NextResponse.json(
        { success: false, error: 'لا يمكن حذف المشرف العام الأساسي للنظام' },
        { status: 400 }
      );
    }

    // 1. Delete from profiles table
    const { error: deleteProfileErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetAdminId);

    if (deleteProfileErr) throw deleteProfileErr;

    // 2. Delete from auth.users
    try {
      await supabaseAdmin.auth.admin.deleteUser(targetAdminId);
    } catch (authErr) {
      console.warn('[DeleteAdmin] Warning deleting auth user:', authErr);
    }

    return NextResponse.json({
      success: true,
      targetAdminId,
    });
  } catch (error: any) {
    console.error('[DeleteAdmin] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'فشل حذف المشرف' },
      { status: 500 }
    );
  }
}

