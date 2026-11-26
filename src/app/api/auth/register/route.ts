import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendAccountConfirmationEmail, resolveEmailLanguage } from '@/server/services/email-service';
import { getAppOrigin } from '@/lib/utils';
import { validateRegistrationInput } from './register-validation';
import { checkRegistrationUniqueness } from './register-uniqueness';
import { handleRiderPostRegistration } from './rider-onboarding';
import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { error: valError, input } = validateRegistrationInput(body);
    if (valError || !input) {
      return NextResponse.json({ success: false, error: valError }, { status: 400 });
    }

    const {
      normalizedPhone,
      password,
      fullName,
      rawEmail,
      role,
      countryId,
      governorateId,
      districtId,
      captainProfile,
    } = input;

    // 2. Uniqueness checks
    const { error: uniqueError } = await checkRegistrationUniqueness(
      normalizedPhone,
      rawEmail,
      role,
      captainProfile
    );
    if (uniqueError) {
      return NextResponse.json({ success: false, error: uniqueError }, { status: 409 });
    }

    // 3. Generate 6-digit OTP code (valid for 15 minutes)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000;

    // Resolve user's preferred language from body, cookies, or headers
    const lang = resolveEmailLanguage({
      explicitLang: body.lang || body.preferredLanguage,
      cookieHeader: req.headers.get('cookie'),
      customHeader: req.headers.get('x-dashboard-language'),
      acceptLanguage: req.headers.get('accept-language'),
    });

    // 4. Build metadata
    const isEgypt = countryId === 2 || normalizedPhone.startsWith('+20');
    const userRole: 'RIDER' | 'CAPTAIN' = (role === 'DRIVER' || role === 'CAPTAIN') ? 'CAPTAIN' : 'RIDER';

    const userMetadata: Record<string, unknown> = {
      role: userRole,
      full_name: fullName,
      phone: normalizedPhone,
      email: rawEmail,
      country_id: countryId,
      currency_ar: isEgypt ? 'ج.م' : 'د.أ',
      currency_en: isEgypt ? 'EGP' : 'JOD',
      governorate_id: governorateId,
      district_id: districtId,
      email_otp_code: otpCode,
      email_otp_expires_at: otpExpiresAt,
      preferred_language: lang,
    };

    if (captainProfile) {
      userMetadata.captain_profile = captainProfile;
    }

    // 5. Create user in Supabase Auth via Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: rawEmail,
      phone: normalizedPhone,
      password,
      email_confirm: false,
      phone_confirm: true,
      user_metadata: userMetadata,
    });

    if (createErr) {
      const msg = (createErr.message || '').toLowerCase();
      const errCode = ((createErr as any).code || '').toLowerCase();

      if (
        errCode === 'email_exists' ||
        errCode === 'email_already_exists' ||
        (msg.includes('email') && (msg.includes('registered') || msg.includes('exists') || msg.includes('taken')))
      ) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يمكنك تسجيل الدخول بدلاً من ذلك.' },
          { status: 409 }
        );
      }

      if (
        errCode === 'phone_exists' ||
        errCode === 'phone_already_exists' ||
        (msg.includes('phone') && (msg.includes('registered') || msg.includes('exists') || msg.includes('taken')))
      ) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً. يمكنك تسجيل الدخول بدلاً من ذلك.' },
          { status: 409 }
        );
      }

      if (
        msg.includes('already') ||
        msg.includes('registered') ||
        msg.includes('exists') ||
        msg.includes('unique') ||
        msg.includes('taken')
      ) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف أو البريد الإلكتروني مسجل بالفعل مسبقاً.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: createErr.message || 'فشل إنشاء الحساب في النظام.' },
        { status: 400 }
      );
    }

    const userId = newUser.user.id;

    // Explicitly sync preferred_language into profiles table
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', userId);
    } catch (profileSyncErr) {
      console.warn('[Registration API] Failed to update preferred_language in profile:', profileSyncErr);
    }

    // 5. Grant welcome credit for new captain
    if (userRole === 'CAPTAIN') {
      try {
        void grantNewCaptainWelcomeCredit(userId);
      } catch (creditErr) {
        console.warn('[Registration API] Welcome credit error:', creditErr);
      }
    }

    // 6. Send User Privacy Policy PDF and welcome email to ALL registered users (Captain & Rider)
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    handleRiderPostRegistration({
      userId,
      fullName,
      normalizedPhone,
      rawEmail,
      governorateId,
      districtId,
      clientIp,
      lang,
    });

    // 6. Generate official confirmation link from Supabase Auth
    const reqOrigin = req.headers.get('origin') || req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
      : getAppOrigin();

    const redirectTo = `${reqOrigin}/auth/confirm?lang=${lang}`;

    let confirmUrl = '';
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: rawEmail,
      password,
      options: {
        redirectTo,
      },
    });

    if (!linkErr && linkData?.properties?.action_link) {
      confirmUrl = linkData.properties.action_link;
    } else {
      confirmUrl = `${redirectTo}&email=${encodeURIComponent(rawEmail)}&uid=${encodeURIComponent(userId)}`;
    }

    // 7. Send confirmation email via Resend
    let emailSent = false;
    try {
      const emailRes = await sendAccountConfirmationEmail({
        to: rawEmail,
        userName: fullName,
        confirmUrl,
        otpCode,
        lang,
      });
      emailSent = emailRes.success;
      if (!emailRes.success) {
        console.warn('[Registration] Resend confirmation email error:', emailRes.error);
      }
    } catch (e) {
      console.warn('[Registration] Failed sending confirmation email:', e);
    }

    return NextResponse.json({
      success: true,
      userId,
      email: rawEmail,
      needsEmailConfirmation: true,
      emailSent,
      phone: normalizedPhone,
      message: lang === 'en'
        ? 'Account created successfully! A 6-digit activation code has been sent to your email (valid for 15 minutes).'
        : 'تم إنشاء الحساب بنجاح! تم إرسال كود التفعيل (6 أرقام) إلى بريدك الإلكتروني، صالح لمدة 15 دقيقة.',
    });
  } catch (error: any) {
    console.error('[Registration API Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.' },
      { status: 500 }
    );
  }
}
