import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../src/lib/supabase-admin';
import {
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '../../src/lib/admin-auth-verifier';

// API Route Handlers
import { GET as getMapsResolve } from '../../src/app/api/maps/resolve/route';
import { POST as postTranslate } from '../../src/app/api/translate/route';
import { POST as postMutualCancel } from '../../src/app/api/trip/mutual-cancel/route';
import { POST as postSetStatus } from '../../src/app/api/captain/set-status/route';
import { GET as getWalletDirectory } from '../../src/app/api/captain/wallet-directory/route';
import { GET as getHourlyRates, POST as postHourlyRates } from '../../src/app/api/admin/hourly-rates/route';
import { GET as getKpis } from '../../src/app/api/admin/kpis/route';
import { GET as getListAdmins } from '../../src/app/api/admin/list-admins/route';
import { POST as postCreateSubAdmin } from '../../src/app/api/admin/create-sub-admin/route';
import { POST as postUpdateAdminRank } from '../../src/app/api/admin/update-admin-rank/route';
import { POST as postDeleteAdmin } from '../../src/app/api/admin/delete-admin/route';
import { POST as postChangePassword } from '../../src/app/api/admin/change-password/route';
import { GET as getAdminNotifications, POST as postAdminNotifications } from '../../src/app/api/admin/notifications/route';
import { GET as getTransferChannels, POST as postTransferChannels } from '../../src/app/api/admin/transfer-channels/route';
import { GET as getFinancialDelegates, POST as postFinancialDelegates } from '../../src/app/api/admin/financial-delegates/route';
import { GET as getAdminUsers, POST as postAdminUsers } from '../../src/app/api/admin/users/route';
import { GET as getAdminWallet, POST as postAdminWallet } from '../../src/app/api/admin/wallet/route';

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
      detailedAuditLog.push({ id, category, testName, passed: false, notes: `${notes} -> ${err?.message || err}` });
      console.error(`[FAIL #${id}] [${category}] ${testName} -> ${err?.message || err}`);
    }
  };
}

// Helpers to build Mock Requests
function makeReq(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const method = options.method || 'GET';
  const headers = new Headers(options.headers || {});
  let bodyStr: string | undefined;

  if (options.body) {
    headers.set('Content-Type', 'application/json');
    bodyStr = JSON.stringify(options.body);
  }

  return new Request(url, {
    method,
    headers,
    body: bodyStr,
  });
}

function makeNextReq(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const method = options.method || 'GET';
  const headers = new Headers(options.headers || {});
  let bodyStr: string | undefined;

  if (options.body) {
    headers.set('Content-Type', 'application/json');
    bodyStr = JSON.stringify(options.body);
  }

  return new NextRequest(url, {
    method,
    headers,
    body: bodyStr,
  });
}

const DEV_ADMIN_HEADERS = {
  authorization: 'Bearer dev-admin-001',
};

const INVALID_AUTH_HEADERS = {
  authorization: 'Bearer unverified_intruder_token',
};

async function runComprehensiveApiAndBackendAudit() {
  console.log('══════════════════════════════════════════════════════════════════════════════');
  console.log('🌐 فحص كافة واجهات الـ API ودوال الباك إند وقواعد البيانات (All API & Backend Audit)');
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  /* ─────────────────────────────────────────────────────────────
   * 1. Public Core API Handlers
   * ───────────────────────────────────────────────────────────── */
  await audit('1. واجهات الخرائط والترجمة', 'GET /api/maps/resolve - رفض الروابط غير الصالحة بكود 400', async () => {
    const req = makeNextReq('https://bynkcom.com/api/maps/resolve?url=https://notmaps.com/xyz');
    const res = await getMapsResolve(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'invalid_maps_url');
  }, 'التحقق من رفض أي رابط لا ينتمي لنطاقات Google Maps أو OSM')();

  await audit('1. واجهات الخرائط والترجمة', 'GET /api/maps/resolve - التعامل مع الروابط الفارغة', async () => {
    const req = makeNextReq('https://bynkcom.com/api/maps/resolve');
    const res = await getMapsResolve(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'invalid_maps_url');
  }, 'منع إهدار الموارد عند إرسال استعلامات فارغة')();

  await audit('1. واجهات الخرائط والترجمة', 'POST /api/translate - رفض الطلبات الخالية من النصوص (400)', async () => {
    const req = makeReq('https://bynkcom.com/api/translate', { method: 'POST', body: {} });
    const res = await postTranslate(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'التحقق من رفض الطلب الخالي من أي نص للترجمة')();

  await audit('1. واجهات الخرائط والترجمة', 'POST /api/translate - ترجمة نص مفرد بنجاح (عربي -> إنجليزي)', async () => {
    const req = makeReq('https://bynkcom.com/api/translate', {
      method: 'POST',
      body: { text: 'كابتن معلن', targetLang: 'en' },
    });
    const res = await postTranslate(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(typeof data.translatedText === 'string' && data.translatedText.length > 0);
  }, 'خدمة الترجمة السيادية بدون مفاتيح مدفوعة')();

  await audit('1. واجهات الخرائط والترجمة', 'POST /api/translate - ترجمة مصفوفة نصوص دفعة واحدة (Batch)', async () => {
    const req = makeReq('https://bynkcom.com/api/translate', {
      method: 'POST',
      body: { texts: ['الرادار الذكي', 'الراكب'], targetLang: 'en' },
    });
    const res = await postTranslate(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.translations) && data.translations.length === 2);
  }, 'دعم الترجمة المجمعة دفعة واحدة لتقليل زمن الاستجابة')();

  /* ─────────────────────────────────────────────────────────────
   * 2. Trip & Captain Operational APIs
   * ───────────────────────────────────────────────────────────── */
  await audit('2. واجهات الرحلات والكباتن', 'POST /api/trip/mutual-cancel - رفض الطلب بدون requestId بكود 400', async () => {
    const req = makeReq('https://bynkcom.com/api/trip/mutual-cancel', { method: 'POST', body: {} });
    const res = await postMutualCancel(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'missing_request_id');
  }, 'اشتراط معرف الرحلة لعملية الإلغاء')();

  await audit('2. واجهات الرحلات والكباتن', 'POST /api/trip/mutual-cancel - إرجاع 404 عند عدم وجود الرحلة', async () => {
    const req = makeReq('https://bynkcom.com/api/trip/mutual-cancel', {
      method: 'POST',
      body: { requestId: '00000000-0000-0000-0000-000000000000' },
    });
    const res = await postMutualCancel(req);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, 'trip_not_found');
  }, 'التعامل السليم مع معرفات الرحلات غير الموجودة')();

  await audit('2. واجهات الرحلات والكباتن', 'POST /api/captain/set-status - رفض الحالات غير الصالحة بكود 400', async () => {
    const req = makeReq('https://bynkcom.com/api/captain/set-status', {
      method: 'POST',
      body: { status: 'UNKNOWN_STATUS' },
    });
    const res = await postSetStatus(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'invalid_captain_status');
  }, 'حظر إرسال حالات غير معتمدة للكابتن')();

  await audit('2. واجهات الرحلات والكباتن', 'POST /api/captain/set-status - رفض الطلب غير الموثق بكود 401', async () => {
    const req = makeReq('https://bynkcom.com/api/captain/set-status', {
      method: 'POST',
      body: { status: 'active' },
    });
    const res = await postSetStatus(req);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'authentication_required');
  }, 'حماية مسار حالة الكابتن واشتراط تسجيل الدخول')();

  await audit('2. واجهات الرحلات والكباتن', 'GET /api/captain/wallet-directory - جلب قنوات التحويل والمناديب النشطة', async () => {
    const req = makeReq('https://bynkcom.com/api/captain/wallet-directory?countryId=1');
    const res = await getWalletDirectory(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.channels), 'Channels must be an array');
    assert.ok(Array.isArray(data.allDelegates), 'allDelegates must be an array');
  }, 'جلب دليل المحفظة وقنوات الدفع الخاصة بالأردن')();

  await audit('2. واجهات الرحلات والكباتن', 'GET /api/captain/wallet-directory - تصفية القنوات حسب الدولة (مصر countryId=2)', async () => {
    const req = makeReq('https://bynkcom.com/api/captain/wallet-directory?countryId=2');
    const res = await getWalletDirectory(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    // Every channel returned must belong to Egypt or be global (null countryId)
    const allEgyptOrGlobal = data.channels.every((c: any) => !c.countryId || c.countryId === 2);
    assert.ok(allEgyptOrGlobal, 'Must only include Egypt or global channels');
  }, 'عزل القنوات المالية الخاصة بمصر')();

  /* ─────────────────────────────────────────────────────────────
   * 3. Admin Security & Administration Access Control APIs
   * ───────────────────────────────────────────────────────────── */
  await audit('3. الرقابة والأمان الإداري', 'GET /api/admin/list-admins - رفض الطلبات غير المصرح بها (401)', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const req = makeReq('https://bynkcom.com/api/admin/list-admins', { headers: INVALID_AUTH_HEADERS });
      const res = await getListAdmins(req);
      assert.equal(res.status, 401);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  }, 'منع أي وصول غير إداري لقائمة المشرفين في بيئة الإنتاج')();

  await audit('3. الرقابة والأمان الإداري', 'GET /api/admin/list-admins - جلب قائمة المشرفين وتأكيد المشرف الأساسي', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/list-admins', { headers: DEV_ADMIN_HEADERS });
    const res = await getListAdmins(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.admins));
    const hasPrimary = data.admins.some((a: any) => a.is_primary || a.id === PRIMARY_SOVEREIGN_ADMIN_ID);
    assert.ok(hasPrimary, 'Must recognize primary sovereign admin');
  }, 'تمييز حساب المشرف العام الأساسي وحمايته')();

  await audit('3. الرقابة والأمان الإداري', 'POST /api/admin/create-sub-admin - رفض الطلب بدون بيانات كاملة بكود 400', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/create-sub-admin', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { fullName: 'مشرف تجريبي' }, // missing phone and password
    });
    const res = await postCreateSubAdmin(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'التحقق الصارم من متطلبات إنشاء مشرف جديد')();

  await audit('3. الرقابة والأمان الإداري', 'POST /api/admin/update-admin-rank - حظر تعديل رتبة المشرف العام الأساسي', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/update-admin-rank', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { targetAdminId: PRIMARY_SOVEREIGN_ADMIN_ID, newRank: 'ASSISTANT_ADMIN' },
    });
    const res = await postUpdateAdminRank(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('المشرف العام الأساسي'));
  }, 'حصانة المشرف العام الأساسي السيادية ضد خفض الرتبة')();

  await audit('3. الرقابة والأمان الإداري', 'POST /api/admin/delete-admin - حظر حذف المشرف العام الأساسي للنظام', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/delete-admin', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { targetAdminId: PRIMARY_SOVEREIGN_ADMIN_ID },
    });
    const res = await postDeleteAdmin(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes('المشرف العام الأساسي'));
  }, 'حصانة المشرف العام الأساسي السيادية ضد الحذف')();

  await audit('3. الرقابة والأمان الإداري', 'POST /api/admin/change-password - رفض كلمات المرور الأقل من 6 أحرف', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/change-password', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { newPassword: '123' },
    });
    const res = await postChangePassword(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'قفل أمان كلمة مرور المشرفين ومنع الكلمات الضعيفة')();

  await audit('3. الرقابة والأمان الإداري', 'GET /api/admin/kpis - جلب المؤشرات الإحصائية العامة بنجاح', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/kpis', { headers: DEV_ADMIN_HEADERS });
    const res = await getKpis(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(typeof data.stats.totalCaptains === 'number');
    assert.ok(typeof data.stats.totalRiders === 'number');
    assert.ok(typeof data.stats.activeCaptains === 'number');
    assert.equal(data.stats.systemHealth, '100% مستقر');
  }, 'استخراج مؤشرات الأداء الحية من قاعدة البيانات')();

  /* ─────────────────────────────────────────────────────────────
   * 4. Admin Regional Hourly Rates & Directory APIs
   * ───────────────────────────────────────────────────────────── */
  await audit('4. تسعير الساعات والدليل المالي', 'GET /api/admin/hourly-rates - رفض غير المصرح به بكود 401', async () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const req = makeReq('https://bynkcom.com/api/admin/hourly-rates', { headers: INVALID_AUTH_HEADERS });
      const res = await getHourlyRates(req);
      assert.equal(res.status, 401);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  }, 'حماية أسعار الساعات الإقليمية من الوصول العام في بيئة الإنتاج')();

  await audit('4. تسعير الساعات والدليل المالي', 'GET /api/admin/hourly-rates - جلب هرمية الدول والمحافظات والأسعار المخصصة', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/hourly-rates', { headers: DEV_ADMIN_HEADERS });
    const res = await getHourlyRates(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.countries));
    assert.ok(Array.isArray(data.governorates));
    assert.ok(Array.isArray(data.districts));
    assert.ok(typeof data.customRates === 'object');
  }, 'توفير مصفوفة تسعير الساعات لكافة المستويات الجغرافية')();

  await audit('4. تسعير الساعات والدليل المالي', 'POST /api/admin/hourly-rates - رفض إدخال سعر سالب أو صفر', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/hourly-rates', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'update_single_rate', targetType: 'governorate', targetId: 1, hourPrice: -5 },
    });
    const res = await postHourlyRates(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'منع إدخال أسعار ساعات سالبة أو معدومة')();

  await audit('4. تسعير الساعات والدليل المالي', 'GET /api/admin/transfer-channels - جلب قنوات التحويل بالكامل للإدارة', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/transfer-channels', { headers: DEV_ADMIN_HEADERS });
    const res = await getTransferChannels(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.channels));
  }, 'إدارة قنوات التحويل المالي (CliQ, محافظ إلكترونية، فودافون كاش)')();

  await audit('4. تسعير الساعات والدليل المالي', 'POST /api/admin/transfer-channels - رفض إنشاء قناة بدون اسم ورقم حساب', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/transfer-channels', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'create', nameAr: '' },
    });
    const res = await postTransferChannels(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'إلزامية الحقول الأساسية لقنوات التحويل المالي')();

  await audit('4. تسعير الساعات والدليل المالي', 'GET /api/admin/financial-delegates - جلب دليل المناديب للإدارة', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/financial-delegates', { headers: DEV_ADMIN_HEADERS });
    const res = await getFinancialDelegates(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.delegates));
  }, 'إدارة شبكة المناديب الماليين المعتمدين')();

  await audit('4. تسعير الساعات والدليل المالي', 'POST /api/admin/financial-delegates - رفض إضافة مندوب بدون اسم أو هاتف', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/financial-delegates', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'create', name: 'مندوب تجريبي' }, // missing phone
    });
    const res = await postFinancialDelegates(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'إلزامية رقم هاتف المندوب للتواصل والشحن')();

  /* ─────────────────────────────────────────────────────────────
   * 5. Admin Fleet & User Management APIs
   * ───────────────────────────────────────────────────────────── */
  await audit('5. إدارة المستخدمين والأسطول', 'GET /api/admin/users - جلب أسطول الكباتن مع بيانات المركبات والمحافظ', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/users?role=CAPTAIN', { headers: DEV_ADMIN_HEADERS });
    const res = await getAdminUsers(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.users));
    if (data.users.length > 0) {
      const sample = data.users[0];
      assert.ok('id' in sample);
      assert.ok('role' in sample);
      assert.ok('vehicle' in sample);
      assert.ok('wallet' in sample);
      assert.ok('documents' in sample);
    }
  }, 'فحص التجميع الذري لبيانات الكابتن والمركبة والمحفظة والوثائق')();

  await audit('5. إدارة المستخدمين والأسطول', 'GET /api/admin/users - جلب الركاب مع إحصائيات الرحلات والالتزام', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/users?role=RIDER', { headers: DEV_ADMIN_HEADERS });
    const res = await getAdminUsers(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.users));
    if (data.users.length > 0) {
      const sample = data.users[0];
      assert.equal(sample.role, 'RIDER');
      assert.ok('completed_trips_count' in sample);
      assert.ok('consecutive_cancellations' in sample);
    }
  }, 'فحص جلب الركاب ونقاط الالتزام والإلغاءات')();

  await audit('5. إدارة المستخدمين والأسطول', 'POST /api/admin/users - رفض الطلب بدون userId بكود 400', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/users', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'update_status', status: 'ACTIVE' },
    });
    const res = await postAdminUsers(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  }, 'اشتراط معرف المستخدم لأي تعديل فردي')();

  await audit('5. إدارة المستخدمين والأسطول', 'POST /api/admin/users - فك تعليق الكابتن والرحلات العالقة (force_clear_trip)', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/users', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'force_clear_trip', userId: '00000000-0000-0000-0000-000000000000' },
    });
    const res = await postAdminUsers(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
  }, 'أداة إنهاء التعليق وإعادة الكابتن إلى IDLE وإلغاء الرحلات العالقة بأمان')();

  /* ─────────────────────────────────────────────────────────────
   * 6. Admin Wallet & Financial Operations APIs
   * ───────────────────────────────────────────────────────────── */
  await audit('6. المالية والمحفظة الإدارية', 'GET /api/admin/wallet - جلب النظرة المالية العامة (overview)', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/wallet?view=overview', { headers: DEV_ADMIN_HEADERS });
    const res = await getAdminWallet(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok('overview' in data);
    assert.ok(typeof data.overview.totalCashBalance === 'number');
    assert.ok(typeof data.overview.totalPaidMinutes === 'number');
    assert.ok(typeof data.overview.jodBalance === 'number');
    assert.ok(typeof data.overview.egpBalance === 'number');
  }, 'حساب إجمالي الأرصدة والدقائق المعلقة في النظام للأردن ومصر')();

  await audit('6. المالية والمحفظة الإدارية', 'GET /api/admin/wallet - جلب قائمة قسائم الشحن (vouchers)', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/wallet?view=vouchers', { headers: DEV_ADMIN_HEADERS });
    const res = await getAdminWallet(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.vouchers));
  }, 'سجل قسائم الشحن الصادرة وحالات استخدامها')();

  await audit('6. المالية والمحفظة الإدارية', 'GET /api/admin/wallet - جلب سجل العمليات المالية (ledger)', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/wallet?view=ledger', { headers: DEV_ADMIN_HEADERS });
    const res = await getAdminWallet(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.ledger));
  }, 'دفتر الأستاذ المالي الشامل للمعاملات')();

  await audit('6. المالية والمحفظة الإدارية', 'POST /api/admin/wallet - توليد حزمة قسائم شحن جديدة بنجاح (generate_vouchers)', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/wallet', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'generate_vouchers', minutesValue: 120, count: 3 },
    });
    const res = await postAdminWallet(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.codes) && data.codes.length === 3);
  }, 'توليد كروت شحن مشفرة بعدد دقائق دقيق (ساعتان = 120 دقيقة)')();

  /* ─────────────────────────────────────────────────────────────
   * 7. Admin Notifications Center APIs
   * ───────────────────────────────────────────────────────────── */
  await audit('7. مركز الإشعارات الإداري', 'GET /api/admin/notifications - جلب إشعارات الإدارة مبوبة ومصنفة', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/notifications', { headers: DEV_ADMIN_HEADERS });
    const res = await getAdminNotifications(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.notifications));
    assert.ok(typeof data.summary.totalUnread === 'number');
  }, 'تبويب إشعارات الإيصالات، مراجعة الكباتن، واستعادة كلمات المرور')();

  await audit('7. مركز الإشعارات الإداري', 'POST /api/admin/notifications - تمييز كافة الإشعارات كمقروءة (MARK_ALL_READ)', async () => {
    const req = makeReq('https://bynkcom.com/api/admin/notifications', {
      method: 'POST',
      headers: DEV_ADMIN_HEADERS,
      body: { action: 'MARK_ALL_READ' },
    });
    const res = await postAdminNotifications(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
  }, 'تصفير عداد الإشعارات الجديدة بضغطة زر')();

  /* ─────────────────────────────────────────────────────────────
   * 8. Supabase Backend RPCs & Database Functions
   * ───────────────────────────────────────────────────────────── */
  await audit('8. دوال وقواعد Supabase', 'RPC get_server_time - مزامنة التوقيت السحابي بدقة متناهية', async () => {
    const { data, error } = await supabaseAdmin.rpc('get_server_time');
    assert.equal(error, null);
    assert.ok(data);
    const serverEpoch = new Date(data).getTime();
    const localEpoch = Date.now();
    const diffSeconds = Math.abs(serverEpoch - localEpoch) / 1000;
    assert.ok(diffSeconds < 60, 'Server time should align with current epoch within 60s');
  }, 'تثبيت الخاتم الزمني السحابي لحماية العدادات من التلاعب')();

  await audit('8. دوال وقواعد Supabase', 'RPC check_captain_identity_available - فحص خماسي الأبعاد لتفرد الهوية', async () => {
    const { data, error } = await supabaseAdmin.rpc('check_captain_identity_available', {
      p_phone: '+962799999999',
      p_national_id: '9999999999',
      p_plate_number: '99-99999',
      p_email: 'new_captain_unique_test@bynkcom.com',
      p_license_number: 'LIC-99999',
    });
    assert.equal(error, null);
    assert.ok(data);
    assert.equal(typeof data.phone_taken, 'boolean');
    assert.equal(typeof data.national_id_taken, 'boolean');
    assert.equal(typeof data.plate_taken, 'boolean');
    assert.equal(typeof data.email_taken, 'boolean');
    assert.equal(typeof data.license_taken, 'boolean');
  }, 'فحص منع تكرار الهاتف والرقم الوطني ورقم اللوحة والبريد والرخصة في نبضة واحدة')();

  await audit('8. دوال وقواعد Supabase', 'جدول app_flags - التحقق من وجود واستقرار أعلام النظام السيادية', async () => {
    const { data, error } = await supabaseAdmin
      .from('app_flags')
      .select('flag, enabled')
      .in('flag', ['captain_self_topup', 'hourly_rates_matrix', 'captain_transfer_channels']);
    assert.equal(error, null);
    assert.ok(Array.isArray(data));
  }, 'التأكد من جاهزية مفاتيح التحكم المركزية للتطبيق')();

  await audit('8. دوال وقواعد Supabase', 'جدول countries - التحقق من إعدادات تسعير الساعة للدول المعتمدة', async () => {
    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('id, name_ar, country_code, currency_ar, radar_hour_price')
      .order('id', { ascending: true });
    assert.equal(error, null);
    assert.ok(Array.isArray(data) && data.length >= 2);
    const jordan = data.find((c: any) => c.country_code === 'JO' || c.id === 1);
    const egypt = data.find((c: any) => c.country_code === 'EG' || c.id === 2);
    assert.ok(jordan, 'Jordan country config must exist');
    assert.ok(egypt, 'Egypt country config must exist');
    assert.ok(Number(jordan.radar_hour_price) > 0);
  }, 'تسعير ساعة الرادار الأساسية للأردن ومصر')();

  await audit('8. دوال وقواعد Supabase', 'جدول wallet_accounts - التحقق من صحة هيكل المحفظة والحسابات', async () => {
    const { data, error } = await supabaseAdmin
      .from('wallet_accounts')
      .select('profile_id, balance, paid_minutes_remaining, bonus_minutes_remaining')
      .limit(1);
    assert.equal(error, null);
  }, 'هيكل المحفظة يدعم الدقائق المدفوعة والدقائق المجانية والرصيد المالي عبر profile_id')();

  /* ─────────────────────────────────────────────────────────────
   * Summary
   * ───────────────────────────────────────────────────────────── */
  const total = detailedAuditLog.length;
  const passed = detailedAuditLog.filter((l) => l.passed).length;
  const failed = detailedAuditLog.filter((l) => !l.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log('\n══════════════════════════════════════════════════════════════════════════════');
  console.log('🏁 ملخص نتائج فحص واجهات الـ API ودوال الباك إند وقواعد البيانات:');
  console.log(`إجمالي الفحوصات المنفذة: ${total}`);
  console.log(`الفحوصات الناجحة (PASS): ${passed}`);
  console.log(`الفحوصات الفاشلة (FAIL): ${failed}`);
  console.log(`نسبة النجاح الإجمالية: ${passRate}%`);
  console.log('══════════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveApiAndBackendAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
