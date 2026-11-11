import { NextResponse } from 'next/server';
import { grantNewCaptainWelcomeCredit } from '@/features/captain/services/captain-welcome-credit';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import {
  consumeRateLimit,
  getClientIp,
  getServerSupabaseAdmin,
  timingSafeCompare,
  verifyOtpHash,
} from '@/shared/server/api-auth-guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_OTP_ATTEMPTS = 5;

async function findAuthUser(params: {
  providedUserId: string;
  rawEmail: string;
  rawPhone: string;
}) {
  const supabaseAdmin = getServerSupabaseAdmin();
  const { providedUserId, rawEmail, rawPhone } = params;

  if (providedUserId && UUID_REGEX.test(providedUserId)) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(providedUserId);
    if (data?.user) return data.user;
  }

  let matchedId: string | null = null;

  if (rawEmail) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', rawEmail)
      .maybeSingle();
    if (profile?.id) matchedId = String(profile.id);

    if (!matchedId) {
      const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc('find_account_by_email', {
        p_email: rawEmail,
      });
      const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      const rpcId = rpcRow && typeof rpcRow === 'object' ? (rpcRow as { user_id?: unknown }).user_id : rpcRow;
      if (!rpcErr && typeof rpcId === 'string' && UUID_REGEX.test(rpcId)) {
        matchedId = rpcId;
      }
    }
  }

  if (!matchedId && rawPhone) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', rawPhone)
      .maybeSingle();
    if (profile?.id) matchedId = String(profile.id);

    if (!matchedId) {
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const { data: rpcRows, error: rpcErr } = await supabaseAdmin.rpc('find_account_by_phone', {
        p_phone_digits: phoneDigits,
      });
      const rpcRow = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      const rpcId = rpcRow && typeof rpcRow === 'object' ? (rpcRow as { user_id?: unknown }).user_id : rpcRow;
      if (!rpcErr && typeof rpcId === 'string' && UUID_REGEX.test(rpcId)) {
        matchedId = rpcId;
      }
    }
  }

  if (matchedId) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(matchedId);
    if (data?.user) return data.user;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const ipLimit = consumeRateLimit(`verify-otp:ip:${clientIp}`, 25, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم إرسال محاولات كثيرة. يرجى الانتظار قليلاً والمحاولة مرة أخرى.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const rawCode = String(body.code || body.token || '').trim();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const rawPhone = String(body.phone || '').trim().replace(/[\s()-]/g, '');
    const providedUserId = String(body.userId || '').trim();

    if (!/^\d{6}$/.test(rawCode)) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال كود التفعيل المكون من 6 أرقام بشكل صحيح.' },
        { status: 400 },
      );
    }

    if (isSaudiPhoneNumber(rawPhone)) {
      return NextResponse.json(
        { success: false, error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected },
        { status: 400 },
      );
    }

    if (!providedUserId && !rawEmail && !rawPhone) {
      return NextResponse.json(
        { success: false, error: 'يرجى تقديم البريد الإلكتروني أو رقم الهاتف للتحقق.' },
        { status: 400 },
      );
    }

    const idKey = rawEmail || rawPhone || providedUserId;
    const idLimit = consumeRateLimit(`verify-otp:id:${idKey}`, 10, 15 * 60 * 1000);
    if (!idLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز عدد محاولات التحقق المسموح بها مؤقتاً.' },
        { status: 429, headers: { 'Retry-After': String(idLimit.retryAfterSeconds) } },
      );
    }

    const authUser = await findAuthUser({ providedUserId, rawEmail, rawPhone });

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'كود التفعيل غير صحيح أو انتهت صلاحيته.' },
        { status: 400 },
      );
    }

    if (authUser.email_confirmed_at) {
      return NextResponse.json(
        { success: false, error: 'هذا الحساب مفعل بالفعل أو رمز التحقق غير صالح. يمكنك تسجيل الدخول مباشرة.' },
        { status: 400 },
      );
    }

    const supabaseAdmin = getServerSupabaseAdmin();
    const metadata = (authUser.user_metadata || {}) as Record<string, unknown>;
    const attempts = Number(metadata.email_otp_attempts || 0);

    if (attempts >= MAX_OTP_ATTEMPTS) {
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...metadata,
          email_otp_hash: null,
          email_otp_code: null,
          email_otp_expires_at: null,
        },
      });
      return NextResponse.json(
        { success: false, error: 'تم استنفاد محاولات إدخال الكود. يرجى الضغط على "إعادة إرسال كود التفعيل" للحصول على كود جديد.' },
        { status: 429 },
      );
    }

    const savedHash = typeof metadata.email_otp_hash === 'string' ? metadata.email_otp_hash.trim() : '';
    const legacyPlainCode = typeof metadata.email_otp_code === 'string' ? metadata.email_otp_code.trim() : '';
    const expiresAt = Number(metadata.email_otp_expires_at || 0);

    if (!savedHash && !legacyPlainCode) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على كود تفعيل نشط لهذا الحساب. يرجى الضغط على "إعادة إرسال كود التفعيل".' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(expiresAt) || expiresAt <= 0 || Date.now() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'انتهت صلاحية كود التفعيل (صلاحيته 15 دقيقة فقط). يرجى الضغط على "إعادة إرسال كود التفعيل" للحصول على كود جديد.' },
        { status: 400 },
      );
    }

    const isMatch = savedHash
      ? verifyOtpHash(rawCode, authUser.id, savedHash)
      : timingSafeCompare(legacyPlainCode, rawCode);

    if (!isMatch) {
      const nextAttempts = attempts + 1;
      const exhausted = nextAttempts >= MAX_OTP_ATTEMPTS;
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          ...metadata,
          email_otp_attempts: nextAttempts,
          ...(exhausted
            ? { email_otp_hash: null, email_otp_code: null, email_otp_expires_at: null }
            : {}),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: exhausted
            ? 'تم استنفاد محاولات إدخال الكود. يرجى طلب كود تفعيل جديد.'
            : 'كود التفعيل غير صحيح. يرجى التأكد من الرمز وإعادة المحاولة.',
        },
        { status: exhausted ? 429 : 400 },
      );
    }

    // Activate user and wipe all OTP artifacts
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        ...metadata,
        email_otp_hash: null,
        email_otp_code: null,
        email_otp_expires_at: null,
        email_otp_attempts: 0,
      },
    });

    if (updateErr) {
      console.error('[Verify Code] Failed to confirm user:', updateErr);
      return NextResponse.json(
        { success: false, error: 'تعذر تأكيد الحساب في النظام حالياً.' },
        { status: 500 },
      );
    }

    // Grant welcome hours if captain (idempotent if already granted during register)
    const metaRole = String(metadata.role || '').toUpperCase();
    if (metaRole === 'CAPTAIN' || metaRole === 'DRIVER') {
      try {
        await grantNewCaptainWelcomeCredit(authUser.id);
      } catch (creditErr) {
        console.warn('[Verify Code] Welcome credit error:', creditErr);
      }
    }

    try {
      await supabaseAdmin.from('user_notifications').insert([
        {
          user_id: authUser.id,
          title: 'مرحباً بك في شبكة بينكم للإعلان الرقمي 🌟',
          description: 'تم تفعيل حسابك بنجاح وأصبح جاهزاً للاستخدام بالكامل. أهلاً بك في منصة بينكم للإعلان الرقمي.',
          type: 'admin_message',
          is_read: false,
        },
        {
          user_id: authUser.id,
          title: 'توثيق السجل القانوني الإلكتروني 🛡️',
          description: 'تم توثيق الإقرار وحفظه في السجل القانوني الإلكتروني في شاشة سجلاتي.',
          type: 'admin_message',
          is_read: false,
        },
      ]);
    } catch (notifErr) {
      console.warn('[Verify Code] Notification insert error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد بريدك الإلكتروني وتفعيل حسابك بنجاح! مرحباً بك.',
    });
  } catch (error) {
    console.error('[Verify Code Error]:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء التحقق من الكود.' },
      { status: 500 },
    );
  }
}
