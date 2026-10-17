import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, phone, password } = await req.json();
    if (!fullName || !phone || !password) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // Create user via Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      phone,
      password,
      phone_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        full_name: fullName,
        phone,
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
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, user: newUser.user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'فشل إنشاء حساب المشرف' }, { status: 500 });
  }
}

