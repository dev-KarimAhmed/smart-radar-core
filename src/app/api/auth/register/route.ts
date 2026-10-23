import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendAccountConfirmationEmail } from '@/server/services/email-service';
import { getAppOrigin } from '@/lib/utils';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawPhone = String(body.phone || '');
    const normalizedPhone = normalizePhone(rawPhone);
    const password = String(body.password || '');
    const fullName = String(body.fullName || body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || 'RIDER').toUpperCase();
    const countryId = Number(body.countryId || 1);
    const governorateId = Number(body.governorateId || 1);
    const districtId = Number(body.districtId || 1);
    const captainProfile = body.captainProfile || null;

    // 1. Validations
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'يرجى كتابة رقم الهاتف بصيغة دولية، مثل +962790000000 أو +201000000000.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.' },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { success: false, error: 'يرجى كتابة الاسم الكامل.' },
        { status: 400 }
      );
    }

    if (role === 'CAPTAIN' || role === 'DRIVER') {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length < 4 || !parts.every((p) => p.length >= 2 && /^[؀-ۿa-zA-Z]+$/.test(p))) {
        return NextResponse.json(
          { success: false, error: 'يرجى كتابة الاسم الرباعي كاملاً (الاسم، الأب، الجد، العائلة) بحروف صحيحة دون أرقام أو رموز.' },
          { status: 400 }
        );
      }
    }

    // Email is strictly required for all new account confirmations
    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب وصحيح لتأكيد وتفعيل الحساب.' },
        { status: 400 }
      );
    }

    // 2. Uniqueness checks
    // A. Check phone in profiles & auth.users
    const { data: existingProfileByPhone } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingProfileByPhone) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً.' },
        { status: 409 }
      );
    }

    // B. Check email in profiles
    const { data: existingProfileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', rawEmail)
      .maybeSingle();

    if (existingProfileByEmail) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.' },
        { status: 409 }
      );
    }

    // C. Check Captain credentials uniqueness if applicable
    if ((role === 'CAPTAIN' || role === 'DRIVER') && captainProfile) {
      const trimmedNatId = captainProfile.national_id_number?.trim() || null;
      const trimmedLic = captainProfile.license_number?.trim() || null;
      const trimmedPlate = captainProfile.plate_number?.trim().toUpperCase() || null;

      const { data: availability } = await supabaseAdmin.rpc('check_captain_identity_available', {
        p_national_id: trimmedNatId,
        p_license_number: trimmedLic,
        p_plate_number: trimmedPlate,
        p_email: rawEmail,
      });

      if (availability) {
        if (availability.email_taken) {
          return NextResponse.json({ success: false, error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.' }, { status: 409 });
        }
        if (availability.national_id_taken) {
          return NextResponse.json({ success: false, error: 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.' }, { status: 409 });
        }
        if (availability.license_taken) {
          return NextResponse.json({ success: false, error: 'رقم رخصة القيادة مسجل بالفعل مسبقاً.' }, { status: 409 });
        }
        if (availability.plate_taken) {
          return NextResponse.json({ success: false, error: 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.' }, { status: 409 });
        }
      }
    }

    // 3. Generate 6-digit OTP code (valid for 15 minutes)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000;

    // 4. Build metadata
    const isEgypt = countryId === 2 || normalizedPhone.startsWith('+20');
    const userRole = (role === 'DRIVER' ? 'CAPTAIN' : role) as 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' | 'ADMIN';

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
    };

    if (captainProfile) {
      userMetadata.captain_profile = captainProfile;
    }

    // 4. Create user in Supabase Auth via Admin API
    // email_confirm: false ensures email_confirmed_at is NULL until user confirms!
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

    // 5. Generate official confirmation link from Supabase Auth
    const reqOrigin = req.headers.get('origin') || req.headers.get('x-forwarded-host')
      ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}`
      : getAppOrigin();

    const redirectTo = `${reqOrigin}/auth/confirm`;

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
      // Direct verification link fallback
      confirmUrl = `${redirectTo}?email=${encodeURIComponent(rawEmail)}&uid=${encodeURIComponent(userId)}`;
    }

    // 6. Send confirmation email via Resend
    let emailSent = false;
    try {
      const emailRes = await sendAccountConfirmationEmail({
        to: rawEmail,
        userName: fullName,
        confirmUrl,
        otpCode,
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
      message: 'تم إنشاء الحساب بنجاح! تم إرسال كود التفعيل (6 أرقام) إلى بريدك الإلكتروني، صالح لمدة 15 دقيقة.',
    });
  } catch (error: any) {
    console.error('[Registration API Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.' },
      { status: 500 }
    );
  }
}

