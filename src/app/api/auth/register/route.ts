import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendAccountConfirmationEmail, sendCaptainContractEmail } from '@/server/services/email-service';
import { saveCaptainContract } from '@/server/services/contract-pdf-service';
import { isSaudiPhoneNumber, isSaudiCountryCode, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import {
  consumeRateLimit,
  getClientIp,
  getSafeAppOrigin,
  getServerSupabaseAdmin,
  hashOtpCode,
} from '@/shared/server/api-auth-guard';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PUBLIC_ROLES = new Set(['RIDER', 'CAPTAIN', 'DRIVER']);

function normalizePhone(phone: string): string {
  let cleaned = phone.trim().replace(/[\s()-]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const ipLimit = consumeRateLimit(`register:ip:${clientIp}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم إرسال طلبات تسجيل كثيرة. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
      );
    }

    const body = await req.json();

    const rawPhone = String(body.phone || '');
    const normalizedPhone = normalizePhone(rawPhone);
    const password = String(body.password || '');
    const fullName = String(body.fullName || body.name || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const requestedRole = String(body.role || 'RIDER').trim().toUpperCase();
    const countryId = Number(body.countryId || 1);
    const governorateId = Number(body.governorateId || 1);
    const districtId = Number(body.districtId || 1);
    const captainProfile =
      body.captainProfile && typeof body.captainProfile === 'object' && !Array.isArray(body.captainProfile)
        ? (body.captainProfile as Record<string, unknown>)
        : null;

    // 1. Validations
    if (!ALLOWED_PUBLIC_ROLES.has(requestedRole)) {
      return NextResponse.json(
        { success: false, error: 'نوع الحساب المطلوب غير مصرح به في التسجيل العام.' },
        { status: 403 },
      );
    }

    if (
      isSaudiPhoneNumber(normalizedPhone) ||
      isSaudiPhoneNumber(rawPhone) ||
      isSaudiCountryCode(body.countryCode || body.isoCode) ||
      countryId === 3
    ) {
      return NextResponse.json(
        { success: false, error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected },
        { status: 400 },
      );
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, error: 'يرجى كتابة رقم الهاتف بصيغة دولية، مثل +962790000000 أو +201000000000.' },
        { status: 400 },
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون بين 6 و 128 حرفاً.' },
        { status: 400 },
      );
    }

    if (!fullName || fullName.length > 120) {
      return NextResponse.json(
        { success: false, error: 'يرجى كتابة الاسم الكامل بشكل صحيح.' },
        { status: 400 },
      );
    }

    if (!Number.isInteger(countryId) || countryId <= 0 || !Number.isInteger(governorateId) || governorateId <= 0 || !Number.isInteger(districtId) || districtId <= 0) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدولة أو المحافظة أو المنطقة غير صحيحة.' },
        { status: 400 },
      );
    }

    if (requestedRole === 'CAPTAIN' || requestedRole === 'DRIVER') {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length < 4 || !parts.every((p) => p.length >= 2 && /^[\u0600-\u06FFa-zA-Z]+$/.test(p))) {
        return NextResponse.json(
          { success: false, error: 'يرجى كتابة الاسم الرباعي كاملاً (الاسم، الأب، الجد، العائلة) بحروف صحيحة دون أرقام أو رموز.' },
          { status: 400 },
        );
      }
    }

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب وصحيح لتأكيد وتفعيل الحساب.' },
        { status: 400 },
      );
    }

    const phoneLimit = consumeRateLimit(`register:phone:${normalizedPhone}`, 5, 15 * 60 * 1000);
    const emailLimit = consumeRateLimit(`register:email:${rawEmail}`, 5, 15 * 60 * 1000);
    if (!phoneLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم إرسال عدة محاولات تسجيل لهذه البيانات. يرجى الانتظار قليلاً.' },
        { status: 429 },
      );
    }

    const supabaseAdmin = getServerSupabaseAdmin();

    // 2. Uniqueness checks
    const { data: existingProfileByPhone } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingProfileByPhone) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً.' },
        { status: 409 },
      );
    }

    const { data: existingProfileByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', rawEmail)
      .maybeSingle();

    if (existingProfileByEmail) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر.' },
        { status: 409 },
      );
    }

    if ((requestedRole === 'CAPTAIN' || requestedRole === 'DRIVER') && captainProfile) {
      const trimmedNatId = String(captainProfile.national_id_number || '').trim() || null;
      const trimmedLic = String(captainProfile.license_number || '').trim() || null;
      const trimmedPlate = String(captainProfile.plate_number || '').trim().toUpperCase() || null;

      const { data: availability } = await supabaseAdmin.rpc('check_captain_identity_available', {
        p_national_id: trimmedNatId,
        p_license_number: trimmedLic,
        p_plate_number: trimmedPlate,
        p_email: rawEmail,
        p_phone: normalizedPhone,
      });

      if (availability) {
        if (availability.phone_taken) {
          return NextResponse.json({ success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً.' }, { status: 409 });
        }
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

    // 3. Generate 6-digit OTP code (valid for 15 minutes; stored as HMAC hash only)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpExpiresAt = Date.now() + 15 * 60 * 1000;

    // 4. Build metadata (never place plaintext OTP code in user_metadata)
    const isEgypt = countryId === 2 || normalizedPhone.startsWith('+20');
    const userRole: 'RIDER' | 'CAPTAIN' =
      requestedRole === 'DRIVER' || requestedRole === 'CAPTAIN' ? 'CAPTAIN' : 'RIDER';

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
      email_otp_expires_at: otpExpiresAt,
      email_otp_attempts: 0,
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
      phone_confirm: false,
      user_metadata: userMetadata,
    });

    if (createErr) {
      const msg = (createErr.message || '').toLowerCase();
      const errCode = String((createErr as { code?: string }).code || '').toLowerCase();

      if (
        errCode === 'email_exists' ||
        errCode === 'email_already_exists' ||
        (msg.includes('email') && (msg.includes('registered') || msg.includes('exists') || msg.includes('taken')))
      ) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يمكنك تسجيل الدخول بدلاً من ذلك.' },
          { status: 409 },
        );
      }

      if (
        errCode === 'phone_exists' ||
        errCode === 'phone_already_exists' ||
        (msg.includes('phone') && (msg.includes('registered') || msg.includes('exists') || msg.includes('taken')))
      ) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً. يمكنك تسجيل الدخول بدلاً من ذلك.' },
          { status: 409 },
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
          { status: 409 },
        );
      }

      return NextResponse.json(
        { success: false, error: 'فشل إنشاء الحساب في النظام. يرجى مراجعة البيانات والمحاولة مرة أخرى.' },
        { status: 400 },
      );
    }

    const userId = newUser.user.id;

    // Persist salted/keyed HMAC OTP hash bound to userId
    const otpHash = hashOtpCode(otpCode, userId);
    const { error: otpSaveErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userMetadata,
        email_otp_hash: otpHash,
        email_otp_expires_at: otpExpiresAt,
        email_otp_attempts: 0,
      },
    });

    if (otpSaveErr) {
      console.error('[Registration API] Failed to store OTP hash:', otpSaveErr);
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
      return NextResponse.json(
        { success: false, error: 'تعذر تهيئة رمز التفعيل للحساب. يرجى المحاولة مرة أخرى.' },
        { status: 500 },
      );
    }

    // Send captain contract asynchronously; welcome hours are granted upon account verification
    if (userRole === 'CAPTAIN') {
      void (async () => {
        try {
          const contractRes = await saveCaptainContract({
            captainId: userId,
            fullName,
            phone: normalizedPhone,
            email: rawEmail,
            nationalIdNumber: captainProfile?.national_id_number ? String(captainProfile.national_id_number) : undefined,
            licenseNumber: captainProfile?.license_number ? String(captainProfile.license_number) : undefined,
            plateNumber: captainProfile?.plate_number ? String(captainProfile.plate_number) : undefined,
            vehicleMake: String(captainProfile?.make || captainProfile?.vehicle_brand || '') || undefined,
            vehicleModel: String(captainProfile?.model || captainProfile?.vehicle_model || '') || undefined,
            vehicleYear: String(captainProfile?.year || captainProfile?.vehicle_year || '') || undefined,
            governorate: captainProfile?.governorate ? String(captainProfile.governorate) : undefined,
            district: captainProfile?.district ? String(captainProfile.district) : undefined,
            ipAddress: clientIp !== 'unknown' ? clientIp : undefined,
          });

          await sendCaptainContractEmail({
            to: rawEmail,
            captainName: fullName,
            pdfBuffer: contractRes.pdfBuffer,
            contractHash: contractRes.contractHash,
            acceptedAt: contractRes.acceptedAt,
          });
        } catch (contractErr) {
          console.warn('[Registration API] Async captain contract email error:', contractErr);
        }
      })();
    }

    // 6. Generate confirmation link strictly from allowlisted origin
    const safeOrigin = getSafeAppOrigin(req);
    const redirectTo = `${safeOrigin}/auth/confirm`;

    let confirmUrl = '';
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: rawEmail,
      password,
      options: { redirectTo },
    });

    if (!linkErr && linkData?.properties?.action_link) {
      confirmUrl = linkData.properties.action_link;
    } else {
      confirmUrl = `${safeOrigin}/register?role=${userRole.toLowerCase()}&verify=otp`;
    }

    // 7. Send confirmation email via Resend
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
  } catch (error) {
    console.error('[Registration API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء إنشاء الحساب.' },
      { status: 500 },
    );
  }
}
