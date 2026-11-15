import type { Request, Response } from 'express';
import { getSenderFromEmail } from '../../services/email-service';
import {
  serviceConfig,
  serviceHeaders,
  auditReset,
  hashToken,
  MIN_PASSWORD_LENGTH,
} from './password-reset-config';

export async function handleCompletePasswordReset(req: Request, res: Response) {
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

    // Burn the token FIRST.
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
}

export async function handleRescuePasswordResetWithToken(req: Request, res: Response) {
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
}

export async function handleTestResend(req: Request, res: Response) {
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
}
