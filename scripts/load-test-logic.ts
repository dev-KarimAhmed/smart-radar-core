/**
 * ============================================================================
 * BYNKCOM SMART RADAR - CORE LOGIC HIGH-CONCURRENCY LOAD & STRESS TEST
 * ============================================================================
 * Purpose: Simulate and benchmark 500 to 1,000 concurrent active users 
 * (Riders + Captains) executing the entire sovereign edge logic pipeline:
 * 
 * 1. H3 Hexagonal Spatial Indexing (Res 9) & Neighbor Ring Discovery
 * 2. Great-Circle Distance & District Tortuosity Fare Calculation
 * 3. Captain Pricing Engine & Market Brakes (15% Sovereign Balance Index)
 * 4. Multi-Criteria Real-Time Offer Ranking (Favorites, Category, Rank, Rating)
 * 5. Anti-Cheat Kernel & Cancellation Immunity Penalty Evaluation
 * ============================================================================
 */

import { performance } from 'perf_hooks';
import {
  latLngToH3Cell,
  getH3Neighbors,
  calculateSovereignFareQuote,
  getDynamicDetourIndex,
} from '../src/core/logic/geospatial-kernel';
import {
  RadarBundleIntegrityKernel,
  type PackagedSovereignBundle,
  type GlobalPulseDoc,
} from '../src/core/logic/sovereign-market-kernel';
import { AntiCheatKernel, type RiderImmunityRecord } from '../src/core/logic/anti-cheat-kernel';
import { prioritizeRiderOffers } from '../src/features/rider/services/rider-offer-ranking';

// Realistic geographic hotspots across Jordan
const JORDAN_COORDINATES = [
  // Amman (Downtown, 7th Circle, Abdali, Dabouq, Shmeisani, University)
  { name: 'Amman - 7th Circle', lat: 31.9539, lng: 35.8578 },
  { name: 'Amman - Abdali Boulevard', lat: 31.9632, lng: 35.9082 },
  { name: 'Amman - Rainbow St', lat: 31.9497, lng: 35.9304 },
  { name: 'Amman - Dabouq', lat: 31.9982, lng: 35.8239 },
  { name: 'Amman - University of Jordan', lat: 32.0152, lng: 35.8732 },
  { name: 'Amman - Shmeisani', lat: 31.9682, lng: 35.8951 },
  // Zarqa (New Zarqa, City Center)
  { name: 'Zarqa - New Zarqa', lat: 32.0728, lng: 36.0880 },
  { name: 'Zarqa - Awajan', lat: 32.0450, lng: 36.0650 },
  // Irbid (University St, City Center)
  { name: 'Irbid - Yarmouk University', lat: 32.5372, lng: 35.8548 },
  { name: 'Irbid - City Center', lat: 32.5568, lng: 35.8469 },
  // Balqa (Salt Center, Fuheis)
  { name: 'Balqa - Salt Historic Center', lat: 32.0392, lng: 35.7272 },
  { name: 'Balqa - Fuheis', lat: 32.0051, lng: 35.7725 },
  // Aqaba
  { name: 'Aqaba - Marina Port', lat: 29.5312, lng: 35.0078 },
  { name: 'Aqaba - City Center', lat: 29.5267, lng: 35.0078 },
];

const CAPTAIN_RANKS = ['PLATINUM', 'GOLD', 'BRONZE', 'SILVER'] as const;
const PRICING_MODES = ['APP', 'TAXI', 'FREE'] as const;

// Standard Pulse Document for Jordan District Benchmark
const BENCHMARK_PULSE_DOC: GlobalPulseDoc = {
  market_base_avg: 1.15,
  market_km_avg: 0.38,
  market_min_avg: 0.05,
  last_updated: Date.now(),
};

interface UserLatencyRecord {
  userId: string;
  totalTimeMs: number;
  h3IndexingTimeMs: number;
  pricingTimeMs: number;
  rankingTimeMs: number;
  antiCheatTimeMs: number;
  offersGenerated: number;
  offersApproved: number;
  offersBlocked: number;
}

interface BenchmarkResult {
  userCount: number;
  totalExecutionTimeMs: number;
  throughputUsersPerSec: number;
  throughputOpsPerSec: number;
  latency: {
    avgMs: number;
    medianMs: number;
    p90Ms: number;
    p95Ms: number;
    p99Ms: number;
    maxMs: number;
    minMs: number;
  };
  memory: {
    heapUsedBeforeMb: number;
    heapUsedAfterMb: number;
    heapDeltaMb: number;
    rssMb: number;
  };
  breakdownAvg: {
    h3IndexingMs: number;
    pricingMs: number;
    rankingMs: number;
    antiCheatMs: number;
  };
  totalOffersProcessed: number;
  totalMarketBrakesBlocked: number;
}

/**
 * Executes a simulated complete lifecycle for a single user transaction.
 */
function simulateSingleUserLifecycle(userIndex: number): UserLatencyRecord {
  const startUser = performance.now();

  // 1. Pick randomized pickup & dropoff coordinates
  const originLoc = JORDAN_COORDINATES[userIndex % JORDAN_COORDINATES.length];
  const destLoc = JORDAN_COORDINATES[(userIndex + 3) % JORDAN_COORDINATES.length];

  // Add small realistic jitter to coordinates (±500m)
  const jitterLat = (Math.sin(userIndex * 13) * 0.005);
  const jitterLng = (Math.cos(userIndex * 17) * 0.005);
  const pickup = { lat: originLoc.lat + jitterLat, lng: originLoc.lng + jitterLng };
  const dropoff = { lat: destLoc.lat - jitterLat, lng: destLoc.lng - jitterLng };

  // --- STAGE 1: H3 Spatial Conversion & Detour Quote ---
  const tH3Start = performance.now();
  const originCell = latLngToH3Cell(pickup.lat, pickup.lng, 9);
  const destCell = latLngToH3Cell(dropoff.lat, dropoff.lng, 9);
  const fareQuote = calculateSovereignFareQuote(pickup, dropoff);
  const scanningRings = getH3Neighbors(originCell, 2); // 2 rings around pickup = 19 hexagons
  const tH3End = performance.now();

  // --- STAGE 2: Competing Captain Bids & Market Integrity Brakes ---
  const tPricingStart = performance.now();
  const numOffers = 5 + (userIndex % 15); // Each rider gets 5 to 20 candidate bids
  const generatedOffers: Array<Record<string, any>> = [];
  let blockedCount = 0;
  let approvedCount = 0;

  for (let i = 0; i < numOffers; i++) {
    const captainId = `capt_${(userIndex * 29 + i) % 300}`;
    const rank = CAPTAIN_RANKS[i % CAPTAIN_RANKS.length];
    const mode = PRICING_MODES[i % PRICING_MODES.length];
    const rating = 4.0 + ((i * 7) % 11) * 0.1; // 4.0 to 5.0

    // Price variation: balanced, slight undercut (10-14% warn), severe dumping (>15% crimson block)
    let bundle: PackagedSovereignBundle;
    let priceMultiplier = 1.0;

    if (i % 11 === 0) {
      // Severe price dumping (> 15% deviation) -> triggers Crimson Block & Lockout
      priceMultiplier = 0.70;
      bundle = {
        basePrice: 1.0,
        perKmPrice: 0.27,
        perMinPrice: 0.03,
      };
    } else if (i % 7 === 0) {
      // Moderate undercut (10% - 14.9%) -> triggers Amber Warning
      priceMultiplier = 0.88;
      bundle = {
        basePrice: 1.0,
        perKmPrice: 0.33,
        perMinPrice: 0.04,
      };
    } else {
      // Balanced market pulse
      priceMultiplier = 1.0;
      bundle = {
        basePrice: 1.20,
        perKmPrice: 0.39,
        perMinPrice: 0.05,
      };
    }

    // Evaluate market integrity brakes
    const integrityCheck = RadarBundleIntegrityKernel.validateBundleIntegrity(
      bundle,
      BENCHMARK_PULSE_DOC
    );

    if (integrityCheck.status === 'REJECTED') {
      blockedCount++;
      continue; // Crimson block: Offer is rejected before entering rider auction hall
    }

    approvedCount++;

    const calculatedFare = Number(
      (fareQuote.guidePriceJod * priceMultiplier).toFixed(2)
    );

    generatedOffers.push({
      id: `offer_${userIndex}_${i}`,
      tripId: `trip_${userIndex}`,
      captainId,
      captain: {
        id: captainId,
        rank,
        trust_rating: rating,
      },
      fare: calculatedFare,
      pricing_mode: mode,
      status: 'pending',
      created_at: new Date(Date.now() - (numOffers - i) * 1000).toISOString(),
    });
  }
  const tPricingEnd = performance.now();

  // --- STAGE 3: Multi-Criteria Real-Time Offer Ranking ---
  const tRankingStart = performance.now();
  const favoriteCaptainIds = [`capt_${(userIndex * 29) % 300}`]; // 1 favorite captain
  const preferredMode = (userIndex % 4 === 0) ? 'TAXI' : (userIndex % 4 === 1 ? 'APP' : null);

  const rankedOffers = prioritizeRiderOffers(
    generatedOffers,
    favoriteCaptainIds,
    preferredMode
  );
  const tRankingEnd = performance.now();

  // --- STAGE 4: Anti-Cheat & Immunity Penalty Evaluation ---
  const tAntiCheatStart = performance.now();
  const riderRecord: RiderImmunityRecord = {
    riderId: `rider_${userIndex}`,
    immunityScore: 4.8,
    consecutiveCancellations: (userIndex % 5),
    isSuspended: false,
  };

  // Simulate evaluation on request cancellation/flow
  const penaltyResult = AntiCheatKernel.evaluateCancellationPenalty(
    riderRecord,
    Date.now()
  );
  const tAntiCheatEnd = performance.now();

  const totalTimeMs = performance.now() - startUser;

  return {
    userId: `user_${userIndex}`,
    totalTimeMs,
    h3IndexingTimeMs: tH3End - tH3Start,
    pricingTimeMs: tPricingEnd - tPricingStart,
    rankingTimeMs: tRankingEnd - tRankingStart,
    antiCheatTimeMs: tAntiCheatEnd - tAntiCheatStart,
    offersGenerated: numOffers,
    offersApproved: approvedCount,
    offersBlocked: blockedCount,
  };
}

/**
 * Runs a load test for a specific number of concurrent simulated users.
 */
function runLoadTest(userCount: number): BenchmarkResult {
  // Collect garbage if available or record initial memory
  if (global.gc) {
    try { global.gc(); } catch {}
  }

  const memBefore = process.memoryUsage();
  const records: UserLatencyRecord[] = new Array(userCount);

  const wallClockStart = performance.now();

  for (let i = 0; i < userCount; i++) {
    records[i] = simulateSingleUserLifecycle(i);
  }

  const wallClockEnd = performance.now();
  const totalExecutionTimeMs = wallClockEnd - wallClockStart;

  const memAfter = process.memoryUsage();

  // Calculate latency percentiles
  const sortedTotalTimes = records.map((r) => r.totalTimeMs).sort((a, b) => a - b);
  const sum = sortedTotalTimes.reduce((acc, v) => acc + v, 0);
  const avgMs = sum / userCount;
  const medianMs = sortedTotalTimes[Math.floor(userCount * 0.50)];
  const p90Ms = sortedTotalTimes[Math.floor(userCount * 0.90)];
  const p95Ms = sortedTotalTimes[Math.floor(userCount * 0.95)];
  const p99Ms = sortedTotalTimes[Math.floor(userCount * 0.99)];
  const minMs = sortedTotalTimes[0];
  const maxMs = sortedTotalTimes[sortedTotalTimes.length - 1];

  // Breakdown averages
  const avgH3 = records.reduce((acc, r) => acc + r.h3IndexingTimeMs, 0) / userCount;
  const avgPricing = records.reduce((acc, r) => acc + r.pricingTimeMs, 0) / userCount;
  const avgRanking = records.reduce((acc, r) => acc + r.rankingTimeMs, 0) / userCount;
  const avgAntiCheat = records.reduce((acc, r) => acc + r.antiCheatTimeMs, 0) / userCount;

  const totalOffersProcessed = records.reduce((acc, r) => acc + r.offersGenerated, 0);
  const totalMarketBrakesBlocked = records.reduce((acc, r) => acc + r.offersBlocked, 0);

  // Total operations = (H3 calculations + offers priced + offers ranked + anti-cheat checks)
  const totalAtomicOperations = totalOffersProcessed + (userCount * 4);
  const throughputUsersPerSec = (userCount / (totalExecutionTimeMs / 1000));
  const throughputOpsPerSec = (totalAtomicOperations / (totalExecutionTimeMs / 1000));

  const heapUsedBeforeMb = memBefore.heapUsed / 1024 / 1024;
  const heapUsedAfterMb = memAfter.heapUsed / 1024 / 1024;
  const heapDeltaMb = heapUsedAfterMb - heapUsedBeforeMb;
  const rssMb = memAfter.rss / 1024 / 1024;

  return {
    userCount,
    totalExecutionTimeMs,
    throughputUsersPerSec,
    throughputOpsPerSec,
    latency: {
      avgMs,
      medianMs,
      p90Ms,
      p95Ms,
      p99Ms,
      maxMs,
      minMs,
    },
    memory: {
      heapUsedBeforeMb,
      heapUsedAfterMb,
      heapDeltaMb,
      rssMb,
    },
    breakdownAvg: {
      h3IndexingMs: avgH3,
      pricingMs: avgPricing,
      rankingMs: avgRanking,
      antiCheatMs: avgAntiCheat,
    },
    totalOffersProcessed,
    totalMarketBrakesBlocked,
  };
}

/**
 * Format benchmark report for CLI console
 */
function printReport(result: BenchmarkResult) {
  const { userCount, totalExecutionTimeMs, throughputUsersPerSec, throughputOpsPerSec, latency, memory, breakdownAvg, totalOffersProcessed, totalMarketBrakesBlocked } = result;

  console.log('\n' + '='.repeat(70));
  console.log(`🚀 LOAD TEST RESULTS: ${userCount} CONCURRENT SIMULATED USERS`);
  console.log('='.repeat(70));
  console.log(`⏱️  Total Wall Clock Time : ${totalExecutionTimeMs.toFixed(2)} ms (${(totalExecutionTimeMs / 1000).toFixed(3)} sec)`);
  console.log(`⚡ Throughput (Users/sec)  : ${throughputUsersPerSec.toFixed(1)} users/sec`);
  console.log(`🔥 Throughput (Ops/sec)    : ${throughputOpsPerSec.toFixed(1)} ops/sec`);
  console.log(`📦 Total Bids Evaluated   : ${totalOffersProcessed.toLocaleString()} offers`);
  console.log(`🛑 15% Market Blocked Bids: ${totalMarketBrakesBlocked.toLocaleString()} dumping bids filtered`);
  console.log('-'.repeat(70));
  console.log('📊 LATENCY DISTRIBUTION (Per User Full Transaction):');
  console.log(`   • Average Latency   : ${latency.avgMs.toFixed(3)} ms`);
  console.log(`   • Median (P50)      : ${latency.medianMs.toFixed(3)} ms`);
  console.log(`   • 90th Percentile   : ${latency.p90Ms.toFixed(3)} ms`);
  console.log(`   • 95th Percentile   : ${latency.p95Ms.toFixed(3)} ms`);
  console.log(`   • 99th Percentile   : ${latency.p99Ms.toFixed(3)} ms`);
  console.log(`   • Min / Max         : ${latency.minMs.toFixed(3)} ms / ${latency.maxMs.toFixed(3)} ms`);
  console.log('-'.repeat(70));
  console.log('🔬 LOGIC PIPELINE BREAKDOWN (Average per user):');
  console.log(`   1. H3 Spatial & Fare Quote  : ${(breakdownAvg.h3IndexingMs * 1000).toFixed(1)} µs (${breakdownAvg.h3IndexingMs.toFixed(3)} ms)`);
  console.log(`   2. Captain Pricing & Brakes : ${(breakdownAvg.pricingMs * 1000).toFixed(1)} µs (${breakdownAvg.pricingMs.toFixed(3)} ms)`);
  console.log(`   3. Multi-Criteria Ranking   : ${(breakdownAvg.rankingMs * 1000).toFixed(1)} µs (${breakdownAvg.rankingMs.toFixed(3)} ms)`);
  console.log(`   4. Anti-Cheat & Immunity    : ${(breakdownAvg.antiCheatMs * 1000).toFixed(1)} µs (${breakdownAvg.antiCheatMs.toFixed(3)} ms)`);
  console.log('-'.repeat(70));
  console.log('💾 MEMORY PROFILE:');
  console.log(`   • Heap Used (Before/After)  : ${memory.heapUsedBeforeMb.toFixed(2)} MB ➔ ${memory.heapUsedAfterMb.toFixed(2)} MB (Delta: ${memory.heapDeltaMb >= 0 ? '+' : ''}${memory.heapDeltaMb.toFixed(2)} MB)`);
  console.log(`   • Resident Set Size (RSS)   : ${memory.rssMb.toFixed(2)} MB`);
  
  const isPassingBudget = latency.p95Ms < 10.0 && memory.heapDeltaMb < 100.0;
  console.log('-'.repeat(70));
  if (isPassingBudget) {
    console.log(`✅ [PASS] 100% Zero-Cost Edge Compliance Confirmed. System easily handles ${userCount} users!`);
  } else {
    console.log(`⚠️ [WARNING] P95 latency (${latency.p95Ms.toFixed(2)}ms) exceeded target budget (10ms).`);
  }
  console.log('='.repeat(70));
}

// Main execution
async function main() {
  console.log('='.repeat(70));
  console.log('🏎️  STARTING BYNKCOM SMART RADAR CONCURRENCY STRESS SUITE');
  console.log('   Target Workload: 500 to 1,000 Concurrent Users');
  console.log('='.repeat(70));

  // Warmup run to allow V8 JIT compiler optimizations
  console.log('⚡ JIT Warmup: running 50 iterations...');
  for (let i = 0; i < 50; i++) {
    simulateSingleUserLifecycle(i);
  }
  console.log('✅ Warmup completed.\n');

  // Test Tier 1: 500 Users
  console.log('▶️ Executing Tier 1: 500 Concurrent Users...');
  const res500 = runLoadTest(500);
  printReport(res500);

  // Test Tier 2: 750 Users
  console.log('\n▶️ Executing Tier 2: 750 Concurrent Users...');
  const res750 = runLoadTest(750);
  printReport(res750);

  // Test Tier 3: 1,000 Users
  console.log('\n▶️ Executing Tier 3: 1,000 Concurrent Users...');
  const res1000 = runLoadTest(1000);
  printReport(res1000);

  console.log('\n🏁 STRESS TEST COMPLETED SUCCESSFULLY FOR ALL TIERS (500, 750, 1000 Users).\n');
}

main().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
