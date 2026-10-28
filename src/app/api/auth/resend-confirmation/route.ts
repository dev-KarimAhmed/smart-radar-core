import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendAccountConfirmationEmail } from '@/server/services/email-service';
import { getAppOrigin } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const rawPhone = String(body.phone || '').trim().replace(/[\s()-]/g, '');
    const providedUserId = String(body.userId || '').trim();

    if (!providedUserId && !rawEmail && !rawPhone) {
      return NextResponse.json(
        { success: false, error: 'يرجى تقديم البريد الإلكتروني أو رقم الهاتف.' },
        { status: 400 }
      );
    }

    // 1. Locate user in profiles or auth.users
    let targetEmail = rawEmail;
    let targetName = 'عزيزنا المستخدم';
    let targetUserId: string | null = providedUserId || null;

    if (rawEmail) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .ilike('email', rawEmail)
        .maybeSingle();

      if (profile) {
        targetName = profile.full_name || targetName;
        targetEmail = profile.email || targetEmail;
        if (!targetUserId) targetUserId = profile.id;
      }
    } else if (rawPhone) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .eq('phone', rawPhone)
        .maybeSingle();

      if (profile && profile.email) {
        targetName = profile.full_name || targetName;
        targetEmail = profile.email;
        if (!targetUserId) targetUserId = profile.id;
      }
    }

    let authUser: any = null;

    if (targetUserId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (userData?.user) {
        authUser = userData.user;
      }
    }

    if (!authUser) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
      authUser = usersData?.users?.find(
        (u) =>
          (targetEmail && u.email?.toLowerCase() === targetEmail.toLowerCase()) ||
          (targetEmail && String(u.user_metadata?.email || '').toLowerCase() === targetEmail.toLowerCase()) ||
          (rawPhone && u.phone === rawPhone) ||
          (rawPhone && String(u.user_metadata?.phone || '') === rawPhone)
      );
    }

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على حساب مسجل بهذه البيانات.' },
        { status: 404 }
      );
    }

    if (authUser.email) {
      targetEmail = authUser.email;
    }
    if (authUser.user_metadata?.full_name) {
      targetName = authUser.user_metadata.full_name;
    }

    if (authUser.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        message: 'بريدك الإلكتروني مؤكد ومفعل بالفعل! يمكنك تسجيل الدخول مباشرة.',
      });
    }

    // 2. Generate new 6-digit OTP code & 15-minute expiration
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtpExpiresAt = Date.now() + 15 * 60 * 1000;

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...authUser.user_metadata,
        email_otp_code: newOtpCode,
        email_otp_expires_at: newOtpExpiresAt,
      },
    });

    if (updateErr) {
      console.warn('[Resend-Confirmation] Failed to update user metadata with new OTP:', updateErr);
    }

    // 3. Generate confirmation link
    const reqOrigin = req.headers.get('origin') || req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
      : getAppOrigin();

    const redirectTo = `${reqOrigin}/auth/confirm`;

    let confirmUrl = '';
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
      options: {
        redirectTo,
      },
    });

    if (!linkErr && linkData?.properties?.action_link) {
      confirmUrl = linkData.properties.action_link;
    } else {
      confirmUrl = `${redirectTo}?email=${encodeURIComponent(targetEmail)}&uid=${encodeURIComponent(authUser.id)}`;
    }

    // 4. Send email via Resend
    const emailRes = await sendAccountConfirmationEmail({
      to: targetEmail,
      userName: targetName,
      confirmUrl,
      otpCode: newOtpCode,
    });

    if (!emailRes.success) {
      console.warn('[Resend-Confirmation] Email dispatch error:', emailRes.error);
      return NextResponse.json({
        success: false,
        error: 'تعذر إرسال البريد الإلكتروني حالياً. يرجى المحاولة بعد قليل.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود تفعيل جديد مكون من 6 أرقام إلى بريدك الإلكتروني (صالح لمدة 15 دقيقة).',
    });
  } catch (error: any) {
    console.error('[Resend-Confirmation API Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'حدث خطأ غير متوقع أثناء إعادة الإرسال.' },
      { status: 500 }
    );
  }
}
