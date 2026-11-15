import assert from 'node:assert/strict';
import test from 'node:test';
import {
  encodeNotificationPayload,
  parseNotificationContent,
} from './notification-i18n';
import { isValidTranslatedOutput } from '../server/translate';

test('resolveDynamicNotification translates Captain Direct/Bulk & Wallet Receipt headers and quick templates bidirectionally', () => {
  const captainDirectEnInAr = parseNotificationContent(
    {
      title: 'Directive from System Administration',
      description: 'Appreciation from byncom Administration for your exemplary service and commitment.',
    },
    true
  );
  assert.equal(captainDirectEnInAr.title, 'توجيه من إدارة المنظومة');
  assert.equal(
    captainDirectEnInAr.description,
    'شكر وتقدير من إدارة بينكم لأدائك المتميز والتزامك العالي.'
  );
  assert.equal(captainDirectEnInAr.titleNeedsTranslation, false);
  assert.equal(captainDirectEnInAr.descriptionNeedsTranslation, false);

  const captainLicenseArInEn = parseNotificationContent(
    {
      title: 'رسالة من إدارة المنظومة',
      description: 'يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب تعليق الحساب.',
    },
    false
  );
  assert.equal(captainLicenseArInEn.title, 'Message from System Administration');
  assert.equal(
    captainLicenseArInEn.description,
    'Please renew driving license or vehicle documents to avoid account suspension.'
  );
  assert.equal(captainLicenseArInEn.titleNeedsTranslation, false);
  assert.equal(captainLicenseArInEn.descriptionNeedsTranslation, false);

  const bulkWeekendEn = parseNotificationContent(
    {
      title: 'إشعار من إدارة المنظومة',
      description: 'بشرى سارة: تم شحن دقائق إضافية لحسابكم بمناسبة نهاية الأسبوع!',
    },
    false
  );
  assert.equal(bulkWeekendEn.title, 'Notice from System Administration');
  assert.equal(
    bulkWeekendEn.description,
    'Good news: Extra flight minutes have been credited to your account for the weekend!'
  );
  assert.equal(bulkWeekendEn.descriptionNeedsTranslation, false);

  const bulkDemandAr = parseNotificationContent(
    {
      title: 'Notice from System Administration',
      description: 'Important alert: Please go online, order demand in your area is surging right now!',
    },
    true
  );
  assert.equal(bulkDemandAr.title, 'إشعار من إدارة المنظومة');
  assert.equal(
    bulkDemandAr.description,
    'تنبيه هام: يرجى تفعيل وضع الاتصال، الطلبات في منطقتك مرتفعة الآن!'
  );
  assert.equal(bulkDemandAr.descriptionNeedsTranslation, false);

  const walletMsgEn = parseNotificationContent(
    {
      title: 'إشعار بخصوص إيصال الشحن',
      description: 'لم نتمكن من مطابقة الرقم المرجعي للحوالة، يرجى تزويدنا به للتأكيد.',
    },
    false
  );
  assert.equal(walletMsgEn.title, 'Notification Regarding Recharge Receipt');
  assert.equal(
    walletMsgEn.description,
    'Could not match transfer reference number. Please provide it to verify.'
  );
  assert.equal(walletMsgEn.titleNeedsTranslation, false);
  assert.equal(walletMsgEn.descriptionNeedsTranslation, false);

  const adminCenterCaptainItem = encodeNotificationPayload(
    'كابتن معلن جديد بانتظار مراجعة المستندات والتحقق',
    'انضم الكابتن المعلن أحمد علي (+962790000000) للأسطول وبانتظار اعتماد رخصة القيادة والسيارة.',
    'New Captain Pending Document Verification',
    "Captain أحمد علي (+962790000000) joined the fleet and is awaiting driver's license & vehicle verification."
  );
  const parsedAdminCaptainAr = parseNotificationContent(adminCenterCaptainItem, true);
  assert.ok(parsedAdminCaptainAr.description.includes('بانتظار اعتماد رخصة القيادة والسيارة'));
  const parsedAdminCaptainEn = parseNotificationContent(adminCenterCaptainItem, false);
  assert.ok(parsedAdminCaptainEn.description.includes("awaiting driver's license & vehicle verification"));
  assert.equal(parsedAdminCaptainEn.descriptionNeedsTranslation, false);
});

test('parseNotificationContent handles bilingual EN text containing Arabic proper names without re-translating, and legal log combined label', () => {
  const referralWithArName = encodeNotificationPayload(
    'انضمام راكب جديد عبر رابط الإحالة 🎉',
    'انضم الراكب (أحمد علي) عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.',
    'New Referral Rider Joined 🎉',
    'Rider (أحمد علي) joined via your referral link and was added to your favorite riders list.'
  );
  const refEn = parseNotificationContent(referralWithArName, false);
  assert.equal(refEn.titleNeedsTranslation, false);
  assert.equal(refEn.descriptionNeedsTranslation, false);

  const customWithProperName = encodeNotificationPayload(
    'تنبيه إداري خاص',
    'مرحباً أحمد علي، يرجى التواصل مع خدمة العملاء لتأكيد الموعد.',
    'Special Admin Notice',
    'Hello أحمد علي, please contact customer support to confirm the appointment.'
  );
  const customEn = parseNotificationContent(customWithProperName, false);
  assert.equal(customEn.titleNeedsTranslation, false);
  assert.equal(customEn.descriptionNeedsTranslation, false);

  const legalCombined = parseNotificationContent(
    {
      title: 'إقرار قانوني إلكتروني: تعديل بيانات الحساب الشخصي / الحساب والمركبة',
      description: 'رقم الإقرار: DEC-123 | المستخدم: CAP-1 — تم التوثيق',
    },
    false
  );
  assert.equal(
    legalCombined.title,
    'Electronic Legal Declaration: Personal Account & Vehicle Details Update'
  );
  assert.equal(legalCombined.titleNeedsTranslation, false);
  assert.equal(legalCombined.descriptionNeedsTranslation, false);
});

test('isValidTranslatedOutput rejects error banners and identical strings while allowing proper nouns', () => {
  assert.equal(
    isValidTranslatedOutput(
      'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.',
      'رسالة تجريبية',
      'en'
    ),
    false
  );
  assert.equal(isValidTranslatedOutput('رسالة تجريبية', 'رسالة تجريبية', 'en'), false);
  assert.equal(
    isValidTranslatedOutput('Hello أحمد علي, please contact support.', 'مرحباً أحمد علي، يرجى التواصل مع الدعم.', 'en'),
    true
  );
  assert.equal(isValidTranslatedOutput('مرحباً بكم في بينكم', 'Welcome to bynkcom', 'ar'), true);
});
