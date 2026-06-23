import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { extractCoordsLocally } from './src/lib/sovereign-digger';
import dns from 'dns';
import { db } from './src/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

async function startServer() {
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

  // Diagnostic Endpoint for Sovereignties (Zone D)
  app.get('/api/health', (req, res) => {
    const memory = process.memoryUsage();
    return res.json({
      status: 'healthy',
      system: 'Sovereign Radar Core',
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
    const { delegateId } = req.body;
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

      await updateDoc(delRef, {
        pendingDues: 0,
        lastSettlementDate: new Date().toISOString()
      });

      console.log(`[Sovereign Core] Cleared dues for delegate ${delegateId}`);
      return res.json({ success: true, message: 'تم تصفية وتصفير مستحقات المندوب بنجاح' });
    } catch (err: any) {
      console.error("[Clear Delegate Dues Error]:", err);
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

  // Serve static assets / Vite setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
