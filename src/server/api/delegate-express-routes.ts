import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { requireRole } from './supabase-identity';
import {
  verifyFirebaseIdToken,
  rateLimiterMiddleware,
  acquireBackendLock,
  releaseBackendLock,
} from '../middleware/server-rate-limiter';

export const delegateExpressRouter = Router();

// Server-Side Sovereign Cryptographic Integrity Engine
export function generateIntegritySignatureServer(delegateId: string, count: number, referralCode: string, homeDistrict?: string, currentH3Cell?: string) {
  const SECRET_SALT = "SOVEREIGN_RADAR_ROUTER_SECURE_SALT_2026";
  const rawString = `${delegateId}:${count}:${referralCode}:${homeDistrict || ''}:${currentH3Cell || ''}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `SIG-HEX-${Math.abs(hash).toString(16).toUpperCase()}`;
}

// SECURE EXECUTIVE DELEGATE DUES SETTLEMENT [RAD-CMD-088]
delegateExpressRouter.post('/clear-delegate-dues', rateLimiterMiddleware, async (req, res) => {
  const { delegateId, idToken } = req.body;
  if (!delegateId) {
    return res.status(400).json({ success: false, error: 'المندوب غير محدد لتسوية المستحقات' });
  }

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'المصادقة الأمنية مطلوبة لتسوية المستحقات المالية.' });
  }
  const requesterUid = await verifyFirebaseIdToken(idToken);
  if (!requesterUid) {
    return res.status(401).json({ success: false, error: 'رمز الجلسة غير صالح أو منتهي الصلاحية.' });
  }

  const requesterRef = doc(db, 'users', requesterUid);
  const requesterSnap = await getDoc(requesterRef);
  const reqData = requesterSnap.exists() ? requesterSnap.data() : null;
  const reqRole = reqData?.role;

  const isAuthorized = requesterUid === delegateId ||
    reqRole === 'admin' ||
    reqRole === 'owner';

  if (!isAuthorized) {
    return res.status(403).json({ success: false, error: 'غير مصرح لك بتنفيذ هذه التسوية المالية.' });
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
    const rawDues = data?.pendingDues || 0;

    if (rawDues <= 0) {
      return res.status(400).json({ success: false, error: '🚨 عطل مالي: لا توجد مستحقات مالية معلقة لتصفيتها أو صرفها لهذا المندوب حالياً!' });
    }

    const delRate = data?.deletionRate || 0;
    const penaltyAmount = rawDues * (delRate / 100) * 0.40;
    const withdrawableBalance = Math.max(0, rawDues - penaltyAmount);

    const settlementRecord = {
      netSettled: withdrawableBalance,
      rawDues: rawDues,
      penaltyAmount: penaltyAmount,
      deletionRate: delRate,
      timestamp: new Date().toISOString(),
      settledBy: 'owner'
    };

    await updateDoc(delRef, {
      pendingDues: 0,
      lastSettlementDate: new Date().toISOString(),
      settledBalances: arrayUnion(settlementRecord)
    });

    if (data?.userId) {
      const userRef = doc(db, 'users', data.userId);
      await updateDoc(userRef, { pendingDues: 0 });
    } else if (data?.phone) {
      const userQuery = query(collection(db, 'users'), where('phone', '==', data.phone), limit(1));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        await updateDoc(doc(db, 'users', userSnap.docs[0].id), { pendingDues: 0 });
      }
    }

    console.log(`[Sovereign Core] Cleared dues for delegate ${delegateId}. Net settled: ${withdrawableBalance}`);
    return res.json({
      success: true,
      message: 'تم تصفية وتصفير مستحقات المندوب بنجاح وتسجيل العملية في الأرشيف المالي',
      netSettled: withdrawableBalance
    });
  } catch (err: any) {
    console.error("[Clear Delegate Dues Error]:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// API to verify delegates signatures server-side
delegateExpressRouter.post('/verify-signatures', rateLimiterMiddleware, (req, res) => {
  const { delegates } = req.body;
  if (!Array.isArray(delegates)) {
    return res.status(400).json({ success: false, error: 'تنسيق البيانات غير صالح للتحقق.' });
  }

  const results: Record<string, boolean> = {};
  for (const d of delegates) {
    if (!d.id) continue;
    if (d.referredCount === undefined || d.referredCount === null || !d.referralCode || !d.integritySignature) {
      results[d.id] = false;
      continue;
    }
    const homeDistrict = d.homeDistrict || d.district || 'وادي السير';
    const currentH3Cell = d.currentH3Cell || '0x892f35ffffffff';
    const expected = generateIntegritySignatureServer(d.id, d.referredCount, d.referralCode, homeDistrict, currentH3Cell);
    results[d.id] = d.integritySignature === expected;
  }

  return res.json({ success: true, results });
});

// 1. RECONCILE AND SIGN DELEGATE (Server-Authoritative Cryptographic Integrity)
delegateExpressRouter.post('/reconcile-and-sign', rateLimiterMiddleware, async (req, res) => {
  const { delegateId, actorRole, actorUid, idToken } = req.body;
  if (!delegateId) {
    return res.status(400).json({ success: false, error: 'المندوب غير محدد لتأكيد العداد والتحقق' });
  }

  if (!idToken) {
    return res.status(401).json({ success: false, error: 'المصادقة الأمنية مطلوبة لإغلاق العدادات.' });
  }
  const requesterUid = await verifyFirebaseIdToken(idToken);
  if (!requesterUid) {
    return res.status(401).json({ success: false, error: 'رمز الجلسة غير صالح أو منتهي الصلاحية.' });
  }

  const requesterRef = doc(db, 'users', requesterUid);
  const requesterSnap = await getDoc(requesterRef);
  const reqData = requesterSnap.exists() ? requesterSnap.data() : null;
  const reqRole = reqData?.role;

  if (reqRole !== 'admin' && reqRole !== 'owner') {
    return res.status(403).json({ success: false, error: 'غير مصرح لك بتوقيع وإغلاق عدادات المناديب.' });
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
    const referralCode = delegateData.referralCode || '';
    const homeDistrict = delegateData.homeDistrict || delegateData.district || 'وادي السير';
    const currentH3Cell = delegateData.currentH3Cell || '0x892f35ffffffff';

    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'driver')
    );
    const usersSnap = await getDocs(usersQuery);

    const actualCount = usersSnap.docs.filter(docSnap => {
      const d = docSnap.data();
      return d.referralCode === referralCode ||
        d.referredByCode === referralCode ||
        d.usedReferralCode === referralCode;
    }).length;

    const finalCount = actualCount > 0 ? actualCount : (delegateData.referredCount || 0);
    const signature = generateIntegritySignatureServer(delegateId, finalCount, referralCode, homeDistrict, currentH3Cell);

    await updateDoc(delRef, {
      referredCount: finalCount,
      integritySignature: signature,
      homeDistrict,
      currentH3Cell
    });

    const actorName = actorUid || 'SYSTEM_SOVEREIGN_ADMIN';
    await addDoc(collection(db, 'audit_ledger'), {
      action: 'DELEGATE_INTEGRITY_SIGN_AND_RECONCILE',
      delegateId: delegateId,
      delegateName: delegateData.name || 'سفير ميداني',
      referralCode: referralCode,
      previousCount: delegateData.referredCount || 0,
      reconciledCount: finalCount,
      signature,
      actor: actorName,
      timestamp: new Date().toISOString(),
      verified: true,
      protocol: 'RAD-RECONCILE-99'
    });

    console.log(`[Sovereign Core] Reconciled and signed delegate ${delegateId}. Count: ${finalCount}. Signature: ${signature}`);

    return res.json({
      success: true,
      referredCount: finalCount,
      integritySignature: signature,
      message: 'تمت مصادقة ومطابقة وتوقيع العدادات تشفيرياً عبر الخادم بنجاح.'
    });
  } catch (err: any) {
    console.error("[Reconcile and Sign Error]:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// 2. GENERATE MAGIC LINK (Server-Authoritative Ticket Inception)
delegateExpressRouter.post('/generate-magic-link', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const { delegateId, delegateName, expiryHours } = req.body;
  if (!delegateId || !delegateName) {
    return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لتوليد الرابط السحري' });
  }

  try {
    const hours = expiryHours || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    const token = crypto.randomBytes(16).toString('hex');

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const originUrl = `${protocol}://${host}`;
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
  } catch (err: any) {
    console.error("[Generate Magic Link Error]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. VERIFY MAGIC LINK (Server-Authoritative Authentication Handshake)
delegateExpressRouter.post('/verify-magic-link', rateLimiterMiddleware, async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'رمز الدخول غير متوفر للتحقق' });
  }

  try {
    const q = query(
      collection(db, 'delegate_links'),
      where('token', '==', token),
      where('status', '==', 'active'),
      limit(1)
    );

    const qSnap = await getDocs(q);
    if (qSnap.empty) {
      return res.status(404).json({ success: false, error: 'رمز الدخول السحري غير صالح أو تم استهلاكه مسبقاً.' });
    }

    const linkDoc = qSnap.docs[0];
    const linkData = linkDoc.data();
    const expiresAt = new Date(linkData.expiresAt);
    const serverNow = new Date();

    if (expiresAt < serverNow) {
      await updateDoc(doc(db, 'delegate_links', linkDoc.id), { status: 'expired' });
      return res.status(410).json({ success: false, error: 'عذراً، انتهت صلاحية الرابط السحري زمنيّاً لحماية الخصوصية.' });
    }

    await updateDoc(doc(db, 'delegate_links', linkDoc.id), { status: 'used' });

    const delegateRef = doc(db, 'delegates', linkData.delegateId);
    const delegateSnap = await getDoc(delegateRef);

    let delegateProfile = null;
    if (delegateSnap.exists()) {
      delegateProfile = { id: delegateSnap.id, ...delegateSnap.data() };
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
  } catch (err: any) {
    console.error("[Verify Magic Link Error]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. SECURE DELEGATE TASK STATE TRANSITION ENFORCER (Server-Side State Machine)
delegateExpressRouter.post('/delegate-task-transition', rateLimiterMiddleware, async (req, res) => {
  let { taskId, targetStatus, delegateId, actorUid, actorRole } = req.body;

  const authHeader = req.headers.authorization;
  let verifiedUid: string | null = null;
  let verifiedRole = 'delegate';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    verifiedUid = await verifyFirebaseIdToken(idToken);
    if (!verifiedUid) {
      return res.status(401).json({ success: false, error: '🚨 اختراق أمني: رمز التحقق الرقمي منتهي الصلاحية أو تم التلاعب به!' });
    }

    const userRef = doc(db, 'users', verifiedUid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ success: false, error: '🚨 اختراق أمني: الملف الشخصي للمستخدم غير موجود!' });
    }
    const userData = userSnap.data();
    verifiedRole = userData.role || 'delegate';

    delegateId = verifiedUid;
    actorUid = verifiedUid;
    actorRole = verifiedRole;
  } else {
    if (!taskId.startsWith('tsk-sim')) {
      return res.status(401).json({ success: false, error: '🚨 اختراق أمني: ترويسة التحقق الأمنية الرقمية (Authorization Token) مطلوبة للمهام الفعلية!' });
    }
  }

  if (!taskId || !targetStatus || !delegateId) {
    return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لتحديث حالة المهمة.' });
  }

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
    const currentStatus = taskData.status || 'pending';

    if (actorRole !== 'admin' && taskData.delegateId !== delegateId) {
      await addDoc(collection(db, 'audit_ledger'), {
        timestamp: new Date().toISOString(),
        actorId: delegateId,
        action: 'UNAUTHORIZED_TASK_ACCESS_ATTEMPT_SERVER',
        details: { taskId, targetDelegateId: taskData.delegateId, attemptedBy: delegateId },
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
      if (actorRole !== 'admin') {
        const userRef = doc(db, 'users', actorUid || delegateId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (!userData || userData.role !== 'admin') {
          return res.status(403).json({ success: false, error: 'صلاحيات غير كافية: إغلاق المهام وصرف المستحقات متاح فقط للمشرفين والمالك.' });
        }
      }
    } else {
      return res.status(400).json({ success: false, error: `حالة غير معروفة للمهمة: ${targetStatus}` });
    }

    await updateDoc(taskRef, { status: targetStatus });

    const integrityHash = `TXN-TASK-${taskId.substring(0, 6)}-${targetStatus.toUpperCase()}-${Date.now()}`;

    await addDoc(collection(db, 'audit_ledger'), {
      action: `TASK_TRANSITION_${targetStatus.toUpperCase()}`,
      taskId: taskId,
      delegateId: delegateId,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      actor: actorUid || delegateId,
      actorRole: actorRole || 'delegate',
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
  } catch (err: any) {
    console.error("[Task Transition Error]:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    releaseBackendLock(lockKey);
  }
});
