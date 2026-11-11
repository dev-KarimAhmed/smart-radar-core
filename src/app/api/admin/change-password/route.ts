import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, invalidateAdminCache } from '@/lib/admin-auth-verifier';
import { consumeRateLimit } from '@/shared/server/api-auth-guard';

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح: يجب تسجيل الدخول بحساب مشرف' }, { status: 401 });
  }

  const rl = consumeRateLimit(`admin-change-pw:${admin.id}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'تم تجاوز الحد المسموح لتغيير كلمة المرور مؤقتاً، حاول لاحقاً' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const { newPassword } = body || {};
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
    return NextResponse.json({ success: false, error: 'كلمة المرور يجب ألا تقل عن 8 أحرف' }, { status: 400 });
  }

  try {
    // 1. Update user password in Supabase Auth
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(admin.id, {
      password: newPassword,
    });

    if (authErr) throw authErr;
    invalidateAdminCache(admin.id);

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح.',
    });
  } catch (err: any) {
    console.error('[Admin Change Password Error]:', err);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء تحديث كلمة المرور',
    }, { status: 500 });
  }
}

