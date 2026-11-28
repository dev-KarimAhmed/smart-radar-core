import { NextResponse } from 'next/server';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import {
  consumeRateLimit,
  createEphemeralSupabaseAnonClient,
  getClientIp,
  getServerSupabaseAdmin,
} from '@/shared/server/api-auth-guard';
import { verifySingleSession, claimActiveSession } from './login-session-guard';
import { resolveFallbackEmail } from './login-email-fallback';
import { checkEmailConfirmation, validateRoleAndStatus } from './login-profile-checks';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

function normalizePhone(phone: string): string {
  let cleaned = phone.trim().replace(/[\s()-]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (!cleaned.startsWith('+') && /^[1-9]\d{7,14}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const ipLimit = consumeRateLimit(`login:ip:${clientIp}`, 30, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, code: 'rate_limit_exceeded', error: 'تم تسجيل محاولات دخول كثيرة. يرجى الانتظار قليلاً.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const rawPhone = String(body.phone || '');
    const normalizedPhone = normalizePhone(rawPhone);
    const password = String(body.password || '');
    const expectedRole = body.expectedRole ? String(body.expectedRole).trim().toUpperCase() : undefined;
    const rawEmail = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const incomingDeviceId = String(body.deviceId || '').trim();
    const forceTakeover = Boolean(body.forceTakeover);

    if (isSaudiPhoneNumber(normalizedPhone) || isSaudiPhoneNumber(rawPhone)) {
      return NextResponse.json(
        { success: false, code: 'saudi_restricted', error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected },
        { status: 400 },
      );
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      return NextResponse.json(
        { success: false, code: 'invalid_phone', error: 'يرجى كتابة رقم الهاتف بصيغة دولية، مثل +962790000000 أو +201000000000.' },
        { status: 400 },
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { success: false, code: 'invalid_credentials', error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' },
        { status: 401 },
      );
    }

    const phoneLimit = consumeRateLimit(`login:phone:${normalizedPhone}`, 8, 15 * 60 * 1000);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { success: false, code: 'rate_limit_exceeded', error: 'تم تجاوز محاولات تسجيل الدخول لهذا الرقم مؤقتاً. يرجى الانتظار.' },
        { status: 429, headers: { 'Retry-After': String(phoneLimit.retryAfterSeconds) } },
      );
    }

    const anonClient = createEphemeralSupabaseAnonClient();
    const adminClient = getServerSupabaseAdmin();

    // Attempt 1: Phone sign-in via Supabase Auth
    let signInRes = await anonClient.auth.signInWithPassword({
      phone: normalizedPhone,
      password,
    });

    // Attempt 2: Email fallback resolved server-side
    if (signInRes.error) {
      const errMsg = (signInRes.error.message || '').toLowerCase();
      const errCode = String((signInRes.error as { code?: string }).code || '').toLowerCase();
      const isCredentialsOrPhoneErr =
        errCode === 'invalid_credentials' ||
        errMsg.includes('invalid login') ||
        errMsg.includes('invalid credentials') ||
        errMsg.includes('phone');

      if (isCredentialsOrPhoneErr) {
        const fallbackEmail = await resolveFallbackEmail({
          adminClient,
          normalizedPhone,
          rawEmail,
        });

        if (fallbackEmail) {
          const emailSignInRes = await anonClient.auth.signInWithPassword({
            email: fallbackEmail,
            password,
          });
          if (!emailSignInRes.error && emailSignInRes.data?.session && emailSignInRes.data?.user) {
            signInRes = emailSignInRes;
          }
        }
      }
    }

    if (signInRes.error || !signInRes.data?.user || !signInRes.data?.session) {
      return NextResponse.json(
        { success: false, code: 'invalid_credentials', error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' },
        { status: 401 },
      );
    }

    const { user, session } = signInRes.data;

    // Email confirmation verification
    const emailCheck = await checkEmailConfirmation({ adminClient, user, normalizedPhone });
    if (!emailCheck.ok) {
      return NextResponse.json(
        { success: false, ...emailCheck.responsePayload },
        { status: 403 },
      );
    }

    // Authoritative profile role, status, and active session check
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, role, status, rank_audit_log')
      .eq('id', user.id)
      .maybeSingle();

    // 1. Role and status verification MUST run before single-session check
    // so a user signing into the wrong role portal (e.g. captain on rider login)
    // gets a role/credentials rejection rather than an "account in use" takeover prompt.
    const roleCheck = validateRoleAndStatus({ profile, user, expectedRole });
    if (!roleCheck.ok) {
      return NextResponse.json(
        { success: false, code: roleCheck.code, error: roleCheck.error },
        { status: roleCheck.status },
      );
    }

    // 2. Strict single-session check on database level
    const sessionCheck = await verifySingleSession({
      adminClient,
      userId: user.id,
      incomingDeviceId,
      profileActiveDeviceId: (profile as any)?.active_device_id,
      profileLastSeenAt: (profile as any)?.last_seen_at,
    });

    if (!forceTakeover && !sessionCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: sessionCheck.code || 'account_in_use',
          error: sessionCheck.error || 'هذا الحساب مسجل دخول حالياً على جهاز أو متصفح آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز المفتوح أولاً.',
        },
        { status: 409 },
      );
    }

    // 2. Atomically claim active session (CAS prevents concurrent same-second race)
    if (incomingDeviceId) {
      const claimResult = await claimActiveSession({
        adminClient,
        userId: user.id,
        deviceId: incomingDeviceId,
        force: forceTakeover,
      });

      if (!claimResult.success && !forceTakeover) {
        return NextResponse.json(
          {
            success: false,
            code: 'account_in_use',
            error: 'هذا الحساب أصبح مسجلاً للتو على جهاز آخر. لا يمكنك تسجيل الدخول في نفس الوقت حتى يتم تسجيل الخروج.',
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      },
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        user_metadata: user.user_metadata,
      },
    });
  } catch (error) {
    console.error('[Auth Login API Error]:', error);
    return NextResponse.json(
      { success: false, code: 'server_error', error: 'تعذر تسجيل الدخول حالياً. يرجى المحاولة مرة أخرى.' },
      { status: 500 },
    );
  }
}
