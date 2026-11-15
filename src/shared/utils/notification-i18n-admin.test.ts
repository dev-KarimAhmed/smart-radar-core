import assert from 'node:assert/strict';
import test from 'node:test';
import {
  encodeNotificationPayload,
  parseNotificationContent,
} from './notification-i18n';

test('resolveDynamicNotification translates receipt rejections, topups, and admin status actions', () => {
  const rejectedDefault = parseNotificationContent(
    {
      title: 'تعذر اعتماد إيصال الشحن ⚠️',
      description: 'تم رفض إيصال الشحن للسبب التالي: الإيصال غير واضح أو المبلغ لا يطابق عملية التحويل.. يمكنك إعادة إرسال إيصال صحيح.',
    },
    false
  );
  assert.equal(rejectedDefault.title, 'Notice: Recharge Receipt Not Approved ⚠️');
  assert.ok(rejectedDefault.description.includes('does not match the transfer'));
  assert.equal(rejectedDefault.descriptionNeedsTranslation, false);

  const rejectedCustom = parseNotificationContent(
    {
      title: 'تنبيه: تعذر قبول إيصال الشحن ⚠️',
      description: 'تم رفض الإيصال للأسباب التالية: صورة التحويل مقطوعة. يرجى مراجعة الإدارة أو إعادة المحاولة بإيصال واضح.',
    },
    false
  );
  assert.equal(rejectedCustom.title, 'Notice: Recharge Receipt Not Approved ⚠️');
  assert.equal(rejectedCustom.titleNeedsTranslation, false);
  assert.equal(rejectedCustom.descriptionNeedsTranslation, true);

  const directTopup = parseNotificationContent(
    {
      title: 'شحن رصيد من الإدارة ⚡',
      description: 'تم شحن حسابك من قِبل إدارة النظام: +15 د.أ +120 دقيقة رادار.',
    },
    false
  );
  assert.equal(directTopup.title, 'Balance Top-Up from Administration ⚡');
  assert.ok(directTopup.description.includes('+15 JOD'));
  assert.ok(directTopup.description.includes('+120 radar minutes'));

  const resetPenalties = parseNotificationContent(
    {
      title: 'سجل المخالفات وكوابح السوق 🛡️',
      description: 'تمت مراجعة حسابك وتصفير سجل المخالفات بالكامل.',
    },
    false
  );
  assert.equal(resetPenalties.title, 'Violations Log & Market Brakes Cleared 🛡️');
  assert.equal(resetPenalties.descriptionNeedsTranslation, false);

  const tierPromo = parseNotificationContent(
    {
      title: 'ترقية سيادية: أصبحت رتبتك الذهبية 🥇 🏆',
      description: 'تهانينا يا كابتن معلن! قامت الإدارة بترقية رتبتك.',
    },
    false
  );
  assert.equal(tierPromo.title, 'Sovereign Promotion: Your rank is now Gold 🥇');
  assert.ok(tierPromo.description.includes('Gold 🥇'));
});

test('parseNotificationContent repairs legacy i18n tags with duplicated Arabic and preserves custom admin messages', () => {
  const brokenLegacy = encodeNotificationPayload(
    'رسالة من إدارة المنظومة',
    'يرجى مراجعة المكتب الرئيسي يوم الأحد',
    'رسالة من إدارة المنظومة',
    'يرجى مراجعة المكتب الرئيسي يوم الأحد'
  );

  const parsedEn = parseNotificationContent(brokenLegacy, false);
  assert.equal(parsedEn.title, 'Message from System Administration');
  assert.equal(parsedEn.titleNeedsTranslation, false);
  assert.equal(parsedEn.description, 'يرجى مراجعة المكتب الرئيسي يوم الأحد');
  assert.equal(parsedEn.descriptionNeedsTranslation, true);

  const customMgmt = parseNotificationContent(
    {
      title: 'رسالة من الإدارة',
      description: 'نشكرك على التزامك بمعايير الجودة هذا الأسبوع',
    },
    false
  );
  assert.equal(customMgmt.title, 'Message from management');
  assert.equal(customMgmt.titleNeedsTranslation, false);
  assert.equal(customMgmt.description, 'نشكرك على التزامك بمعايير الجودة هذا الأسبوع');
  assert.equal(customMgmt.descriptionNeedsTranslation, true);

  const englishCustomInAr = parseNotificationContent(
    {
      title: 'Maintenance Notice',
      description: 'Scheduled server update tonight at 02:00 UTC.',
    },
    true
  );
  assert.equal(englishCustomInAr.titleNeedsTranslation, true);
  assert.equal(englishCustomInAr.descriptionNeedsTranslation, true);
});

test('resolveDynamicNotification translates all Admin-to-Rider status, rehabilitation, headers, and templates bidirectionally', () => {
  const riderActive = parseNotificationContent(
    {
      title: 'تم تنشيط حسابك على الرادار ⚡',
      description: 'قامت إدارة المنظومة بتنشيط حسابك فورياً، وأصبحت جاهزاً لطلب الرحلات والتواصل مع الكباتن المعلنين عبر الرادار.',
    },
    false
  );
  assert.equal(riderActive.title, 'Your Radar Account Is Now Active ⚡');
  assert.ok(riderActive.description.includes('request rides'));
  assert.equal(riderActive.titleNeedsTranslation, false);
  assert.equal(riderActive.descriptionNeedsTranslation, false);

  const riderIdle = parseNotificationContent(
    {
      title: 'تم ضبط حسابك إلى وضع الجاهزية 🛑',
      description: 'أنت الآن في وضع الجاهزية، يمكنك طلب الرحلات عبر الرادار في أي وقت.',
    },
    false
  );
  assert.equal(riderIdle.title, 'Account Set to Ready Mode 🛑');
  assert.ok(riderIdle.description.includes('Ready mode'));
  assert.equal(riderIdle.descriptionNeedsTranslation, false);

  const riderSuspended = parseNotificationContent(
    {
      title: 'تنبيه إداري: تم تعليق حساب المستخدم مؤقتاً ⚠️',
      description: 'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات لمراجعة النشاط أو المناعة السلوكية.',
    },
    false
  );
  assert.equal(riderSuspended.title, 'Administrative Notice: Account Temporarily Suspended ⚠️');
  assert.equal(riderSuspended.titleNeedsTranslation, false);

  const riderBanned = parseNotificationContent(
    {
      title: 'إشعار أمني: تم حظر حساب المستخدم نهائياً 🚫',
      description: 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية. تم إيقاف إمكانية طلب الرحلات والاتصال بالرادار.',
    },
    false
  );
  assert.equal(riderBanned.title, 'Security Notice: Account Permanently Banned 🚫');
  assert.ok(riderBanned.description.includes('Ride requests and radar access have been disabled'));

  const riderRehab = parseNotificationContent(
    {
      title: 'إعادة تأهيل الحساب والنزاهة السلوكية 🛡️',
      description: 'تمت إعادة تأهيل حسابك واستعادة مؤشر النزاهة والمناعة السلوكية إلى 5.0 نجوم كاملة وتصفير أي عقوبات سابقة بنجاح.',
    },
    false
  );
  assert.equal(riderRehab.title, 'Account Rehabilitation & Behavioral Integrity 🛡️');
  assert.ok(riderRehab.description.includes('behavioral immunity index restored'));

  const enDirectiveInAr = parseNotificationContent(
    {
      title: 'Directive from Platform Administration',
      description: 'Welcome to bynkcom! We wish you safe and pleasant rides always.',
    },
    true
  );
  assert.equal(enDirectiveInAr.title, 'توجيه من إدارة المنظومة');
  assert.equal(
    enDirectiveInAr.description,
    'مرحباً بك في بينكم - bynkcom! نتمنى لك تجربة رحلات ممتعة وآمنة دائماً.'
  );
  assert.equal(enDirectiveInAr.titleNeedsTranslation, false);
  assert.equal(enDirectiveInAr.descriptionNeedsTranslation, false);

  const arBroadcastInEn = parseNotificationContent(
    {
      title: 'إشعار توجيهي من إدارة المنظومة',
      description: 'تنبيه: نرجو الالتزام بعدم تكرار إلغاء الطلبات للحفاظ على تقييم حسابك.',
    },
    false
  );
  assert.equal(arBroadcastInEn.title, 'Directive Notification from System Administration');
  assert.equal(
    arBroadcastInEn.description,
    'Admin Notice: Please avoid consecutive cancellations to maintain your account trust score.'
  );
  assert.equal(arBroadcastInEn.titleNeedsTranslation, false);
  assert.equal(arBroadcastInEn.descriptionNeedsTranslation, false);

  const brokenArEnvelope = encodeNotificationPayload(
    'Special Rider Update',
    'Please check pickup pin before confirming.',
    'Rider Alert',
    'Please verify pin.'
  );
  const brokenParsedInAr = parseNotificationContent(brokenArEnvelope, true);
  assert.equal(brokenParsedInAr.titleNeedsTranslation, true);
  assert.equal(brokenParsedInAr.descriptionNeedsTranslation, true);
});
