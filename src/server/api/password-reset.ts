import crypto from 'crypto';
import { Router, type Request } from 'express';

import { requireRole } from './supabase-identity';

/**
 * Password recovery for a phone-only login.
 *
 * Two routes, both free, decided per account:
 *
 *   1. The account has a recovery email -> Supabase mails a link. No human involved.
 *   2. It does not                      -> a request is queued for an admin, who verifies
 *                                          identity out of band and issues a one-time token.
 *
 * Everything here runs with the service_role key, which bypasses RLS on every table. That
 * key is read from the environment and never leaves this process — if it reaches a browser,
 * the entire database is readable and writable by anyone who has it.
 */
export const passwordResetRouter = Router();

const TOKEN_TTL_MINUTES = 30;
const MIN_PASSWORD_LENGTH = 8;

function serviceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ''), serviceKey };
}

function serviceHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/** Stored hashed so a database dump does not hand over working reset links. */
function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Phone numbers are compared as digits only. A captain who registered as +201234567890 will
 * type 01234567890 when they are locked out, and a recovery flow that fails on formatting is
 * a recovery flow that does not work.
 */
function phoneDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function clientIp(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0]!.trim();
  return req.socket.remoteAddress || null;
}

async function auditReset(
  config: { url: string; serviceKey: string },
  entry: Record<string, unknown>,
) {
  try {
    await fetch(`${config.url}/rest/v1/password_reset_audit`, {
      method: 'POST',
      headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=minimal' },
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    // Never fail the caller's request because the audit write failed, but do make the gap
    // loud: a recovery step that happened without a record is exactly what the audit exists
    // to prevent.
    console.error('[password-reset] AUDIT WRITE FAILED', entry.action, error);
  }
}

/**
 * Resolves a phone to an account through find_account_by_phone, which indexes into
 * auth.users directly.
 *
 * The admin users list endpoint was the first approach and is the wrong one: it pages 200 at
 * a time with no phone filter, so it is a linear scan that quietly stops finding people once
 * the fleet grows past however many pages we walk — recovery would break for whoever
 * registered most recently, which is the opposite of what a recovery flow should do.
 */
async function findAuthUserByPhone(
  config: { url: string; serviceKey: string },
  digits: string,
): Promise<{ id: string; email: string | null } | null> {
  if (!digits) return null;

  const response = await fetch(`${config.url}/rest/v1/rpc/find_account_by_phone`, {
    method: 'POST',
    headers: serviceHeaders(config.serviceKey),
    body: JSON.stringify({ p_phone_digits: digits }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return null;

  const [row] = (await response.json()) as Array<{ user_id?: string; email?: string | null }>;
  if (!row?.user_id) return null;

  return { id: row.user_id, email: row.email?.trim() || null };
}


// ---------------------------------------------------------------------------
// 1. The locked-out person asks for help. Public, rate-limited by the caller.
// ---------------------------------------------------------------------------

passwordResetRouter.post('/password-reset/request', async (req, res) => {
  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استرجاع كلمة المرور غير متاحة حالياً.' });
  }

  const digits = phoneDigits(req.body?.phone);
  if (digits.length < 8) {
    return res.status(400).json({ success: false, error: 'رقم الهاتف غير صالح.' });
  }

  // Optional, and CONFIRMATION ONLY — never a destination.
  //
  // Letting an anonymous caller name the address a reset link is sent to is account
  // takeover with extra steps: type the victim's phone and your own email. So the link only
  // ever goes to the address already stored on the account, and anything typed here is
  // compared against that address rather than used in its place.
  const claimedEmail = String(req.body?.email ?? '').trim().toLowerCase();

  // ONE response shape for every outcome below. Telling the caller whether a phone is
  // registered, or whether it has an email, turns this endpoint into a way to enumerate
  // every account in the system.
  const genericAnswer = {
    success: true,
    message: 'لو الرقم ده مسجّل عندنا، هتوصلك خطوات استرجاع كلمة المرور. لو مضفتش إيميل، الدعم هيتواصل معاك بعد التحقق من هويتك.',
  };

  try {
    const user = await findAuthUserByPhone(config, digits);

    // A typed address that does not match the one on file is not a typo to be helpful
    // about — it is what an attempted takeover looks like. Record it and fall through to
    // the admin queue, where a human decides.
    const emailMismatch = Boolean(
      user?.email && claimedEmail && claimedEmail !== user.email.trim().toLowerCase(),
    );
    if (emailMismatch) {
      await auditReset(config, {
        profile_id: user?.id ?? null,
        action: 'EMAIL_MISMATCH_REFUSED',
        detail: { route: 'email', reason: 'claimed address does not match the account' },
      });
    }

    if (user?.email && !emailMismatch) {
      // Route 1: self-service. Supabase mails the recovery link itself, to the stored
      // address — never to whatever was typed above.
      const origin = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
      await fetch(`${config.url}/auth/v1/recover`, {
        method: 'POST',
        headers: serviceHeaders(config.serviceKey),
        body: JSON.stringify({ email: user.email, redirect_to: `${origin}/reset-password` }),
        signal: AbortSignal.timeout(8_000),
      });

      await auditReset(config, {
        profile_id: user.id,
        action: 'EMAIL_RECOVERY_SENT',
        detail: { route: 'email' },
      });

      return res.json(genericAnswer);
    }

    // Route 2: queue it for an admin. Recorded even when the phone matched nothing, so a
    // flood of misses is visible rather than silently dropped.
    const insert = await fetch(`${config.url}/rest/v1/password_reset_requests`, {
      method: 'POST',
      headers: { ...serviceHeaders(config.serviceKey), Prefer: 'return=representation' },
      body: JSON.stringify({
        claimed_phone: digits,
        profile_id: user?.id ?? null,
        requested_ip: clientIp(req),
      }),
      signal: AbortSignal.timeout(8_000),
    });

    const [row] = insert.ok ? ((await insert.json()) as Array<{ id: string }>) : [];
    await auditReset(config, {
      request_id: row?.id ?? null,
      profile_id: user?.id ?? null,
      action: 'ADMIN_REVIEW_REQUESTED',
      detail: {
        route: 'admin',
        matchedAccount: Boolean(user),
        accountHasEmail: Boolean(user?.email),
        emailMismatch,
      },
    });

    return res.json(genericAnswer);
  } catch (error) {
    console.error('[password-reset/request]', error);
    // Still generic: an error message that differs by outcome leaks the same information.
    return res.json(genericAnswer);
  }
});


// ---------------------------------------------------------------------------
// 2. The admin queue.
//
// token_hash is never selected. There is no reason for it to travel to a browser, and a
// hash that reaches the admin screen is a hash that ends up in a screenshot.
// ---------------------------------------------------------------------------

passwordResetRouter.get('/password-reset/requests', async (req, res) => {
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

passwordResetRouter.post('/password-reset/reject', async (req, res) => {
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

    // A refusal is as worth recording as an approval — it is the evidence that someone tried.
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

passwordResetRouter.post('/password-reset/issue', async (req, res) => {
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
  // The note is what makes the audit trail worth having: "verified national ID + plate"
  // rather than an unexplained password change.
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
      return res.status(409).json({ success: false, error: 'الطلب اتعامل معاه قبل كده.' });
    }
    if (!request.profile_id) {
      return res.status(422).json({ success: false, error: 'الرقم ده مش مرتبط بحساب. ارفض الطلب.' });
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
      // status=eq.PENDING in the filter means a second admin approving the same request at
      // the same time matches nothing and cannot mint a second live token.
      return res.status(409).json({ success: false, error: 'الطلب اتعامل معاه للتو من حد تاني.' });
    }

    await auditReset(config, {
      request_id: requestId,
      profile_id: request.profile_id,
      actor_id: authorized.caller.userId,
      action: 'RESET_TOKEN_ISSUED',
      detail: { verificationNote, expiresAt },
    });

    // The plaintext token is returned exactly once, here. It is never stored.
    return res.json({ success: true, token, expiresAt, expiresInMinutes: TOKEN_TTL_MINUTES });
  } catch (error) {
    console.error('[password-reset/issue]', error);
    return res.status(500).json({ success: false, error: 'تعذّر إصدار رمز الاسترجاع.' });
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

    // One message for "wrong token" and "expired token" alike — distinguishing them tells a
    // guesser when they have found a real one.
    const invalid = { success: false, error: 'رمز الاسترجاع غير صالح أو انتهت صلاحيته.' };
    if (!request) return res.status(400).json(invalid);
    if (new Date(request.token_expires_at).getTime() < Date.now()) {
      return res.status(400).json(invalid);
    }

    // Burn the token FIRST. If the password update then fails, the worst case is that the
    // captain needs a fresh token — far better than a token that stays live after use.
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
      // Someone else redeemed it between the lookup and here.
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

    return res.json({ success: true, message: 'تم تغيير كلمة المرور. تقدر تسجّل الدخول دلوقتي.' });
  } catch (error) {
    console.error('[password-reset/complete]', error);
    return res.status(500).json({ success: false, error: 'تعذّر تحديث كلمة المرور.' });
  }
});
