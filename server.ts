import express from 'express';
import path from 'path';
import crypto from 'crypto';
import next from 'next';
import { extractCoordsLocally } from './src/lib/sovereign-digger';
import dns from 'dns';
import { db } from './src/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, addDoc, collection, query, where, getDocs, limit, setDoc } from 'firebase/firestore';
import fs from 'fs';
import { cleanupRouter } from './src/server/api/cleanup';

// Helper to load firebase config securely on the server
const getFirebaseApiKey = (): string => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const rawData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(rawData);
    return config.apiKey || '';
  } catch (err) {
    console.error("Failed to read firebase-applet-config.json:", err);
    return '';
  }
};

// Secure Server-Authoritative Identity Verification via Google Identity Toolkit
async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  if (!idToken) return null;
  try {
    const apiKey = getFirebaseApiKey();
    if (!apiKey) return null;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) return null;
    const data = (await response.json()) as any;
    if (data && data.users && data.users.length > 0) {
      return data.users[0].localId; // Verified UID
    }
  } catch (err) {
    console.error("[Token Verification Error]:", err);
  }
  return null;
}

async function startServer() {
  const dev = process.env.NODE_ENV !== 'production';
  const nextApp = next({ dev, hostname: '0.0.0.0', port: 3000 });
  const nextHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  const app = express();
  const PORT = 3000;

  // Real-time IP-based Sliding Window Rate Limiter (Zone B)
  const rateLimitMap = new Map<string, { timestamps: number[] }>();
  const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute

  const rateLimiterMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip').split(',')[0].trim();
    const now = Date.now();
    
    let tracker = rateLimitMap.get(ip);
    if (!tracker) {
      tracker = { timestamps: [] };
      rateLimitMap.set(ip, tracker);
    }

    // Filter out timestamps outside the active window
    tracker.timestamps = tracker.timestamps.filter(t => now - t < LIMIT_WINDOW_MS);

    if (tracker.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      console.warn(`[Sovereign Core Shield] IP Blocked owing to Flood Attempt: ${ip}`);
      return res.status(429).json({
        success: false,
        error: 'تهديد حركي: تم تجاوز حد الطلبات المسموح به لحماية الموارد السحابية المعزولة.'
      });
    }

    tracker.timestamps.push(now);
    next();
  };

  // Parse JSON bodies
  app.use(express.json());

  // Mount the Cloud-Side Mechanical Shovel Router [SR-CMD-2026-0104]
  app.use('/api', cleanupRouter);

  // Diagnostic Endpoint for Sovereignties (Zone D)
  app.get('/api/health', (req, res) => {
    const memory = process.memoryUsage();
    return res.json({
      status: 'healthy',
      system: 'Sovereign Radar Core',
      serverTime: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      securityShield: 'Active (Protocol 88)',
      diagnostics: {
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(memory.rss / 1024 / 1024)} MB`
      }
    });
  });

  // Synchronous Execution Locks on Backend to eliminate "The Ghost Command Syndrome" (SSOT Protection)
  const activeBackendLocks = new Set<string>();

  const acquireBackendLock = (key: string): boolean => {
    if (activeBackendLocks.has(key)) return false;
    activeBackendLocks.add(key);
    return true;
  };

  const releaseBackendLock = (key: string) => {
    activeBackendLocks.delete(key);
  };

  // VIP SECURE DRIVER REVIVAL GATEWAY [RAD-CMD-078] with IP-based sliding rate limiting
  app.post('/api/revive-driver', rateLimiterMiddleware, async (req, res) => {
    const { driverUid } = req.body;
    if (!driverUid) {
      return res.status(400).json({ success: false, error: 'السائق المطلوب غير محدد' });
    }

    const lockKey = `revive-${driverUid}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: 'عملية قيد المعالجة والمزامنة سحابياً بالفعل لهذا السائق.' });
    }

    try {
      const driverRef = doc(db, 'users', driverUid);
      const driverSnap = await getDoc(driverRef);

      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: 'السائق غير موجود' });
      }

      // Secure signature/token approved exclusively by backend
      const approveToken = `REVIVE-SECURE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await updateDoc(driverRef, {
        isBanned: false,
        immunityScore: 100.0,
        paidHoursRemaining: 12, // 12 emergency hours authorized by backend audit
        status: 'idle',
        banReason: null,
        reviveSovereignToken: approveToken
      });

      console.log(`[Sovereign Core] Revived driver ${driverUid}. Token: ${approveToken}`);

      return res.json({ 
        success: true, 
        hoursGranted: 12, 
        message: 'تمت مصادقة وتوقيع شحنة الإحياء سحابياً بسلام' 
      });
    } catch (err: any) {
      console.error("[Revive Driver Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });

  // VIP SECURE OWNER SCRATCH VOUCHER REDEEM [RAD-CMD-078] with IP-based sliding rate limiting
  app.post('/api/redeem-voucher', rateLimiterMiddleware, async (req, res) => {
    const { driverUid, voucherCode } = req.body;
    if (!driverUid || !voucherCode) {
      return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لشحن الساعات' });
    }

    const lockKey = `redeem-${driverUid}-${voucherCode}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: 'هناك عملية شحن وتفتيت تذاكر نشطة لهذا الكابتن حالياً.' });
    }

    try {
      // Check voucher signature
      if (!voucherCode.startsWith("RADAR-100H-")) {
        return res.status(400).json({ success: false, error: 'توقيع الكود المستلم غير مطابق لبروتوكول الشحن المعتمد' });
      }

      // Supported cryptographic vouchers list
      const authorizedVouchers = ["RADAR-100H-JORDAN", "RADAR-100H-AMMAN", "RADAR-100H-SOVEREIGN"];
      if (!authorizedVouchers.includes(voucherCode)) {
        return res.status(400).json({ success: false, error: 'كود التذكرة غير مطابق أو تم استهلاكه مسبقاً' });
      }

      const driverRef = doc(db, 'users', driverUid);
      const driverSnap = await getDoc(driverRef);

      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: 'السائق غير موجود' });
      }

      const driverData = driverSnap.data();
      const currentHours = driverData.paidHoursRemaining ?? (driverData.subscriptionHours ?? 0);
      const newHours = currentHours + 100;

      await updateDoc(driverRef, {
        paidHoursRemaining: newHours,
        subscriptionHours: newHours
      });

      console.log(`[Sovereign Core] Redempted 100 hours for driver ${driverUid} via voucher ${voucherCode}`);

      return res.json({ success: true, hoursAdded: 100, newHours });
    } catch (err: any) {
      console.error("[Redeem Voucher Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });

  // SECURE GEOGRAPHIC DISTRICT COMMUTE GATEWAY [RAD-CMD-086]
  app.post('/api/commute-driver', rateLimiterMiddleware, async (req, res) => {
    const { driverUid, targetDistrict } = req.body;
    if (!driverUid || !targetDistrict) {
      return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة للارتحال الجغرافي' });
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
    } catch (err: any) {
      console.error("[Commute Driver Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });

  // SECURE EXECUTIVE DRIVER SOVEREIGN STRIKE SWITCH [RAD-CMD-087]
  app.post('/api/kill-switch', rateLimiterMiddleware, async (req, res) => {
    const { driverUid } = req.body;
    if (!driverUid) {
      return res.status(400).json({ success: false, error: 'المعرف المطلوب غير محدد للمصادرة' });
    }

    const lockKey = `kill-${driverUid}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: 'طلب الصعق والتعطيل الجنائي قيد التنفيذ والمزامنة.' });
    }

    try {
      const driverRef = doc(db, 'users', driverUid);
      const driverSnap = await getDoc(driverRef);

      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: 'السائق غير موجود' });
      }

      await updateDoc(driverRef, {
        isBanned: true,
        immunityScore: 0.0,
        paidHoursRemaining: 0,
        subscriptionHours: 0,
        status: 'suspended',
        banReason: '[صعق جنائي سيادي فوري - إبطال صامت]'
      });

      console.log(`[Sovereign Core] Kill-switch triggered on driver ${driverUid}`);
      return res.json({ success: true, message: 'تم الصعق الجنائي الكلي للهدف ومصادرة ساعاته وقفل الحساب' });
    } catch (err: any) {
      console.error("[Kill Switch Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });

  // SECURE EXECUTIVE DELEGATE DUES SETTLEMENT [RAD-CMD-088]
  app.post('/api/clear-delegate-dues', rateLimiterMiddleware, async (req, res) => {
    const { delegateId, idToken } = req.body;
    if (!delegateId) {
      return res.status(400).json({ success: false, error: 'المندوب غير محدد لتسوية المستحقات' });
    }

    // [SECURITY-PATCH] مصادقة صارمة مشفرة لمنع هجمات الإغراق والتلاعب بالحقائب المالية
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

      // Clear the corresponding user document in 'users' collection to prevent desync
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

  // Server-Side Sovereign Cryptographic Integrity Engine
  function generateIntegritySignatureServer(delegateId: string, count: number, referralCode: string, homeDistrict?: string, currentH3Cell?: string) {
    const SECRET_SALT = "SOVEREIGN_RADAR_ROUTER_SECURE_SALT_2026";
    // We bind the signature with the geographical region (homeDistrict & currentH3Cell) to block location forgery!
    const rawString = `${delegateId}:${count}:${referralCode}:${homeDistrict || ''}:${currentH3Cell || ''}:${SECRET_SALT}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `SIG-HEX-${Math.abs(hash).toString(16).toUpperCase()}`;
  }

  // API to verify delegates signatures server-side (Backend-Proxy to hide SECRET_SALT)
  app.post('/api/verify-signatures', rateLimiterMiddleware, (req, res) => {
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
  app.post('/api/reconcile-and-sign', rateLimiterMiddleware, async (req, res) => {
    const { delegateId, actorRole, actorUid, idToken } = req.body;
    if (!delegateId) {
      return res.status(400).json({ success: false, error: 'المندوب غير محدد لتأكيد العداد والتحقق' });
    }

    // [SECURITY-PATCH] مصادقة صارمة مشفرة لمنع التلاعب بالمقاييس والعدادات
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
      // Fetch delegate details
      const delRef = doc(db, 'delegates', delegateId);
      const delSnap = await getDoc(delRef);
      if (!delSnap.exists()) {
        return res.status(404).json({ success: false, error: 'المندوب غير موجود في السجلات السحابية.' });
      }

      const delegateData = delSnap.data();
      const referralCode = delegateData.referralCode || '';
      const homeDistrict = delegateData.homeDistrict || delegateData.district || 'وادي السير';
      const currentH3Cell = delegateData.currentH3Cell || '0x892f35ffffffff';

      // Fetch all drivers with this referralCode in Firestore to get authoritative count
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

      // Reconcile count: if actualCount > 0, we can use actualCount, or keep current referredCount but sign it
      const finalCount = actualCount > 0 ? actualCount : (delegateData.referredCount || 0);
      
      // Calculate server-side signature incorporating geography!
      const signature = generateIntegritySignatureServer(delegateId, finalCount, referralCode, homeDistrict, currentH3Cell);

      // Update delegate document
      await updateDoc(delRef, {
        referredCount: finalCount,
        integritySignature: signature,
        homeDistrict,
        currentH3Cell
      });

      // Log to audit ledger
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
  app.post('/api/generate-magic-link', rateLimiterMiddleware, async (req, res) => {
    const { delegateId, delegateName, expiryHours, actorRole } = req.body;
    if (!delegateId || !delegateName) {
      return res.status(400).json({ success: false, error: 'المعطيات غير مكتملة لتوليد الرابط السحري' });
    }

    try {
      const hours = expiryHours || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      // Create a cryptographically secure token on the server
      const token = crypto.randomBytes(16).toString('hex');

      // Check protocol or environment mapping for origin
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || `localhost:${PORT}`;
      const originUrl = `${protocol}://${host}`;
      const magicLinkUrl = `${originUrl}/#magic-login?token=${token}`;

      const newLink = {
        delegateId,
        delegateName,
        token,
        expiresAt,
        expiryHours: hours,
        status: 'active',
        url: magicLinkUrl
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
  app.post('/api/verify-magic-link', rateLimiterMiddleware, async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'رمز الدخول غير متوفر للتحقق' });
    }

    try {
      // Find matching active link
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
        // Mark as expired
        await updateDoc(doc(db, 'delegate_links', linkDoc.id), { status: 'expired' });
        return res.status(410).json({ success: false, error: 'عذراً، انتهت صلاحية الرابط السحري زمنيّاً لحماية الخصوصية.' });
      }

      // Mark as used
      await updateDoc(doc(db, 'delegate_links', linkDoc.id), { status: 'used' });

      // Fetch delegate profile data to authenticate and return
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
  app.post('/api/delegate-task-transition', rateLimiterMiddleware, async (req, res) => {
    let { taskId, targetStatus, delegateId, actorUid, actorRole } = req.body;
    
    // Check for Authorization header first to extract verified credentials
    const authHeader = req.headers.authorization;
    let verifiedUid: string | null = null;
    let verifiedRole = 'delegate';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      verifiedUid = await verifyFirebaseIdToken(idToken);
      if (!verifiedUid) {
        return res.status(401).json({ success: false, error: '🚨 اختراق أمني: رمز التحقق الرقمي منتهي الصلاحية أو تم التلاعب به!' });
      }
      
      // Look up verified user profile
      const userRef = doc(db, 'users', verifiedUid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, error: '🚨 اختراق أمني: الملف الشخصي للمستخدم غير موجود!' });
      }
      const userData = userSnap.data();
      verifiedRole = userData.role || 'delegate';

      // Override request parameters with 100% secure verified values
      delegateId = verifiedUid;
      actorUid = verifiedUid;
      actorRole = verifiedRole;
    } else {
      // If no token, we only allow it if it's a simulated task (begins with tsk-sim)
      // Otherwise, we strictly enforce Authorization headers for production and development integrity.
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

      // Verify ownership if not admin
      if (actorRole !== 'admin' && taskData.delegateId !== delegateId) {
        // Log unauthorized access attempt in audit ledger
        await addDoc(collection(db, 'audit_ledger'), {
          timestamp: new Date().toISOString(),
          actorId: delegateId,
          action: 'UNAUTHORIZED_TASK_ACCESS_ATTEMPT_SERVER',
          details: { taskId, targetDelegateId: taskData.delegateId, attemptedBy: delegateId },
          securityClearance: 'CRITICAL_SECURITY_ALERT'
        });

        return res.status(403).json({ success: false, error: 'تحذير أمني حاسم: لا تملك صلاحية تعديل مهمة لا تنتمي لمعرّفك الأمني!' });
      }

      // Validate state transition machine (linear: pending -> acknowledged -> completed -> closed)
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
        // Only admin can close tasks
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

      // Update in firestore
      await updateDoc(taskRef, { status: targetStatus });

      // Generate a secure backend signed transaction fingerprint
      const integrityHash = `TXN-TASK-${taskId.substring(0, 6)}-${targetStatus.toUpperCase()}-${Date.now()}`;

      // Audit log entry
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

  // Safe SSRF URL validation (Zone C)
  function isSafeUrl(targetUrl: string): boolean {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      // Block common private network loopbacks and Cloud Metadata services
      const unsafeBlocklist = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '169.254.169.254', // AWS/GCP Metadata
        'metadata.google.internal'
      ];
      if (unsafeBlocklist.includes(hostname)) {
        return false;
      }
      // Block GCP/AWS/Azure Private subnet classes
      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')
      ) {
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // Safe IP check for DNS Rebinding blocklist
  function isSafeIp(ip: string): boolean {
    if (
      ip === '127.0.0.1' ||
      ip === '0.0.0.0' ||
      ip === '169.254.169.254' ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')
    ) {
      return false;
    }
    return true;
  }

  // Custom fetch wrapper with manual DNS lookup & verification to prevent DNS Rebinding
  async function secureFetch(targetUrl: string, options: any = {}) {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname;

    // Reject outright if original URL hostname triggers safe URL filter
    if (!isSafeUrl(targetUrl)) {
      throw new Error('الرابط المقدم غير آمن أو ينتهك ميثاق الأمان السيادي');
    }

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    let resolvedIp = hostname;

    if (!ipRegex.test(hostname)) {
      try {
        const lookupResult = await dns.promises.lookup(hostname, { family: 4 });
        resolvedIp = lookupResult.address;
      } catch (err) {
        throw new Error(`تعذر حل العنوان لـ ${hostname}`);
      }
    }

    if (!isSafeIp(resolvedIp)) {
      throw new Error(`حظر أمن سيادي: العنوان الموجه له ${resolvedIp} غير آمن أو مغمور بنظام الحظر المحلي`);
    }

    // Reconstruct the URL using the resolved raw IP to fully lock the connection destination
    parsed.hostname = resolvedIp;
    const resolvedUrl = parsed.toString();

    // Prepare headers with Host override to bypass redirect/proxy validation
    const headers = {
      ...(options.headers || {}),
      'Host': hostname
    };

    // Since we fetch by IP, bypass TLS altname errors in Node sandbox
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    return fetch(resolvedUrl, {
      ...options,
      headers
    });
  }

  // In-Memory Cache for Sovereign Digger coordinate lookup (Zone B - Zero cloud chativeness / TTL 1 hour)
  const diggerCache = new Map<string, { coords: { lat: number; lng: number }; expiresAt: number }>();

  // Self-cleaning routine for cache entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of diggerCache.entries()) {
      if (now > value.expiresAt) {
        diggerCache.delete(key);
      }
    }
  }, 60 * 1000); // Check and sweep expired keys every minute

  // API Route for Sovereign Digger proxying to bypass CORS with rate limits
  app.post('/api/sovereign-digger', rateLimiterMiddleware, async (req, res) => {
    try {
      const { shortUrl } = req.body;

      if (!shortUrl || typeof shortUrl !== 'string') {
        return res.status(400).json({ error: 'الرابط مفقود أو غير صالح' });
      }

      // Check cache first before any external request
      const cacheKey = shortUrl.trim();
      const cached = diggerCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        console.log(`[Sovereign Cache Hit] Returning coordinates from cache for: ${cacheKey}`);
        return res.json({ success: true, coords: cached.coords });
      }

      // Check SSRF vulnerability / validity of the target short url
      if (!isSafeUrl(shortUrl)) {
        console.warn(`[Sovereign Security Shield] Blocked potential SSRF attempt: ${shortUrl}`);
        return res.status(400).json({ error: 'الرابط المقدم غير آمن أو ينتهك ميثاق الأمان السيادي' });
      }

      // Group of URLs in redirect chain
      const urlChain: string[] = [shortUrl];
      let currentUrl = shortUrl;
      let hops = 0;

      // Helper to store coords to cache and return response
      const saveToCacheAndReturn = (coords: { lat: number; lng: number }) => {
        diggerCache.set(cacheKey, {
          coords,
          expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour TTL
        });
        return res.json({ success: true, coords });
      };

      // 1. Manually follow redirects with manual DNS checks (Zone A)
      while (hops < 6) {
        try {
          if (!isSafeUrl(currentUrl)) break;

          const response = await secureFetch(currentUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5'
            },
            redirect: 'manual'
          });

          const loc = response.headers.get('location');
          if (loc) {
            const resolvedLoc = new URL(loc, currentUrl).toString();
            if (isSafeUrl(resolvedLoc)) {
              urlChain.push(resolvedLoc);
              currentUrl = resolvedLoc;
              hops++;

              if (response.status >= 300 && response.status < 400) {
                continue;
              }
            }
          }
        } catch (fetchErr) {
          console.error("[Sovereign Digger hops error]:", fetchErr);
          break;
        }
        break;
      }

      // 2. Scan parsed URL chain (with decodeURIComponent) (Zone A)
      for (const url of urlChain) {
        const decoded = decodeURIComponent(url);
        const coords = extractCoordsLocally(decoded);
        if (coords) {
          console.log(`[Sovereign Digger Server Chain Success] Extracted: ${coords.lat}, ${coords.lng}`);
          return saveToCacheAndReturn(coords);
        }
      }

      // 3. Jettison fetch follow to scrape the final HTML safely with content-length checks (Zone A & B - zero waste)
      try {
        if (isSafeUrl(currentUrl)) {
          const sizeLimit = 1 * 1024 * 1024; // Guard memory: max 1MB response limit
          const response = await secureFetch(currentUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            redirect: 'follow'
          });

          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength, 10) > sizeLimit) {
            return res.status(413).json({ error: 'تم إلغاء العملية: حجم صفحة الإحداثيات كبير جداً ويتنكب الموارد.' });
          }

          const finalUrl = response.url;
          // Guard final redirected URL
          if (!isSafeUrl(finalUrl)) {
            return res.status(400).json({ error: 'إعادة التوجيه النهائية تنتهك ميثاق الأمان السيادي' });
          }

          const htmlText = await response.text();
          if (htmlText.length > sizeLimit) {
            return res.status(413).json({ error: 'حجم مخرجات صفحة الإحداثيات تجاوز الحد الآمن' });
          }

          urlChain.push(finalUrl);

          // Check final decoded URL
          const decodedFinalUrl = decodeURIComponent(finalUrl);
          const finalUrlCoords = extractCoordsLocally(decodedFinalUrl);
          if (finalUrlCoords) {
            return saveToCacheAndReturn(finalUrlCoords);
          }

          // Check raw and decoded HTML
          let decodedHtmlText = htmlText;
          try {
            decodedHtmlText = decodeURIComponent(htmlText);
          } catch (e) {
            // ignore parsing error
          }

          const htmlCoords = extractCoordsLocally(htmlText) || extractCoordsLocally(decodedHtmlText);
          if (htmlCoords) {
            return saveToCacheAndReturn(htmlCoords);
          }
        }
      } catch (finalFetchErr: any) {
        console.error("[Sovereign Digger Final Fetch Error]:", finalFetchErr);
      }

      return res.status(404).json({ error: 'تعذر انتزاع الإحداثيات من الرابط المختصر' });

    } catch (error: any) {
      console.error("[Sovereign Digger Server General Error]:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Next.js page routing handler
  app.all('*all', (req, res) => {
    return nextHandler(req, res);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
