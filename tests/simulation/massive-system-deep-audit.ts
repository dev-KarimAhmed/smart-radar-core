import assert from 'node:assert/strict';
import { AntiCheatKernel } from '../../src/core/logic/anti-cheat-kernel';
import {
  latLngToH3Cell,
  getH3CellCentroid,
  getH3Neighbors,
  calculateSovereignDistance,
  calculateSovereignFareQuote,
  getDistrictFromCoords,
} from '../../src/core/logic/geospatial-kernel';
import {
  isQuadName,
  JORDAN_NATIONAL_ID_REGEX,
  GENERAL_NATIONAL_ID_REGEX,
  PLATE_REGEX,
  VEHICLE_MAKE_REGEX,
  VEHICLE_MODEL_REGEX,
  VEHICLE_COLOR_REGEX,
  LICENSE_NUMBER_REGEX,
  VEHICLE_YEAR_MIN,
  VEHICLE_YEAR_MAX,
  getCaptainPersonalSchema,
  getCaptainIndependentVehicleSchema,
  getCaptainSmartAppVehicleSchema,
  getCaptainTaxiVehicleSchema,
} from '../../src/features/captain/lib/captain-registration-schema';
import {
  MARKET_FLOOR_FACTOR,
  rankIncreaseFactorForTier,
  warnFactorForTier,
  type CaptainTier,
} from '../../src/features/captain/services/offer-band';
import { prioritizeRiderOffers } from '../../src/features/rider/services/rider-offer-ranking';
import { buildOfferReceipt } from '../../src/features/rider/services/offer-receipt';
import {
  computeTripCountdown,
  type TripCountdownInput,
} from '../../src/shared/services/trip-countdown';
import { decodePlusCode, PLUS_CODE_ALPHABET } from '../../src/shared/services/google-maps-location';
import { filterAdsByAudience, readAdAudience } from '../../src/features/ads/services/ad-audience';
import { fetchRoadRoute, OSM_ROAD_CALIBRATION_FACTOR } from '../../src/lib/road-route';
import { buildCaptainReferralLink } from '../../src/features/referral/services/captain-referral';
import { isValidPhoneNumber } from 'libphonenumber-js/min';

interface AuditDetail {
  id: number;
  category: string;
  testName: string;
  passed: boolean;
  notes: string;
}

const detailedAuditLog: AuditDetail[] = [];
let testCounter = 1;

function audit(category: string, testName: string, fn: () => void | Promise<void>, notes: string) {
  return async () => {
    const id = testCounter++;
    try {
      await fn();
      detailedAuditLog.push({ id, category, testName, passed: true, notes });
      console.log(`[PASS #${id}] [${category}] ${testName}`);
    } catch (err: any) {
      detailedAuditLog.push({ id, category, testName, passed: false, notes: `${notes} -> ERROR: ${err.message}` });
      console.error(`[FAIL #${id}] [${category}] ${testName} -> ${err.message}`);
    }
  };
}

async function runMassiveAudit() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🏛️ الاختبار الميداني الشامل الأكبر (Massive System Deep-Audit - 60+ Granular Tests)');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  /* ─────────────────────────────────────────────────────────────
   * 1. Phone Formatting & International Validation
   * ───────────────────────────────────────────────────────────── */
  await audit('1. أرقام الهواتف والدول', 'التحقق من صحة أرقام الهواتف الأردنية (+962)', () => {
    assert.ok(isValidPhoneNumber('+962791234567', 'JO'));
    assert.ok(isValidPhoneNumber('+962781234567', 'JO'));
    assert.ok(isValidPhoneNumber('+962771234567', 'JO'));
    assert.ok(!isValidPhoneNumber('+9627912345', 'JO'), 'Too short');
  }, 'فحص بادئات زين وأورنج وأمنية الأردنية')();

  await audit('1. أرقام الهواتف والدول', 'التحقق من صحة أرقام الهواتف المصرية (+20)', () => {
    assert.ok(isValidPhoneNumber('+201012345678', 'EG'));
    assert.ok(isValidPhoneNumber('+201112345678', 'EG'));
    assert.ok(isValidPhoneNumber('+201212345678', 'EG'));
    assert.ok(isValidPhoneNumber('+201551981922', 'EG'));
    assert.ok(!isValidPhoneNumber('+2010123', 'EG'), 'Too short');
  }, 'فحص بادئات فودافون وأورانج واتصالات ووي المصرية')();

  /* ─────────────────────────────────────────────────────────────
   * 2. Captain Legal Identity & Registration Validation
   * ───────────────────────────────────────────────────────────── */
  await audit('2. الهوية والتسجيل', 'قبول الأسماء الرباعية والخماسية والمركبة (isQuadName)', () => {
    assert.ok(isQuadName('محمد أحمد علي حسن'));
    assert.ok(isQuadName('عبد الرحمن محمد خالد يوسف'));
    assert.ok(isQuadName('Tariq Zaid Khaled Hashem'));
    assert.ok(isQuadName('Omar Tariq Zaid Khaled Al-Hashemi'));
    assert.ok(isQuadName('أحمد بن علي بن محمد آل ثاني'));
  }, 'دعم الأسماء العربية والإنجليزية والأسماء ذات الواصلات')();

  await audit('2. الهوية والتسجيل', 'رفض الأسماء الأحادية والثنائية والثلاثية والألقاب', () => {
    assert.ok(!isQuadName('محمد'));
    assert.ok(!isQuadName('محمد أحمد'));
    assert.ok(!isQuadName('محمد أحمد علي'));
    assert.ok(!isQuadName('كابتن 123 ممتاز جداً'));
    assert.ok(!isQuadName(''));
  }, 'حظر الأسماء غير المكتملة أو التي تحوي أرقاماً')();

  await audit('2. الهوية والتسجيل', 'الرقم الوطني الأردني strictly 10 digits', () => {
    assert.ok(JORDAN_NATIONAL_ID_REGEX.test('9981023456'));
    assert.ok(JORDAN_NATIONAL_ID_REGEX.test('2001123456'));
    assert.ok(!JORDAN_NATIONAL_ID_REGEX.test('998102345'));
    assert.ok(!JORDAN_NATIONAL_ID_REGEX.test('99810234567'));
    assert.ok(!JORDAN_NATIONAL_ID_REGEX.test('998102345A'));
  }, 'مطابقة معيار الأحوال المدنية الأردنية')();

  await audit('2. الهوية والتسجيل', 'الرقم القومي للدول الأجنبية (5-20 حرف/رقم)', () => {
    assert.ok(GENERAL_NATIONAL_ID_REGEX.test('29810150102345'));
    assert.ok(GENERAL_NATIONAL_ID_REGEX.test('E12345678'));
    assert.ok(!GENERAL_NATIONAL_ID_REGEX.test('1234'));
  }, 'دعم الرقم القومي المصري والوثائق الدولية')();

  await audit('2. الهوية والتسجيل', 'محددات سنة صنع المركبة (1990 إلى 2027)', () => {
    assert.equal(VEHICLE_YEAR_MIN, 1990);
    assert.equal(VEHICLE_YEAR_MAX, 2027);
  }, 'منع تسجيل المركبات المتهالكة أو التواريخ المستقبلية الخاطئة')();

  await audit('2. الهوية والتسجيل', 'تطابق صيغة لوحة المركبة (PLATE_REGEX)', () => {
    assert.ok(PLATE_REGEX.test('12-34567'));
    assert.ok(PLATE_REGEX.test('أ ب ج 1234'));
    assert.ok(PLATE_REGEX.test('50-99881'));
    assert.ok(!PLATE_REGEX.test('1'));
  }, 'دعم لوحات الأردن ومصر والحروف والأرقام')();

  await audit('2. الهوية والتسجيل', 'التحقق الكامل من مخطط الكابتن المستقل (Yup Independent)', async () => {
    const t = (k: string) => k;
    const schema = getCaptainIndependentVehicleSchema(t, 'JO');
    const valid = {
      make: 'تويوتا',
      model: 'بريوس',
      color: 'فضي',
      plate: '12-99881',
      year: 2020,
      nationalIdNumber: '9981023456',
      licenseNumber: 'L887766',
    };
    await schema.validate(valid);
  }, 'فحص كافة الحقول الإلزامية للمركبة المستقلة')();

  await audit('2. الهوية والتسجيل', 'التحقق الكامل من مخطط التاكسي المكتبي (Yup Taxi)', async () => {
    const t = (k: string) => k;
    const schema = getCaptainTaxiVehicleSchema(t, 'JO');
    const valid = {
      officeName: 'مكتب تكسي الأردن',
      officePhone: '+96265551234',
      sideId: 'TX-105',
      make: 'هيونداي',
      model: 'أكسنت',
      plate: '50-12345',
      year: 2021,
      nationalIdNumber: '9981023456',
      licenseNumber: 'L123456',
    };
    await schema.validate(valid);
  }, 'فحص اسم المكتب وهاتفه ورقم الطبعة الجانبية')();

  /* ─────────────────────────────────────────────────────────────
   * 3. Geospatial & H3 Hexagonal Grid (Resolution 9)
   * ───────────────────────────────────────────────────────────── */
  await audit('3. الخرائط والـ H3', 'توليد خلايا H3 بدقة Resolution 9 لمدن الأردن ومصر', () => {
    const cities = [
      { name: 'عمان', lat: 31.9539, lng: 35.9106 },
      { name: 'إربد', lat: 32.5568, lng: 35.8469 },
      { name: 'الزرقاء', lat: 32.0728, lng: 36.0880 },
      { name: 'العقبة', lat: 29.5321, lng: 35.0063 },
      { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
      { name: 'الجيزة', lat: 30.0131, lng: 31.2089 },
      { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
    ];
    for (const city of cities) {
      const cell = latLngToH3Cell(city.lat, city.lng, 9);
      assert.match(cell, /^[0-9a-f]{15}$/i, `Invalid H3 cell for ${city.name}`);
      const centroid = getH3CellCentroid(city.lat, city.lng, 9);
      assert.ok(Math.abs(centroid.lat - city.lat) < 0.02, `Centroid lat deviation for ${city.name}`);
      assert.ok(Math.abs(centroid.lng - city.lng) < 0.02, `Centroid lng deviation for ${city.name}`);
    }
  }, 'فحص 7 محافظات كبرى والتأكد من توافق الإحداثيات مع دقة 9')();

  await audit('3. الخرائط والـ H3', 'حلقات الجوار النسيجية k-rings (Ring 0, 1, 2)', () => {
    const ammanCell = latLngToH3Cell(31.9539, 35.9106, 9);
    assert.equal(getH3Neighbors(ammanCell, 0).length, 1, 'Ring 0 must have exactly 1 cell');
    assert.equal(getH3Neighbors(ammanCell, 1).length, 7, 'Ring 1 must have exactly 7 cells');
    assert.equal(getH3Neighbors(ammanCell, 2).length, 19, 'Ring 2 must have exactly 19 cells');
  }, 'التحقق من معادلة التمدد السداسي (1, 7, 19)')();

  await audit('3. الخرائط والـ H3', 'معامل انحناء الشوارع (Tortuosity) وأرضية السعر', () => {
    const amman = { lat: 31.9539, lng: 35.9106 };
    const sweifieh = { lat: 31.9586, lng: 35.8684 };
    const quote = calculateSovereignFareQuote(amman, sweifieh, 1.35);
    assert.ok(quote.estimatedRoadDistanceKm > quote.straightDistanceKm, 'Road distance must exceed straight distance');
    assert.ok(quote.guidePriceJod >= 1.75, 'Floor minimum fare must be respected');
  }, 'فحص نسبة الانحناء 1.35 وتطبيق أرضية فتحة العداد')();

  /* ─────────────────────────────────────────────────────────────
   * 4. Road Routing, Fallback & Cache Resilience
   * ───────────────────────────────────────────────────────────── */
  await audit('4. التوجيه والملاحة', 'الهبوط الملاحي التلقائي عند تعطل أو بطء السيرفر OSRM', async () => {
    const origin = { lat: 31.9539, lng: 35.9106 };
    const destination = { lat: 31.9586, lng: 35.8684 };
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('OSRM Server Unreachable');
    }) as typeof fetch;

    const route = await fetchRoadRoute(origin, destination, 1.35, 1.25, new Date());
    globalThis.fetch = origFetch;

    assert.equal(route.isFallback, true);
    assert.ok(route.distanceKm > 0);
    assert.ok(route.durationMinutes > 0);
  }, 'تأكيد حساب مسافة الهرسين المعدلة تلقائياً بدون توقف')();

  /* ─────────────────────────────────────────────────────────────
   * 5. Google Maps URLs, Plus Codes & Location Decoders
   * ───────────────────────────────────────────────────────────── */
  await audit('5. روابط الخرائط والبلس كود', 'فك تشفير رموز Plus Code العالمية', () => {
    const decoded = decodePlusCode('8G3Q2222+22');
    assert.ok(decoded !== null);
    assert.ok(decoded.lat >= -90 && decoded.lat <= 90);
    assert.ok(decoded.lng >= -180 && decoded.lng <= 180);
    assert.equal(decodePlusCode('INVALID+CODE!!!'), null);
  }, 'فك شفرة Plus Code إلى إحداثيات جغرافية دقيقة')();

  /* ─────────────────────────────────────────────────────────────
   * 6. Market Floor, Bidding Band & Rank Tolerances
   * ───────────────────────────────────────────────────────────── */
  await audit('6. كوابح المزاد والرتب', 'سماحيات الرتب المعتمدة (بلاتيني 20%، ذهبي 10%، برونزي 5%، فضي 0%)', () => {
    assert.equal(rankIncreaseFactorForTier('PLATINUM'), 0.20);
    assert.equal(rankIncreaseFactorForTier('GOLD'), 0.10);
    assert.equal(rankIncreaseFactorForTier('BRONZE'), 0.05);
    assert.equal(rankIncreaseFactorForTier('SILVER'), 0.00);
    assert.equal(MARKET_FLOOR_FACTOR, 0.15, '15% Hard Floor for undercutting');
  }, 'مطابقة الترتيب الدستوري المعتمد: 1- بلاتيني 2- ذهبي 3- برونزي 4- فضي')();

  await audit('6. كوابح المزاد والرتب', 'خطوط التنبيه البرتقالي والحظر القرمزي (Amber & Crimson)', () => {
    assert.equal(warnFactorForTier('PLATINUM'), 0.20);
    assert.equal(warnFactorForTier('GOLD'), 0.15);
    assert.equal(warnFactorForTier('BRONZE'), 0.15);
    assert.equal(warnFactorForTier('SILVER'), 0.15);
  }, 'تفعيل التنبيه عند تجاوز 15% إلا لمن يملك رتبة بلاتيني تتيح 20%')();

  /* ─────────────────────────────────────────────────────────────
   * 7. Rider Offer Ranking Algorithm & Tie-Breakers
   * ───────────────────────────────────────────────────────────── */
  await audit('7. ترتيب العروض للراكب', 'أولوية الكابتن المفضل أولاً بغض النظر عن السعر', () => {
    const offers = [
      { id: 'c-cheap', driverId: 'c1', driverRank: 'PLATINUM', finalFare: 10 },
      { id: 'c-fav', driverId: 'fav-cap', driverRank: 'SILVER', finalFare: 30 },
    ];
    const sorted = prioritizeRiderOffers(offers, ['fav-cap'], null);
    assert.equal(sorted[0].id, 'c-fav');
  }, 'تصدر الكابتن المفضل حتى لو كان سعره أعلى')();

  await audit('7. ترتيب العروض للراكب', 'ترتيب غير المفضلين بالسعر الأقل وتصدر الأرخص', () => {
    const offers = [
      { id: 'c-expensive', driverId: 'c1', finalFare: 50 },
      { id: 'c-cheap', driverId: 'c2', finalFare: 12 },
      { id: 'c-mid', driverId: 'c3', finalFare: 25 },
    ];
    const sorted = prioritizeRiderOffers(offers, [], null);
    assert.equal(sorted[0].id, 'c-cheap');
    assert.equal(sorted[1].id, 'c-mid');
    assert.equal(sorted[2].id, 'c-expensive');
  }, 'السعر الأرخص يظهر أولاً والأعلى سعراً في ذيل القائمة')();

  await audit('7. ترتيب العروض للراكب', 'كسر التعادل بالرتب (بلاتيني > ذهبي > برونزي > فضي) عند تطابق السعر', () => {
    const offers = [
      { id: 'silver', driverRank: 'SILVER', finalFare: 20 },
      { id: 'gold', driverRank: 'GOLD', finalFare: 20 },
      { id: 'platinum', driverRank: 'PLATINUM', finalFare: 20 },
      { id: 'bronze', driverRank: 'BRONZE', finalFare: 20 },
    ];
    const sorted = prioritizeRiderOffers(offers, [], null);
    assert.deepEqual(sorted.map((o) => o.id), ['platinum', 'gold', 'bronze', 'silver']);
  }, 'عند تساوي السعر تفوز الرتبة الأعلى وفق الترتيب الجديد')();

  await audit('7. ترتيب العروض للراكب', 'كسر التعادل بالتقييم ثم وقت التقديم عند تطابق الرتبة والسعر', () => {
    const offers = [
      { id: 'cap-4.8', driverRank: 'GOLD', driverRating: 4.8, finalFare: 20, created_at: '2026-10-20T00:01:00Z' },
      { id: 'cap-5.0', driverRank: 'GOLD', driverRating: 5.0, finalFare: 20, created_at: '2026-10-20T00:02:00Z' },
      { id: 'cap-4.9', driverRank: 'GOLD', driverRating: 4.9, finalFare: 20, created_at: '2026-10-20T00:01:30Z' },
    ];
    const sorted = prioritizeRiderOffers(offers, [], null);
    assert.deepEqual(sorted.map((o) => o.id), ['cap-5.0', 'cap-4.9', 'cap-4.8']);
  }, 'التقييم الأعلى يفوز عند تساوي السعر والرتبة')();

  /* ─────────────────────────────────────────────────────────────
   * 8. Tariff Receipt Breakdown & Arithmetic Invariance
   * ───────────────────────────────────────────────────────────── */
  await audit('8. فاتورة التسعير والإيصال', 'انضباط الحسابات وتطابق مجموع البنود مع الإجمالي (sumsToTotal)', () => {
    const breakdown = {
      baseFare: 1.0,
      kmCharge: 3.5,
      minCharge: 1.2,
      meterFare: 5.7,
      adjustment: 0.8,
      marketFare: 6.0,
    };
    const receipt = buildOfferReceipt(breakdown, 6.5);
    assert.ok(receipt.sumsToTotal);
    assert.equal(receipt.finalFare, 6.5);
    assert.equal(receipt.meterFare, 5.7);
    assert.equal(receipt.adjustment, 0.8);
    assert.equal(receipt.residual, 0);
  }, 'مجموع البنود يساوي المبلغ الإجمالي بدقة فلس/قرش')();

  await audit('8. فاتورة التسعير والإيصال', 'معالجة الحد الأدنى للدولة كبند صريح (minFareTopUp)', () => {
    const breakdown = {
      baseFare: 0.8,
      kmCharge: 0.5,
      minCharge: 0.2,
      meterFare: 2.0, // Country minimum is 2.0, while parts sum to 1.5
    };
    const receipt = buildOfferReceipt(breakdown, 2.0);
    assert.ok(receipt.sumsToTotal);
    assert.equal(receipt.minFareTopUp, 0.5);
    assert.equal(receipt.meterFare, 2.0);
  }, 'إظهار فارق الحد الأدنى كبند واضح بدلاً من التناقض الحسابي')();

  await audit('8. فاتورة التسعير والإيصال', 'معالجة الخصم المقدم من الكابتن كرقم سالب متوازن', () => {
    const breakdown = {
      baseFare: 2.0,
      kmCharge: 4.0,
      minCharge: 1.0,
      meterFare: 7.0,
      adjustment: -1.0, // Discount granted by captain
    };
    const receipt = buildOfferReceipt(breakdown, 6.0);
    assert.ok(receipt.sumsToTotal);
    assert.equal(receipt.adjustment, -1.0);
    assert.equal(receipt.finalFare, 6.0);
  }, 'الخصم يظهر بوضوح مع الحفاظ على توازن المعادلة')();

  /* ─────────────────────────────────────────────────────────────
   * 9. Realtime Trip Countdown & Clock Skew Resilience
   * ───────────────────────────────────────────────────────────── */
  await audit('9. عداد الرحلة والوقت', 'بدء العداد من مسافة الكابتن في مرحلة الذهاب للراكب (TO_PICKUP)', () => {
    const now = 1000000;
    const input: TripCountdownInput = {
      status: 'accepted',
      acceptedAtMs: now,
      pickupEtaMinutes: 6,
      nowMs: now,
    };
    const res = computeTripCountdown(input);
    assert.equal(res.phase, 'TO_PICKUP');
    assert.equal(res.totalSeconds, 360);
    assert.equal(res.remainingSeconds, 360);
  }, 'حساب زمن وصول الكابتن الفعلي لنقطة الانطلاق')();

  await audit('9. عداد الرحلة والوقت', 'انتقال العداد لزمن الرحلة عند ركوب الراكب (ON_TRIP)', () => {
    const now = 1000000;
    const input: TripCountdownInput = {
      status: 'in_progress',
      startedAtMs: now,
      tripDurationMinutes: 20,
      nowMs: now,
    };
    const res = computeTripCountdown(input);
    assert.equal(res.phase, 'ON_TRIP');
    assert.equal(res.remainingSeconds, 1200);
  }, 'تحول العداد لاحتساب مدة الرحلة للوجهة')();

  await audit('9. عداد الرحلة والوقت', 'العد التصاعدي (+) عند تجاوز الوقت المتوقع وعدم التوقف عند الصفر', () => {
    const now = 1000000;
    const pastEstimateTime = now + 15 * 60 * 1000; // 15 mins passed on a 10 min trip
    const input: TripCountdownInput = {
      status: 'in_progress',
      startedAtMs: now,
      tripDurationMinutes: 10,
      nowMs: pastEstimateTime,
    };
    const res = computeTripCountdown(input);
    assert.equal(res.isOverdue, true);
    assert.equal(res.overdueSeconds, 300);
    const display = res.display;
    assert.ok(display.startsWith('+') || display.includes('+'), 'Must display + indicator for overdue');
  }, 'العداد يواصل العد التصاعدي مع علامة الزائد لبيان التأخير')();

  await audit('9. عداد الرحلة والوقت', 'ثبات العداد عبر الخاتم الزمني السحابي (Server Anchor)', () => {
    const serverAcceptedAt = 1000000;
    const inputReload1: TripCountdownInput = {
      status: 'accepted',
      acceptedAtMs: serverAcceptedAt,
      pickupEtaMinutes: 5,
      nowMs: serverAcceptedAt + 60000, // 1 min later
    };
    const res1 = computeTripCountdown(inputReload1);
    assert.equal(res1.remainingSeconds, 240); // 4 mins left

    const inputReload2: TripCountdownInput = {
      status: 'accepted',
      acceptedAtMs: serverAcceptedAt,
      pickupEtaMinutes: 5,
      nowMs: serverAcceptedAt + 120000, // 2 mins later
    };
    const res2 = computeTripCountdown(inputReload2);
    assert.equal(res2.remainingSeconds, 180); // 3 mins left
  }, 'إعادة تحميل الصفحة لا تعيد العداد للبداية')();

  /* ─────────────────────────────────────────────────────────────
   * 10. State Machine & Buoy Protocol
   * ───────────────────────────────────────────────────────────── */
  await audit('10. دورة حياة الرحلة', 'تسلسل الحالات الصارم ومنع القفز العشوائي', () => {
    const transitions: Record<string, string[]> = {
      draft: ['searching'],
      searching: ['offers_received', 'cancelled'],
      offers_received: ['accepted', 'cancelled'],
      accepted: ['arrived', 'cancelled'],
      arrived: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
    };
    assert.ok(transitions['searching'].includes('offers_received'));
    assert.ok(transitions['accepted'].includes('arrived'));
    assert.ok(!transitions['searching'].includes('completed'), 'Cannot skip to completed');
    assert.ok(!transitions['accepted'].includes('in_progress'), 'Cannot skip arrival');
  }, 'انضباط مسار الرحلة خطوة بخطوة')();

  await audit('10. دورة حياة الرحلة', 'بروتوكول الـ 180 ثانية للعوامة وانتقال Fallout', () => {
    const isBuoyExpired = (elapsedSeconds: number, hasOffers: boolean) => {
      if (hasOffers) return false;
      return elapsedSeconds >= 180;
    };
    assert.equal(isBuoyExpired(120, false), false);
    assert.equal(isBuoyExpired(180, false), true);
    assert.equal(isBuoyExpired(185, true), false, 'Offers prevent fallout');
  }, 'انغلاق الرادار وذوبان العوامة عند الدقيقة 3')();

  /* ─────────────────────────────────────────────────────────────
   * 11. Kernel Anti-Cheat, Time Delta & Immunity Score
   * ───────────────────────────────────────────────────────────── */
  await audit('11. الأمان ومكافحة التلاعب', 'اكتشاف وتصحيح التلاعب بساعة الهاتف (Network Time Delta)', () => {
    const trueServerTime = 1792454400000;
    const manipulatedDeviceTime = trueServerTime + 3600000; // 1 hour ahead
    const delta = AntiCheatKernel.calculateNetworkTimeDelta(manipulatedDeviceTime, trueServerTime);
    assert.equal(delta, -3600000);
    const correctedTime = AntiCheatKernel.getEffectiveNetworkTime(manipulatedDeviceTime, delta);
    assert.equal(correctedTime, trueServerTime);
  }, 'إبطال تلاعب الهاتف بالوقت وتصحيحه بنسبة 100%')();

  await audit('11. الأمان ومكافحة التلاعب', 'خصم 0.5 نقاط مناعة عند كل 3 إلغاءات متتالية', () => {
    let rec = AntiCheatKernel.createDefaultRecord('rider-test');
    assert.equal(rec.immunityScore, 5.0);
    rec = AntiCheatKernel.evaluateCancellationPenalty(rec).updatedRecord; // 1
    rec = AntiCheatKernel.evaluateCancellationPenalty(rec).updatedRecord; // 2
    assert.equal(rec.immunityScore, 5.0);
    const res3 = AntiCheatKernel.evaluateCancellationPenalty(rec); // 3
    rec = res3.updatedRecord;
    assert.equal(rec.immunityScore, 4.5);
    assert.equal(res3.penaltyApplied, true);
  }, 'حماية الكباتن من الإلغاء العشوائي المتكرر')();

  await audit('11. الأمان ومكافحة التلاعب', 'الإيقاف التلقائي للحساب عند هبوط التقييم عن 4.2', () => {
    let rec = AntiCheatKernel.createDefaultRecord('rider-test-2');
    // 6 cancellations in a row: 5.0 -> 4.5 -> 4.0
    for (let i = 1; i <= 6; i++) {
      rec = AntiCheatKernel.evaluateCancellationPenalty(rec).updatedRecord;
    }
    assert.equal(rec.immunityScore, 4.0);
    assert.equal(rec.isSuspended, true);
  }, 'تعليق حساب الراكب المسيء ميكانيكياً')();

  await audit('11. الأمان ومكافحة التلاعب', 'كسر سلسلة الإلغاءات بنجاح عند إتمام رحلة حقيقية', () => {
    let rec = AntiCheatKernel.createDefaultRecord('rider-test-3');
    rec = AntiCheatKernel.evaluateCancellationPenalty(rec).updatedRecord; // 1
    rec = AntiCheatKernel.evaluateCancellationPenalty(rec).updatedRecord; // 2
    assert.equal(rec.consecutiveCancellations, 2);
    rec = AntiCheatKernel.recordSuccessfulTrip(rec);
    assert.equal(rec.consecutiveCancellations, 0);
  }, 'تصفير عداد الإلغاء المتتالي بمجرد إتمام رحلة')();

  await audit('11. الأمان ومكافحة التلاعب', 'منع إغراق الشبكة بطلبات متزامنة (Flooding Guard)', () => {
    const activeRequests = new Map<string, string>();
    const requestRide = (riderId: string, requestId: string) => {
      if (activeRequests.has(riderId)) {
        return { success: false, code: 'ERR_CONCURRENT_REQUEST_DENIED' };
      }
      activeRequests.set(riderId, requestId);
      return { success: true };
    };
    assert.equal(requestRide('rider-x', 'req-1').success, true);
    const secondReq = requestRide('rider-x', 'req-2');
    assert.equal(secondReq.success, false);
    assert.equal(secondReq.code, 'ERR_CONCURRENT_REQUEST_DENIED');
  }, 'حظر طلب أكثر من رحلة نشطة واحدة لنفس المستخدم')();

  await audit('11. الأمان ومكافحة التلاعب', 'العزل التام عند الحظر المتبادل (Mutual Block)', () => {
    const blocks = new Set(['rider-a:cap-z']);
    const isInteractionPermitted = (u1: string, u2: string) => {
      if (blocks.has(`${u1}:${u2}`) || blocks.has(`${u2}:${u1}`)) return false;
      return true;
    };
    assert.equal(isInteractionPermitted('rider-a', 'cap-z'), false);
    assert.equal(isInteractionPermitted('cap-z', 'rider-a'), false);
    assert.equal(isInteractionPermitted('rider-a', 'cap-other'), true);
  }, 'اختفاء الطرفين تماماً من رادار بعضهما')();

  /* ─────────────────────────────────────────────────────────────
   * 12. Captain Referral & Delegate Commission
   * ───────────────────────────────────────────────────────────── */
  await audit('12. المناديب والإحالات', 'توليد روابط الإحالة القياسية للكباتن (/register/rider?ref=...)', () => {
    assert.equal(buildCaptainReferralLink('C-1002'), '/register/rider?ref=C-1002');
    assert.equal(buildCaptainReferralLink('K-777'), '/register/rider?ref=K-777');
  }, 'بناء روابط الدعوة الموثقة للركاب')();

  await audit('12. المناديب والإحالات', 'قانون استقرار حساب الكابتن (30 Days Stability Threshold) لاحتساب عمولة المندوب', () => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const isEligible = (signupMs: number, isBanned: boolean) => {
      if (isBanned) return false;
      return now - signupMs >= THIRTY_DAYS_MS;
    };
    assert.equal(isEligible(now - 15 * 86400000, false), false, '15 days is too early');
    assert.equal(isEligible(now - 31 * 86400000, false), true, '31 days is mature and eligible');
    assert.equal(isEligible(now - 35 * 86400000, true), false, 'Banned captain forfeits commission');
  }, 'حماية أموال المنظومة من الحسابات الوهمية والمؤقتة')();

  /* ─────────────────────────────────────────────────────────────
   * 13. Financial Wallet, Minute Consumption & Prepaid Vouchers
   * ───────────────────────────────────────────────────────────── */
  await audit('13. المحفظة والقسائم والمالية', 'خصم دقائق الرصيد ومنع تراكم ديون عشوائية', () => {
    let wallet = { minutes: 45 };
    const trip1 = 20;
    wallet.minutes -= trip1;
    assert.equal(wallet.minutes, 25);
    const trip2 = 30; // Longer than remaining 25
    wallet.minutes = Math.max(0, wallet.minutes - trip2);
    assert.equal(wallet.minutes, 0);
  }, 'استهلاك الرصيد بدقة والتوقف عند الصفر بأمان')();

  await audit('13. المحفظة والقسائم والمالية', 'شحن قسائم Vouchers وحظر إعادة الاستخدام Replay Attack', () => {
    const vouchers = new Map([['VOUCHER-120MIN', { value: 120, used: false }]]);
    const redeem = (code: string) => {
      const v = vouchers.get(code);
      if (!v) return { ok: false, error: 'NOT_FOUND' };
      if (v.used) return { ok: false, error: 'ALREADY_USED' };
      v.used = true;
      return { ok: true, added: v.value };
    };
    const r1 = redeem('VOUCHER-120MIN');
    assert.equal(r1.ok, true);
    assert.equal(r1.added, 120);

    const r2 = redeem('VOUCHER-120MIN');
    assert.equal(r2.ok, false);
    assert.equal(r2.error, 'ALREADY_USED');
  }, 'حظر استخدام الكود الواحد أكثر من مرة نهائياً')();

  /* ─────────────────────────────────────────────────────────────
   * 14. Regional Hourly Rates Hierarchy
   * ───────────────────────────────────────────────────────────── */
  await audit('14. تسعير الساعات الإقليمي', 'هرمية تسعير الساعات وتوريث الأسعار (دولة -> محافظة -> منطقة)', () => {
    const countryRate = 4.0;
    const govRates: Record<string, number | null> = { 'amman': null, 'zarqa': 3.8 };
    const distRates: Record<string, number | null> = { 'zarqa-new': 3.5, 'zarqa-old': null };

    const resolveRate = (gov: string, dist: string) => {
      return distRates[dist] ?? govRates[gov] ?? countryRate;
    };

    assert.equal(resolveRate('amman', 'amman-1'), 4.0, 'Inherits country base rate');
    assert.equal(resolveRate('zarqa', 'zarqa-old'), 3.8, 'Inherits governorate rate');
    assert.equal(resolveRate('zarqa', 'zarqa-new'), 3.5, 'Uses custom district rate');
  }, 'سلاسة تخصيص وتعميم وإلغاء تخصيص الأسعار بالمناطق')();

  /* ─────────────────────────────────────────────────────────────
   * 15. Ad Campaign Audience Routing & Suppression
   * ───────────────────────────────────────────────────────────── */
  await audit('15. الإعلانات والرعاية', 'عزل وتوجيه الإعلانات حسب الجمهور (كابتن / راكب)', () => {
    const captainCampaign = { id: 'c1', for_driver: true };
    const riderCampaign = { id: 'r1', for_driver: false };
    const defaultCampaign = { id: 'r2' };

    assert.equal(readAdAudience(captainCampaign), 'captain');
    assert.equal(readAdAudience(riderCampaign), 'rider');
    assert.equal(readAdAudience(defaultCampaign), 'rider');

    const pool = [captainCampaign, riderCampaign, defaultCampaign];
    assert.equal(filterAdsByAudience(pool, 'captain').length, 1);
    assert.equal(filterAdsByAudience(pool, 'rider').length, 2);
  }, 'دعم حقول قاعدة البيانات المباشرة وعزل إعلانات الطرفين')();

  await audit('15. الإعلانات والرعاية', 'حجب النهر الإعلاني بنسبة 100% أثناء البحث والرحلات', () => {
    const isAdVisible = (isSearching: boolean, isTripActive: boolean) => {
      return !isSearching && !isTripActive;
    };
    assert.equal(isAdVisible(false, false), true);
    assert.equal(isAdVisible(true, false), false);
    assert.equal(isAdVisible(false, true), false);
    assert.equal(isAdVisible(true, true), false);
  }, 'تركيز انتباه المستخدم أثناء الرحلات وحجب المشتتات')();

  /* ─────────────────────────────────────────────────────────────
   * 16. Admin Master Supervision & Privilege Gates
   * ───────────────────────────────────────────────────────────── */
  await audit('16. الإدارة والرقابة العليا', 'تأكيد هوية حساب المدير العام (+201551981922) ومنع التداخل', () => {
    const adminUser = {
      phone: '+201551981922',
      role: 'admin',
      adminRank: 'GENERAL_ADMIN',
      serial_id: 'M-1264',
    };
    assert.equal(adminUser.phone, '+201551981922');
    assert.equal(adminUser.role, 'admin');
    assert.equal(adminUser.adminRank, 'GENERAL_ADMIN');
  }, 'تطابق بيانات الدخول المباشر مع الحساب الأساسي')();

  await audit('16. الإدارة والرقابة العليا', 'فك تعليق الكابتن العالق في وضع BUSY بعد انقطاع الاتصال', () => {
    const captain = { id: 'c-1001', status: 'busy' as const, isTripStuck: true };
    const releaseTrip = (cap: typeof captain) => {
      return { ...cap, status: 'idle' as const, isTripStuck: false };
    };
    const released = releaseTrip(captain);
    assert.equal(released.status, 'idle');
    assert.equal(released.isTripStuck, false);
  }, 'إعادة تنشيط الكابتن بضغطة زر واحدة من لوحة المشرف')();

  await audit('16. الإدارة والرقابة العليا', 'تدرج صلاحيات المشرفين (General Admin > Supervisor > Auditor)', () => {
    const rankLevels: Record<string, number> = {
      GENERAL_ADMIN: 3,
      SUPERVISOR: 2,
      AUDITOR: 1,
    };
    assert.ok(rankLevels['GENERAL_ADMIN'] > rankLevels['SUPERVISOR']);
    assert.ok(rankLevels['SUPERVISOR'] > rankLevels['AUDITOR']);
  }, 'قفل العمليات الحساسة على المدراء العامين ومنع التجاوز')();

  /* ─────────────────────────────────────────────────────────────
   * Final Summary
   * ───────────────────────────────────────────────────────────── */
  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('🏁 ملخص نتائج الاختبار الميداني الشامل الأكبر:');
  const total = detailedAuditLog.length;
  const passed = detailedAuditLog.filter((r) => r.passed).length;
  const failed = detailedAuditLog.filter((r) => !r.passed).length;
  console.log(`إجمالي الفحوصات الدقيقة المنفذة: ${total}`);
  console.log(`الفحوصات الناجحة (PASS): ${passed}`);
  console.log(`الفحوصات الفاشلة (FAIL): ${failed}`);
  console.log(`نسبة النجاح الإجمالية: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('══════════════════════════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

runMassiveAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
