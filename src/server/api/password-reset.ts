import { Router } from 'express';
import { sendPasswordResetEmail, getSenderFromEmail } from '../services/email-service';
import {
  MIN_PASSWORD_LENGTH,
  serviceConfig,
  serviceHeaders,
  hashToken,
  phoneDigits,
  auditReset,
  findAuthUserByPhone,
  findAuthUserByEmail,
  resolveAppOrigin,
} from './password-reset-helpers';
import { passwordResetAdminRouter } from './password-reset-admin';

export {
  TOKEN_TTL_MINUTES,
  MIN_PASSWORD_LENGTH,
  serviceConfig,
  serviceHeaders,
  hashToken,
  phoneDigits,
  clientIp,
  auditReset,
  findAuthUserByPhone,
  findAuthUserByEmail,
  resolveAppOrigin,
} from './password-reset-helpers';
export { passwordResetAdminRouter } from './password-reset-admin';

export const passwordResetRouter = Router();

// Mount admin queue routes
passwordResetRouter.use(passwordResetAdminRouter);

// ---------------------------------------------------------------------------
// 1. The locked-out person asks for help. Public, rate-limited by the caller.
// ---------------------------------------------------------------------------

passwordResetRouter.post('/password-reset/request', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  let digits = phoneDigits(req.body?.phone);
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

    if (!registeredEmail) {
      return res.status(400).json({
        success: false,
        error: 'هذا الحساب غير مرتبط ببريد إلكتروني. يرجى التواصل مع الدعم الفني لاستعادة كلمة المرور.',
      });
    }

    const targetEmail = registeredEmail;

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

    const origin = resolveAppOrigin(req);
    const redirectTo = `${origin}/reset-password`;

    let actionLink: string | null = null;
    let emailOtp: string | null = null;
    try {
      const genRes = await fetch(`${config.url}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: serviceHeaders(config.serviceKey),
        body: JSON.stringify({
          type: 'recovery',
          email: targetEmail,
          redirect_to: redirectTo,
          options: { redirectTo },
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (genRes.ok) {
        const genData = (await genRes.json()) as {
          action_link?: string;
          properties?: { action_link?: string; email_otp?: string };
          email_otp?: string;
        };
        actionLink = genData.action_link || genData.properties?.action_link || null;
        emailOtp = genData.email_otp || genData.properties?.email_otp || null;
      }
    } catch (genErr) {
      console.warn('[password-reset] generate_link failed:', genErr);
    }

    let emailSentViaResend = false;
    if (actionLink) {
      try {
        const resendRes = await sendPasswordResetEmail({
          to: targetEmail,
          resetUrl: actionLink,
          otpCode: emailOtp,
        });
        emailSentViaResend = resendRes.success;
      } catch (resendErr) {
        console.warn('[password-reset] Resend direct dispatch attempt:', resendErr);
      }
    }

    let nativeRecoverDispatched = false;
    if (!emailSentViaResend) {
      try {
        const recoverRes = await fetch(`${config.url}/auth/v1/recover`, {
          method: 'POST',
          headers: serviceHeaders(config.serviceKey),
          body: JSON.stringify({ email: targetEmail, redirect_to: redirectTo }),
          signal: AbortSignal.timeout(4_000),
        });
        nativeRecoverDispatched = recoverRes.ok;
      } catch (e) {
        console.warn('[password-reset] Supabase recover fetch error:', e);
      }
    }

    const emailSent = emailSentViaResend || nativeRecoverDispatched;

    await auditReset(config, {
      profile_id: user.id,
      action: 'EMAIL_RECOVERY_SENT',
      detail: { route: 'email', targetEmail, redirectTo, actionLinkGenerated: Boolean(actionLink), emailSent },
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'تعذّر إرسال بريد استعادة كلمة المرور في الوقت الحالي. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.',
      });
    }

    const message = `تم إرسال رابط استعادة كلمة المرور بنجاح إلى (${targetEmail}). يرجى فتح بريدك الإلكتروني (صندوق الوارد أو مجلد Spam) والضغط على الرابط لإعادة تعيين كلمة المرور.`;

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
});

// ---------------------------------------------------------------------------
// 3. The account owner redeems the token and sets a new password.
// ---------------------------------------------------------------------------

passwordResetRouter.post('/password-reset/complete', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  const token = String(req.body?.token ?? '').trim();
  const newPassword = String(req.body?.newPassword ?? '');

  if (!token) {
    return res.status(400).json({ success: false, error: 'رمز الاسترجاع مطلوب.' });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ success: false, error: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.` });
  }

  try {
    const lookup = await fetch(
      `${config.url}/rest/v1/password_reset_requests?token_hash=eq.${hashToken(token)}&status=eq.APPROVED&select=id,profile_id,token_expires_at&limit=1`,
      { headers: serviceHeaders(config.serviceKey), signal: AbortSignal.timeout(8_000) },
    );
    const [request] = (await lookup.json()) as Array<{
      id: string;
      profile_id: string;
      token_expires_at: string;
    }>;

    const invalid = { success: false, error: 'رمز الاسترجاع غير صالح أو انتهت صلاحيته.' };
    if (!request) return res.status(400).json(invalid);
    if (new Date(request.token_expires_at).getTime() < Date.now()) {
      return res.status(400).json(invalid);
    }

    const burn = await fetch(
      `${config.url}/rest/v1/password_reset_requests?id=eq.${encodeURIComponent(request.id)}&status=eq.APPROVED`,
      {
        method: 'PATCH',
        headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=representation' },
        body: JSON.stringify({
          status: 'COMPLETED',
          token_hash: null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    const burned = (await burn.json()) as unknown[];
    if (!burn.ok || burned.length === 0) {
      return res.status(400).json(invalid);
    }

    const updated = await fetch(`${config.url}/auth/v1/admin/users/${request.profile_id}`, {
      method: 'PUT',
      headers: serviceHeaders(config.serviceKey),
      body: JSON.stringify({ password: newPassword }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!updated.ok) {
      await auditReset(config, {
        request_id: request.id,
        profile_id: request.profile_id,
        action: 'PASSWORD_RESET_FAILED',
        detail: { status: updated.status },
      });
      return res.status(502).json({ success: false, error: 'تعذّر تحديث كلمة المرور. اطلب رمز جديد.' });
    }

    await auditReset(config, {
      request_id: request.id,
      profile_id: request.profile_id,
      action: 'PASSWORD_RESET_COMPLETED',
      detail: { route: 'admin_token' },
    });

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
  } catch (error) {
    console.error('[password-reset/complete]', error);
    return res.status(500).json({ success: false, error: 'تعذّر تحديث كلمة المرور.' });
  }
});

// ---------------------------------------------------------------------------
// 4. Rescue route: Updates password directly via Admin API when client-side
// session in the browser is dropped or fails with "Auth session missing".
// ---------------------------------------------------------------------------

passwordResetRouter.post('/password-reset/rescue-with-token', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  const accessToken = String(req.body?.accessToken ?? '').trim();
  const newPassword = String(req.body?.newPassword ?? '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || config.serviceKey;

  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'رمز الجلسة مفقود.' });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ success: false, error: `كلمة المرور لازم تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.` });
  }

  try {
    const verifyRes = await fetch(`${config.url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ success: false, error: 'انتهت صلاحية جلسة الاستعادة. يرجى طلب رابط جديد.' });
    }

    const userData = (await verifyRes.json()) as { id?: string };
    if (!userData?.id) {
      return res.status(401).json({ success: false, error: 'تعذّر التحقق من صاحب الحساب.' });
    }

    const updateRes = await fetch(`${config.url}/auth/v1/admin/users/${userData.id}`, {
      method: 'PUT',
      headers: serviceHeaders(config.serviceKey),
      body: JSON.stringify({ password: newPassword }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!updateRes.ok) {
      return res.status(502).json({ success: false, error: 'تعذّر تحديث كلمة المرور في قاعدة البيانات.' });
    }

    await auditReset(config, {
      profile_id: userData.id,
      action: 'PASSWORD_RESET_COMPLETED',
      detail: { route: 'rescue_token' },
    });

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
  } catch (err) {
    console.error('[password-reset/rescue-with-token]', err);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تحديث كلمة المرور.' });
  }
});

passwordResetRouter.post('/password-reset/test-resend', async (req, res) => {
  const to = String(req.body?.to || 'devkarimahmed@gmail.com').trim();
  const apiKey = String(req.body?.apiKey || process.env.RESEND_API_KEY || '').trim();
  if (!apiKey || !apiKey.startsWith('re_')) {
    return res.status(400).json({ success: false, error: 'Valid Resend API Key is required (starts with re_).' });
  }

  try {
    const { Resend: ResendClient } = await import('resend');
    const client = new ResendClient(apiKey);
    const fromEmail = getSenderFromEmail();
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'تجربة إرسال عبر Resend API | بينكم - bynkcom',
      html: '<p dir="rtl">تهانينا! تم إرسال هذا الإيميل بنجاح وبسرعة فائقة عبر <strong>Resend API</strong> 🚀</p>',
    });

    if (result.error) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.json({ success: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});
