"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_next = __toESM(require("next"), 1);

// src/core/constants/sovereign-protocols.ts
var SOVEREIGN_CONSTANTS = {
  // 1. الثوابت الجغرافية (Geo-Constraints)
  RADAR_RADIUS_KM: 1.5,
  // نصف قطر الدوران الفعال للرحلات
  URBAN_DETOUR_INDEX: 1.35,
  // معدل الاستدارة الميداني المحاكي لكثافة الشوارع
  PULSE_SECTOR_SIZE: 1.5,
  // The size of the market pulse sectors in kilometers.
  // 2. معايير الفترات الزمنية والدورية (Rotation & Lifecycle)
  ROTATION_CYCLE_DURATION_MS: 250 * 1e3,
  // المدة الزمنية لدورة البحث النشط
  ROTATION_MAX_ITERATIONS: 2,
  // Allows for 3 total cycles
  REQUEST_COOL_DOWN_MS: 1e4,
  // 10 seconds anti-spam for new ride requests.
  TRIP_CHECKPOINT_DELAY_MIN: 10,
  // 10 minutes before a trip is flagged for checkpoint.
  TRIP_ARCHIVE_PURGE_HOURS: 150,
  // Purge archived trips older than this
  TRIP_FORGOTTEN_GRACE_MIN: 30,
  // Grace period for auto-terminating forgotten trips
  TRIP_LIFESPAN_EXTENSION_MIN: 30,
  // Minutes to add when extending a trip's lifespan
  // 3. معايير الحصص والحدود (Quota)
  QUOTA_MAX_DRIVERS_VISIBLE: 12,
  // 9 فرسان نشيطين + 3 في الاستماع
  QUOTA_MAX_RIDERS_VISIBLE: 9,
  // الأقصى للفرسان المرئيين للفرسان النشيطين
  RADAR_SCAN_LIMIT: 50,
  // Max trips/drivers to query in a single go
  // 4. معايير السرعات والمحاكاة لسرعة النبض (V-Pulse Speeds & Simulation)
  PULSE_SPEED_CRITICAL: 15,
  // السرعة الحرجة للنبض الميداني (كم/س)
  PULSE_SPEED_ACTIVE: 25,
  // السرعة النشطة للنبض الميداني (كم/س)
  PULSE_SPEED_STABLE: 40,
  // السرعة المستقرة للنبض الميداني (كم/س)
  SIMULATION_KM: 5,
  // Distance for benchmark simulation
  SIMULATION_MIN: 10,
  // Duration for benchmark simulation
  FUEL_CONSUMPTION_FACTOR: 0.12,
  // Fuel consumption L/km for benchmark
  PRICE_DUMPING_THRESHOLD_PERCENT: 15,
  // Max allowed undercut percentage
  // 5. معايير النشاط والخماد (Operational)
  DORMANCY_WARNING_MS: 4 * 60 * 1e3,
  // 4 minutes until a dormancy warning
  DORMANCY_TIMEOUT_MS: 5 * 60 * 1e3,
  // 5 minutes of inactivity until status is set to 'idle'
  MIN_TRIP_DURATION_MIN: 3,
  // الأدنى المعتمد للرحلات كأمان
  // 6. ثوابت الرتب والتصنيفات (Ranking)
  RANKING_RULES: {
    PLATINUM: { minRating: 4.8, minHearts: 50, name: "Platinum" },
    GOLD: { minRating: 4.5, minHearts: 20, name: "Gold" },
    SILVER: { minRating: 4, minHearts: 0, name: "Silver" },
    BRONZE: { minRating: 0, minHearts: 0, name: "Bronze" }
  }
};

// src/core/logic/geospatial-kernel.ts
var import_h3_js = require("h3-js");

// src/lib/sovereign-digger.ts
var coordinatePatterns = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
  // النمط القياسي @lat,lng
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  // نمط الأبعاد الأربعة !3dlat!4dlng
  /center=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,
  // نمط المركز المعزز
  /ll=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,
  // نمط ll المعزز
  /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  // نمط البحث المبسط q=lat,lng
  /query=(-?\d+\.\d+)(?:\+2C|%2C|%2c|,)(-?\d+\.\d+)/i,
  // نمط البحث الأساسي query=lat,lng
  /(-?\d{1,2}\.\d+)(?:\+2C|%2C|%2c|,)\s*(-?\d{1,3}\.\d+)/i
  // النمط العشري الصريح المرن (lat,lng) الموحد
];
function extractCoordsLocally(url) {
  for (const pattern of coordinatePatterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2])
      };
    }
  }
  const dmsRegex = /(\d+)°(\d+)'(\d+(\.\d+)?)"\s*([NS])\s*(\d+)°(\d+)'(\d+(\.\d+)?)"\s*([EW])/i;
  const dmsMatch = url.match(dmsRegex);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]);
    const latMin = parseFloat(dmsMatch[2]);
    const latSec = parseFloat(dmsMatch[3]);
    const latDir = dmsMatch[5].toUpperCase();
    const lngDeg = parseFloat(dmsMatch[6]);
    const lngMin = parseFloat(dmsMatch[7]);
    const lngSec = parseFloat(dmsMatch[8]);
    const lngDir = dmsMatch[10].toUpperCase();
    let lat = latDeg + latMin / 60 + latSec / 3600;
    if (latDir === "S") lat = -lat;
    let lng = lngDeg + lngMin / 60 + lngSec / 3600;
    if (lngDir === "W") lng = -lng;
    return { lat, lng };
  }
  return null;
}

// server.ts
var import_dns = __toESM(require("dns"), 1);

// src/lib/firebase.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_auth = require("firebase/auth");

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "studio-1599225026-dbbaa",
  appId: "1:23870609900:web:1782cb5b886cbbe9f088c9",
  apiKey: "AIzaSyB-AHIZ18qMlmTIUndA-RhEcrRoEmY9Hgk",
  authDomain: "studio-1599225026-dbbaa.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-388b7043-6b0c-4de2-8130-17b23cd3fd7d",
  storageBucket: "studio-1599225026-dbbaa.firebasestorage.app",
  messagingSenderId: "23870609900",
  measurementId: ""
};

// src/lib/firebase.ts
var app = !(0, import_app.getApps)().length ? (0, import_app.initializeApp)(firebase_applet_config_default) : (0, import_app.getApp)();
var db = (0, import_firestore.initializeFirestore)(app, {
  experimentalForceLongPolling: true
}, firebase_applet_config_default.firestoreDatabaseId);
var auth = (0, import_auth.getAuth)(app);

// server.ts
var import_firestore3 = require("firebase/firestore");
var import_fs = __toESM(require("fs"), 1);

// src/server/api/cleanup.ts
var import_express = require("express");
var import_firestore2 = require("firebase/firestore");
var cleanupRouter = (0, import_express.Router)();
cleanupRouter.post("/cleanup", async (req, res) => {
  console.log("[\u0627\u0644\u0645\u062C\u0631\u0641\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629] \u0628\u062F\u0621 \u062F\u0648\u0631\u0629 \u0627\u0644\u062A\u0637\u0647\u064A\u0631 \u0648\u0627\u0644\u0643\u0646\u0633 \u0644\u062B\u063A\u0631\u0629 \u0627\u0644\u062A\u0631\u0627\u0643\u0645 \u0627\u0644\u0628\u064A\u0627\u0646\u064A...");
  let deletedCount = 0;
  let bufferResetCount = 0;
  const nowMs = Date.now();
  const seventyTwoHoursAgoLimit = nowMs - 72 * 60 * 60 * 1e3;
  try {
    const tripsQuery = (0, import_firestore2.query)((0, import_firestore2.collection)(db, "trips"));
    const tripsSnapshot = await (0, import_firestore2.getDocs)(tripsQuery);
    const batch = (0, import_firestore2.writeBatch)(db);
    let batchSize = 0;
    tripsSnapshot.forEach((tripDoc) => {
      const data = tripDoc.data();
      let createdAtMs = 0;
      if (data.createdAt) {
        if (data.createdAt.seconds) {
          createdAtMs = data.createdAt.seconds * 1e3;
        } else if (data.createdAt instanceof Date) {
          createdAtMs = data.createdAt.getTime();
        } else {
          createdAtMs = new Date(data.createdAt).getTime();
        }
      }
      if (createdAtMs > 0 && createdAtMs <= seventyTwoHoursAgoLimit) {
        const isVaulted = data.isVaulted === true || data.isGreenHearted === true;
        if (!isVaulted) {
          batch.delete(tripDoc.ref);
          deletedCount++;
          batchSize++;
        } else {
          console.log(`[\u0627\u0644\u062D\u0627\u0631\u0633 \u0627\u0644\u0633\u064A\u0627\u062F\u064A] \u062D\u0645\u0627\u064A\u0629 \u0648\u062A\u062E\u0637\u064A \u0648\u062B\u064A\u0642\u0629 \u0627\u0644\u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u062D\u0635\u0646\u0629: ${tripDoc.id}`);
        }
      }
    });
    const ridersQuery = (0, import_firestore2.query)(
      (0, import_firestore2.collection)(db, "users"),
      (0, import_firestore2.where)("role", "==", "rider"),
      (0, import_firestore2.where)("isBufferActive", "==", true)
    );
    const ridersSnapshot = await (0, import_firestore2.getDocs)(ridersQuery);
    ridersSnapshot.forEach((riderDoc) => {
      const data = riderDoc.data();
      const expiresAt = data.lastTripBuffer?.expiresAt;
      let expiresAtMs = 0;
      if (expiresAt) {
        if (expiresAt.seconds) {
          expiresAtMs = expiresAt.seconds * 1e3;
        } else if (expiresAt instanceof Date) {
          expiresAtMs = expiresAt.getTime();
        } else {
          expiresAtMs = new Date(expiresAt).getTime();
        }
      }
      if (expiresAtMs > 0 && expiresAtMs <= nowMs) {
        batch.update(riderDoc.ref, {
          isBufferActive: false,
          lastTripBuffer: null
        });
        bufferResetCount++;
        batchSize++;
      }
    });
    if (batchSize > 0) {
      await batch.commit();
    }
    console.log(`[\u0627\u0644\u0645\u062C\u0631\u0641\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629] \u062A\u0645 \u062A\u0637\u0647\u064A\u0631 \u0648\u0628\u062A\u0631 ${deletedCount} \u0631\u062D\u0644\u0627\u062A \u0645\u064A\u062A\u0629\u060C \u0648\u0625\u0639\u0627\u062F\u0629 \u062A\u0647\u064A\u0626\u0629 ${bufferResetCount} \u0645\u0624\u0642\u062A\u0627\u062A \u062A\u0627\u0644\u0641\u0629.`);
    await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "system_states", "cleanup_pulse"), {
      lastPurgeTimestamp: nowMs,
      purgedTripsCount: deletedCount,
      purgedBuffersCount: bufferResetCount,
      action: "PURGE_TRIGGER_LOCAL_TATHIR",
      integrityHash: `TXN-PURGE-${nowMs}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      protocol: "SC-55-SHOVE-TATHIR"
    });
    await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db, "audit_ledger"), {
      action: "CLEANUP_PURGE_SUCCESS",
      deletedCount,
      bufferResetCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      protocol: "RAD-ANTI-CHEAT-20",
      verified: true
    });
    return res.json({
      success: true,
      message: "\u062A\u0645\u062A \u062F\u0648\u0631\u0629 \u0643\u0646\u0633 \u0648\u0625\u0628\u0627\u062F\u0629 \u0627\u0644\u062A\u0631\u0627\u0643\u0645\u0627\u062A \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0628\u0646\u062C\u0627\u062D \u0645\u0637\u0644\u0642 \u0648\u062A\u0644\u0642\u064A\u062D \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0628\u0646\u0628\u0636\u0629 \u0627\u0644\u062A\u0637\u0647\u064A\u0631 \u0627\u0644\u0635\u0627\u0645\u062A\u0629.",
      data: {
        purgedTrips: deletedCount,
        purgedBuffers: bufferResetCount,
        timestamp: nowMs
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("\u{1F6D1} [\u0627\u0644\u0645\u062C\u0631\u0641\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 - \u0641\u0634\u0644 \u0627\u0644\u0625\u0628\u0627\u062F\u0629]:", errorMsg);
    try {
      await (0, import_firestore2.addDoc)((0, import_firestore2.collection)(db, "audit_ledger"), {
        action: "CLEANUP_PURGE_FAILURE",
        error: errorMsg,
        stack: errorStack,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        protocol: "RAD-ANTI-CHEAT-20",
        verified: false
      });
    } catch (auditError) {
      console.error("Failed to log error to audit ledger:", auditError);
    }
    return res.status(500).json({
      success: false,
      error: "\u0639\u0637\u0644 \u0641\u064A \u0627\u0644\u062A\u0637\u0647\u064A\u0631 \u0627\u0644\u0645\u064A\u0643\u0627\u0646\u064A\u0643\u064A: \u062A\u0645 \u0627\u062D\u062A\u062C\u0627\u0632 \u0627\u0644\u062E\u0637\u0623 \u0648\u0627\u0644\u0627\u0639\u062A\u0631\u0627\u0636 \u0639\u0644\u064A\u0647 \u062C\u0646\u0627\u0626\u064A\u0627\u064B \u0648\u0645\u0646\u0639 \u062A\u0645\u0631\u064A\u0631\u0647 \u0635\u0627\u0645\u062A\u0627\u064B.",
      details: errorMsg
    });
  }
});

// server.ts
var getFirebaseApiKey = () => {
  try {
    const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
    const rawData = import_fs.default.readFileSync(configPath, "utf8");
    const config = JSON.parse(rawData);
    return config.apiKey || "";
  } catch (err) {
    console.error("Failed to read firebase-applet-config.json:", err);
    return "";
  }
};
async function verifyFirebaseIdToken(idToken) {
  if (!idToken) return null;
  try {
    const apiKey = getFirebaseApiKey();
    if (!apiKey) return null;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.users && data.users.length > 0) {
      return data.users[0].localId;
    }
  } catch (err) {
    console.error("[Token Verification Error]:", err);
  }
  return null;
}
async function startServer() {
  const dev = process.env.NODE_ENV !== "production";
  const nextApp = (0, import_next.default)({ dev, hostname: "0.0.0.0", port: 3e3 });
  const nextHandler = nextApp.getRequestHandler();
  await nextApp.prepare();
  const app2 = (0, import_express2.default)();
  const PORT = 3e3;
  const rateLimitMap = /* @__PURE__ */ new Map();
  const LIMIT_WINDOW_MS = 60 * 1e3;
  const MAX_REQUESTS_PER_WINDOW = 30;
  const rateLimiterMiddleware = (req, res, next2) => {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip").split(",")[0].trim();
    const now = Date.now();
    let tracker = rateLimitMap.get(ip);
    if (!tracker) {
      tracker = { timestamps: [] };
      rateLimitMap.set(ip, tracker);
    }
    tracker.timestamps = tracker.timestamps.filter((t) => now - t < LIMIT_WINDOW_MS);
    if (tracker.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      console.warn(`[Sovereign Core Shield] IP Blocked owing to Flood Attempt: ${ip}`);
      return res.status(429).json({
        success: false,
        error: "\u062A\u0647\u062F\u064A\u062F \u062D\u0631\u0643\u064A: \u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u062D\u062F \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0627\u0644\u0645\u0639\u0632\u0648\u0644\u0629."
      });
    }
    tracker.timestamps.push(now);
    next2();
  };
  app2.use(import_express2.default.json());
  app2.use("/api", cleanupRouter);
  app2.get("/api/health", (req, res) => {
    const memory = process.memoryUsage();
    return res.json({
      status: "healthy",
      system: "Sovereign Radar Core",
      serverTime: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      securityShield: "Active (Protocol 88)",
      diagnostics: {
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(memory.rss / 1024 / 1024)} MB`
      }
    });
  });
  const activeBackendLocks = /* @__PURE__ */ new Set();
  const acquireBackendLock = (key) => {
    if (activeBackendLocks.has(key)) return false;
    activeBackendLocks.add(key);
    return true;
  };
  const releaseBackendLock = (key) => {
    activeBackendLocks.delete(key);
  };
  app2.post("/api/revive-driver", rateLimiterMiddleware, async (req, res) => {
    const { driverUid } = req.body;
    if (!driverUid) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0633\u0627\u0626\u0642 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F" });
    }
    const lockKey = `revive-${driverUid}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0639\u0645\u0644\u064A\u0629 \u0642\u064A\u062F \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0648\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0633\u062D\u0627\u0628\u064A\u0627\u064B \u0628\u0627\u0644\u0641\u0639\u0644 \u0644\u0647\u0630\u0627 \u0627\u0644\u0633\u0627\u0626\u0642." });
    }
    try {
      const driverRef = (0, import_firestore3.doc)(db, "users", driverUid);
      const driverSnap = await (0, import_firestore3.getDoc)(driverRef);
      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0633\u0627\u0626\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const approveToken = `REVIVE-SECURE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await (0, import_firestore3.updateDoc)(driverRef, {
        isBanned: false,
        immunityScore: 100,
        paidHoursRemaining: 12,
        // 12 emergency hours authorized by backend audit
        status: "idle",
        banReason: null,
        reviveSovereignToken: approveToken
      });
      console.log(`[Sovereign Core] Revived driver ${driverUid}. Token: ${approveToken}`);
      return res.json({
        success: true,
        hoursGranted: 12,
        message: "\u062A\u0645\u062A \u0645\u0635\u0627\u062F\u0642\u0629 \u0648\u062A\u0648\u0642\u064A\u0639 \u0634\u062D\u0646\u0629 \u0627\u0644\u0625\u062D\u064A\u0627\u0621 \u0633\u062D\u0627\u0628\u064A\u0627\u064B \u0628\u0633\u0644\u0627\u0645"
      });
    } catch (err) {
      console.error("[Revive Driver Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  app2.post("/api/redeem-voucher", rateLimiterMiddleware, async (req, res) => {
    const { driverUid, voucherCode } = req.body;
    if (!driverUid || !voucherCode) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0644\u0634\u062D\u0646 \u0627\u0644\u0633\u0627\u0639\u0627\u062A" });
    }
    const lockKey = `redeem-${driverUid}-${voucherCode}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0647\u0646\u0627\u0643 \u0639\u0645\u0644\u064A\u0629 \u0634\u062D\u0646 \u0648\u062A\u0641\u062A\u064A\u062A \u062A\u0630\u0627\u0643\u0631 \u0646\u0634\u0637\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0643\u0627\u0628\u062A\u0646 \u062D\u0627\u0644\u064A\u0627\u064B." });
    }
    try {
      if (!voucherCode.startsWith("RADAR-100H-")) {
        return res.status(400).json({ success: false, error: "\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0643\u0648\u062F \u0627\u0644\u0645\u0633\u062A\u0644\u0645 \u063A\u064A\u0631 \u0645\u0637\u0627\u0628\u0642 \u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u0639\u062A\u0645\u062F" });
      }
      const authorizedVouchers = ["RADAR-100H-JORDAN", "RADAR-100H-AMMAN", "RADAR-100H-SOVEREIGN"];
      if (!authorizedVouchers.includes(voucherCode)) {
        return res.status(400).json({ success: false, error: "\u0643\u0648\u062F \u0627\u0644\u062A\u0630\u0643\u0631\u0629 \u063A\u064A\u0631 \u0645\u0637\u0627\u0628\u0642 \u0623\u0648 \u062A\u0645 \u0627\u0633\u062A\u0647\u0644\u0627\u0643\u0647 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      const driverRef = (0, import_firestore3.doc)(db, "users", driverUid);
      const driverSnap = await (0, import_firestore3.getDoc)(driverRef);
      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0633\u0627\u0626\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const driverData = driverSnap.data();
      const currentHours = driverData.paidHoursRemaining ?? (driverData.subscriptionHours ?? 0);
      const newHours = currentHours + 100;
      await (0, import_firestore3.updateDoc)(driverRef, {
        paidHoursRemaining: newHours,
        subscriptionHours: newHours
      });
      console.log(`[Sovereign Core] Redempted 100 hours for driver ${driverUid} via voucher ${voucherCode}`);
      return res.json({ success: true, hoursAdded: 100, newHours });
    } catch (err) {
      console.error("[Redeem Voucher Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  app2.post("/api/commute-driver", rateLimiterMiddleware, async (req, res) => {
    const { driverUid, targetDistrict } = req.body;
    if (!driverUid || !targetDistrict) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0644\u0644\u0627\u0631\u062A\u062D\u0627\u0644 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A" });
    }
    const lockKey = `commute-${driverUid}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0627\u0631\u062A\u062D\u0627\u0644 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A \u0642\u064A\u062F \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0648\u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u062D\u0627\u0644\u064A\u0627\u064B." });
    }
    try {
      const driverRef = (0, import_firestore3.doc)(db, "users", driverUid);
      const driverSnap = await (0, import_firestore3.getDoc)(driverRef);
      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0633\u0627\u0626\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      await (0, import_firestore3.updateDoc)(driverRef, {
        currentDistrict: targetDistrict,
        lastCommuteUpdate: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log(`[Sovereign Core] Commuted driver ${driverUid} to ${targetDistrict}`);
      return res.json({ success: true, message: "\u062A\u0645 \u0627\u0644\u0627\u0631\u062A\u062D\u0627\u0644 \u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A \u0628\u0646\u062C\u0627\u062D" });
    } catch (err) {
      console.error("[Commute Driver Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  app2.post("/api/kill-switch", rateLimiterMiddleware, async (req, res) => {
    const { driverUid } = req.body;
    if (!driverUid) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0639\u0631\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0644\u0644\u0645\u0635\u0627\u062F\u0631\u0629" });
    }
    const lockKey = `kill-${driverUid}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0637\u0644\u0628 \u0627\u0644\u0635\u0639\u0642 \u0648\u0627\u0644\u062A\u0639\u0637\u064A\u0644 \u0627\u0644\u062C\u0646\u0627\u0626\u064A \u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0648\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629." });
    }
    try {
      const driverRef = (0, import_firestore3.doc)(db, "users", driverUid);
      const driverSnap = await (0, import_firestore3.getDoc)(driverRef);
      if (!driverSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0633\u0627\u0626\u0642 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      await (0, import_firestore3.updateDoc)(driverRef, {
        isBanned: true,
        immunityScore: 0,
        paidHoursRemaining: 0,
        subscriptionHours: 0,
        status: "suspended",
        banReason: "[\u0635\u0639\u0642 \u062C\u0646\u0627\u0626\u064A \u0633\u064A\u0627\u062F\u064A \u0641\u0648\u0631\u064A - \u0625\u0628\u0637\u0627\u0644 \u0635\u0627\u0645\u062A]"
      });
      console.log(`[Sovereign Core] Kill-switch triggered on driver ${driverUid}`);
      return res.json({ success: true, message: "\u062A\u0645 \u0627\u0644\u0635\u0639\u0642 \u0627\u0644\u062C\u0646\u0627\u0626\u064A \u0627\u0644\u0643\u0644\u064A \u0644\u0644\u0647\u062F\u0641 \u0648\u0645\u0635\u0627\u062F\u0631\u0629 \u0633\u0627\u0639\u0627\u062A\u0647 \u0648\u0642\u0641\u0644 \u0627\u0644\u062D\u0633\u0627\u0628" });
    } catch (err) {
      console.error("[Kill Switch Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  app2.post("/api/clear-delegate-dues", rateLimiterMiddleware, async (req, res) => {
    const { delegateId, idToken } = req.body;
    if (!delegateId) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0627\u062A" });
    }
    if (!idToken) {
      return res.status(401).json({ success: false, error: "\u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0627\u0644\u0623\u0645\u0646\u064A\u0629 \u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629." });
    }
    const requesterUid = await verifyFirebaseIdToken(idToken);
    if (!requesterUid) {
      return res.status(401).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629." });
    }
    const requesterRef = (0, import_firestore3.doc)(db, "users", requesterUid);
    const requesterSnap = await (0, import_firestore3.getDoc)(requesterRef);
    const reqData = requesterSnap.exists() ? requesterSnap.data() : null;
    const reqRole = reqData?.role;
    const isAuthorized = requesterUid === delegateId || reqRole === "admin" || reqRole === "owner";
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0647 \u0627\u0644\u062A\u0633\u0648\u064A\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629." });
    }
    const lockKey = `clear-dues-${delegateId}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0639\u0645\u0644\u064A\u0629 \u062A\u0633\u0648\u064A\u0629 \u0648\u062A\u0635\u0641\u064A\u0627\u062A \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0642\u064A\u062F \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u062D\u0627\u0644\u064A\u0627\u064B." });
    }
    try {
      const delRef = (0, import_firestore3.doc)(db, "delegates", delegateId);
      const delSnap = await (0, import_firestore3.getDoc)(delRef);
      if (!delSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const data = delSnap.data();
      const rawDues = data?.pendingDues || 0;
      if (rawDues <= 0) {
        return res.status(400).json({ success: false, error: "\u{1F6A8} \u0639\u0637\u0644 \u0645\u0627\u0644\u064A: \u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0645\u0627\u0644\u064A\u0629 \u0645\u0639\u0644\u0642\u0629 \u0644\u062A\u0635\u0641\u064A\u062A\u0647\u0627 \u0623\u0648 \u0635\u0631\u0641\u0647\u0627 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u062D\u0627\u0644\u064A\u0627\u064B!" });
      }
      const delRate = data?.deletionRate || 0;
      const penaltyAmount = rawDues * (delRate / 100) * 0.4;
      const withdrawableBalance = Math.max(0, rawDues - penaltyAmount);
      const settlementRecord = {
        netSettled: withdrawableBalance,
        rawDues,
        penaltyAmount,
        deletionRate: delRate,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        settledBy: "owner"
      };
      await (0, import_firestore3.updateDoc)(delRef, {
        pendingDues: 0,
        lastSettlementDate: (/* @__PURE__ */ new Date()).toISOString(),
        settledBalances: (0, import_firestore3.arrayUnion)(settlementRecord)
      });
      if (data?.userId) {
        const userRef = (0, import_firestore3.doc)(db, "users", data.userId);
        await (0, import_firestore3.updateDoc)(userRef, { pendingDues: 0 });
      } else if (data?.phone) {
        const userQuery = (0, import_firestore3.query)((0, import_firestore3.collection)(db, "users"), (0, import_firestore3.where)("phone", "==", data.phone), (0, import_firestore3.limit)(1));
        const userSnap = await (0, import_firestore3.getDocs)(userQuery);
        if (!userSnap.empty) {
          await (0, import_firestore3.updateDoc)((0, import_firestore3.doc)(db, "users", userSnap.docs[0].id), { pendingDues: 0 });
        }
      }
      console.log(`[Sovereign Core] Cleared dues for delegate ${delegateId}. Net settled: ${withdrawableBalance}`);
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u0635\u0641\u064A\u0629 \u0648\u062A\u0635\u0641\u064A\u0631 \u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0641\u064A \u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0645\u0627\u0644\u064A",
        netSettled: withdrawableBalance
      });
    } catch (err) {
      console.error("[Clear Delegate Dues Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  function generateIntegritySignatureServer(delegateId, count, referralCode, homeDistrict, currentH3Cell) {
    const SECRET_SALT = "SOVEREIGN_RADAR_ROUTER_SECURE_SALT_2026";
    const rawString = `${delegateId}:${count}:${referralCode}:${homeDistrict || ""}:${currentH3Cell || ""}:${SECRET_SALT}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      const char = rawString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `SIG-HEX-${Math.abs(hash).toString(16).toUpperCase()}`;
  }
  app2.post("/api/verify-signatures", rateLimiterMiddleware, (req, res) => {
    const { delegates } = req.body;
    if (!Array.isArray(delegates)) {
      return res.status(400).json({ success: false, error: "\u062A\u0646\u0633\u064A\u0642 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0644\u0644\u062A\u062D\u0642\u0642." });
    }
    const results = {};
    for (const d of delegates) {
      if (!d.id) continue;
      if (d.referredCount === void 0 || d.referredCount === null || !d.referralCode || !d.integritySignature) {
        results[d.id] = false;
        continue;
      }
      const homeDistrict = d.homeDistrict || d.district || "\u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0631";
      const currentH3Cell = d.currentH3Cell || "0x892f35ffffffff";
      const expected = generateIntegritySignatureServer(d.id, d.referredCount, d.referralCode, homeDistrict, currentH3Cell);
      results[d.id] = d.integritySignature === expected;
    }
    return res.json({ success: true, results });
  });
  app2.post("/api/reconcile-and-sign", rateLimiterMiddleware, async (req, res) => {
    const { delegateId, actorRole, actorUid, idToken } = req.body;
    if (!delegateId) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F \u0644\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0639\u062F\u0627\u062F \u0648\u0627\u0644\u062A\u062D\u0642\u0642" });
    }
    if (!idToken) {
      return res.status(401).json({ success: false, error: "\u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u0627\u0644\u0623\u0645\u0646\u064A\u0629 \u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0639\u062F\u0627\u062F\u0627\u062A." });
    }
    const requesterUid = await verifyFirebaseIdToken(idToken);
    if (!requesterUid) {
      return res.status(401).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062C\u0644\u0633\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629." });
    }
    const requesterRef = (0, import_firestore3.doc)(db, "users", requesterUid);
    const requesterSnap = await (0, import_firestore3.getDoc)(requesterRef);
    const reqData = requesterSnap.exists() ? requesterSnap.data() : null;
    const reqRole = reqData?.role;
    if (reqRole !== "admin" && reqRole !== "owner") {
      return res.status(403).json({ success: false, error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0648\u0642\u064A\u0639 \u0648\u0625\u063A\u0644\u0627\u0642 \u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u062F\u064A\u0628." });
    }
    const lockKey = `reconcile-sign-${delegateId}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0648\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0639\u062F\u0627\u062F\u0627\u062A \u0642\u064A\u062F \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u062D\u0627\u0644\u064A\u0627\u064B." });
    }
    try {
      const delRef = (0, import_firestore3.doc)(db, "delegates", delegateId);
      const delSnap = await (0, import_firestore3.getDoc)(delRef);
      if (!delSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629." });
      }
      const delegateData = delSnap.data();
      const referralCode = delegateData.referralCode || "";
      const homeDistrict = delegateData.homeDistrict || delegateData.district || "\u0648\u0627\u062F\u064A \u0627\u0644\u0633\u064A\u0631";
      const currentH3Cell = delegateData.currentH3Cell || "0x892f35ffffffff";
      const usersQuery = (0, import_firestore3.query)(
        (0, import_firestore3.collection)(db, "users"),
        (0, import_firestore3.where)("role", "==", "driver")
      );
      const usersSnap = await (0, import_firestore3.getDocs)(usersQuery);
      const actualCount = usersSnap.docs.filter((docSnap) => {
        const d = docSnap.data();
        return d.referralCode === referralCode || d.referredByCode === referralCode || d.usedReferralCode === referralCode;
      }).length;
      const finalCount = actualCount > 0 ? actualCount : delegateData.referredCount || 0;
      const signature = generateIntegritySignatureServer(delegateId, finalCount, referralCode, homeDistrict, currentH3Cell);
      await (0, import_firestore3.updateDoc)(delRef, {
        referredCount: finalCount,
        integritySignature: signature,
        homeDistrict,
        currentH3Cell
      });
      const actorName = actorUid || "SYSTEM_SOVEREIGN_ADMIN";
      await (0, import_firestore3.addDoc)((0, import_firestore3.collection)(db, "audit_ledger"), {
        action: "DELEGATE_INTEGRITY_SIGN_AND_RECONCILE",
        delegateId,
        delegateName: delegateData.name || "\u0633\u0641\u064A\u0631 \u0645\u064A\u062F\u0627\u0646\u064A",
        referralCode,
        previousCount: delegateData.referredCount || 0,
        reconciledCount: finalCount,
        signature,
        actor: actorName,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        verified: true,
        protocol: "RAD-RECONCILE-99"
      });
      console.log(`[Sovereign Core] Reconciled and signed delegate ${delegateId}. Count: ${finalCount}. Signature: ${signature}`);
      return res.json({
        success: true,
        referredCount: finalCount,
        integritySignature: signature,
        message: "\u062A\u0645\u062A \u0645\u0635\u0627\u062F\u0642\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0648\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0639\u062F\u0627\u062F\u0627\u062A \u062A\u0634\u0641\u064A\u0631\u064A\u0627\u064B \u0639\u0628\u0631 \u0627\u0644\u062E\u0627\u062F\u0645 \u0628\u0646\u062C\u0627\u062D."
      });
    } catch (err) {
      console.error("[Reconcile and Sign Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  app2.post("/api/generate-magic-link", rateLimiterMiddleware, async (req, res) => {
    const { delegateId, delegateName, expiryHours, actorRole } = req.body;
    if (!delegateId || !delegateName) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0644\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0633\u062D\u0631\u064A" });
    }
    try {
      const hours = expiryHours || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1e3).toISOString();
      const token = import_crypto.default.randomBytes(16).toString("hex");
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || `localhost:${PORT}`;
      const originUrl = `${protocol}://${host}`;
      const magicLinkUrl = `${originUrl}/#magic-login?token=${token}`;
      const newLink = {
        delegateId,
        delegateName,
        token,
        expiresAt,
        expiryHours: hours,
        status: "active",
        url: magicLinkUrl
      };
      await (0, import_firestore3.addDoc)((0, import_firestore3.collection)(db, "delegate_links"), newLink);
      return res.json({
        success: true,
        link: newLink,
        message: "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0633\u062D\u0631\u064A \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0623\u0645\u064A\u0646\u0647 \u062F\u0627\u062E\u0644 \u0627\u0644\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0644\u0644\u0631\u0627\u062F\u0627\u0631."
      });
    } catch (err) {
      console.error("[Generate Magic Link Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/verify-magic-link", rateLimiterMiddleware, async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0644\u0644\u062A\u062D\u0642\u0642" });
    }
    try {
      const q = (0, import_firestore3.query)(
        (0, import_firestore3.collection)(db, "delegate_links"),
        (0, import_firestore3.where)("token", "==", token),
        (0, import_firestore3.where)("status", "==", "active"),
        (0, import_firestore3.limit)(1)
      );
      const qSnap = await (0, import_firestore3.getDocs)(q);
      if (qSnap.empty) {
        return res.status(404).json({ success: false, error: "\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0633\u062D\u0631\u064A \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u062A\u0645 \u0627\u0633\u062A\u0647\u0644\u0627\u0643\u0647 \u0645\u0633\u0628\u0642\u0627\u064B." });
      }
      const linkDoc = qSnap.docs[0];
      const linkData = linkDoc.data();
      const expiresAt = new Date(linkData.expiresAt);
      const serverNow = /* @__PURE__ */ new Date();
      if (expiresAt < serverNow) {
        await (0, import_firestore3.updateDoc)((0, import_firestore3.doc)(db, "delegate_links", linkDoc.id), { status: "expired" });
        return res.status(410).json({ success: false, error: "\u0639\u0630\u0631\u0627\u064B\u060C \u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0633\u062D\u0631\u064A \u0632\u0645\u0646\u064A\u0651\u0627\u064B \u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629." });
      }
      await (0, import_firestore3.updateDoc)((0, import_firestore3.doc)(db, "delegate_links", linkDoc.id), { status: "used" });
      const delegateRef = (0, import_firestore3.doc)(db, "delegates", linkData.delegateId);
      const delegateSnap = await (0, import_firestore3.getDoc)(delegateRef);
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
        message: "\u062A\u0645 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0633\u062D\u0631\u064A \u0645\u0646 \u0647\u0648\u064A\u062A\u0643 \u0643\u0648\u0643\u064A\u0644 \u0633\u064A\u0627\u062F\u064A \u0628\u0646\u062C\u0627\u062D \u0645\u0628\u0631\u0647\u0646!"
      });
    } catch (err) {
      console.error("[Verify Magic Link Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app2.post("/api/delegate-task-transition", rateLimiterMiddleware, async (req, res) => {
    let { taskId, targetStatus, delegateId, actorUid, actorRole } = req.body;
    const authHeader = req.headers.authorization;
    let verifiedUid = null;
    let verifiedRole = "delegate";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      verifiedUid = await verifyFirebaseIdToken(idToken);
      if (!verifiedUid) {
        return res.status(401).json({ success: false, error: "\u{1F6A8} \u0627\u062E\u062A\u0631\u0627\u0642 \u0623\u0645\u0646\u064A: \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0631\u0642\u0645\u064A \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0623\u0648 \u062A\u0645 \u0627\u0644\u062A\u0644\u0627\u0639\u0628 \u0628\u0647!" });
      }
      const userRef = (0, import_firestore3.doc)(db, "users", verifiedUid);
      const userSnap = await (0, import_firestore3.getDoc)(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u{1F6A8} \u0627\u062E\u062A\u0631\u0627\u0642 \u0623\u0645\u0646\u064A: \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F!" });
      }
      const userData = userSnap.data();
      verifiedRole = userData.role || "delegate";
      delegateId = verifiedUid;
      actorUid = verifiedUid;
      actorRole = verifiedRole;
    } else {
      if (!taskId.startsWith("tsk-sim")) {
        return res.status(401).json({ success: false, error: "\u{1F6A8} \u0627\u062E\u062A\u0631\u0627\u0642 \u0623\u0645\u0646\u064A: \u062A\u0631\u0648\u064A\u0633\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u0623\u0645\u0646\u064A\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629 (Authorization Token) \u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0641\u0639\u0644\u064A\u0629!" });
      }
    }
    if (!taskId || !targetStatus || !delegateId) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0639\u0637\u064A\u0627\u062A \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0644\u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0647\u0645\u0629." });
    }
    const lockKey = `task-transition-${taskId}`;
    if (!acquireBackendLock(lockKey)) {
      return res.status(429).json({ success: false, error: "\u0647\u0646\u0627\u0643 \u0639\u0645\u0644\u064A\u0629 \u062A\u062D\u062F\u064A\u062B \u0646\u0634\u0637\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629 \u062D\u0627\u0644\u064A\u0627\u064B." });
    }
    try {
      const taskRef = (0, import_firestore3.doc)(db, "delegate_tasks", taskId);
      const taskSnap = await (0, import_firestore3.getDoc)(taskRef);
      if (!taskSnap.exists()) {
        return res.status(404).json({ success: false, error: "\u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0633\u062C\u0644\u0627\u062A." });
      }
      const taskData = taskSnap.data();
      const currentStatus = taskData.status || "pending";
      if (actorRole !== "admin" && taskData.delegateId !== delegateId) {
        await (0, import_firestore3.addDoc)((0, import_firestore3.collection)(db, "audit_ledger"), {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          actorId: delegateId,
          action: "UNAUTHORIZED_TASK_ACCESS_ATTEMPT_SERVER",
          details: { taskId, targetDelegateId: taskData.delegateId, attemptedBy: delegateId },
          securityClearance: "CRITICAL_SECURITY_ALERT"
        });
        return res.status(403).json({ success: false, error: "\u062A\u062D\u0630\u064A\u0631 \u0623\u0645\u0646\u064A \u062D\u0627\u0633\u0645: \u0644\u0627 \u062A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u062A\u0639\u062F\u064A\u0644 \u0645\u0647\u0645\u0629 \u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0644\u0645\u0639\u0631\u0651\u0641\u0643 \u0627\u0644\u0623\u0645\u0646\u064A!" });
      }
      if (currentStatus === "closed") {
        return res.status(400).json({ success: false, error: "\u062E\u0637\u0623: \u0627\u0644\u0645\u0647\u0645\u0629 \u0645\u063A\u0644\u0642\u0629 \u0646\u0647\u0627\u0626\u064A\u0627\u064B \u0648\u0645\u0648\u062B\u0642\u0629 \u0648\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644\u0647\u0627 \u0623\u0648 \u0627\u0644\u0631\u062C\u0648\u0639 \u0628\u0627\u0644\u062E\u0644\u0641." });
      }
      if (targetStatus === "acknowledged") {
        if (currentStatus !== "pending") {
          return res.status(400).json({ success: false, error: `\u062E\u0637\u0623 \u0641\u064A \u0622\u0644\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A: \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0641\u0639\u064A\u0644 \u0645\u0647\u0645\u0629 \u0628\u062D\u0627\u0644\u0629 ${currentStatus}.` });
        }
      } else if (targetStatus === "completed") {
        if (currentStatus !== "acknowledged") {
          return res.status(400).json({ success: false, error: `\u062E\u0637\u0623 \u0641\u064A \u0622\u0644\u0629 \u0627\u0644\u062D\u0627\u0644\u0627\u062A: \u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0643\u0645\u0627\u0644 \u0645\u0647\u0645\u0629 \u0628\u062D\u0627\u0644\u0629 ${currentStatus}.` });
        }
      } else if (targetStatus === "closed") {
        if (actorRole !== "admin") {
          const userRef = (0, import_firestore3.doc)(db, "users", actorUid || delegateId);
          const userSnap = await (0, import_firestore3.getDoc)(userRef);
          const userData = userSnap.data();
          if (!userData || userData.role !== "admin") {
            return res.status(403).json({ success: false, error: "\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629: \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0645\u0647\u0627\u0645 \u0648\u0635\u0631\u0641 \u0627\u0644\u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0645\u062A\u0627\u062D \u0641\u0642\u0637 \u0644\u0644\u0645\u0634\u0631\u0641\u064A\u0646 \u0648\u0627\u0644\u0645\u0627\u0644\u0643." });
          }
        }
      } else {
        return res.status(400).json({ success: false, error: `\u062D\u0627\u0644\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641\u0629 \u0644\u0644\u0645\u0647\u0645\u0629: ${targetStatus}` });
      }
      await (0, import_firestore3.updateDoc)(taskRef, { status: targetStatus });
      const integrityHash = `TXN-TASK-${taskId.substring(0, 6)}-${targetStatus.toUpperCase()}-${Date.now()}`;
      await (0, import_firestore3.addDoc)((0, import_firestore3.collection)(db, "audit_ledger"), {
        action: `TASK_TRANSITION_${targetStatus.toUpperCase()}`,
        taskId,
        delegateId,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        actor: actorUid || delegateId,
        actorRole: actorRole || "delegate",
        integrityHash,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        verified: true,
        protocol: "RAD-STATE-MACHINE-99"
      });
      return res.json({
        success: true,
        newStatus: targetStatus,
        integrityHash,
        message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0645\u0647\u0645\u0629 \u0628\u0623\u0645\u0627\u0646 \u062A\u0627\u0645 \u0645\u0646 \u062E\u0644\u0627\u0644 \u062C\u062F\u0627\u0631 \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A \u0627\u0644\u0645\u0648\u062D\u062F."
      });
    } catch (err) {
      console.error("[Task Transition Error]:", err);
      return res.status(500).json({ success: false, error: err.message });
    } finally {
      releaseBackendLock(lockKey);
    }
  });
  function isSafeUrl(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      const unsafeBlocklist = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "169.254.169.254",
        // AWS/GCP Metadata
        "metadata.google.internal"
      ];
      if (unsafeBlocklist.includes(hostname)) {
        return false;
      }
      if (hostname.startsWith("10.") || hostname.startsWith("192.168.") || hostname.startsWith("172.16.") || hostname.startsWith("172.17.") || hostname.startsWith("172.18.") || hostname.startsWith("172.19.") || hostname.startsWith("172.20.") || hostname.startsWith("172.21.") || hostname.startsWith("172.22.") || hostname.startsWith("172.23.") || hostname.startsWith("172.24.") || hostname.startsWith("172.25.") || hostname.startsWith("172.26.") || hostname.startsWith("172.27.") || hostname.startsWith("172.28.") || hostname.startsWith("172.29.") || hostname.startsWith("172.30.") || hostname.startsWith("172.31.")) {
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }
  function isSafeIp(ip) {
    if (ip === "127.0.0.1" || ip === "0.0.0.0" || ip === "169.254.169.254" || ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.") || ip.startsWith("172.20.") || ip.startsWith("172.21.") || ip.startsWith("172.22.") || ip.startsWith("172.23.") || ip.startsWith("172.24.") || ip.startsWith("172.25.") || ip.startsWith("172.26.") || ip.startsWith("172.27.") || ip.startsWith("172.28.") || ip.startsWith("172.29.") || ip.startsWith("172.30.") || ip.startsWith("172.31.")) {
      return false;
    }
    return true;
  }
  async function secureFetch(targetUrl, options = {}) {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname;
    if (!isSafeUrl(targetUrl)) {
      throw new Error("\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0642\u062F\u0645 \u063A\u064A\u0631 \u0622\u0645\u0646 \u0623\u0648 \u064A\u0646\u062A\u0647\u0643 \u0645\u064A\u062B\u0627\u0642 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0633\u064A\u0627\u062F\u064A");
    }
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    let resolvedIp = hostname;
    if (!ipRegex.test(hostname)) {
      try {
        const lookupResult = await import_dns.default.promises.lookup(hostname, { family: 4 });
        resolvedIp = lookupResult.address;
      } catch (err) {
        throw new Error(`\u062A\u0639\u0630\u0631 \u062D\u0644 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0644\u0640 ${hostname}`);
      }
    }
    if (!isSafeIp(resolvedIp)) {
      throw new Error(`\u062D\u0638\u0631 \u0623\u0645\u0646 \u0633\u064A\u0627\u062F\u064A: \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0648\u062C\u0647 \u0644\u0647 ${resolvedIp} \u063A\u064A\u0631 \u0622\u0645\u0646 \u0623\u0648 \u0645\u063A\u0645\u0648\u0631 \u0628\u0646\u0638\u0627\u0645 \u0627\u0644\u062D\u0638\u0631 \u0627\u0644\u0645\u062D\u0644\u064A`);
    }
    parsed.hostname = resolvedIp;
    const resolvedUrl = parsed.toString();
    const headers = {
      ...options.headers || {},
      "Host": hostname
    };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return fetch(resolvedUrl, {
      ...options,
      headers
    });
  }
  const diggerCache = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of diggerCache.entries()) {
      if (now > value.expiresAt) {
        diggerCache.delete(key);
      }
    }
  }, 60 * 1e3);
  app2.post("/api/sovereign-digger", rateLimiterMiddleware, async (req, res) => {
    try {
      const { shortUrl } = req.body;
      if (!shortUrl || typeof shortUrl !== "string") {
        return res.status(400).json({ error: "\u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0641\u0642\u0648\u062F \u0623\u0648 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
      }
      const cacheKey = shortUrl.trim();
      const cached = diggerCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        console.log(`[Sovereign Cache Hit] Returning coordinates from cache for: ${cacheKey}`);
        return res.json({ success: true, coords: cached.coords });
      }
      if (!isSafeUrl(shortUrl)) {
        console.warn(`[Sovereign Security Shield] Blocked potential SSRF attempt: ${shortUrl}`);
        return res.status(400).json({ error: "\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u0642\u062F\u0645 \u063A\u064A\u0631 \u0622\u0645\u0646 \u0623\u0648 \u064A\u0646\u062A\u0647\u0643 \u0645\u064A\u062B\u0627\u0642 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0633\u064A\u0627\u062F\u064A" });
      }
      const urlChain = [shortUrl];
      let currentUrl = shortUrl;
      let hops = 0;
      const saveToCacheAndReturn = (coords) => {
        diggerCache.set(cacheKey, {
          coords,
          expiresAt: Date.now() + 60 * 60 * 1e3
          // 1 hour TTL
        });
        return res.json({ success: true, coords });
      };
      while (hops < 6) {
        try {
          if (!isSafeUrl(currentUrl)) break;
          const response = await secureFetch(currentUrl, {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5"
            },
            redirect: "manual"
          });
          const loc = response.headers.get("location");
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
      for (const url of urlChain) {
        const decoded = decodeURIComponent(url);
        const coords = extractCoordsLocally(decoded);
        if (coords) {
          console.log(`[Sovereign Digger Server Chain Success] Extracted: ${coords.lat}, ${coords.lng}`);
          return saveToCacheAndReturn(coords);
        }
      }
      try {
        if (isSafeUrl(currentUrl)) {
          const sizeLimit = 1 * 1024 * 1024;
          const response = await secureFetch(currentUrl, {
            method: "GET",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            },
            redirect: "follow"
          });
          const contentLength = response.headers.get("content-length");
          if (contentLength && parseInt(contentLength, 10) > sizeLimit) {
            return res.status(413).json({ error: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0639\u0645\u0644\u064A\u0629: \u062D\u062C\u0645 \u0635\u0641\u062D\u0629 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B \u0648\u064A\u062A\u0646\u0643\u0628 \u0627\u0644\u0645\u0648\u0627\u0631\u062F." });
          }
          const finalUrl = response.url;
          if (!isSafeUrl(finalUrl)) {
            return res.status(400).json({ error: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629 \u062A\u0646\u062A\u0647\u0643 \u0645\u064A\u062B\u0627\u0642 \u0627\u0644\u0623\u0645\u0627\u0646 \u0627\u0644\u0633\u064A\u0627\u062F\u064A" });
          }
          const htmlText = await response.text();
          if (htmlText.length > sizeLimit) {
            return res.status(413).json({ error: "\u062D\u062C\u0645 \u0645\u062E\u0631\u062C\u0627\u062A \u0635\u0641\u062D\u0629 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0622\u0645\u0646" });
          }
          urlChain.push(finalUrl);
          const decodedFinalUrl = decodeURIComponent(finalUrl);
          const finalUrlCoords = extractCoordsLocally(decodedFinalUrl);
          if (finalUrlCoords) {
            return saveToCacheAndReturn(finalUrlCoords);
          }
          let decodedHtmlText = htmlText;
          try {
            decodedHtmlText = decodeURIComponent(htmlText);
          } catch (e) {
          }
          const htmlCoords = extractCoordsLocally(htmlText) || extractCoordsLocally(decodedHtmlText);
          if (htmlCoords) {
            return saveToCacheAndReturn(htmlCoords);
          }
        }
      } catch (finalFetchErr) {
        console.error("[Sovereign Digger Final Fetch Error]:", finalFetchErr);
      }
      return res.status(404).json({ error: "\u062A\u0639\u0630\u0631 \u0627\u0646\u062A\u0632\u0627\u0639 \u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A \u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u0645\u062E\u062A\u0635\u0631" });
    } catch (error) {
      console.error("[Sovereign Digger Server General Error]:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  app2.all("*all", (req, res) => {
    return nextHandler(req, res);
  });
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
