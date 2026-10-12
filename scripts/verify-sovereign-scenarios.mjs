import assert from 'node:assert/strict';
import { RadarAntiCheatKernel } from '../src/core/RadarAntiCheatKernel.ts';
import { riderDashboardReducer, initialRiderMachineState } from '../src/features/rider/state/rider-state-machine.ts';
import { captainDashboardReducer, initialCaptainDashboardState } from '../src/features/captain/state/captain-state-machine.ts';
import { prioritizeRiderOffers } from '../src/features/rider/services/rider-offer-ranking.ts';
import { getOfferCountdown } from '../src/features/rider/services/offer-countdown.ts';
import { rankIncreaseFactorForTier, warnFactorForTier } from '../src/features/captain/services/offer-band.ts';
import { JORDAN_NATIONAL_ID_REGEX } from '../src/features/captain/lib/captain-registration-schema.ts';
import * as h3 from 'h3-js';

const testResults = [];

function testCase(category, name, fn) {
  try {
    fn();
    testResults.push({ category, name, passed: true });
    console.log(`  [PASS] [${category}] ${name}`);
  } catch (error) {
    testResults.push({ category, name, passed: false, error: error.message });
    console.error(`  [FAIL] [${category}] ${name}: ${error.message}`);
  }
}

async function asyncTestCase(category, name, fn) {
  try {
    await fn();
    testResults.push({ category, name, passed: true });
    console.log(`  [PASS] [${category}] ${name}`);
  } catch (error) {
    testResults.push({ category, name, passed: false, error: error.message });
    console.error(`  [FAIL] [${category}] ${name}: ${error.message}`);
  }
}

console.log('\n============================================================');
console.log('--- 1. اختبارات واجهة الراكب (RIDER INTERFACE SCENARIOS) ---');
console.log('============================================================\n');

testCase('Rider', 'تحويل إحداثيات الراكب محلياً إلى خلية H3 بدقة Resolution 9', () => {
  const ammanLat = 31.9539;
  const ammanLng = 35.9106;
  const cell = h3.latLngToCell(ammanLat, ammanLng, 9);
  assert.ok(cell, 'H3 cell must be generated');
  assert.equal(typeof cell, 'string', 'H3 cell must be string');
  assert.equal(h3.getResolution(cell), 9, 'H3 resolution must strictly be 9');
});

testCase('Rider', 'بروتوكول الاستجابة الفورية وانعدام الكباتن بعد 180 ثانية حتمية', () => {
  const early = RadarAntiCheatKernel.evaluateBuoyLifeCycle(60);
  assert.equal(early.shouldPurge, false);
  assert.equal(early.notifyNoCaptains, false);

  const exactTimeout = RadarAntiCheatKernel.evaluateBuoyLifeCycle(180);
  assert.equal(exactTimeout.shouldPurge, true);
  assert.equal(exactTimeout.notifyNoCaptains, true);

  const overdueTimeout = RadarAntiCheatKernel.evaluateBuoyLifeCycle(250);
  assert.equal(overdueTimeout.shouldPurge, true);
  assert.equal(overdueTimeout.notifyNoCaptains, true);
});

testCase('Rider', 'دورة حياة آلة حالة الراكب (IDLE -> DESTINATION -> OFFERS -> TRIP -> RATING)', () => {
  let state = initialRiderMachineState;
  assert.equal(state.screen, 'IDLE_MAP');

  state = riderDashboardReducer(state, { type: 'OPEN_DESTINATION' });
  assert.equal(state.screen, 'DESTINATION_SELECTION');

  const dest = {
    id: 'dest_1',
    label: 'عمان مول',
    governorate: 'عمان',
    district: 'تلاع العلي',
    coords: { lat: 31.98, lng: 35.85 },
  };
  state = riderDashboardReducer(state, { type: 'CONFIRM_DESTINATION', destination: dest });
  assert.equal(state.destination.label, 'عمان مول');

  state = riderDashboardReducer(state, { type: 'SEND_REQUEST' });
  state = riderDashboardReducer(state, { type: 'SERVER_REQUEST_CREATED', requestId: 'req_123' });
  state = riderDashboardReducer(state, { type: 'SERVER_STATUS_RECEIVING_OFFERS' });
  assert.equal(state.screen, 'RECEIVING_OFFERS');
  assert.equal(state.requestId, 'req_123');

  // استقبال عرض وقبوله
  const mockTripRow = {
    id: 'trip_100',
    captain_id: 'cap_1',
    final_fare: 4.5,
    status: 'ACCEPTED',
    pickup_address: 'نقطة الانطلاق',
    destination_address: 'عمان مول',
    captain_profile: { full_name: 'كابتن أحمد', phone: '0791234567' }
  };
  state = riderDashboardReducer(state, { type: 'SERVER_STATUS_ACCEPTED', row: mockTripRow });
  assert.equal(state.screen, 'TRIP_ACTIVE');
  assert.equal(state.activeTrip?.tripId, 'trip_100');

  // إنهاء الرحلة
  state = riderDashboardReducer(state, { type: 'SERVER_STATUS_COMPLETED', row: mockTripRow });
  assert.equal(state.screen, 'RATING_MODAL');
});

testCase('Rider', 'ترتيب عروض الكباتن وفق مصفوفة السيادة (المفضلة أولاً، ثم الرتبة، ثم السعر الأقل)', () => {
  const offers = [
    { id: 'off_1', driverId: 'c1', price: 6.0, rank: 'SILVER', rating: 4.8 },
    { id: 'off_2', driverId: 'c2', price: 5.0, rank: 'GOLD', rating: 4.9 },
    { id: 'off_3', driverId: 'c3', price: 4.0, rank: 'PLATINUM', rating: 4.7 },
    { id: 'off_4', driverId: 'fav_cap', price: 7.0, rank: 'BRONZE', rating: 4.5 },
  ];
  const sorted = prioritizeRiderOffers(offers, ['fav_cap']);
  
  // الكابتن المفضل يجب أن يطفو أولاً حتى لو كان سعره أعلى
  assert.equal(sorted[0].driverId, 'fav_cap', 'Favorite captain must float first');
  // ثم البلاتيني
  assert.equal(sorted[1].driverId, 'c3', 'Platinum captain must precede gold and silver');
  // ثم الذهبي
  assert.equal(sorted[2].driverId, 'c2', 'Gold captain must precede silver');
  // ثم الفضي
  assert.equal(sorted[3].driverId, 'c1', 'Silver captain comes last');
});

testCase('Rider', 'عداد صلاحية عرض الكابتن المرتكز على لحظة ظهور العرض للراكب', () => {
  const now = 1000000;
  const firstSeen = now - 5000; // مر 5 ثوان
  const countdown = getOfferCountdown({ wait_seconds: 30 }, firstSeen, now);
  assert.equal(countdown.remainingSeconds, 25);
  assert.equal(countdown.isExpired, false);

  // انتهاء صلاحية العرض بعد 30 ثانية
  const expiredCountdown = getOfferCountdown({ wait_seconds: 30 }, firstSeen, now + 35000);
  assert.equal(expiredCountdown.remainingSeconds, 0);
  assert.equal(expiredCountdown.isExpired, true);
});

testCase('Rider', 'جدار الحماية السلوكي للراكب: خصم 0.5 عند 3 إلغاءات متتالية وإسقاط الحساب عند < 4.2', () => {
  const rider = { consecutiveCancellations: 3, behaviorSafetyScore: 4.5, isPurged: false };
  assert.throws(() => {
    RadarAntiCheatKernel.enforceRiderFirewall(rider);
  }, /KERNEL_PURGE: Account terminated due to malicious behavior/);
  assert.equal(rider.behaviorSafetyScore, 4.0);
  assert.equal(rider.isPurged, true);
});

console.log('\n============================================================');
console.log('--- 2. اختبارات واجهة الكابتن (CAPTAIN INTERFACE SCENARIOS) ---');
console.log('============================================================\n');

testCase('Captain', 'التحقق من صحة الرقم الوطني الأردني (10 أرقام صارمة)', () => {
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('2000123456'), true);
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('12345'), false); // أقل من 10
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('20001234567'), false); // أكثر من 10
  assert.equal(JORDAN_NATIONAL_ID_REGEX.test('200012345a'), false); // أحرف
});

testCase('Captain', 'حظر عروض الكباتن خارج محيط المسح المصرح به (أقصى سقف 2.5 كم)', () => {
  const riderLat = 31.95;
  const riderLon = 35.91;

  // كابتن على بعد 1.2 كم (مسموح)
  const nearbyCaptainLat = 31.959;
  const nearbyCaptainLon = 35.915;
  assert.equal(RadarAntiCheatKernel.validateBuoyProximity(riderLat, riderLon, nearbyCaptainLat, nearbyCaptainLon), true);

  // كابتن على بعد 5.0 كم (ممنوع ويجب رمي خطأ أمني)
  const farCaptainLat = 31.99;
  const farCaptainLon = 35.95;
  assert.throws(() => {
    RadarAntiCheatKernel.validateBuoyProximity(riderLat, riderLon, farCaptainLat, farCaptainLon);
  }, /SECURITY_ALERT: Driver proposal blocked/);
});

testCase('Captain', 'معادلة التسعير النسيجية: السعر الأساسي + الكيلومترات + الدقائق', () => {
  const baseFare = 1.0;
  const distanceKm = 10.0;
  const durationMins = 20;
  const tariffPerKm = 0.25;
  const tariffPerMin = 0.05;

  const fare = RadarAntiCheatKernel.calculateOSRMFare(baseFare, distanceKm, durationMins, tariffPerKm, tariffPerMin);
  // 1.0 + (10 * 0.25 = 2.5) + (20 * 0.05 = 1.0) = 4.5
  assert.equal(fare, 4.5);
});

testCase('Captain', 'كوابح السوق ومؤشر التوازن (تحذير برتقالي 10-14.9% وحظر قرمزي >= 15%)', () => {
  const standardFare = 10.0;

  // سعر طبيعي (خصم 5% فقط) -> NORMAL
  const normal = RadarAntiCheatKernel.enforceMarketBrakes(9.5, standardFare);
  assert.equal(normal.status, 'NORMAL');

  // انحراف 12% -> AMBER_WARNING
  const amber = RadarAntiCheatKernel.enforceMarketBrakes(8.8, standardFare);
  assert.equal(amber.status, 'AMBER_WARNING');

  // انحراف 16% -> CRIMSON_BLOCK
  const crimson = RadarAntiCheatKernel.enforceMarketBrakes(8.4, standardFare);
  assert.equal(crimson.status, 'CRIMSON_BLOCK');
});

testCase('Captain', 'حدود الزيادة المسموحة حسب رتبة الكابتن (Platinum 20%, Gold 10%, Bronze 5%, Silver 0%)', () => {
  assert.equal(rankIncreaseFactorForTier('PLATINUM'), 0.2);
  assert.equal(rankIncreaseFactorForTier('GOLD'), 0.1);
  assert.equal(rankIncreaseFactorForTier('BRONZE'), 0.05);
  assert.equal(rankIncreaseFactorForTier('SILVER'), 0.0);

  // البلاتيني الوحيد الذي يتجاوز سقف الـ 15% العامة
  assert.equal(warnFactorForTier('PLATINUM'), 0.2);
  assert.equal(warnFactorForTier('GOLD'), 0.15);
  assert.equal(warnFactorForTier('SILVER'), 0.15);
});

testCase('Captain', 'آلة حالة الكابتن (RADAR -> BIDDING -> SUBMITTED -> ACCEPTED -> ARRIVED -> STARTED -> COMPLETED)', () => {
  let state = initialCaptainDashboardState;
  assert.equal(state.screen, 'RADAR_MAP');
  assert.equal(state.tripStep, 'IDLE');

  const mockRequest = { id: 'req_123', rider_name: 'كريم', pickup: 'شارع الجامعة' };
  state = captainDashboardReducer(state, { type: 'SELECT_REQUEST', request: mockRequest });
  assert.equal(state.screen, 'BIDDING');
  assert.equal(state.selectedRequest?.id, 'req_123');

  state = captainDashboardReducer(state, { type: 'OFFER_SUBMITTED', requestId: 'req_123', offerId: 'off_99' });
  assert.equal(state.tripStep, 'OFFER_SUBMITTED');

  state = captainDashboardReducer(state, { type: 'SERVER_ACCEPTED', request: mockRequest, offerId: 'off_99' });
  assert.equal(state.screen, 'ACTIVE_TRIP');
  assert.equal(state.tripStep, 'ACCEPTED');

  state = captainDashboardReducer(state, { type: 'CONFIRM_ARRIVAL' });
  assert.equal(state.tripStep, 'ARRIVED');

  state = captainDashboardReducer(state, { type: 'START_TRIP' });
  assert.equal(state.tripStep, 'STARTED');

  state = captainDashboardReducer(state, {
    type: 'TRIP_COMPLETED',
    completedTrip: { requestId: 'req_123', riderId: 'rider_abc', riderName: 'كريم' },
  });
  assert.equal(state.screen, 'RATING_MODAL');
  assert.equal(state.tripStep, 'COMPLETED');
});

console.log('\n============================================================');
console.log('--- 3. السيناريوهات غير المتوقعة وحالات الطوارئ (EDGE & CHAOS) ---');
console.log('============================================================\n');

testCase('Chaos', 'حماية النبض الزمني من التلاعب بساعة الهاتف (Network Time Delta > 60s)', () => {
  const serverTime = 1700000000000;
  const normalLocalTime = serverTime + 5000; // 5 ثواني فرق
  assert.doesNotThrow(() => {
    RadarAntiCheatKernel.validateDeviceTime(serverTime, normalLocalTime);
  });

  const tamperedTime = serverTime + 120000; // ساعتان أو دقيقتان فرق
  assert.throws(() => {
    RadarAntiCheatKernel.validateDeviceTime(serverTime, tamperedTime);
  }, /SECURITY_ALERT: Device time manipulation detected/);
});

testCase('Chaos', 'الهبوط الملاحي الآمن (Offline Fallback) بمعامل شوارع الأردن (1.3)', () => {
  const originLat = 31.9539;
  const originLon = 35.9106;
  const destLat = 32.0000;
  const destLon = 35.9500;

  const fallbackDist = RadarAntiCheatKernel.calculateFallbackDistance(originLat, originLon, destLat, destLon);
  assert.ok(fallbackDist > 0, 'Distance must be positive');
  assert.ok(Number.isFinite(fallbackDist), 'Distance must be finite');
  
  // التحقق من أن المسافة تعتمد معامل الالتواء 1.3
  const R = 6371000;
  const dLat = (destLat - originLat) * Math.PI / 180;
  const dLon = (destLon - originLon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const pureDistance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  assert.ok(Math.abs(fallbackDist - pureDistance * 1.3) < 0.1, 'Must strictly multiply pure Haversine by 1.3');
});

await asyncTestCase('Chaos', 'فشل خادم OSRM وسقوط التوجيه الآلي إلى Haversine مع علم isFallback', async () => {
  const result = await RadarAntiCheatKernel.fetchSovereignRoute(
    'http://invalid-unreachable-osrm-server.local',
    [35.9106, 31.9539],
    [35.9500, 32.0000]
  );
  assert.equal(result.isFallback, true, 'isFallback must be true when OSRM server fails');
  assert.ok(result.distanceKm > 0, 'Must compute fallback distance');
  assert.ok(result.durationMins > 0, 'Must compute fallback duration');
});

testCase('Chaos', 'حظر فتح وجهة جديدة وتكرار الطلبات أثناء البحث النشط (SSOT Protection)', () => {
  let state = initialRiderMachineState;
  state = riderDashboardReducer(state, { type: 'OPEN_DESTINATION' });
  state = riderDashboardReducer(state, {
    type: 'CONFIRM_DESTINATION',
    destination: { id: 'd1', label: 'وجهة 1', coords: { lat: 31.9, lng: 35.9 }, governorate: '', district: '' }
  });
  state = riderDashboardReducer(state, { type: 'SEND_REQUEST' });
  state = riderDashboardReducer(state, { type: 'SERVER_STATUS_RECEIVING_OFFERS' });
  assert.equal(state.screen, 'RECEIVING_OFFERS');

  // محاولة فتح شاشة الوجهة أثناء البحث النشط
  const blockedState = riderDashboardReducer(state, { type: 'OPEN_DESTINATION' });
  // يجب أن يظل في شاشة RECEIVING_OFFERS وحظر فتح واجهة اختيار وجهة جديدة
  assert.equal(blockedState.screen, 'RECEIVING_OFFERS', 'Must block opening destination while searching');
});

testCase('Chaos', 'صمود مؤقت العد التنازلي عند تقدم ساعة جهاز المستخدم أو تأخرها', () => {
  const now = 2000000;
  const firstSeen = now;
  // ساعة الجهاز تقفز إلى الأمام بـ 1000 ثانية
  const skewedResult = getOfferCountdown({ wait_seconds: 40 }, firstSeen, now + 1000000);
  assert.equal(skewedResult.isExpired, true);
  assert.equal(skewedResult.percentRemaining, 0);

  // ساعة الجهاز متأخرة
  const pastResult = getOfferCountdown({ wait_seconds: 40 }, firstSeen, now - 5000);
  assert.equal(pastResult.remainingSeconds, 40);
  assert.equal(pastResult.percentRemaining, 100);
});

console.log('\n============================================================');
console.log('--- ملخص النتائج النهائية (FINAL TEST SUMMARY) ---');
console.log('============================================================\n');

const total = testResults.length;
const passed = testResults.filter(r => r.passed).length;
const failed = testResults.filter(r => !r.passed).length;

console.log(`الإجمالي: ${total}`);
console.log(`الناجح: ${passed} (Passed)`);
console.log(`الفاشل: ${failed} (Failed)`);

if (failed === 0) {
  console.log('\n🎉 جميع الاختبارات الهندسية الشاملة نجحت بنسبة 100%!');
  process.exit(0);
} else {
  console.error('\n⚠️ هناك إخفاقات تحتاج إلى معالجة قبل الإطلاق!');
  process.exit(1);
}

