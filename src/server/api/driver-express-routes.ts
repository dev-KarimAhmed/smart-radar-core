import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../../lib/firebase';
import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { requireExpressRole } from './supabase-identity';
import { rateLimiterMiddleware, acquireBackendLock, releaseBackendLock } from '../middleware/server-rate-limiter';

export const driverExpressRouter = Router();

class RouteHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function parseSafeUid(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 128 || trimmed.includes('/') || trimmed.includes('..')) {
    return null;
  }
  return trimmed;
}

// VIP SECURE DRIVER REVIVAL GATEWAY [RAD-CMD-078] with IP-based sliding rate limiting
driverExpressRouter.post('/revive-driver', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const driverUid = parseSafeUid(req.body?.driverUid);
  if (!driverUid) {
    return res.status(400).json({ success: false, error: 'السائق المطلوب غير محدد' });
  }

  const lockKey = `revive-${driverUid}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'عملية قيد المعالجة والمزامنة سحابياً بالفعل لهذا السائق.' });
  }

  try {
    const driverRef = doc(db, 'users', driverUid);
    // Secure cryptographic token approved exclusively by backend
    const approveToken = `REVIVE-SECURE-${Date.now()}-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;

    await runTransaction(db, async (tx) => {
      const driverSnap = await tx.get(driverRef);
      if (!driverSnap.exists()) {
        throw new RouteHttpError(404, 'السائق غير موجود');
      }

      tx.update(driverRef, {
        isBanned: false,
        immunityScore: 100.0,
        paidHoursRemaining: 12, // 12 emergency hours authorized by backend audit
        status: 'idle',
        banReason: null,
        reviveSovereignToken: approveToken,
        revivedByAdminId: authorized.caller.userId,
      });
    });

    console.log(`[Sovereign Core] Revived driver ${driverUid} by ${authorized.caller.userId}`);

    return res.json({
      success: true,
      hoursGranted: 12,
      message: 'تمت مصادقة وتوقيع شحنة الإحياء سحابياً بسلام'
    });
  } catch (err: unknown) {
    if (err instanceof RouteHttpError) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    console.error('[Revive Driver Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر إتمام عملية إحياء حساب الكابتن.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// VIP SECURE OWNER SCRATCH VOUCHER REDEEM [RAD-CMD-078] with Admin Authorization
driverExpressRouter.post('/redeem-voucher', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const driverUid = parseSafeUid(req.body?.driverUid);
  const voucherCode = typeof req.body?.voucherCode === 'string' ? req.body.voucherCode.trim().toUpperCase() : '';
  if (!driverUid || !voucherCode) {
    return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لشحن الساعات' });
  }
  if (!/^[A-Z0-9-]{6,64}$/.test(voucherCode) || !voucherCode.startsWith('RADAR-')) {
    return res.status(400).json({ success: false, error: 'توقيع الكود المستلم غير مطابق لبروتوكول الشحن المعتمد' });
  }

  const lockKey = `redeem-${driverUid}-${voucherCode}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'هناك عملية شحن وتفتيت تذاكر نشطة لهذا الكابتن حالياً.' });
  }

  try {
    const voucherRef = doc(db, 'wallet_vouchers', voucherCode);
    const driverRef = doc(db, 'users', driverUid);

    const { hoursAdded, newHours } = await runTransaction(db, async (tx) => {
      const voucherSnap = await tx.get(voucherRef);
      const driverSnap = await tx.get(driverRef);

      if (!voucherSnap.exists()) {
        throw new RouteHttpError(404, 'كود التذكرة غير مسجل أو غير موجود.');
      }

      const voucherData = voucherSnap.data();
      const voucherStatus = String(voucherData?.status || '').toUpperCase();
      if (voucherStatus !== 'UNUSED') {
        throw new RouteHttpError(409, 'كود التذكرة غير مطابق أو تم استهلاكه مسبقاً.');
      }

      const rawHoursValue = Number(voucherData?.hoursValue ?? voucherData?.hours ?? 100);
      if (!Number.isFinite(rawHoursValue) || rawHoursValue <= 0 || rawHoursValue > 1000) {
        throw new RouteHttpError(400, 'قيمة الساعات المسجلة في القسيمة غير صالحة.');
      }

      if (!driverSnap.exists()) {
        throw new RouteHttpError(404, 'السائق غير موجود');
      }

      const driverData = driverSnap.data();
      const currentHoursRaw = Number(driverData.paidHoursRemaining ?? driverData.subscriptionHours ?? 0);
      const currentHours = Number.isFinite(currentHoursRaw) && currentHoursRaw >= 0 ? currentHoursRaw : 0;
      const computedHours = currentHours + rawHoursValue;

      tx.update(voucherRef, {
        status: 'USED',
        redeemedBy: driverUid,
        redeemedByAdminId: authorized.caller.userId,
        redeemedAt: new Date().toISOString(),
      });

      tx.update(driverRef, {
        paidHoursRemaining: computedHours,
        subscriptionHours: computedHours,
      });

      return { hoursAdded: rawHoursValue, newHours: computedHours };
    });

    console.log(`[Sovereign Core] Redeemed ${hoursAdded} hours for driver ${driverUid} via ${voucherCode} by ${authorized.caller.userId}`);

    return res.json({ success: true, hoursAdded, newHours });
  } catch (err: unknown) {
    if (err instanceof RouteHttpError) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    console.error('[Redeem Voucher Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر تنفيذ عملية شحن القسيمة.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// SECURE GEOGRAPHIC DISTRICT COMMUTE GATEWAY [RAD-CMD-086]
driverExpressRouter.post('/commute-driver', rateLimiterMiddleware, async (req, res) => {
  const driverUid = parseSafeUid(req.body?.driverUid);
  const targetDistrict = typeof req.body?.targetDistrict === 'string' ? req.body.targetDistrict.trim() : '';
  if (!driverUid || !targetDistrict || targetDistrict.length > 120 || /[<>\\\x00-\x1F\x7F]/.test(targetDistrict)) {
    return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة للارتحال الجغرافي' });
  }

  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER'], { allowSelfId: driverUid });
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const lockKey = `commute-${driverUid}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'عملية الارتحال الجغرافي قيد المعالجة والتنفيذ حالياً.' });
  }

  try {
    const driverRef = doc(db, 'users', driverUid);
    const driverSnap = await getDoc(driverRef);

    if (!driverSnap.exists()) {
      return res.status(404).json({ success: false, error: 'السائق غير موجود' });
    }

    await updateDoc(driverRef, {
      currentDistrict: targetDistrict,
      lastCommuteUpdate: new Date().toISOString()
    });

    console.log(`[Sovereign Core] Commuted driver ${driverUid} to ${targetDistrict}`);
    return res.json({ success: true, message: 'تم الارتحال الجغرافي بنجاح' });
  } catch (err: unknown) {
    console.error('[Commute Driver Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر تنفيذ الارتحال الجغرافي.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});

// SECURE EXECUTIVE DRIVER SOVEREIGN STRIKE SWITCH [RAD-CMD-087]
driverExpressRouter.post('/kill-switch', rateLimiterMiddleware, async (req, res) => {
  const authorized = await requireExpressRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const driverUid = parseSafeUid(req.body?.driverUid);
  if (!driverUid) {
    return res.status(400).json({ success: false, error: 'المعرف المطلوب غير محدد للمصادرة' });
  }

  const lockKey = `kill-${driverUid}`;
  if (!acquireBackendLock(lockKey)) {
    return res.status(429).json({ success: false, error: 'طلب الصعق والتعطيل الجنائي قيد التنفيذ والمزامنة.' });
  }

  try {
    const driverRef = doc(db, 'users', driverUid);
    await runTransaction(db, async (tx) => {
      const driverSnap = await tx.get(driverRef);
      if (!driverSnap.exists()) {
        throw new RouteHttpError(404, 'السائق غير موجود');
      }

      tx.update(driverRef, {
        isBanned: true,
        immunityScore: 0.0,
        paidHoursRemaining: 0,
        subscriptionHours: 0,
        status: 'suspended',
        banReason: '[صعق جنائي سيادي فوري - إبطال صامت]'
      });
    });

    console.log(`[Sovereign Core] Kill-switch triggered on driver ${driverUid} by ${authorized.caller.userId}`);
    return res.json({ success: true, message: 'تم الصعق الجنائي الكلي للهدف ومصادرة ساعاته وقفل الحساب' });
  } catch (err: unknown) {
    if (err instanceof RouteHttpError) {
      return res.status(err.status).json({ success: false, error: err.message });
    }
    console.error('[Kill Switch Error]:', err);
    return res.status(500).json({ success: false, error: 'تعذّر تنفيذ الصعق الجنائي على الحساب.' });
  } finally {
    releaseBackendLock(lockKey);
  }
});
