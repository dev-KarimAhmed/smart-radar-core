import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection, query, where, getDocs, limit, runTransaction } from 'firebase/firestore';
import {
  getPurposeHmacKey,
  getSafeAppOrigin,
  timingSafeCompare,
} from '../../shared/server/api-auth-guard';
import { requireExpressRole } from './supabase-identity';
import {
  createScopedRateLimiter,
  rateLimiterMiddleware,
  acquireBackendLock,
  releaseBackendLock,
} from '../middleware/server-rate-limiter';

export const delegateExpressRouter = Router();

const magicVerifyRateLimiter = createScopedRateLimiter('magic-link-verify', 10, 60_000);

function parseSafeDocId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 128 || trimmed.includes('/') || trimmed.includes('..')) {
    return null;
  }
  return trimmed;
}

// Server-Side Sovereign Cryptographic HMAC Integrity Engine
export function generateIntegritySignatureServer(
  delegateId: string,
  count: number,
  referralCode: string,
  homeDistrict?: string,
  currentH3Cell?: string,
): string {
  const hmacKey = getPurposeHmacKey('DELEGATE_INTEGRITY_SECRET', 'delegate-signature');
  const rawPayload = `${delegateId}:${count}:${referralCode}:${homeDistrict || ''}:${currentH3Cell || ''}`;
  const digest = crypto
    .createHmac('sha256', hmacKey)
    .update(rawPayload, 'utf8')
    .digest('hex')
    .slice(0, 24)
    .toUpperCase();
  return `SIG-HMAC-${digest}`;
}

// SECURE EXECUTIVE DELEGATE DUES SETTLEMENT [RAD-CMD-088]
delegateExpressRouter.post('/clear-delegate-dues', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const delegateId = parseSafeDocId(req.body?.delegateId);
  if (!delegateId) {
    return res.status(400).json({ success: false, error: 'المندوب غير محدد لتسوية المستحقات' });
  }

  const lockKey = `clear-dues-${delegateId}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'عملية تسوية وتصفيات مستحقات المندوب قيد المعالجة حالياً.' });
  }

  try {
    const delRef = doc(db, 'delegates', delegateId);
    const delSnap = await getDoc(delRef);

    if (!delSnap.exists()) {
      return res.status(404).json({ success: false, error: 'المندوب غير موجود' });
    }

    const data = delSnap.data();
    const rawDues = Number(data?.pendingDues || 0);

    if (!Number.isFinite(rawDues) || rawDues <= 0) {
      return res.status(400).json({ success: false, error: '🚨 عطل مالي: لا توجد مستحقات مالية معلقة لتصفيتها أو صرفها لهذا المندوب حالياً!' });
    }

    const delRateRaw = Number(data?.deletionRate || 0);
    const delRate = Number.isFinite(delRateRaw) && delRateRaw >= 0 ? Math.min(100, delRateRaw) : 0;
    const penaltyAmount = rawDues * (delRate / 100) * 0.40;
    const withdrawableBalance = Math.max(0, rawDues - penaltyAmount);

    const settlementRecord = {
      netSettled: withdrawableBalance,
      rawDues,
      penaltyAmount,
      deletionRate: delRate,
      timestamp: new Date().toISOString(),
      settledBy: authorized.caller.userId,
    };

    await updateDoc(delRef, {
      pendingDues: 0,
      lastSettlementDate: new Date().toISOString(),
      settledBalances: arrayUnion(settlementRecord)
    });

    if (typeof data?.userId === 'string' && parseSafeDocId(data.userId)) {
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, { pendingDues: 0 });
    } else if (typeof data?.phone === 'string' && data.phone.trim()) {
      const userQuery = query(collection(db, 'users'), where('phone', '==', data.phone), limit(1));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        await updateDoc(doc(db, 'users', userSnap.docs[0].id), { pendingDues: 0 });
      }
    }

    console.log(`[Sovereign Core] Cleared dues for delegate ${delegateId} by ${authorized.caller.userId}. Net settled: ${withdrawableBalance}`);
    return res.json({
      success: true,
      message: 'تم تصفية وتصفير مستحقات المندوب بنجاح وتسجيل العملية في الأرشيف المالي',
      netSettled: withdrawableBalance
    });
  } catch (err: unknown) {
    console.error('[Clear Delegate Dues Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر إتمام التسوية المالية للمندوب.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// API to verify delegates signatures server-side
delegateExpressRouter.post('/verify-signatures', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const delegates = req.body?.delegates;
  if (!Array.isArray(delegates) || delegates.length > 200) {
    return res.status(400).json({ success: false, error: 'تنسيق البيانات غير صالح للتحقق.' });
  }

  const results: Record<string, boolean> = {};
  for (const d of delegates) {
    if (!d || typeof d !== 'object') continue;
    const delegateId = parseSafeDocId((d as Record<string, unknown>).id);
    if (!delegateId) continue;

    const referredCount = (d as Record<string, unknown>).referredCount;
    const referralCode = (d as Record<string, unknown>).referralCode;
    const integritySignature = (d as Record<string, unknown>).integritySignature;

    if (
      typeof referredCount !== 'number' ||
      !Number.isFinite(referredCount) ||
      typeof referralCode !== 'string' ||
      !referralCode ||
      typeof integritySignature !== 'string' ||
      !integritySignature
    ) {
      results[delegateId] = false;
      continue;
    }

    const homeDistrictRaw = (d as Record<string, unknown>).homeDistrict || (d as Record<string, unknown>).district || 'وادي السير';
    const currentH3CellRaw = (d as Record<string, unknown>).currentH3Cell || '0x892f35ffffffff';
    const expected = generateIntegritySignatureServer(
      delegateId,
      referredCount,
      referralCode,
      String(homeDistrictRaw),
      String(currentH3CellRaw),
    );
    results[delegateId] = timingSafeCompare(integritySignature, expected);
  }

  return res.json({ success: true, results });
});

// 1. RECONCILE AND SIGN DELEGATE (Server-Authoritative Cryptographic Integrity)
delegateExpressRouter.post('/reconcile-and-sign', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const delegateId = parseSafeDocId(req.body?.delegateId);
  if (!delegateId) {
    return res.status(400).json({ success: false, error: 'المندوب غير محدد لتأكيد العداد والتحقق' });
  }

  const lockKey = `reconcile-sign-${delegateId}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'عملية التحقق وإغلاق العدادات قيد المزامنة حالياً.' });
  }

  try {
    const delRef = doc(db, 'delegates', delegateId);
    const delSnap = await getDoc(delRef);
    if (!delSnap.exists()) {
      return res.status(404).json({ success: false, error: 'المندوب غير موجود في السجلات السحابية.' });
    }

    const delegateData = delSnap.data();
    const referralCode = String(delegateData.referralCode || '');
    const homeDistrict = String(delegateData.homeDistrict || delegateData.district || 'وادي السير');
    const currentH3Cell = String(delegateData.currentH3Cell || '0x892f35ffffffff');

    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver'),
      limit(2000)
    );
    const usersSnap = await getDocs(usersQuery);

    const actualCount = usersSnap.docs.filter(docSnap => {
      const d = docSnap.data();
      return d.referralCode === referralCode ||
        d.referredByCode === referralCode ||
        d.usedReferralCode === referralCode;
    }).length;

    const finalCount = actualCount > 0 ? actualCount : Number(delegateData.referredCount || 0);
    const signature = generateIntegritySignatureServer(delegateId, finalCount, referralCode, homeDistrict, currentH3Cell);

    await updateDoc(delRef, {
      referredCount: finalCount,
      integritySignature: signature,
      homeDistrict,
      currentH3Cell
    });

    await addDoc(collection(db, 'audit_ledger'), {
      action: 'DELEGATE_INTEGRITY_SIGN_AND_RECONCILE',
      delegateId,
      delegateName: delegateData.name || 'سفير ميداني',
      referralCode,
      previousCount: delegateData.referredCount || 0,
      reconciledCount: finalCount,
      signature,
      actor: authorized.caller.userId,
      timestamp: new Date().toISOString(),
      verified: true,
      protocol: 'RAD-RECONCILE-99'
    });

    console.log(`[Sovereign Core] Reconciled and signed delegate ${delegateId} by ${authorized.caller.userId}. Count: ${finalCount}`);

    return res.json({
      success: true,
      referredCount: finalCount,
      integritySignature: signature,
      message: 'تمت مصادقة ومطابقة وتوقيع العدادات تشفيرياً عبر الخادم بنجاح.'
    });
  } catch (err: unknown) {
    console.error('[Reconcile and Sign Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر توقيع ومطابقة عدادات المندوب.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// 2. GENERATE MAGIC LINK (Server-Authoritative Ticket Inception)
delegateExpressRouter.post('/generate-magic-link', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const delegateId = parseSafeDocId(req.body?.delegateId);
  const delegateName = typeof req.body?.delegateName === 'string' ? req.body.delegateName.trim() : '';
  const rawHours = Number(req.body?.expiryHours);
  const hours = Number.isFinite(rawHours) ? Math.min(168, Math.max(1, Math.round(rawHours))) : 24;

  if (!delegateId || !delegateName || delegateName.length > 120) {
    return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لتوليد الرابط السحري' });
  }

  try {
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const token = crypto.randomBytes(24).toString('hex');

    const originUrl = getSafeAppOrigin(req);
    const magicLinkUrl = `${originUrl}/#magic-login?token=${token}`;

    const newLink = {
      delegateId,
      delegateName,
      token,
      expiresAt,
      expiryHours: hours,
      status: 'active',
      url: magicLinkUrl,
      issuedByUserId: authorized.caller.userId,
      issuedByRole: authorized.caller.role,
      issuedAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'delegate_links'), newLink);

    return res.json({
      success: true,
      link: newLink,
      message: 'تم توليد الرابط السحري بنجاح وتأمينه داخل البوابة السحابية للرادار.'
    });
  } catch (err: unknown) {
    console.error('[Generate Magic Link Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر توليد الرابط السحري حالياً.' });
  }
});

// 3. VERIFY MAGIC LINK (Server-Authoritative Authentication Handshake)
delegateExpressRouter.post('/verify-magic-link', magicVerifyRateLimiter, async (req, res) => {
  const rawToken = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!rawToken || !/^[a-f0-9]{16,128}$/i.test(rawToken)) {
    return res.status(400).json({ success: false, error: 'رمز الدخول غير صالح للتحقق' });
  }

  const lockKey = `magic-verify-${rawToken}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'جاري التحقق من الرابط السحري.' });
  }

  try {
    const q = query(
      collection(db, 'delegate_links'),
      where('token', '==', rawToken),
      where('status', '==', 'active'),
      limit(1)
    );

    const qSnap = await getDocs(q);
    if (qSnap.empty) {
      return res.status(404).json({ success: false, error: 'رمز الدخول السحري غير صالح أو تم استهلاكه مسبقاً.' });
    }

    const linkDoc = qSnap.docs[0];
    const linkRef = doc(db, 'delegate_links', linkDoc.id);
    const serverNow = new Date();

    const txOutcome = await runTransaction(db, async (tx) => {
      const freshSnap = await tx.get(linkRef);
      if (!freshSnap.exists()) {
        return { outcome: 'invalid' as const };
      }
      const linkData = freshSnap.data();
      if (
        String(linkData.status || '').toLowerCase() !== 'active' ||
        !timingSafeCompare(String(linkData.token || ''), rawToken)
      ) {
        return { outcome: 'invalid' as const };
      }

      const expiresAt = new Date(linkData.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt < serverNow) {
        tx.update(linkRef, { status: 'expired' });
        return { outcome: 'expired' as const };
      }

      tx.update(linkRef, {
        status: 'used',
        usedAt: serverNow.toISOString(),
      });
      return { outcome: 'valid' as const, linkData };
    });

    if (txOutcome.outcome === 'invalid') {
      return res.status(404).json({ success: false, error: 'رمز الدخول السحري غير صالح أو تم استهلاكه مسبقاً.' });
    }
    if (txOutcome.outcome === 'expired') {
      return res.status(410).json({ success: false, error: 'عذراً، انتهت صلاحية الرابط السحري زمنيّاً لحماية الخصوصية.' });
    }

    const { linkData } = txOutcome;

    let delegateProfile: Record<string, unknown> | null = null;
    if (typeof linkData.delegateId === 'string' && parseSafeDocId(linkData.delegateId)) {
      const delegateRef = doc(db, 'delegates', linkData.delegateId);
      const delegateSnap = await getDoc(delegateRef);
      if (delegateSnap.exists()) {
        delegateProfile = { id: delegateSnap.id, ...delegateSnap.data() };
      }
    }

    return res.json({
      success: true,
      delegateId: linkData.delegateId,
      delegateName: linkData.delegateName,
      expiresAt: linkData.expiresAt,
      serverTime: serverNow.toISOString(),
      delegateProfile,
      message: 'تم التحقق السحري من هويتك كوكيل سيادي بنجاح مبرهن!'
    });
  } catch (err: unknown) {
    console.error('[Verify Magic Link Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر التحقق من رمز الدخول السحري.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// 4. SECURE DELEGATE TASK STATE TRANSITION ENFORCER (Server-Side State Machine)
delegateExpressRouter.post('/delegate-task-transition', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER', 'DELEGATE']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const taskId = parseSafeDocId(req.body?.taskId);
  const targetStatus = typeof req.body?.targetStatus === 'string' ? req.body.targetStatus.trim().toLowerCase() : '';

  if (!taskId || !targetStatus) {
    return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لتحديث حالة المهمة.' });
  }

  const verifiedUid = authorized.caller.userId;
  const verifiedRole = authorized.caller.role.toLowerCase();
  const isAdminCaller = verifiedRole === 'admin' || verifiedRole === 'owner';

  const lockKey = `task-transition-${taskId}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'هناك عملية تحديث نشطة لهذه المهمة حالياً.' });
  }

  try {
    const taskRef = doc(db, 'delegate_tasks', taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      return res.status(404).json({ success: false, error: 'المهمة المطلوبة غير موجودة في السجلات.' });
    }

    const taskData = taskSnap.data();
    const currentStatus = String(taskData.status || 'pending').toLowerCase();

    if (!isAdminCaller && taskData.delegateId !== verifiedUid) {
      await addDoc(collection(db, 'audit_ledger'), {
        timestamp: new Date().toISOString(),
        actorId: verifiedUid,
        action: 'UNAUTHORIZED_TASK_ACCESS_ATTEMPT_SERVER',
        details: { taskId, targetDelegateId: taskData.delegateId, attemptedBy: verifiedUid },
        securityClearance: 'CRITICAL_SECURITY_ALERT'
      });

      return res.status(403).json({ success: false, error: 'تحذير أمني حاسم: لا تملك صلاحية تعديل مهمة لا تنتمي لمعرّفك الأمني!' });
    }

    if (currentStatus === 'closed') {
      return res.status(400).json({ success: false, error: 'خطأ: المهمة مغلقة نهائياً وموثقة ولا يمكن تعديلها أو الرجوع بالخلف.' });
    }

    if (targetStatus === 'acknowledged') {
      if (currentStatus !== 'pending') {
        return res.status(400).json({ success: false, error: `خطأ في آلة الحالات: لا يمكن تفعيل مهمة بحالة ${currentStatus}.` });
      }
    } else if (targetStatus === 'completed') {
      if (currentStatus !== 'acknowledged') {
        return res.status(400).json({ success: false, error: `خطأ في آلة الحالات: لا يمكن إكمال مهمة بحالة ${currentStatus}.` });
      }
    } else if (targetStatus === 'closed') {
      if (!isAdminCaller) {
        return res.status(403).json({ success: false, error: 'صلاحيات غير كافية: إغلاق المهام وصرف المستحقات متاح فقط للمشرفين والمالك.' });
      }
    } else {
      return res.status(400).json({ success: false, error: `حالة غير معروفة للمهمة: ${targetStatus}` });
    }

    await updateDoc(taskRef, { status: targetStatus });

    const integrityHash = `TXN-TASK-${taskId.substring(0, 6)}-${targetStatus.toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    await addDoc(collection(db, 'audit_ledger'), {
      action: `TASK_TRANSITION_${targetStatus.toUpperCase()}`,
      taskId,
      delegateId: taskData.delegateId || verifiedUid,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      actor: verifiedUid,
      actorRole: verifiedRole,
      integrityHash,
      timestamp: new Date().toISOString(),
      verified: true,
      protocol: 'RAD-STATE-MACHINE-99'
    });

    return res.json({
      success: true,
      newStatus: targetStatus,
      integrityHash,
      message: 'تم تحديث حالة المهمة بأمان تام من خلال جدار الحماية السحابي الموحد.'
    });
  } catch (err: unknown) {
    console.error('[Task Transition Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر تحديث حالة المهمة حالياً.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});
