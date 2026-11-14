import type { Request, Response } from 'express';
import { resolveEmailLanguage } from '../../services/email-service';
import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '../../../core/logic/saudi-restriction';
import {
  serviceConfig,
  serviceHeaders,
  phoneDigits,
  auditReset,
  resolveAppOrigin,
} from './password-reset-config';
import { findAuthUserByPhone, findAuthUserByEmail } from './password-reset-lookup';
import { generateRecoveryLink, dispatchRecoveryEmail } from './password-reset-delivery';

export async function handlePasswordResetRequest(req: Request, res: Response) {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  if (isSaudiPhoneNumber(req.body?.phone)) {
    return res.status(400).json({ success: false, error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected });
  }

  let digits = phoneDigits(req.body?.phone);
  if (digits.startsWith('966')) {
    return res.status(400).json({ success: false, error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected });
  }
  const claimedEmail = String(req.body?.email ?? '').trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimedEmail);

  // If phone is missing from body, check if caller has a Bearer token (authenticated user in settings)
  const authHeader = req.headers['authorization'];
  if (digits.length < 8 && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    try {
      const userRes = await fetch(`${config.url}/auth/v1/user`, {
        headers: {
          apikey: config.serviceKey,
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(4_000),
      });
      if (userRes.ok) {
        const authUser = (await userRes.json()) as { phone?: string };
        if (authUser?.phone) {
          digits = phoneDigits(authUser.phone);
        }
      }
    } catch {
      // ignore
    }
  }

  if (digits.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'يرجى إدخال رقم الهاتف المسجل به الحساب (8 أرقام على الأقل).',
    });
  }

  if (!isEmailValid) {
    return res.status(400).json({
      success: false,
      error: 'يرجى إدخال بريد إلكتروني صحيح.',
    });
  }

  try {
    // 1. Strict lookup by phone number — never fallback to search by email!
    const user = await findAuthUserByPhone(config, digits);

    if (!user) {
      await auditReset(config, {
        profile_id: null,
        action: 'PASSWORD_RESET_ACCOUNT_NOT_FOUND',
        detail: { digits, claimedEmail },
      });
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على حساب مسجل برقم الهاتف هذا.',
      });
    }

    // 2. Strict Email Verification
    const registeredEmail = (user.email ?? '').trim().toLowerCase();

    // Check if the claimed email belongs to another registered account
    const emailOwner = await findAuthUserByEmail(config, claimedEmail);
    if (emailOwner && emailOwner.id !== user.id) {
      await auditReset(config, {
        profile_id: user.id,
        action: 'PASSWORD_RESET_EMAIL_MISMATCH_ANOTHER_ACCOUNT',
        detail: { digits, claimedEmail, registeredEmail, ownerId: emailOwner.id },
      });
      return res.status(400).json({
        success: false,
        error: 'هذا البريد الإلكتروني غير مسجل لهذا الرقم.',
      });
    }

    // If the account has a registered email, it must match the claimed email exactly
    if (registeredEmail && registeredEmail !== claimedEmail) {
      await auditReset(config, {
        profile_id: user.id,
        action: 'PASSWORD_RESET_EMAIL_MISMATCH',
        detail: { digits, claimedEmail, registeredEmail },
      });
      return res.status(400).json({
        success: false,
        error: 'هذا البريد الإلكتروني غير مسجل لهذا الرقم.',
      });
    }

    // If the account has no registered email at all
    if (!registeredEmail) {
      return res.status(400).json({
        success: false,
        error: 'هذا الحساب غير مرتبط ببريد إلكتروني. يرجى التواصل مع الدعم الفني لاستعادة كلمة المرور.',
      });
    }

    const targetEmail = registeredEmail;

    // Sync auth.users email if needed
    try {
      await fetch(`${config.url}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: serviceHeaders(config.serviceKey),
        body: JSON.stringify({ email: targetEmail, email_confirm: true }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch (err) {
      console.warn('[password-reset] Failed to sync auth.users email:', err);
    }

    const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : null;
    const customHeader = typeof req.headers['x-dashboard-language'] === 'string' ? req.headers['x-dashboard-language'] : null;
    const acceptLanguage = typeof req.headers['accept-language'] === 'string' ? req.headers['accept-language'] : null;

    const lang = resolveEmailLanguage({
      explicitLang: req.body?.lang || req.body?.preferredLanguage,
      profileLang: (user as any)?.preferred_language || (user as any)?.user_metadata?.preferred_language,
      cookieHeader,
      customHeader,
      acceptLanguage,
    });

    const origin = resolveAppOrigin(req);
    const redirectTo = `${origin}/reset-password?lang=${lang}`;

    const { actionLink, emailOtp } = await generateRecoveryLink(config, targetEmail, redirectTo);
    const emailSent = await dispatchRecoveryEmail(config, targetEmail, redirectTo, actionLink, emailOtp, lang);

    await auditReset(config, {
      profile_id: user.id,
      action: 'EMAIL_RECOVERY_SENT',
      detail: { route: 'email', targetEmail, redirectTo, actionLinkGenerated: Boolean(actionLink), emailSent },
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: lang === 'en'
          ? 'Failed to send password reset email at this time. Please try again later or contact support.'
          : 'تعذّر إرسال بريد استعادة كلمة المرور في الوقت الحالي. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.',
      });
    }

    const message = lang === 'en'
      ? `A password reset link has been sent successfully to (${targetEmail}). Please check your inbox or spam folder.`
      : `تم إرسال رابط استعادة كلمة المرور بنجاح إلى (${targetEmail}). يرجى فتح بريدك الإلكتروني (صندوق الوارد أو مجلد Spam) والضغط على الرابط لإعادة تعيين كلمة المرور.`;

    return res.json({
      success: true,
      emailSent: true,
      message,
    });
  } catch (error) {
    console.error('[password-reset/request]', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ غير متوقع أثناء معالجة طلب الاسترجاع. يرجى المحاولة لاحقاً.',
    });
  }
}
