import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendAccountConfirmationEmail } from '@/server/services/email-service';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import {
  consumeRateLimit,
  getClientIp,
  getSafeAppOrigin,
  getServerSupabaseAdmin,
  hashOtpCode,
} from '@/shared/server/api-auth-guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GENERIC_RESEND_SUCCESS = {
  success: true,
  message: 'إذا كان هذا الحساب مسجلاً وغير مفعل، فقد تم إرسال رمز تفعيل جديد إلى البريد الإلكتروني.',
};

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
    const ipLimit = consumeRateLimit(`resend:ip:${clientIp}`, 12, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم إرسال طلبات كثيرة لإعادة الإرسال. يرجى الانتظار قليلاً.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const rawPhone = String(body.phone || '').trim().replace(/[\s()-]/g, '');
    const providedUserId = String(body.userId || '').trim();

    if (isSaudiPhoneNumber(rawPhone)) {
      return NextResponse.json(
        { success: false, error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected },
        { status: 400 },
      );
    }

    if (!providedUserId && !rawEmail && !rawPhone) {
      return NextResponse.json(
        { success: false, error: 'يرجى تقديم البريد الإلكتروني أو رقم الهاتف.' },
        { status: 400 },
      );
    }

    const identifierKey = rawEmail || rawPhone || providedUserId;
    const idLimit = consumeRateLimit(`resend:id:${identifierKey}`, 3, 10 * 60 * 1000);
    if (!idLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'يرجى الانتظار دقيقة قبل طلب رمز تفعيل جديد.' },
        { status: 429, headers: { 'Retry-After': String(idLimit.retryAfterSeconds) } },
      );
    }

    const authUser = await findAuthUser({ providedUserId, rawEmail, rawPhone });

    // Prevent account & confirmation enumeration by returning a uniform 200 response
    if (!authUser || authUser.email_confirmed_at) {
      return NextResponse.json(GENERIC_RESEND_SUCCESS);
    }

    const targetEmail = (authUser.email || rawEmail || String(authUser.user_metadata?.email || '')).trim().toLowerCase();
    if (!targetEmail) {
      return NextResponse.json(GENERIC_RESEND_SUCCESS);
    }

    const targetName = String(authUser.user_metadata?.full_name || 'عزيزنا المستخدم');
    const supabaseAdmin = getServerSupabaseAdmin();

    // Generate new 6-digit OTP code & store only its keyed HMAC hash
    const newOtpCode = crypto.randomInt(100000, 1000000).toString();
    const newOtpExpiresAt = Date.now() + 15 * 60 * 1000;
    const newOtpHash = hashOtpCode(newOtpCode, authUser.id);

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        ...(authUser.user_metadata || {}),
        email_otp_code: null,
        email_otp_hash: newOtpHash,
        email_otp_expires_at: newOtpExpiresAt,
        email_otp_attempts: 0,
      },
    });

    if (updateErr) {
      console.error('[Resend-Confirmation] Failed to update OTP metadata:', updateErr);
      return NextResponse.json(
        { success: false, error: 'تعذر تجهيز رمز تفعيل جديد حالياً. يرجى المحاولة بعد قليل.' },
        { status: 500 },
      );
    }

    const safeOrigin = getSafeAppOrigin(req);
    const redirectTo = `${safeOrigin}/auth/confirm`;

    let confirmUrl = '';
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
      options: { redirectTo },
    });

    if (!linkErr && linkData?.properties?.action_link) {
      confirmUrl = linkData.properties.action_link;
    } else {
      confirmUrl = `${safeOrigin}/register?verify=otp`;
    }

    const emailRes = await sendAccountConfirmationEmail({
      to: targetEmail,
      userName: targetName,
      confirmUrl,
      otpCode: newOtpCode,
    });

    if (!emailRes.success) {
      console.warn('[Resend-Confirmation] Email dispatch error:', emailRes.error);
      return NextResponse.json(
        { success: false, error: 'تعذر إرسال البريد الإلكتروني حالياً. يرجى المحاولة بعد قليل.' },
        { status: 500 },
      );
    }

    return NextResponse.json(GENERIC_RESEND_SUCCESS);
  } catch (error) {
    console.error('[Resend-Confirmation API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء إعادة الإرسال.' },
      { status: 500 },
    );
  }
}
