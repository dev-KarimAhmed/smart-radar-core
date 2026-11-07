import crypto from 'crypto';
import { Router } from 'express';
import { requireRole } from './supabase-identity';
import {
  TOKEN_TTL_MINUTES,
  serviceConfig,
  serviceHeaders,
  hashToken,
  auditReset,
} from './password-reset-helpers';

export const passwordResetAdminRouter = Router();

// ---------------------------------------------------------------------------
// 2. The admin queue.
// ---------------------------------------------------------------------------

passwordResetAdminRouter.get('/password-reset/requests', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  const authorized = await requireRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const status = String(req.query.status ?? 'PENDING').toUpperCase();
  const allowed = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'EXPIRED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, error: 'حالة غير معروفة.' });
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/password_reset_requests`
        + `?status=eq.${status}`
        + '&select=id,claimed_phone,profile_id,status,created_at,approved_at,verification_note,token_expires_at'
        + '&order=created_at.desc&limit=100',
      { headers: serviceHeaders(config.serviceKey), signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) throw new Error(`list failed: ${response.status}`);

    return res.json({ success: true, requests: await response.json() });
  } catch (error) {
    console.error('[password-reset/requests]', error);
    return res.status(500).json({ success: false, error: 'تعذّر تحميل طلبات الاسترجاع.' });
  }
});

passwordResetAdminRouter.post('/password-reset/reject', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  const authorized = await requireRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const requestId = String(req.body?.requestId ?? '').trim();
  const reason = String(req.body?.reason ?? '').trim();
  if (!requestId) {
    return res.status(400).json({ success: false, error: 'الطلب غير محدد.' });
  }

  try {
    await fetch(
      `${config.url}/rest/v1/password_reset_requests?id=eq.${encodeURIComponent(requestId)}&status=eq.PENDING`,
      {
        method: 'PATCH',
        headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'REJECTED',
          verification_note: reason || 'مرفوض بدون سبب مسجّل',
          approved_by: authorized.caller.userId,
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );

    await auditReset(config, {
      request_id: requestId,
      actor_id: authorized.caller.userId,
      action: 'RESET_REQUEST_REJECTED',
      detail: { reason },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('[password-reset/reject]', error);
    return res.status(500).json({ success: false, error: 'تعذّر رفض الطلب.' });
  }
});

// ---------------------------------------------------------------------------
// 3. An admin approves a queued request and gets a one-time token to hand over.
// ---------------------------------------------------------------------------

passwordResetAdminRouter.post('/password-reset/issue', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  const authorized = await requireRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const requestId = String(req.body?.requestId ?? '').trim();
  const verificationNote = String(req.body?.verificationNote ?? '').trim();
  if (!requestId) {
    return res.status(400).json({ success: false, error: 'الطلب غير محدد.' });
  }
  if (verificationNote.length < 10) {
    return res.status(400).json({ success: false, error: 'اكتب كيف تم التحقق من هوية صاحب الحساب (10 أحرف على الأقل).' });
  }

  try {
    const lookup = await fetch(
      `${config.url}/rest/v1/password_reset_requests?id=eq.${encodeURIComponent(requestId)}&select=id,profile_id,status&limit=1`,
      { headers: serviceHeaders(config.serviceKey), signal: AbortSignal.timeout(8_000) },
    );
    const [request] = (await lookup.json()) as Array<{ id: string; profile_id: string | null; status: string }>;

    if (!request) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود.' });
    }
    if (request.status !== 'PENDING') {
      return res.status(409).json({ success: false, error: 'تمت معالجة الطلب مسبقاً.' });
    }
    if (!request.profile_id) {
      return res.status(422).json({ success: false, error: 'هذا الرقم غير مرتبط بأي حساب مسجل.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    const update = await fetch(
      `${config.url}/rest/v1/password_reset_requests?id=eq.${encodeURIComponent(requestId)}&status=eq.PENDING`,
      {
        method: 'PATCH',
        headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=representation' },
        body: JSON.stringify({
          status: 'APPROVED',
          token_hash: hashToken(token),
          token_expires_at: expiresAt,
          approved_by: authorized.caller.userId,
          approved_at: new Date().toISOString(),
          verification_note: verificationNote,
          updated_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );

    const updated = (await update.json()) as unknown[];
    if (!update.ok || updated.length === 0) {
      return res.status(409).json({ success: false, error: 'تمت معالجة الطلب للتو من قِبل مسؤول آخر.' });
    }

    await auditReset(config, {
      request_id: requestId,
      profile_id: request.profile_id,
      actor_id: authorized.caller.userId,
      action: 'RESET_TOKEN_ISSUED',
      detail: { verificationNote, expiresAt },
    });

    return res.json({ success: true, token, expiresAt, expiresInMinutes: TOKEN_TTL_MINUTES });
  } catch (error) {
    console.error('[password-reset/issue]', error);
    return res.status(500).json({ success: false, error: 'تعذّر إصدار رمز الاسترجاع.' });
  }
});
