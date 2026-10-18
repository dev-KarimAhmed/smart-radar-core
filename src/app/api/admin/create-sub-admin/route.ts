import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, getAdminRank } from '@/lib/admin-auth-verifier';

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  const callerRank = getAdminRank(admin);
  if (callerRank !== 'GENERAL_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: المشرف العام فقط يملك صلاحية إضافة مشرفين جدد' },
      { status: 403 }
    );
  }

  try {
    const { fullName, phone, password, adminRank } = await req.json();
    if (!fullName || !phone || !password) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const targetRank = adminRank === 'GENERAL_ADMIN' ? 'GENERAL_ADMIN' : 'ASSISTANT_ADMIN';
    const rankAuditValue = targetRank === 'GENERAL_ADMIN' ? 'RANK_GENERAL_ADMIN' : 'RANK_ASSISTANT_ADMIN';

    // Create user via Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        admin_rank: targetRank,
        full_name: fullName,
        phone,
        created_by_admin: admin.id,
        created_at_epoch: Date.now(),
      },
    });

    if (createErr) throw createErr;

    // Insert or update profiles
    if (newUser?.user?.id) {
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        role: 'ADMIN',
        status: 'IDLE',
        full_name: fullName,
        phone,
        rank_audit_log: [rankAuditValue],
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      user: newUser.user,
      adminRank: targetRank,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'فشل إنشاء حساب المشرف' }, { status: 500 });
  }
}

