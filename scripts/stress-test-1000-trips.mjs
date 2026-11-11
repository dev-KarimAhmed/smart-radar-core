import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as h3 from 'h3-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CLI Arguments
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = {
    riders: 1000,
    captains: 1000,
    trips: 1000,
    concurrency: 12,
    tripConcurrency: 18,
    keep: false,
    cleanupOnly: null,
    reportOut: path.resolve(
      'C:/Users/karee/.gemini/antigravity/brain/a0535332-0364-4953-8d43-fe17e9e54585/scratch/load-test-report.json'
    ),
    manifestOut: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--riders' && argv[i + 1]) opts.riders = Math.max(1, Number(argv[++i]));
    else if (a === '--captains' && argv[i + 1]) opts.captains = Math.max(1, Number(argv[++i]));
    else if (a === '--trips' && argv[i + 1]) opts.trips = Math.max(1, Number(argv[++i]));
    else if (a === '--concurrency' && argv[i + 1]) opts.concurrency = Math.max(1, Number(argv[++i]));
    else if (a === '--trip-concurrency' && argv[i + 1]) opts.tripConcurrency = Math.max(1, Number(argv[++i]));
    else if (a === '--keep') opts.keep = true;
    else if (a === '--cleanup-only' && argv[i + 1]) opts.cleanupOnly = path.resolve(argv[++i]);
    else if (a === '--report-out' && argv[i + 1]) opts.reportOut = path.resolve(argv[++i]);
    else if (a === '--manifest-out' && argv[i + 1]) opts.manifestOut = path.resolve(argv[++i]);
    else if (a === '--smoke') {
      opts.riders = 24;
      opts.captains = 24;
      opts.trips = 24;
      opts.concurrency = 8;
      opts.tripConcurrency = 8;
    }
  }
  return opts;
}

const OPTS = parseArgs(process.argv.slice(2));
const RUN_ID = `st${Date.now().toString(36)}`;
const RUN_NUM4 = String(Math.floor(1000 + (Date.now() % 8999)));
const TEST_EMAIL_DOMAIN = 'loadtest.radar.local';
const TEST_PASSWORD = 'RadarTest#2026!Safe';

if (!OPTS.manifestOut) {
  OPTS.manifestOut = path.resolve(
    `C:/Users/karee/.gemini/antigravity/brain/a0535332-0364-4953-8d43-fe17e9e54585/scratch/load-test-manifest-${RUN_ID}.json`
  );
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
const clientOpts = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, clientOpts);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOpts);

function makeAuthedClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...clientOpts,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

// ---------------------------------------------------------------------------
// Geographic Zones (Jordan & Egypt)
// ---------------------------------------------------------------------------
const ZONES = [
  { key: 'JO_AMMAN', countryId: 1, govId: 1, districts: [1, 2, 3, 4, 5], lat: 31.9539, lng: 35.9106, currency: 'JOD' },
  { key: 'JO_IRBID', countryId: 1, govId: 2, districts: [6, 7], lat: 32.5568, lng: 35.8469, currency: 'JOD' },
  { key: 'JO_ZARQA', countryId: 1, govId: 3, districts: [8, 9], lat: 32.0608, lng: 36.0942, currency: 'JOD' },
  { key: 'EG_GIZA_OCT', countryId: 2, govId: 14, districts: [19, 20], lat: 29.9578, lng: 30.8972, currency: 'EGP' },
  { key: 'EG_CAIRO_NASR', countryId: 2, govId: 13, districts: [11, 12, 13, 14], lat: 30.0561, lng: 31.3301, currency: 'EGP' },
];

const VEHICLE_BRANDS = ['Toyota', 'Hyundai', 'Kia', 'Nissan', 'BYD', 'MG'];
const VEHICLE_MODELS = ['Corolla 2023', 'Elantra 2022', 'Cerato 2024', 'Sunny 2023', 'Dolphin 2024', 'MG5 2023'];
const PRICING_MODES = ['FREE', 'APP', 'TAXI'];

function zoneForUser(index, isEgyptBias = null) {
  if (isEgyptBias === true) return ZONES[3 + (index % 2)];
  if (isEgyptBias === false) return ZONES[index % 3];
  // 65% Jordan (Amman/Irbid/Zarqa), 35% Egypt (Giza/Cairo) matching trip mix
  const mod = index % 20;
  if (mod < 8) return ZONES[0]; // 40% Amman
  if (mod < 11) return ZONES[1]; // 15% Irbid
  if (mod < 13) return ZONES[2]; // 10% Zarqa
  if (mod < 17) return ZONES[3]; // 20% Giza/6Oct
  return ZONES[4]; // 15% Cairo
}

function deterministicJitter(seed, scale = 0.012) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const frac = x - Math.floor(x);
  return (frac - 0.5) * 2 * scale;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

// ---------------------------------------------------------------------------
// Telemetry & Utilities
// ---------------------------------------------------------------------------
const telemetry = {
  runId: RUN_ID,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  config: OPTS,
  baseline: {},
  phase1: {
    ridersRequested: OPTS.riders,
    captainsRequested: OPTS.captains,
    ridersCreated: 0,
    ridersSignedIn: 0,
    captainsCreated: 0,
    captainsSignedIn: 0,
    captainsActivated: 0,
    specialCaptainsCount: 0,
    durationMs: 0,
    authRetries: 0,
    errors: [],
  },
  phase2: {
    tripsRequested: OPTS.trips,
    tripsPassed: 0,
    tripsFailed: 0,
    durationMs: 0,
    scenarios: {},
    checksPassed: 0,
    checksFailed: 0,
    failedTripDetails: [],
  },
  latencies: {},
  walletAudit: {
    completedSampleChecked: 0,
    completedChargedCount: 0,
    completedTotalMinutesCharged: 0,
    completedTransactionsVerified: 0,
    activeCancelSampleChecked: 0,
    activeCancelChargedCount: 0,
    activeCancelTotalMinutesCharged: 0,
    anomalies: [],
  },
  securityAudit: [],
  dbPeakCounts: {},
  cleanup: {
    executed: false,
    durationMs: 0,
    deletedAuthUsers: 0,
    postCounts: {},
    baselinePreserved: false,
    leftoverTestUsers: null,
    errors: [],
  },
};

function recordLatency(metricName, ms) {
  if (!telemetry.latencies[metricName]) telemetry.latencies[metricName] = [];
  telemetry.latencies[metricName].push(ms);
}

function summarizeLatencies() {
  const out = {};
  for (const [k, arr] of Object.entries(telemetry.latencies)) {
    if (!arr.length) continue;
    const sorted = [...arr].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const p = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
    out[k] = {
      count: sorted.length,
      minMs: Math.round(sorted[0]),
      avgMs: Math.round(sum / sorted.length),
      p50Ms: Math.round(p(0.5)),
      p95Ms: Math.round(p(0.95)),
      p99Ms: Math.round(p(0.99)),
      maxMs: Math.round(sorted[sorted.length - 1]),
    };
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isRetryableError(err) {
  const status = err?.status || err?.code;
  const msg = String(err?.message || err || '');
  if (status === 429 || status === 502 || status === 503 || status === 504 || status === 500) return true;
  return /rate limit|too many requests|over_request_rate_limit|fetch failed|econnreset|socket|etimedout|network|gateway|502|503|504/i.test(
    msg
  );
}

// Shared Token-Bucket Pacer for Auth Sign-In (/auth/v1/token rate limit resilience)
const authSignInState = {
  rateLimitedOnce: false,
  nextAllowedAt: 0,
  minIntervalMs: 0,
};

async function paceSignInSlot() {
  while (true) {
    const now = Date.now();
    if (now >= authSignInState.nextAllowedAt) {
      authSignInState.nextAllowedAt = now + authSignInState.minIntervalMs;
      return;
    }
    await sleep(Math.min(5000, authSignInState.nextAllowedAt - now + 25));
  }
}

async function withRetry(label, fn, { maxAttempts = 6, isAuth = false, isTokenEndpoint = false } = {}) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (isTokenEndpoint) await paceSignInSlot();
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts && isRetryableError(err)) {
        if (isAuth) telemetry.phase1.authRetries++;
        if (isTokenEndpoint && /rate limit|too many|429/i.test(String(err?.message || ''))) {
          authSignInState.rateLimitedOnce = true;
          authSignInState.minIntervalMs = 2150; // ~28 req/min steady refill matching GoTrue bucket
          const backoff = Math.min(20000, 2200 * attempt + Math.floor(Math.random() * 500));
          authSignInState.nextAllowedAt = Math.max(authSignInState.nextAllowedAt, Date.now() + backoff);
          await sleep(backoff);
        } else {
          const waitMs = Math.min(18000, 450 * 2 ** (attempt - 1) + Math.floor(Math.random() * 400));
          await sleep(waitMs);
        }
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function timed(metricName, fn, retryOpts = null) {
  const t0 = performance.now();
  try {
    return retryOpts ? await withRetry(metricName, fn, retryOpts) : await fn();
  } finally {
    recordLatency(metricName, performance.now() - t0);
  }
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length || 1) }, () => next());
  await Promise.all(workers);
  return results;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function saveManifest(manifest) {
  ensureDir(OPTS.manifestOut);
  fs.writeFileSync(OPTS.manifestOut, JSON.stringify(manifest, null, 2));
}

async function getTableCounts() {
  const tables = [
    'profiles',
    'captain_profiles',
    'ride_requests',
    'ride_offers',
    'trips_72h_ledger',
    'reviews',
    'rider_ratings',
    'wallet_accounts',
    'wallet_transactions',
    'captain_locations',
    'user_blocks',
    'rider_favorite_captains',
    'captain_favorite_riders',
    'captain_rider_referrals',
    'user_notifications',
  ];
  const counts = {};
  await Promise.all(
    tables.map(async (t) => {
      const { count, error } = await adminClient.from(t).select('*', { count: 'exact', head: true });
      counts[t] = error ? `ERR:${error.message}` : count;
    })
  );
  return counts;
}

// ---------------------------------------------------------------------------
// Phase 3: Surgical Cleanup (Strictly Scoped to Manifest IDs)
// ---------------------------------------------------------------------------
async function deleteInChunks(table, col, ids) {
  if (!ids || ids.length === 0) return;
  const CHUNK = 80;
  const chunks = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    chunks.push(ids.slice(i, i + CHUNK));
  }
  await runPool(chunks, 4, async (slice) => {
    await withRetry(`delete_${table}_${col}`, async () => {
      const { error } = await adminClient.from(table).delete().in(col, slice);
      if (error && !/does not exist/i.test(error.message)) {
        throw new Error(`${table}.${col}: ${error.message}`);
      }
    });
  });
}

async function runCleanup(manifest) {
  const t0 = performance.now();
  console.log('\n====================================================');
  console.log('🧹 PHASE 3: SURGICAL CLEANUP OF TEST DATA ONLY');
  console.log('====================================================');

  const baselineSet = new Set(manifest.baselineProfileIds || []);
  const allUserIds = Array.from(
    new Set([...(manifest.riderIds || []), ...(manifest.captainIds || []), ...(manifest.extraUserIds || [])])
  ).filter((id) => id && !baselineSet.has(id));

  const requestIds = Array.from(new Set(manifest.requestIds || [])).filter(Boolean);

  console.log(`Targeted test users: ${allUserIds.length} | Targeted test requests: ${requestIds.length}`);
  console.log(`Protected baseline real users: ${baselineSet.size}`);

  try {
    // Child rows first in strict FK order
    await deleteInChunks('reviews', 'reviewer_id', allUserIds);
    await deleteInChunks('reviews', 'reviewee_id', allUserIds);
    await deleteInChunks('rider_ratings', 'rider_id', allUserIds);
    if (requestIds.length) {
      await deleteInChunks('reviews', 'trip_id', requestIds);
      await deleteInChunks('rider_ratings', 'request_id', requestIds);
      await deleteInChunks('trips_72h_ledger', 'request_id', requestIds);
      await deleteInChunks('ride_offers', 'request_id', requestIds);
    }
    await deleteInChunks('trips_72h_ledger', 'rider_id', allUserIds);
    await deleteInChunks('trips_72h_ledger', 'captain_id', allUserIds);
    await deleteInChunks('ride_offers', 'captain_id', allUserIds);
    await deleteInChunks('ride_requests', 'id', requestIds);
    await deleteInChunks('ride_requests', 'rider_id', allUserIds);
    await deleteInChunks('user_notifications', 'user_id', allUserIds);
    await deleteInChunks('wallet_transactions', 'profile_id', allUserIds);
    await deleteInChunks('wallet_accounts', 'profile_id', allUserIds);
    await deleteInChunks('captain_locations', 'captain_id', allUserIds);
    await deleteInChunks('user_blocks', 'blocker_id', allUserIds);
    await deleteInChunks('user_blocks', 'blocked_id', allUserIds);
    await deleteInChunks('rider_favorite_captains', 'rider_id', allUserIds);
    await deleteInChunks('rider_favorite_captains', 'captain_id', allUserIds);
    await deleteInChunks('captain_favorite_riders', 'captain_id', allUserIds);
    await deleteInChunks('captain_favorite_riders', 'rider_id', allUserIds);
    await deleteInChunks('captain_rider_referrals', 'rider_id', allUserIds);
    await deleteInChunks('captain_rider_referrals', 'captain_id', allUserIds);
    await deleteInChunks('ad_favorites', 'profile_id', allUserIds);
    await deleteInChunks('captain_profiles', 'id', allUserIds);
    await deleteInChunks('profiles', 'id', allUserIds);

    let deletedAuth = 0;
    let processed = 0;
    await runPool(allUserIds, OPTS.concurrency, async (uid) => {
      try {
        await withRetry(
          'delete_auth_user',
          async () => {
            const { error } = await adminClient.auth.admin.deleteUser(uid);
            if (error && !/not found/i.test(error.message)) throw error;
          },
          { isAuth: true }
        );
        deletedAuth++;
      } catch (e) {
        telemetry.cleanup.errors.push(`auth.deleteUser(${uid}): ${e.message}`);
      }
      processed++;
      if (processed % 200 === 0 || processed === allUserIds.length) {
        console.log(`   Deleted auth users: ${processed}/${allUserIds.length}`);
      }
    });

    telemetry.cleanup.deletedAuthUsers = deletedAuth;
    telemetry.cleanup.executed = true;
  } catch (e) {
    telemetry.cleanup.errors.push(`cleanup fatal: ${e.message}`);
    console.error('❌ Cleanup error:', e.message);
  }

  // Verify DB restoration
  telemetry.cleanup.postCounts = await getTableCounts();
  const { count: remainingTestEmails } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('email', `%@${TEST_EMAIL_DOMAIN}`);
  telemetry.cleanup.leftoverTestUsers = remainingTestEmails ?? -1;

  if (manifest.baselineProfileIds?.length) {
    const { data: baselineCheck } = await adminClient
      .from('profiles')
      .select('id')
      .in('id', manifest.baselineProfileIds);
    telemetry.cleanup.baselinePreserved =
      (baselineCheck?.length || 0) === manifest.baselineProfileIds.length &&
      telemetry.cleanup.postCounts.profiles === manifest.baselineProfileIds.length;
  }

  telemetry.cleanup.durationMs = Math.round(performance.now() - t0);
  console.log(`✅ Cleanup complete in ${(telemetry.cleanup.durationMs / 1000).toFixed(1)}s`);
  console.log(`   Profiles count now: ${telemetry.cleanup.postCounts.profiles} | Baseline preserved: ${telemetry.cleanup.baselinePreserved}`);
}

// ---------------------------------------------------------------------------
// Scenario Planner (Exact 1,000 Trips Breakdown or Scaled Smoke)
// ---------------------------------------------------------------------------
function buildScenarioPlan(totalTrips, totalCaptains) {
  const plan = [];
  if (totalTrips === 1000 && totalCaptains >= 1000) {
    for (let i = 0; i < 300; i++) plan.push({ idx: i, scenario: 'STD_COMPLETED_JO' });
    for (let i = 300; i < 500; i++) plan.push({ idx: i, scenario: 'STD_COMPLETED_EG' });
    for (let i = 500; i < 600; i++) plan.push({ idx: i, scenario: 'MULTI_OFFER_AUCTION' });
    for (let i = 600; i < 700; i++) plan.push({ idx: i, scenario: 'PAX_AND_PREFS' });
    for (let i = 700; i < 780; i++) plan.push({ idx: i, scenario: 'CANCEL_PRE_START' });
    for (let i = 780; i < 850; i++) plan.push({ idx: i, scenario: 'CANCEL_ACTIVE_MUTUAL' });
    for (let i = 850; i < 930; i++) plan.push({ idx: i, scenario: 'GEO_BLOCK_REFERRAL_GUARDS' });
    for (let i = 930; i < 1000; i++) plan.push({ idx: i, scenario: 'ADVERSARIAL_ANTICHEAT_SECURITY' });
    return plan;
  }

  // Scaled distribution for smaller smoke runs
  const cats = [
    'STD_COMPLETED_JO',
    'STD_COMPLETED_EG',
    'MULTI_OFFER_AUCTION',
    'PAX_AND_PREFS',
    'CANCEL_PRE_START',
    'CANCEL_ACTIVE_MUTUAL',
    'GEO_BLOCK_REFERRAL_GUARDS',
    'ADVERSARIAL_ANTICHEAT_SECURITY',
  ];
  for (let i = 0; i < totalTrips; i++) {
    plan.push({ idx: i, scenario: cats[i % cats.length] });
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Phase 1: Create 1,000 Riders & 1,000 Captains with Real Sessions & Setup
// ---------------------------------------------------------------------------
async function createAndAuthUsers(manifest) {
  const t0 = performance.now();
  console.log('\n====================================================');
  console.log(`👥 PHASE 1: CREATING ${OPTS.riders} RIDERS + ${OPTS.captains} CAPTAINS`);
  console.log('====================================================');

  const specialCount = OPTS.captains >= 100 ? 20 : Math.min(4, Math.floor(OPTS.captains / 6));
  const normalCaptainBoundary = OPTS.captains - specialCount;
  telemetry.phase1.specialCaptainsCount = specialCount;

  // Assign rider specs
  const riderSpecs = Array.from({ length: OPTS.riders }, (_, i) => {
    const zone = zoneForUser(i);
    const lat = Number((zone.lat + deterministicJitter(i + 101, 0.014)).toFixed(6));
    const lng = Number((zone.lng + deterministicJitter(i + 202, 0.014)).toFixed(6));
    return {
      idx: i,
      role: 'RIDER',
      email: `st1k_${RUN_ID}_r_${String(i).padStart(4, '0')}@${TEST_EMAIL_DOMAIN}`,
      phone: `+96270${RUN_NUM4}${String(i).padStart(4, '0')}`,
      fullName: `راكب اختبار حمولة رقم${String(i).padStart(4, '0')}`,
      zone,
      lat,
      lng,
      h3: h3.latLngToCell(lat, lng, 9),
      id: null,
      token: null,
      client: null,
    };
  });

  // Assign captain specs (same zone alignment for indices 0..N-1)
  const captainSpecs = Array.from({ length: OPTS.captains }, (_, i) => {
    const zone = zoneForUser(i);
    const lat = Number((zone.lat + deterministicJitter(i + 505, 0.012)).toFixed(6));
    const lng = Number((zone.lng + deterministicJitter(i + 606, 0.012)).toFixed(6));
    const pad4 = String(i).padStart(4, '0');
    const natPrefix = String(90 + (Number(RUN_NUM4) % 9));
    let specialType = null;
    if (i >= normalCaptainBoundary && specialCount > 0) {
      const offset = i - normalCaptainBoundary;
      const bucketSize = Math.max(1, Math.floor(specialCount / 4));
      if (offset < bucketSize) specialType = 'PENDING';
      else if (offset < bucketSize * 2) specialType = 'SUSPENDED';
      else if (offset < bucketSize * 3) specialType = 'BANNED';
      else specialType = 'ZERO_BUNDLE';
    }
    return {
      idx: i,
      role: 'CAPTAIN',
      specialType,
      email: `st1k_${RUN_ID}_c_${pad4}@${TEST_EMAIL_DOMAIN}`,
      phone: `+96271${RUN_NUM4}${pad4}`,
      fullName: `Captain LoadTest Batch${RUN_NUM4} Num${pad4}`,
      nationalId: `${natPrefix}${RUN_NUM4}${pad4}`,
      licenseNum: `LIC-${RUN_ID.toUpperCase()}-${pad4}`,
      plateNum: `TST-${RUN_NUM4}-${pad4}`,
      vehicleBrand: VEHICLE_BRANDS[i % VEHICLE_BRANDS.length],
      vehicleModel: VEHICLE_MODELS[i % VEHICLE_MODELS.length],
      pricingMode: PRICING_MODES[i % PRICING_MODES.length],
      zone,
      lat,
      lng,
      h3: h3.latLngToCell(lat, lng, 9),
      id: null,
      token: null,
      client: null,
    };
  });

  // Step 1A: Auth Create (Riders + Captains)
  const allSpecs = [...riderSpecs, ...captainSpecs];
  let createdProgress = 0;

  await runPool(allSpecs, OPTS.concurrency, async (spec) => {
    const metadata =
      spec.role === 'RIDER'
        ? {
            role: 'RIDER',
            full_name: spec.fullName,
            phone: spec.phone,
            email: spec.email,
            country_id: spec.zone.countryId,
            governorate_id: spec.zone.govId,
            district_id: spec.zone.districts[spec.idx % spec.zone.districts.length],
          }
        : {
            role: 'CAPTAIN',
            full_name: spec.fullName,
            phone: spec.phone,
            email: spec.email,
            country_id: spec.zone.countryId,
            governorate_id: spec.zone.govId,
            district_id: spec.zone.districts[spec.idx % spec.zone.districts.length],
            captain_profile: {
              vehicle_type: spec.idx % 4 === 0 ? 'TAXI' : 'SECTOR_SEDAN',
              vehicle_brand: spec.vehicleBrand,
              vehicle_model: spec.vehicleModel,
              vehicle_color: 'أبيض',
              vehicle_year: 2023,
              plate_number: spec.plateNum,
              employment_type: 'INDEPENDENT',
              affiliation_type: 'INDEPENDENT',
              national_id_number: spec.nationalId,
              license_number: spec.licenseNum,
              verification_status: 'APPROVED',
            },
          };

    try {
      const res = await timed(
        'auth_admin_create_user',
        async () => {
          const { data, error } = await adminClient.auth.admin.createUser({
            email: spec.email,
            phone: spec.phone,
            password: TEST_PASSWORD,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: metadata,
          });
          if (error) throw error;
          return data;
        },
        { maxAttempts: 6, isAuth: true }
      );
      spec.id = res.user.id;
      if (spec.role === 'RIDER') {
        telemetry.phase1.ridersCreated++;
        manifest.riderIds.push(spec.id);
      } else {
        telemetry.phase1.captainsCreated++;
        manifest.captainIds.push(spec.id);
      }
    } catch (e) {
      telemetry.phase1.errors.push(`createUser(${spec.role}#${spec.idx}): ${e.message}`);
    }

    createdProgress++;
    if (createdProgress % 200 === 0 || createdProgress === allSpecs.length) {
      saveManifest(manifest);
      console.log(`   Auth createUser progress: ${createdProgress}/${allSpecs.length} (retries: ${telemetry.phase1.authRetries})`);
    }
  });

  // Step 1B: Auth Sign-In for real per-user JWT sessions
  const createdSpecs = allSpecs.filter((s) => s.id);
  let signInProgress = 0;

  await runPool(createdSpecs, Math.min(OPTS.concurrency, 12), async (spec) => {
    try {
      const data = await timed(
        'auth_sign_in_password',
        async () => {
          const signInClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOpts);
          const { data: sData, error } = await signInClient.auth.signInWithPassword({
            email: spec.email,
            password: TEST_PASSWORD,
          });
          if (error) throw error;
          if (!sData?.session?.access_token) throw new Error('missing_access_token');
          return sData;
        },
        { maxAttempts: 24, isAuth: true, isTokenEndpoint: true }
      );
      spec.token = data.session.access_token;
      spec.client = makeAuthedClient(spec.token);
      if (spec.role === 'RIDER') telemetry.phase1.ridersSignedIn++;
      else telemetry.phase1.captainsSignedIn++;
    } catch (e) {
      telemetry.phase1.errors.push(`signIn(${spec.role}#${spec.idx}): ${e.message}`);
    }
    signInProgress++;
    if (signInProgress % 50 === 0 || signInProgress === createdSpecs.length) {
      console.log(`   Auth signIn progress: ${signInProgress}/${createdSpecs.length} (retries: ${telemetry.phase1.authRetries})`);
    }
  });

  // Step 1C: Batch DB configuration via service_role (tariffs, wallets, special states)
  console.log('   Configuring captain tariffs, wallets, and edge-case statuses...');
  const validRiderIds = riderSpecs.filter((r) => r.id).map((r) => r.id);
  for (let i = 0; i < validRiderIds.length; i += 100) {
    const slice = validRiderIds.slice(i, i + 100);
    await withRetry('setup_rider_active', async () => {
      const { error } = await adminClient.from('profiles').update({ status: 'ACTIVE' }).in('id', slice);
      if (error) throw error;
    });
  }

  const normalCaptains = captainSpecs.filter((c) => c.id && !c.specialType);
  const specialCaptains = captainSpecs.filter((c) => c.id && c.specialType);
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

  // Upsert tariffs & wallet balances in chunks of 100
  for (let i = 0; i < normalCaptains.length; i += 100) {
    const slice = normalCaptains.slice(i, i + 100);
    const cpRows = slice.map((c) => ({
      id: c.id,
      verification_status: 'APPROVED',
      vehicle_type: c.idx % 4 === 0 ? 'TAXI' : 'SECTOR_SEDAN',
      vehicle_brand: c.vehicleBrand,
      vehicle_model: c.vehicleModel,
      vehicle_color: 'أبيض',
      vehicle_year: 2023,
      plate_number: c.plateNum,
      employment_type: 'INDEPENDENT',
      affiliation_type: 'INDEPENDENT',
      pricing_mode: c.pricingMode,
      base_fare: c.zone.countryId === 2 ? 12.0 : 1.0,
      price_per_km: 0.35,
      price_per_min: c.zone.countryId === 2 ? 0.25 : 0.05,
      included_km: 0,
      flag_fall_fee: 0,
    }));
    const wRows = slice.map((c) => ({
      profile_id: c.id,
      balance: c.zone.countryId === 2 ? 200 : 25,
      paid_minutes_remaining: 1200,
      bonus_minutes_remaining: 60,
      time_bundle_expires_at: expiresAt,
      active_package_name: 'باقة اختبار الحمولة',
    }));
    await withRetry('upsert_captain_profiles_batch', async () => {
      const { error } = await adminClient.from('captain_profiles').upsert(cpRows, { onConflict: 'id' });
      if (error) throw error;
    });
    await withRetry('upsert_wallet_batch', async () => {
      const { error } = await adminClient.from('wallet_accounts').upsert(wRows, { onConflict: 'profile_id' });
      if (error) throw error;
    });
  }

  // Configure special edge-case captains
  for (const sc of specialCaptains) {
    // Give special captains a valid location so distance guard doesn't mask status/verification tests
    await adminClient.from('captain_locations').upsert(
      {
        captain_id: sc.id,
        location_lat: sc.lat,
        location_lng: sc.lng,
        h3_cell: sc.h3,
        country_id: sc.zone.countryId,
        is_available: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'captain_id' }
    );
    if (sc.specialType === 'PENDING') {
      await adminClient.from('captain_profiles').update({ verification_status: 'PENDING' }).eq('id', sc.id);
    } else if (sc.specialType === 'SUSPENDED') {
      await adminClient.from('captain_profiles').update({ verification_status: 'APPROVED' }).eq('id', sc.id);
      await adminClient.from('profiles').update({ status: 'SUSPENDED' }).eq('id', sc.id);
    } else if (sc.specialType === 'BANNED') {
      await adminClient.from('captain_profiles').update({ verification_status: 'APPROVED' }).eq('id', sc.id);
      await adminClient.from('profiles').update({ status: 'BANNED' }).eq('id', sc.id);
    } else if (sc.specialType === 'ZERO_BUNDLE') {
      await adminClient.from('captain_profiles').update({ verification_status: 'APPROVED' }).eq('id', sc.id);
      await adminClient
        .from('wallet_accounts')
        .upsert(
          {
            profile_id: sc.id,
            balance: 0,
            paid_minutes_remaining: 0,
            bonus_minutes_remaining: 0,
            time_bundle_expires_at: null,
          },
          { onConflict: 'profile_id' }
        );
    }
  }

  // Step 1D: Captain location pulse & active status via authenticated RPCs
  let actProgress = 0;
  await runPool(normalCaptains.filter((c) => c.client), OPTS.tripConcurrency, async (cap) => {
    try {
      await timed(
        'rpc_pulse_captain_location',
        async () => {
          const { error } = await cap.client.rpc('pulse_captain_location', {
            p_lat: cap.lat,
            p_lng: cap.lng,
            p_h3_cell: cap.h3,
          });
          if (error) throw error;
        },
        { maxAttempts: 4 }
      );
      await timed(
        'rpc_set_captain_status',
        async () => {
          const { error } = await cap.client.rpc('set_captain_status', { p_status: 'active' });
          if (error) throw error;
        },
        { maxAttempts: 4 }
      );
      telemetry.phase1.captainsActivated++;
    } catch (e) {
      telemetry.phase1.errors.push(`activateCaptain(#${cap.idx}): ${e.message}`);
    }
    actProgress++;
    if (actProgress % 250 === 0 || actProgress === normalCaptains.length) {
      console.log(`   Captain radar activation progress: ${actProgress}/${normalCaptains.length}`);
    }
  });

  // Also give special captains initial locations so distance doesn't mask status checks during probes
  await runPool(specialCaptains.filter((c) => c.client), 6, async (cap) => {
    try {
      await cap.client.rpc('pulse_captain_location', {
        p_lat: cap.lat,
        p_lng: cap.lng,
        p_h3_cell: cap.h3,
      });
    } catch {}
  });

  telemetry.phase1.durationMs = Math.round(performance.now() - t0);
  saveManifest(manifest);
  console.log(
    `✅ Phase 1 complete in ${(telemetry.phase1.durationMs / 1000).toFixed(1)}s: ` +
      `${telemetry.phase1.ridersSignedIn}/${OPTS.riders} riders, ` +
      `${telemetry.phase1.captainsSignedIn}/${OPTS.captains} captains (${telemetry.phase1.captainsActivated} active)`
  );
  return { riderSpecs, captainSpecs, normalCaptains, specialCaptains };
}

// ---------------------------------------------------------------------------
// Trip Helper Helpers
// ---------------------------------------------------------------------------
async function detectRadarMode(sampleCap) {
  if (!sampleCap?.client) return 'view';
  const { error } = await sampleCap.client.rpc('get_captain_radar_requests', {
    p_origin_h3: sampleCap.h3 ? [sampleCap.h3] : ['892d5900003ffff'],
  });
  if (error && /could not find|does not exist/i.test(error.message)) {
    return 'view';
  }
  return 'rpc';
}

async function createTripRequestForRider(rider, opts = {}) {
  const destOffsetLat = opts.destOffsetLat ?? 0.032; // ~3.5 km
  const destOffsetLng = opts.destOffsetLng ?? 0.025;
  const destLat = Number((rider.lat + destOffsetLat).toFixed(6));
  const destLng = Number((rider.lng + destOffsetLng).toFixed(6));
  const destH3 = h3.latLngToCell(destLat, destLng, 9);
  const straightKm = haversineKm(rider.lat, rider.lng, destLat, destLng);
  const roadKm = Number((straightKm * 1.32).toFixed(2));
  const durationMin = Math.max(4, Math.round(roadKm * 2.1));

  const fareArgs = {
    lat1: rider.lat,
    lng1: rider.lng,
    lat2: destLat,
    lng2: destLng,
    p_country_id: rider.zone.countryId,
  };
  if (!opts.omitRouteMetrics) {
    fareArgs.p_road_km = roadKm;
    fareArgs.p_minutes = durationMin;
  }

  const serverFare = await timed('rpc_calculate_server_fare', async () => {
    const { data, error } = await rider.client.rpc('calculate_server_fare', fareArgs);
    if (error) throw new Error(`calculate_server_fare: ${error.message}`);
    return Number(data);
  });

  const payload = {
    rider_id: rider.id,
    origin_lat: rider.lat,
    origin_lng: rider.lng,
    origin_address: `نقطة انطلاق ${rider.zone.key} #${rider.idx}`,
    origin_google_maps_url: `https://www.google.com/maps/search/?api=1&query=${rider.lat},${rider.lng}`,
    estimated_distance_km: opts.omitRouteMetrics ? null : roadKm,
    estimated_duration_minutes: opts.omitRouteMetrics ? null : durationMin,
    destination_lat: destLat,
    destination_lng: destLng,
    origin_h3: rider.h3,
    destination_h3: destH3,
    destination_address_ar: `وجهة اختبار ${rider.zone.key} #${rider.idx}`,
    server_estimated_fare: serverFare,
    country_id: rider.zone.countryId,
    status: 'PENDING',
    pricing_preference: opts.pricingPreference ?? 'FREE',
    number_of_riders: opts.numberOfRiders ?? 1,
  };

  const row = await timed('insert_ride_request', async () => {
    const { data, error } = await rider.client
      .from('ride_requests')
      .insert(payload)
      .select('id,status,server_estimated_fare')
      .single();
    if (error) throw new Error(`insert ride_request: ${error.message}`);
    return data;
  });

  return { requestRow: row, serverFare, destLat, destLng, roadKm, durationMin };
}

function findZonePartners(normalCaptains, targetZoneKey, excludeId, count = 2) {
  const sameZone = normalCaptains.filter(
    (c) => c.zone.key === targetZoneKey && c.id !== excludeId && c.client && c.idx < 500
  );
  const pool = sameZone.length >= count ? sameZone : normalCaptains.filter((c) => c.zone.key === targetZoneKey && c.id !== excludeId && c.client);
  return pool.slice(0, count);
}

// ---------------------------------------------------------------------------
// Phase 2: Execute Individual Scenario Trip
// ---------------------------------------------------------------------------
async function executeScenarioTrip(item, ctx) {
  const { idx, scenario } = item;
  const { riderSpecs, captainSpecs, normalCaptains, specialCaptains, radarMode, manifest } = ctx;
  const rider = riderSpecs[idx];
  const primaryCap =
    idx < normalCaptains.length
      ? captainSpecs[idx]
      : normalCaptains[idx % normalCaptains.length];

  if (!rider?.client || !primaryCap?.client) {
    throw new Error(`Missing authenticated client for trip #${idx}`);
  }

  let checks = 0;
  const assertCheck = (cond, msg) => {
    checks++;
    if (!cond) throw new Error(msg);
  };

  // Pick realistic country bias per scenario
  const forceOmitRoute = scenario === 'STD_COMPLETED_EG' && idx % 2 === 1;
  const paxCount = scenario === 'PAX_AND_PREFS' ? (idx % 4) + 1 : 1;
  const pref = scenario === 'PAX_AND_PREFS' ? PRICING_MODES[idx % PRICING_MODES.length] : 'FREE';

  // Ensure zone alignment if primaryCap index was wrapped from fallback
  if (rider.zone.key !== primaryCap.zone.key) {
    // Re-align request origin coords only in local simulation? Better: use partner from rider's zone!
    const sameZoneCap = normalCaptains.find((c) => c.zone.key === rider.zone.key && c.client);
    if (sameZoneCap) {
      return executeScenarioTripWithCap(item, rider, sameZoneCap, ctx, { forceOmitRoute, paxCount, pref });
    }
  }
  return executeScenarioTripWithCap(item, rider, primaryCap, ctx, { forceOmitRoute, paxCount, pref });
}

async function executeScenarioTripWithCap(item, rider, cap, ctx, params) {
  const { idx, scenario } = item;
  const { normalCaptains, specialCaptains, riderSpecs, radarMode, manifest } = ctx;
  const { forceOmitRoute, paxCount, pref } = params;

  let localChecks = 0;
  const passCheck = () => {
    localChecks++;
    telemetry.phase2.checksPassed++;
  };

  // 1. Create Ride Request
  const { requestRow, serverFare } = await createTripRequestForRider(rider, {
    omitRouteMetrics: forceOmitRoute,
    numberOfRiders: paxCount,
    pricingPreference: pref,
  });
  const reqId = requestRow.id;
  manifest.requestIds.push(reqId);
  passCheck();

  // Check Captain Radar Privacy & Visibility on subset to avoid heavy redundant view scans while proving contract
  if (idx % 10 === 0 || scenario === 'PAX_AND_PREFS') {
    await timed('captain_radar_lookup', async () => {
      const query =
        radarMode === 'rpc'
          ? cap.client.rpc('get_captain_radar_requests', { p_request_ids: [reqId] })
          : cap.client.from('captain_radar_requests').select('id,origin_lat,origin_lng,status,number_of_riders').eq('id', reqId);
      const { data, error } = await query;
      if (error) throw new Error(`radar lookup: ${error.message}`);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error(`radar did not expose pending req ${reqId}`);
      if (row.origin_lat !== null || row.origin_lng !== null) {
        throw new Error(`privacy breach: origin coordinates exposed before acceptance`);
      }
      if (scenario === 'PAX_AND_PREFS' && Number(row.number_of_riders || 1) !== paxCount) {
        throw new Error(`number_of_riders mismatch on radar: got ${row.number_of_riders}, expected ${paxCount}`);
      }
    });
    passCheck();
  }

  // -------------------------------------------------------------------------
  // Scenario Branching
  // -------------------------------------------------------------------------

  // A) STD_COMPLETED_JO & STD_COMPLETED_EG
  if (scenario === 'STD_COMPLETED_JO' || scenario === 'STD_COMPLETED_EG') {
    const quote = await timed('rpc_captain_offer_quote', async () => {
      const { data, error } = await cap.client.rpc('captain_offer_quote', { p_request_id: reqId });
      if (error) throw new Error(`captain_offer_quote: ${error.message}`);
      return data;
    });
    const offerPrice = Number((quote?.suggestedFare || serverFare).toFixed(2));
    passCheck();

    const offer = await timed('rpc_submit_ride_offer', async () => {
      const { data, error } = await cap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: offerPrice,
        p_wait_seconds: 90,
        p_pricing_mode: cap.pricingMode,
      });
      if (error) throw new Error(`submit_ride_offer: ${error.message}`);
      return data;
    });
    passCheck();

    const bids = await timed('rpc_get_passenger_bids', async () => {
      const { data, error } = await rider.client.rpc('get_passenger_bids', { p_request_id: reqId });
      if (error) throw new Error(`get_passenger_bids: ${error.message}`);
      return data || [];
    });
    if (!bids.some((b) => b.id === offer.id)) {
      throw new Error(`Submitted offer ${offer.id} missing from get_passenger_bids`);
    }
    passCheck();

    await timed('rpc_accept_ride_offer', async () => {
      const { error } = await rider.client.rpc('accept_ride_offer', {
        p_request_id: reqId,
        p_offer_id: offer.id,
      });
      if (error) throw new Error(`accept_ride_offer: ${error.message}`);
    });
    passCheck();

    await timed('rpc_captain_arrived', async () => {
      const { error } = await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
      if (error) throw new Error(`captain_arrived_to_pickup: ${error.message}`);
    });
    passCheck();

    await timed('rpc_start_ride_trip', async () => {
      const { error } = await cap.client.rpc('start_ride_trip', { p_request_id: reqId });
      if (error) throw new Error(`start_ride_trip: ${error.message}`);
    });
    passCheck();

    // Every 4th completed trip: test real elapsed minute billing + idempotent completion + reviews
    const isWalletAuditSample = idx % 4 === 0;
    let walletBefore = null;
    if (isWalletAuditSample) {
      const { data: wb } = await adminClient
        .from('wallet_accounts')
        .select('balance,paid_minutes_remaining,bonus_minutes_remaining')
        .eq('profile_id', cap.id)
        .single();
      walletBefore = wb;
      const elapsedSimMin = 7 + (idx % 12);
      const backdatedStart = new Date(Date.now() - elapsedSimMin * 60000).toISOString();
      await adminClient.from('ride_requests').update({ started_at: backdatedStart }).eq('id', reqId);
    }

    const cmpRes = await timed('rpc_complete_ride_trip', async () => {
      const { data, error } = await cap.client.rpc('complete_ride_trip', { p_request_id: reqId });
      if (error) throw new Error(`complete_ride_trip: ${error.message}`);
      return data;
    });
    if (cmpRes?.status !== 'COMPLETED') throw new Error(`Expected COMPLETED status, got ${cmpRes?.status}`);
    passCheck();

    if (isWalletAuditSample) {
      // Idempotent duplicate tap check by rider
      const { data: dupCmp, error: dupErr } = await rider.client.rpc('complete_ride_trip', { p_request_id: reqId });
      if (dupErr || !dupCmp?.already_completed) {
        throw new Error(`Idempotent complete_ride_trip failed: ${dupErr?.message || JSON.stringify(dupCmp)}`);
      }
      telemetry.walletAudit.completedSampleChecked++;
      const { data: rrAfter } = await adminClient
        .from('ride_requests')
        .select('wallet_minutes_charged')
        .eq('id', reqId)
        .single();
      const charged = Number(rrAfter?.wallet_minutes_charged || 0);
      if (charged > 0) {
        telemetry.walletAudit.completedChargedCount++;
        telemetry.walletAudit.completedTotalMinutesCharged += charged;
        const { data: wt } = await adminClient
          .from('wallet_transactions')
          .select('id,amount,type')
          .eq('profile_id', cap.id)
          .eq('type', 'trip_time')
          .contains('metadata', { requestId: reqId });
        if (wt?.length > 0) telemetry.walletAudit.completedTransactionsVerified++;
      } else {
        telemetry.walletAudit.anomalies.push(`Trip ${reqId} completed with backdated started_at had wallet_minutes_charged=${charged}`);
      }
      if (walletBefore) {
        // sanity: ledger entry exists
        const { data: ledgerRow } = await adminClient
          .from('trips_72h_ledger')
          .select('id,status')
          .eq('request_id', reqId)
          .maybeSingle();
        if (!ledgerRow) telemetry.walletAudit.anomalies.push(`Missing trips_72h_ledger row for ${reqId}`);
      }
      passCheck();
    }

    // Post-trip mutual reviews on sample of completed trips (20%)
    if (idx % 5 === 0) {
      await timed('insert_review_rider', async () => {
        const { error } = await rider.client.from('reviews').insert({
          trip_id: reqId,
          reviewer_id: rider.id,
          reviewee_id: cap.id,
          detailed_stars: {
            captain: { politeness: 1, honesty: 1, route: 1, punctuality: 1, safety: 1 },
            vehicle: { cleanliness: 1, ac: 1, comfort: 1, quietness: 1, readiness: 1 },
          },
          comment: `تقييم اختباري للرحلة ${idx}`,
          gave_heart: idx % 10 === 0,
        });
        if (error) throw new Error(`rider review insert: ${error.message}`);
      });
      await timed('insert_review_captain', async () => {
        const { error } = await cap.client.from('reviews').insert({
          trip_id: reqId,
          reviewer_id: cap.id,
          reviewee_id: rider.id,
          detailed_stars: {
            rider: { punctuality: 1, respect: 1, cleanliness: 1, clarity: 1, compliance: 1 },
          },
          comment: `تقييم الراكب للرحلة ${idx}`,
        });
        if (error) throw new Error(`captain review insert: ${error.message}`);
      });
      passCheck();
    }
    return localChecks;
  }

  // B) MULTI_OFFER_AUCTION (3 competing captains + favorite priority + rejection of losers)
  if (scenario === 'MULTI_OFFER_AUCTION') {
    const partners = findZonePartners(normalCaptains, rider.zone.key, cap.id, 2);
    const lowCap = partners[0] || cap;
    const highFavCap = partners[1] || cap;
    const useFav = idx % 2 === 0 && highFavCap.id !== cap.id;

    if (useFav) {
      const { error: favErr } = await rider.client
        .from('rider_favorite_captains')
        .upsert(
          { rider_id: rider.id, captain_id: highFavCap.id },
          { onConflict: 'rider_id,captain_id', ignoreDuplicates: true }
        );
      if (favErr) throw new Error(`rider_favorite_captains upsert: ${favErr.message}`);
    }

    // 1) Advisory below-floor offer (12% below marketFare -> allowed with isBelowFloor: true)
    const belowFloorPrice = Number(Math.max(0.5, serverFare * 0.88).toFixed(2));
    const offLow = await timed('rpc_submit_ride_offer', async () => {
      const { data, error } = await lowCap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: belowFloorPrice,
        p_wait_seconds: 90,
        p_pricing_mode: 'FREE',
      });
      if (error) throw new Error(`below-floor submit_ride_offer: ${error.message}`);
      return data;
    });
    passCheck();

    // 2) Standard market offer from primary captain
    const offMid = await timed('rpc_submit_ride_offer', async () => {
      const { data, error } = await cap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: Number(serverFare.toFixed(2)),
        p_wait_seconds: 90,
        p_pricing_mode: 'APP',
      });
      if (error) throw new Error(`mid submit_ride_offer: ${error.message}`);
      return data;
    });

    // 3) Higher offer from fav captain (still valid)
    let offFav = null;
    if (highFavCap.id !== cap.id && highFavCap.id !== lowCap.id) {
      const { data, error } = await highFavCap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: Number((serverFare * 1.08).toFixed(2)),
        p_wait_seconds: 90,
        p_pricing_mode: 'TAXI',
      });
      if (!error) offFav = data;
    }

    const bids = await timed('rpc_get_passenger_bids', async () => {
      const { data, error } = await rider.client.rpc('get_passenger_bids', { p_request_id: reqId });
      if (error) throw new Error(`get_passenger_bids: ${error.message}`);
      return data || [];
    });

    if (useFav && offFav && bids[0]?.captain_id !== highFavCap.id) {
      throw new Error(`Favorite captain did not sort first in get_passenger_bids`);
    }
    passCheck();

    const winningOffer = offMid;
    await timed('rpc_accept_ride_offer', async () => {
      const { error } = await rider.client.rpc('accept_ride_offer', {
        p_request_id: reqId,
        p_offer_id: winningOffer.id,
      });
      if (error) throw new Error(`accept_ride_offer: ${error.message}`);
    });

    // Verify idempotent accept + losing offer marked REJECTED
    const { data: dupAcc, error: dupAccErr } = await rider.client.rpc('accept_ride_offer', {
      p_request_id: reqId,
      p_offer_id: winningOffer.id,
    });
    if (dupAccErr || dupAcc?.status !== 'ACCEPTED') {
      throw new Error(`accept_ride_offer idempotency failed: ${dupAccErr?.message}`);
    }
    if (offLow.id !== winningOffer.id) {
      const { data: lostRow } = await adminClient.from('ride_offers').select('status').eq('id', offLow.id).single();
      if (lostRow?.status !== 'REJECTED') {
        throw new Error(`Losing offer ${offLow.id} expected REJECTED, got ${lostRow?.status}`);
      }
    }
    passCheck();

    await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
    await cap.client.rpc('start_ride_trip', { p_request_id: reqId });
    const { error: cmpErr } = await cap.client.rpc('complete_ride_trip', { p_request_id: reqId });
    if (cmpErr) throw new Error(`multi-offer complete_ride_trip: ${cmpErr.message}`);
    passCheck();
    return localChecks;
  }

  // C) PAX_AND_PREFS (number_of_riders 1..4 & pricing_preference match sorting)
  if (scenario === 'PAX_AND_PREFS') {
    const partners = findZonePartners(normalCaptains, rider.zone.key, cap.id, 1);
    const otherCap = partners[0];
    const mismatchedMode = PRICING_MODES.find((m) => m !== pref) || 'FREE';

    if (otherCap && otherCap.id !== cap.id) {
      await otherCap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: Number((serverFare * 0.96).toFixed(2)),
        p_wait_seconds: 90,
        p_pricing_mode: mismatchedMode,
      });
    }

    const matchedOffer = await timed('rpc_submit_ride_offer', async () => {
      const { data, error } = await cap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: Number(serverFare.toFixed(2)),
        p_wait_seconds: 90,
        p_pricing_mode: pref,
      });
      if (error) throw new Error(`pax matched submit_ride_offer: ${error.message}`);
      return data;
    });

    const bids = await rider.client.rpc('get_passenger_bids', { p_request_id: reqId });
    if (bids.error) throw new Error(bids.error.message);
    if (otherCap && otherCap.id !== cap.id && bids.data?.[0]?.pricing_mode !== pref) {
      throw new Error(`Pricing preference ${pref} did not sort first (got ${bids.data?.[0]?.pricing_mode})`);
    }
    passCheck();

    await rider.client.rpc('accept_ride_offer', { p_request_id: reqId, p_offer_id: matchedOffer.id });
    await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
    await cap.client.rpc('start_ride_trip', { p_request_id: reqId });
    const { error: cmpErr } = await cap.client.rpc('complete_ride_trip', { p_request_id: reqId });
    if (cmpErr) throw new Error(cmpErr.message);
    passCheck();
    return localChecks;
  }

  // D) CANCEL_PRE_START (Unilateral cancels while PENDING, ACCEPTED, or ARRIVED; plus cancel_ride_offer)
  if (scenario === 'CANCEL_PRE_START') {
    const subVariant = idx % 3;
    const { data: offer, error: offErr } = await cap.client.rpc('submit_ride_offer', {
      p_request_id: reqId,
      p_offer_price: Number(serverFare.toFixed(2)),
      p_wait_seconds: 90,
      p_pricing_mode: cap.pricingMode,
    });
    if (offErr) throw new Error(`cancel_pre_start offer: ${offErr.message}`);

    if (subVariant === 0) {
      // Captain cancels pending offer, then Rider cancels PENDING request
      const { error: cancelOffErr } = await cap.client.rpc('cancel_ride_offer', { p_request_id: reqId });
      if (cancelOffErr) throw new Error(`cancel_ride_offer: ${cancelOffErr.message}`);
      passCheck();

      await timed('rpc_cancel_ride_request', async () => {
        const { error } = await rider.client.rpc('cancel_ride_request', { p_request_id: reqId });
        if (error) throw new Error(`rider PENDING cancel: ${error.message}`);
      });
      passCheck();
    } else if (subVariant === 1) {
      // Rider accepts -> optionally arrived -> Rider unilaterally cancels before start (20261101010000 policy)
      await rider.client.rpc('accept_ride_offer', { p_request_id: reqId, p_offer_id: offer.id });
      if (idx % 2 === 0) await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
      await timed('rpc_cancel_ride_request', async () => {
        const { error } = await rider.client.rpc('cancel_ride_request', { p_request_id: reqId });
        if (error) throw new Error(`rider pre-start cancel: ${error.message}`);
      });
      passCheck();
    } else {
      // Rider accepts -> arrived -> Captain unilaterally cancels before start
      await rider.client.rpc('accept_ride_offer', { p_request_id: reqId, p_offer_id: offer.id });
      await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
      await timed('rpc_captain_cancel_active_trip', async () => {
        const { error } = await cap.client.rpc('captain_cancel_active_trip', { p_request_id: reqId });
        if (error) throw new Error(`captain pre-start cancel: ${error.message}`);
      });
      passCheck();
    }

    const { data: reqCheck } = await adminClient
      .from('ride_requests')
      .select('status,wallet_minutes_charged')
      .eq('id', reqId)
      .single();
    if (reqCheck?.status !== 'CANCELLED' || Number(reqCheck?.wallet_minutes_charged || 0) !== 0) {
      throw new Error(`Pre-start cancel check failed: ${JSON.stringify(reqCheck)}`);
    }
    passCheck();
    return localChecks;
  }

  // E) CANCEL_ACTIVE_MUTUAL (Unilateral blocked on TRIP_ACTIVE -> mutual cancel + elapsed wallet charge)
  if (scenario === 'CANCEL_ACTIVE_MUTUAL') {
    const { data: offer, error: offErr } = await cap.client.rpc('submit_ride_offer', {
      p_request_id: reqId,
      p_offer_price: Number(serverFare.toFixed(2)),
      p_wait_seconds: 90,
      p_pricing_mode: cap.pricingMode,
    });
    if (offErr) throw new Error(offErr.message);

    await rider.client.rpc('accept_ride_offer', { p_request_id: reqId, p_offer_id: offer.id });
    await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
    await cap.client.rpc('start_ride_trip', { p_request_id: reqId });

    // Backdate started_at by 8 minutes so elapsed minute billing fires cleanly
    const backdated = new Date(Date.now() - 8 * 60000).toISOString();
    await adminClient.from('ride_requests').update({ started_at: backdated }).eq('id', reqId);

    // Verify unilateral cancel by RIDER fails
    const { error: rCancelErr } = await rider.client.rpc('cancel_ride_request', { p_request_id: reqId });
    if (!rCancelErr || !/cannot_cancel_active_trip/i.test(rCancelErr.message)) {
      throw new Error(`Expected cannot_cancel_active_trip for rider, got: ${rCancelErr?.message || 'NONE'}`);
    }
    passCheck();

    // Verify unilateral cancel by CAPTAIN fails
    const { error: cCancelErr } = await cap.client.rpc('captain_cancel_active_trip', { p_request_id: reqId });
    if (!cCancelErr || !/cannot_cancel_active_trip/i.test(cCancelErr.message)) {
      throw new Error(`Expected cannot_cancel_active_trip for captain, got: ${cCancelErr?.message || 'NONE'}`);
    }
    passCheck();

    // Mutual handshake + confirmation
    await rider.client.rpc('request_mutual_trip_cancellation', {
      p_request_id: reqId,
      p_role: 'RIDER',
      p_action: 'REQUEST',
    });
    const { data: mutRes, error: mutErr } = await timed('rpc_mutual_cancel', async () =>
      cap.client.rpc('mutual_cancel_ride_request', { p_request_id: reqId })
    );
    if (mutErr || mutRes?.status !== 'CANCELLED') {
      throw new Error(`mutual_cancel_ride_request failed: ${mutErr?.message || JSON.stringify(mutRes)}`);
    }
    passCheck();

    telemetry.walletAudit.activeCancelSampleChecked++;
    const { data: rrAfter } = await adminClient
      .from('ride_requests')
      .select('wallet_minutes_charged')
      .eq('id', reqId)
      .single();
    const charged = Number(rrAfter?.wallet_minutes_charged || 0);
    if (charged > 0) {
      telemetry.walletAudit.activeCancelChargedCount++;
      telemetry.walletAudit.activeCancelTotalMinutesCharged += charged;
    } else {
      telemetry.walletAudit.anomalies.push(
        `Mutual active cancel ${reqId} expected elapsed >0 min charge (20261102180000), got wallet_minutes_charged=${charged}`
      );
    }
    return localChecks;
  }

  // F) GEO_BLOCK_REFERRAL_GUARDS (>9km guard, cross-country, blocks, referrals, coordinates)
  if (scenario === 'GEO_BLOCK_REFERRAL_GUARDS') {
    const mode = idx % 4;
    if (mode === 0) {
      // >9km distance guard: temporarily move THIS trip's primary captain 16.6 km north -> must fail -> move back -> succeed!
      const farLat = Number((cap.lat + 0.15).toFixed(6));
      await cap.client.rpc('pulse_captain_location', {
        p_lat: farLat,
        p_lng: cap.lng,
        p_h3_cell: h3.latLngToCell(farLat, cap.lng, 9),
      });
      const { error: farErr } = await cap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: Number(serverFare.toFixed(2)),
        p_wait_seconds: 90,
        p_pricing_mode: cap.pricingMode,
      });
      if (!farErr || !/captain_too_far_from_pickup/i.test(farErr.message)) {
        throw new Error(`Expected captain_too_far_from_pickup, got: ${farErr?.message || 'NONE'}`);
      }
      // Restore captain coordinate
      await cap.client.rpc('pulse_captain_location', {
        p_lat: cap.lat,
        p_lng: cap.lng,
        p_h3_cell: cap.h3,
      });
      passCheck();
    } else if (mode === 1) {
      // Cross-country guard
      const otherCountry = cap.zone.countryId === 1 ? 2 : 1;
      const otherCap = normalCaptains.find((c) => c.zone.countryId === otherCountry && c.client);
      if (otherCap) {
        const { error: ccErr } = await otherCap.client.rpc('submit_ride_offer', {
          p_request_id: reqId,
          p_offer_price: Number(serverFare.toFixed(2)),
          p_wait_seconds: 90,
          p_pricing_mode: 'FREE',
        });
        if (!ccErr || !/request_outside_captain_country/i.test(ccErr.message)) {
          throw new Error(`Expected request_outside_captain_country, got: ${ccErr?.message || 'NONE'}`);
        }
      }
      passCheck();
    } else if (mode === 2) {
      // Mutual block guard + unblock
      await timed('rpc_block_user', async () => {
        const { error } = await rider.client.rpc('block_user', { p_blocked_id: cap.id });
        if (error) throw new Error(`block_user: ${error.message}`);
      });
      const { error: blkOffErr } = await cap.client.rpc('submit_ride_offer', {
        p_request_id: reqId,
        p_offer_price: Number(serverFare.toFixed(2)),
        p_wait_seconds: 90,
        p_pricing_mode: 'FREE',
      });
      if (!blkOffErr || !/user_block_active/i.test(blkOffErr.message)) {
        throw new Error(`Expected user_block_active while blocked, got: ${blkOffErr?.message || 'NONE'}`);
      }
      await rider.client.rpc('unblock_user', { p_blocked_id: cap.id });
      passCheck();
    } else {
      // Referral claim & lock check + removal
      const partner = findZonePartners(normalCaptains, rider.zone.key, cap.id, 1)[0];
      const { data: claim1, error: c1Err } = await timed('rpc_claim_referral', async () =>
        rider.client.rpc('claim_captain_referral', { p_captain_ref: cap.id })
      );
      if (c1Err || !claim1?.success) {
        throw new Error(`claim_captain_referral failed: ${c1Err?.message || JSON.stringify(claim1)}`);
      }
      if (partner && partner.id !== cap.id) {
        const { data: claim2 } = await rider.client.rpc('claim_captain_referral', { p_captain_ref: partner.id });
        if (claim2?.success !== false || claim2?.error !== 'already_linked_to_other_captain') {
          throw new Error(`Expected referral lock rejection, got: ${JSON.stringify(claim2)}`);
        }
      }
      await rider.client.rpc('remove_captain_referral', {});
      passCheck();
    }

    // Complete trip cleanly after guard checks
    const { data: off, error: offErr } = await cap.client.rpc('submit_ride_offer', {
      p_request_id: reqId,
      p_offer_price: Number(serverFare.toFixed(2)),
      p_wait_seconds: 90,
      p_pricing_mode: cap.pricingMode,
    });
    if (offErr) throw new Error(`geo post-guard offer: ${offErr.message}`);
    await rider.client.rpc('accept_ride_offer', { p_request_id: reqId, p_offer_id: off.id });
    await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
    await cap.client.rpc('start_ride_trip', { p_request_id: reqId });
    await cap.client.rpc('complete_ride_trip', { p_request_id: reqId });
    passCheck();
    return localChecks;
  }

  // G) ADVERSARIAL_ANTICHEAT_SECURITY
  if (scenario === 'ADVERSARIAL_ANTICHEAT_SECURITY') {
    const otherRider = riderSpecs[(idx + 1) % riderSpecs.length];

    // 1) Active request flooding guard (2nd concurrent active request MUST be rejected)
    const { error: floodErr } = await rider.client.from('ride_requests').insert({
      rider_id: rider.id,
      origin_lat: rider.lat,
      origin_lng: rider.lng,
      destination_lat: rider.lat + 0.02,
      destination_lng: rider.lng + 0.02,
      origin_h3: rider.h3,
      destination_h3: h3.latLngToCell(rider.lat + 0.02, rider.lng + 0.02, 9),
      destination_address_ar: 'طلب إغراق مرفوض',
      server_estimated_fare: serverFare,
      country_id: rider.zone.countryId,
      status: 'PENDING',
    });
    if (!floodErr || !/unique_active_rider_request|duplicate key/i.test(floodErr.message)) {
      throw new Error(`Anti-flooding unique_active_rider_request failed: ${floodErr?.message || 'NONE'}`);
    }
    passCheck();

    // 2) Direct status column update bypass attempt by rider
    const { error: directUpdErr } = await rider.client
      .from('ride_requests')
      .update({ status: 'COMPLETED' })
      .eq('id', reqId);
    // Verify row stayed PENDING even if trigger rejected or RLS blocked
    const { data: checkPending } = await adminClient.from('ride_requests').select('status').eq('id', reqId).single();
    if (checkPending?.status !== 'PENDING') {
      throw new Error(`Rider forged status via direct UPDATE without RPC! (${directUpdErr?.message})`);
    }
    passCheck();

    // 3) Check Special Captains (SUSPENDED, BANNED, ZERO_BUNDLE, PENDING) if assigned
    const sc = specialCaptains[idx % Math.max(1, specialCaptains.length)];
    if (sc && sc.client) {
      if (sc.specialType === 'SUSPENDED') {
        const { error } = await sc.client.rpc('set_captain_status', { p_status: 'active' });
        if (!error || !/captain_account_suspended/i.test(error.message)) {
          throw new Error(`Expected captain_account_suspended, got: ${error?.message}`);
        }
      } else if (sc.specialType === 'BANNED') {
        const { error } = await sc.client.rpc('set_captain_status', { p_status: 'active' });
        if (!error || !/captain_account_banned/i.test(error.message)) {
          throw new Error(`Expected captain_account_banned, got: ${error?.message}`);
        }
      } else if (sc.specialType === 'ZERO_BUNDLE') {
        // Per 20261019010000_allow_captain_active_with_zero_balance.sql: zero-balance captains ARE allowed to go active
        const { data: zbRes, error: zbErr } = await sc.client.rpc('set_captain_status', { p_status: 'active' });
        if (zbErr || !zbRes?.has_active_bundle) {
          throw new Error(`Expected zero-balance activation allowed (20261019010000), got: ${zbErr?.message || JSON.stringify(zbRes)}`);
        }
        await sc.client.rpc('set_captain_status', { p_status: 'idle' });
      }
      passCheck();
    }

    // 4) Valid offer + unauthorized hijack attempts on accept/start/complete
    const { data: off, error: offErr } = await cap.client.rpc('submit_ride_offer', {
      p_request_id: reqId,
      p_offer_price: Number(serverFare.toFixed(2)),
      p_wait_seconds: 90,
      p_pricing_mode: cap.pricingMode,
    });
    if (offErr) throw new Error(`adv submit_ride_offer: ${offErr.message}`);

    if (otherRider?.client && otherRider.id !== rider.id) {
      const { error: hijackAcc } = await otherRider.client.rpc('accept_ride_offer', {
        p_request_id: reqId,
        p_offer_id: off.id,
      });
      if (!hijackAcc || !/not_request_owner/i.test(hijackAcc.message)) {
        throw new Error(`Other rider hijack accept should fail with not_request_owner, got: ${hijackAcc?.message}`);
      }
    }
    passCheck();

    await rider.client.rpc('accept_ride_offer', { p_request_id: reqId, p_offer_id: off.id });

    // Captain attempts to start trip BEFORE arrival -> must reject with captain_must_arrive_first
    const { error: skipArrErr } = await cap.client.rpc('start_ride_trip', { p_request_id: reqId });
    if (!skipArrErr || !/captain_must_arrive_first/i.test(skipArrErr.message)) {
      throw new Error(`Expected captain_must_arrive_first, got: ${skipArrErr?.message}`);
    }
    passCheck();

    await cap.client.rpc('captain_arrived_to_pickup', { p_request_id: reqId });
    await cap.client.rpc('start_ride_trip', { p_request_id: reqId });
    await cap.client.rpc('complete_ride_trip', { p_request_id: reqId });

    // Duplicate review prevention
    const { error: rev1 } = await rider.client.from('reviews').insert({
      trip_id: reqId,
      reviewer_id: rider.id,
      reviewee_id: cap.id,
      detailed_stars: { captain: { politeness: 1 } },
      gave_heart: false,
    });
    const { error: rev2 } = await rider.client.from('reviews').insert({
      trip_id: reqId,
      reviewer_id: rider.id,
      reviewee_id: cap.id,
      detailed_stars: { captain: { politeness: 1 } },
      gave_heart: false,
    });
    if (rev1 || !rev2) {
      throw new Error(`Expected 2nd review on same trip to fail, rev1=${rev1?.message} rev2=${rev2?.message}`);
    }
    passCheck();
    return localChecks;
  }

  throw new Error(`Unknown scenario ${scenario}`);
}

// ---------------------------------------------------------------------------
// Live Security & RLS Probe Suite (Reports Exact Live Enforcement State)
// ---------------------------------------------------------------------------
async function runLiveSecurityAudit(riderSpecs, captainSpecs, specialCaptains, manifest) {
  console.log('\n====================================================');
  console.log('🛡️  LIVE RLS & SECURITY AUDIT PROBES');
  console.log('====================================================');

  const r0 = riderSpecs.find((r) => r.client);
  const r1 = riderSpecs.find((r) => r.client && r.id !== r0?.id);
  const c0 = captainSpecs.find((c) => c.client && !c.specialType);
  const bannedCap = specialCaptains.find((c) => c.specialType === 'BANNED' && c.client);
  const pendingCap = specialCaptains.find((c) => c.specialType === 'PENDING' && c.client);

  const probes = [];
  async function probe(name, checkFn) {
    try {
      const outcome = await checkFn();
      probes.push({ name, ...outcome });
      console.log(`   [${outcome.secure ? 'SECURE ✅' : 'EXPOSED ⚠️'}] ${name}: ${outcome.detail}`);
    } catch (e) {
      probes.push({ name, secure: false, detail: `probe error: ${e.message}` });
      console.log(`   [ERROR ❌] ${name}: ${e.message}`);
    }
  }

  // 1. Anon read of profiles (fresh pure anon client with zero auth session)
  const pureAnonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOpts);
  await probe('Anon SELECT public.profiles', async () => {
    const { data, error } = await pureAnonClient.from('profiles').select('id,phone,email,role').limit(2);
    const exposed = !error && Array.isArray(data) && data.length > 0;
    return {
      secure: !exposed,
      detail: exposed
        ? `anon read returned ${data.length} row(s) with PII columns`
        : `blocked (${error?.message || '0 rows'})`,
    };
  });

  // 2. Anon read of captains_data / referrals / wallet_accounts / ride_requests
  for (const tbl of ['captains_data', 'referrals', 'wallet_accounts', 'ride_requests']) {
    await probe(`Anon SELECT public.${tbl}`, async () => {
      const { data, error } = await pureAnonClient.from(tbl).select('*').limit(1);
      const exposed = !error && Array.isArray(data) && data.length > 0;
      return {
        secure: !exposed,
        detail: error ? `blocked (${error.message})` : `returned ${data?.length || 0} row(s)`,
      };
    });
  }

  // 3. Cross-user profiles PII read (Rider 0 reading Rider 1 phone/email)
  if (r0 && r1) {
    await probe('Authenticated Rider reading OTHER Rider phone/email in profiles', async () => {
      const { data, error } = await r0.client.from('profiles').select('id,phone,email').eq('id', r1.id).maybeSingle();
      const exposed = !error && data && Boolean(data.phone || data.email);
      return {
        secure: !exposed,
        detail: exposed ? `cross-user PII readable directly (phone/email exposed)` : `blocked (${error?.message || 'null'})`,
      };
    });
  }

  // 4. Check hardened RPC get_captain_radar_requests existence
  if (c0) {
    await probe('Hardened RPC get_captain_radar_requests deployed', async () => {
      const { error } = await c0.client.rpc('get_captain_radar_requests', {
        p_origin_h3: c0.h3 ? [c0.h3] : ['892d5900003ffff'],
      });
      const deployed = !error || !/could not find|does not exist/i.test(error.message);
      return {
        secure: deployed,
        detail: deployed ? 'RPC deployed and callable' : `missing from live schema (${error.message})`,
      };
    });
  }

  // 5. Role & Tier self-escalation via UPDATE profiles
  if (r0) {
    await probe('Rider self-escalation UPDATE profiles SET role=ADMIN', async () => {
      const { error } = await r0.client.from('profiles').update({ role: 'ADMIN' }).eq('id', r0.id);
      const { data } = await adminClient.from('profiles').select('role').eq('id', r0.id).single();
      const escalated = data?.role === 'ADMIN';
      if (escalated) await adminClient.from('profiles').update({ role: 'RIDER' }).eq('id', r0.id);
      return {
        secure: !escalated,
        detail: escalated ? 'CRITICAL: role modified via client UPDATE' : `blocked (${error?.message || 'role stayed ' + data?.role})`,
      };
    });
  }

  // 6. Captain self-approval via captain_profiles
  if (pendingCap) {
    await probe('Pending Captain self-approval verification_status=APPROVED', async () => {
      const { error } = await pendingCap.client
        .from('captain_profiles')
        .update({ verification_status: 'APPROVED' })
        .eq('id', pendingCap.id);
      const { data } = await adminClient.from('captain_profiles').select('verification_status').eq('id', pendingCap.id).single();
      const escalated = data?.verification_status === 'APPROVED';
      if (escalated) await adminClient.from('captain_profiles').update({ verification_status: 'PENDING' }).eq('id', pendingCap.id);
      return {
        secure: !escalated,
        detail: escalated ? 'verification_status changed by owner UPDATE (20261110120000 needed)' : `blocked (${error?.message || 'stayed PENDING'})`,
      };
    });
  }

  // 7. Banned captain submitting ride offer
  if (bannedCap && r0) {
    await probe('BANNED Captain blocked from submit_ride_offer', async () => {
      // Quick ephemeral check against a cancelled-after request? Wait: check existing or create + cancel
      const { data: probeReq } = await adminClient
        .from('ride_requests')
        .insert({
          rider_id: r0.id,
          origin_lat: bannedCap.lat,
          origin_lng: bannedCap.lng,
          destination_lat: bannedCap.lat + 0.02,
          destination_lng: bannedCap.lng + 0.02,
          origin_h3: bannedCap.h3,
          destination_h3: h3.latLngToCell(bannedCap.lat + 0.02, bannedCap.lng + 0.02, 9),
          destination_address_ar: 'فحص حظر كابتن',
          server_estimated_fare: 2.0,
          country_id: bannedCap.zone.countryId,
          status: 'PENDING',
        })
        .select('id')
        .single();
      let detail = 'could not create probe request';
      let secure = false;
      if (probeReq?.id) {
        manifest.requestIds.push(probeReq.id);
        const { error: offErr } = await bannedCap.client.rpc('submit_ride_offer', {
          p_request_id: probeReq.id,
          p_offer_price: 2.0,
          p_wait_seconds: 90,
          p_pricing_mode: 'FREE',
        });
        secure = Boolean(offErr && /banned|suspended|status|restricted/i.test(offErr.message));
        detail = offErr ? `rejected (${offErr.message})` : 'ALLOWED: BANNED captain submitted offer! (20261110120000 needed)';
        await adminClient.from('ride_requests').update({ status: 'CANCELLED' }).eq('id', probeReq.id);
      }
      return { secure, detail };
    });
  }

  // 8. ADMIN role spoofing via handle_new_user metadata
  await probe('Signup trigger metadata role=ADMIN escalation blocked', async () => {
    const spoofEmail = `st1k_${RUN_ID}_spoof@${TEST_EMAIL_DOMAIN}`;
    const spoofPhone = `+96279${RUN_NUM4}9999`;
    const { data: suData, error: suErr } = await adminClient.auth.admin.createUser({
      email: spoofEmail,
      phone: spoofPhone,
      password: TEST_PASSWORD,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { role: 'ADMIN', full_name: 'Spoof Admin Test', phone: spoofPhone, email: spoofEmail },
    });
    let secure = true;
    let detail = suErr ? `createUser error (${suErr.message})` : 'downgraded safely';
    if (suData?.user?.id) {
      manifest.extraUserIds.push(suData.user.id);
      saveManifest(manifest);
      const { data: prof } = await adminClient.from('profiles').select('role').eq('id', suData.user.id).maybeSingle();
      if (prof?.role === 'ADMIN') {
        secure = false;
        detail = 'CRITICAL: signup metadata self-assigned role=ADMIN (20261110120000 needed)';
      } else {
        detail = `assigned role=${prof?.role || 'N/A'}`;
      }
    } else if (suErr) {
      secure = false;
    }
    return { secure, detail };
  });

  // 9. Saudi territorial coordinate rejection probe
  if (c0) {
    await probe('pulse_captain_location blocks out-of-territory Saudi coordinates (24.7136, 46.6753)', async () => {
      const { error } = await c0.client.rpc('pulse_captain_location', {
        p_lat: 24.7136,
        p_lng: 46.6753,
        p_h3_cell: h3.latLngToCell(24.7136, 46.6753, 9),
      });
      // Restore immediately
      await c0.client.rpc('pulse_captain_location', { p_lat: c0.lat, p_lng: c0.lng, p_h3_cell: c0.h3 });
      const blocked = Boolean(error);
      return {
        secure: blocked,
        detail: blocked ? `blocked (${error.message})` : 'accepted Riyadh coordinates on RPC (client-only guard currently)',
      };
    });
  }

  // 10. Client blocked from injecting admin_message notification & fake review without trip
  if (r0 && c0) {
    await probe('Client blocked from forging admin_message notification', async () => {
      const { error } = await r0.client.from('user_notifications').insert({
        id: `notif_admin_${RUN_ID}`,
        user_id: r0.id,
        title: 'Fake Admin',
        description: 'forged',
        type: 'admin_message',
      });
      return {
        secure: Boolean(error),
        detail: error ? `blocked (${error.message})` : 'EXPOSED: client inserted forged admin notification',
      };
    });

    await probe('Client blocked from inserting fake review without completed trip', async () => {
      const { error } = await r0.client.from('reviews').insert({
        trip_id: '00000000-0000-4000-8000-000000000999',
        reviewer_id: r0.id,
        reviewee_id: c0.id,
        detailed_stars: { captain: { politeness: 1 } },
      });
      return {
        secure: Boolean(error),
        detail: error ? `blocked (${error.message})` : 'EXPOSED: review inserted without completed trip',
      };
    });
  }

  telemetry.securityAudit = probes;
}

// ---------------------------------------------------------------------------
// Main Execution
// ---------------------------------------------------------------------------
async function main() {
  if (OPTS.cleanupOnly) {
    if (!fs.existsSync(OPTS.cleanupOnly)) {
      console.error(`❌ Manifest not found: ${OPTS.cleanupOnly}`);
      process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(OPTS.cleanupOnly, 'utf8'));
    await runCleanup(manifest);
    return;
  }

  console.log('====================================================');
  console.log(`🚀 SMART RADAR FULL E2E LOAD TEST (${RUN_ID})`);
  console.log(`   Riders: ${OPTS.riders} | Captains: ${OPTS.captains} | Trips: ${OPTS.trips}`);
  console.log(`   Concurrency: Auth=${OPTS.concurrency}, Trips=${OPTS.tripConcurrency} | Cleanup=${!OPTS.keep}`);
  console.log('====================================================');

  // Pre-flight baseline snapshot
  const { data: existingProfiles, error: baseErr } = await adminClient.from('profiles').select('id');
  if (baseErr) throw new Error(`Failed reading baseline profiles: ${baseErr.message}`);

  const baselineCounts = await getTableCounts();
  telemetry.baseline = baselineCounts;

  const manifest = {
    runId: RUN_ID,
    createdAt: new Date().toISOString(),
    baselineProfileIds: (existingProfiles || []).map((p) => p.id),
    riderIds: [],
    captainIds: [],
    extraUserIds: [],
    requestIds: [],
  };
  saveManifest(manifest);
  console.log(`🔒 Baseline snapshot captured: ${manifest.baselineProfileIds.length} existing profiles protected.`);

  let setupData = null;
  try {
    // Phase 1
    setupData = await createAndAuthUsers(manifest);
    const { riderSpecs, captainSpecs, normalCaptains, specialCaptains } = setupData;

    const sampleCap = normalCaptains.find((c) => c.client);
    const radarMode = await detectRadarMode(sampleCap);
    console.log(`📡 Detected live captain radar mode: ${radarMode === 'rpc' ? 'get_captain_radar_requests() RPC' : 'captain_radar_requests VIEW'}`);

    // Phase 2
    console.log('\n====================================================');
    console.log(`🚗 PHASE 2: EXECUTING ${OPTS.trips} DIVERSE REAL TRIPS`);
    console.log('====================================================');
    const t2Start = performance.now();
    const plan = buildScenarioPlan(OPTS.trips, OPTS.captains);

    for (const item of plan) {
      if (!telemetry.phase2.scenarios[item.scenario]) {
        telemetry.phase2.scenarios[item.scenario] = {
          planned: 0,
          passed: 0,
          failed: 0,
          checksPassed: 0,
          errors: {},
          durationsMs: [],
        };
      }
      telemetry.phase2.scenarios[item.scenario].planned++;
    }

    let tripsDone = 0;
    await runPool(plan, OPTS.tripConcurrency, async (item) => {
      const scStat = telemetry.phase2.scenarios[item.scenario];
      const tTrip = performance.now();
      try {
        const checks = await executeScenarioTrip(item, {
          riderSpecs,
          captainSpecs,
          normalCaptains,
          specialCaptains,
          radarMode,
          manifest,
        });
        telemetry.phase2.tripsPassed++;
        scStat.passed++;
        scStat.checksPassed += checks;
      } catch (e) {
        telemetry.phase2.tripsFailed++;
        telemetry.phase2.checksFailed++;
        scStat.failed++;
        const msg = String(e.message || e).slice(0, 140);
        scStat.errors[msg] = (scStat.errors[msg] || 0) + 1;
        if (telemetry.phase2.failedTripDetails.length < 30) {
          telemetry.phase2.failedTripDetails.push({
            tripIdx: item.idx,
            scenario: item.scenario,
            error: e.message,
          });
        }
      } finally {
        scStat.durationsMs.push(performance.now() - tTrip);
      }

      tripsDone++;
      if (tripsDone % 100 === 0 || tripsDone === plan.length) {
        saveManifest(manifest);
        console.log(
          `   Trips progress: ${tripsDone}/${plan.length} | Passed: ${telemetry.phase2.tripsPassed} | Failed: ${telemetry.phase2.tripsFailed}`
        );
      }
    });

    telemetry.phase2.durationMs = Math.round(performance.now() - t2Start);
    console.log(
      `✅ Phase 2 complete in ${(telemetry.phase2.durationMs / 1000).toFixed(1)}s: ` +
        `${telemetry.phase2.tripsPassed}/${OPTS.trips} trips passed (${telemetry.phase2.checksPassed} assertions passed)`
    );

    // Peak DB Snapshot before cleanup
    telemetry.dbPeakCounts = await getTableCounts();

    // Live Security & RLS Probes
    await runLiveSecurityAudit(riderSpecs, captainSpecs, specialCaptains, manifest);
  } finally {
    // Summarize scenario durations cleanly before saving JSON
    for (const sc of Object.values(telemetry.phase2.scenarios)) {
      const ds = [...sc.durationsMs].sort((a, b) => a - b);
      sc.avgTripMs = ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : 0;
      sc.p95TripMs = ds.length ? Math.round(ds[Math.min(ds.length - 1, Math.max(0, Math.ceil(0.95 * ds.length) - 1))]) : 0;
      delete sc.durationsMs;
    }

    if (!OPTS.keep) {
      await runCleanup(manifest);
    } else {
      console.log(`\n⏭️  Skipping cleanup (--keep). Manifest saved at: ${OPTS.manifestOut}`);
    }

    telemetry.finishedAt = new Date().toISOString();
    telemetry.latencySummary = summarizeLatencies();
    delete telemetry.latencies;

    ensureDir(OPTS.reportOut);
    fs.writeFileSync(OPTS.reportOut, JSON.stringify(telemetry, null, 2));
    console.log(`\n📄 Telemetry report written to: ${OPTS.reportOut}`);
  }
}

main().catch((err) => {
  console.error('💥 Fatal stress test error:', err);
  process.exit(1);
});
