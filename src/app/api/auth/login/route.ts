import { NextResponse } from 'next/server';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import {
  consumeRateLimit,
  createEphemeralSupabaseAnonClient,
  getClientIp,
  getServerSupabaseAdmin,
} from '@/shared/server/api-auth-guard';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const PRIMARY_OWNER_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
const PRIMARY_OWNER_PHONE = '+201551981922';
// Cutoff timestamp for email verification rollout: Oct 23, 2026 15:30:00 UTC
const EMAIL_CONFIRM_CUTOFF_MS = 1792769400000;

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

    // Attempt 2: Email fallback resolved server-side (avoids public profiles exposure)
    if (signInRes.error) {
      const errMsg = (signInRes.error.message || '').toLowerCase();
      const errCode = String((signInRes.error as { code?: string }).code || '').toLowerCase();
      const isCredentialsOrPhoneErr =
        errCode === 'invalid_credentials' ||
        errMsg.includes('invalid login') ||
        errMsg.includes('invalid credentials') ||
        errMsg.includes('phone');

      if (isCredentialsOrPhoneErr) {
        let fallbackEmail: string | null = null;
        const { data: profileByPhone } = await adminClient
          .from('profiles')
          .select('email')
          .eq('phone', normalizedPhone)
          .maybeSingle();

        if (profileByPhone?.email && String(profileByPhone.email).includes('@')) {
          fallbackEmail = String(profileByPhone.email).trim().toLowerCase();
        } else {
          const phoneDigits = normalizedPhone.replace(/\D/g, '');
          const { data: rpcRows, error: rpcErr } = await adminClient.rpc('find_account_by_phone', {
            p_phone_digits: phoneDigits,
          });
          const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
          const rpcId = rpcRow && typeof rpcRow === 'object' ? (rpcRow as { user_id?: unknown }).user_id : undefined;
          const rpcEmail = rpcRow && typeof rpcRow === 'object' ? (rpcRow as { email?: unknown }).email : undefined;
          if (!rpcErr && typeof rpcEmail === 'string' && rpcEmail.includes('@')) {
            fallbackEmail = rpcEmail.trim().toLowerCase();
          } else if (!rpcErr && typeof rpcId === 'string') {
            const { data: userLookup } = await adminClient.auth.admin.getUserById(rpcId);
            const emailCandidate = userLookup?.user?.email || String(userLookup?.user?.user_metadata?.email || '');
            if (emailCandidate && emailCandidate.includes('@')) {
              fallbackEmail = emailCandidate.trim().toLowerCase();
            }
          }
        }

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

    // Email confirmation check with legacy grandfathering
    const userEmail = user.email || (user.user_metadata?.email as string | undefined);
    const createdAtMs = user.created_at ? new Date(user.created_at).getTime() : 0;
    const isPreFeatureAccount = createdAtMs > 0 && createdAtMs < EMAIL_CONFIRM_CUTOFF_MS;
    const isPhoneOnlyAccount = !userEmail || !userEmail.includes('@');
    const requiresEmailConfirmation = !isPreFeatureAccount && !isPhoneOnlyAccount;

    if (requiresEmailConfirmation && !user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          code: 'email_not_confirmed',
          error: 'email_not_confirmed',
          email: userEmail,
          phone: normalizedPhone,
        },
        { status: 403 },
      );
    }

    // Authoritative profile role and status check
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, role, status, rank_audit_log')
      .eq('id', user.id)
      .maybeSingle();

    const profileStatus = String(profile?.status || 'ACTIVE').toUpperCase();
    const auditLogs = Array.isArray(profile?.rank_audit_log) ? (profile.rank_audit_log as string[]) : [];
    const isTemporarySuspension = profileStatus === 'SUSPENDED' || (profileStatus === 'BANNED' && auditLogs.includes('ACCOUNT_SUSPENDED'));
    const isPermanentBan = profileStatus === 'BANNED' && !isTemporarySuspension;

    if (isPermanentBan) {
      return NextResponse.json(
        { success: false, code: 'account_banned', error: 'هذا الحساب محظور من استخدام المنصة.' },
        { status: 403 },
      );
    }

    const dbRole = String(profile?.role || user.user_metadata?.role || 'RIDER').toUpperCase();
    const isPrimaryOwner =
      user.id === PRIMARY_OWNER_ID ||
      user.phone === PRIMARY_OWNER_PHONE ||
      user.user_metadata?.phone === PRIMARY_OWNER_PHONE;

    if (expectedRole === 'ADMIN' && (profileStatus === 'BANNED' || profileStatus === 'SUSPENDED')) {
      return NextResponse.json(
        { success: false, code: 'admin_suspended', error: 'حساب الإدارة موقوف أو محظور حالياً.' },
        { status: 403 },
      );
    }

    if (expectedRole) {
      if (dbRole !== expectedRole && !(isPrimaryOwner && expectedRole === 'ADMIN')) {
        return NextResponse.json(
          {
            success: false,
            code: 'role_mismatch',
            error: `role_mismatch:${dbRole}:${expectedRole}`,
          },
          { status: 403 },
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
