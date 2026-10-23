import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawCode = String(body.code || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const rawPhone = String(body.phone || '').trim().replace(/[\s()-]/g, '');
    const providedUserId = String(body.userId || '').trim();

    // 1. Validate OTP format
    if (!/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال كود التفعيل المكون من 6 أرقام بشكل صحيح.' },
        { status: 400 }
      );
    }

    if (!providedUserId && !rawEmail && !rawPhone) {
      return NextResponse.json(
        { success: false, error: 'يرجى تقديم البريد الإلكتروني أو رقم الهاتف للتحقق.' },
        { status: 400 }
      );
    }

    // 2. Locate user
    let targetUserId: string | null = providedUserId || null;

    if (!targetUserId && rawEmail) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', rawEmail)
        .maybeSingle();

      if (profile?.id) {
        targetUserId = profile.id;
      }
    }

    if (!targetUserId && rawPhone) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', rawPhone)
        .maybeSingle();

      if (profile?.id) {
        targetUserId = profile.id;
      }
    }

    let authUser: any = null;

    if (targetUserId) {
      const { data: userData, error: getUserErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (!getUserErr && userData?.user) {
        authUser = userData.user;
      }
    }

    // Fallback search across auth users if profile wasn't found yet
    if (!authUser) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      authUser = usersData?.users?.find(
        (u) =>
          (rawEmail && u.email?.toLowerCase() === rawEmail) ||
          (rawEmail && String(u.user_metadata?.email || '').toLowerCase() === rawEmail) ||
          (rawPhone && u.phone === rawPhone) ||
          (rawPhone && String(u.user_metadata?.phone || '') === rawPhone)
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على حساب مسجل بهذه البيانات. يرجى التأكد من البريد أو الهاتف.' },
        { status: 404 }
      );
    }

    // 3. Check if already confirmed
    if (authUser.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        userId: authUser.id,
        email: authUser.email,
        message: 'بريدك الإلكتروني مؤكد ومفعل بالفعل! يمكنك تسجيل الدخول مباشرة.',
      });
    }

    // 4. Validate OTP code & 15-minute expiration
    const metadata = authUser.user_metadata || {};
    const savedCode = metadata.email_otp_code ? String(metadata.email_otp_code).trim() : null;
    const expiresAt = metadata.email_otp_expires_at ? Number(metadata.email_otp_expires_at) : 0;

    if (!savedCode) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على كود تفعيل نشط لهذا الحساب. يرجى الضغط على "إعادة إرسال كود التفعيل".' },
        { status: 400 }
      );
    }

    if (savedCode !== rawCode) {
      return NextResponse.json(
        { success: false, error: 'كود التفعيل غير صحيح. يرجى التأكد من الرمز وإعادة المحاولة.' },
        { status: 400 }
      );
    }

    const now = Date.now();
    if (expiresAt > 0 && now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية كود التفعيل (صلاحيته 15 دقيقة فقط). يرجى الضغط على "إعادة إرسال كود التفعيل" للحصول على كود جديد.' },
        { status: 400 }
      );
    }

    // 5. Activate User in Supabase Auth
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      email_confirm: true,
      user_metadata: {
        ...metadata,
        email_otp_code: null,
        email_otp_expires_at: null,
      },
    });

    if (updateErr) {
      console.error('[Verify Code] Failed to confirm user:', updateErr);
      return NextResponse.json(
        { success: false, error: updateErr.message || 'تعذر تأكيد الحساب في النظام.' },
        { status: 500 }
      );
    }

    // Sync profiles table if needed
    try {
      await supabaseAdmin.from('profiles').update({ email_verified: true }).eq('id', authUser.id);
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      userId: authUser.id,
      email: authUser.email,
      phone: authUser.phone,
      message: 'تم تأكيد بريدك الإلكتروني وتفعيل حسابك بنجاح! مرحباً بك.',
    });
  } catch (error: any) {
    console.error('[Verify Code Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'حدث خطأ غير متوقع أثناء التحقق من الكود.' },
      { status: 500 }
    );
  }
}

