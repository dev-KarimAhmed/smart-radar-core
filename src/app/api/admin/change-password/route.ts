import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Helper to authenticate caller as an Admin
async function verifyAdminCaller(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;

    const roleInMeta = String(user.user_metadata?.role || user.app_metadata?.role || '').toUpperCase();
    if (roleInMeta === 'ADMIN') return user;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && String(profile.role).toUpperCase() === 'ADMIN') {
      return user;
    }
  } catch (err) {
    console.warn('[Admin Change Password API] Auth verification error:', err);
  }

  return null;
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'غير مصرح: يجب تسجيل الدخول بحساب مشرف' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const { newPassword } = body || {};
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return NextResponse.json({ success: false, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' }, { status: 400 });
  }

  try {
    // 1. Update user password in Supabase Auth
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(admin.id, {
      password: newPassword,
    });

    if (authErr) throw authErr;

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح.',
    });
  } catch (err: any) {
    console.error('[Admin Change Password Error]:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'حدث خطأ أثناء تحديث كلمة المرور',
    }, { status: 500 });
  }
}

