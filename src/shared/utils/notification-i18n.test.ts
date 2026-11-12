import assert from 'node:assert/strict';
import test from 'node:test';
import {
  encodeNotificationPayload,
  parseNotificationContent,
  resolveDynamicNotification,
} from './notification-i18n';

test('encodeNotificationPayload embeds standard i18n payload', () => {
  const encoded = encodeNotificationPayload(
    'اكتملت الرحلة بنجاح 💰',
    'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.',
    'Trip Completed Successfully 💰',
    'Trip ended and your earnings have been recorded successfully.'
  );

  assert.equal(encoded.title, 'اكتملت الرحلة بنجاح 💰');
  assert.ok(encoded.description.includes('<!--i18n:'));

  // Parse in Arabic
  const parsedAr = parseNotificationContent(encoded, true);
  assert.equal(parsedAr.title, 'اكتملت الرحلة بنجاح 💰');
  assert.equal(parsedAr.description, 'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.');
  assert.equal(parsedAr.hasTranslation, true);

  // Parse in English
  const parsedEn = parseNotificationContent(encoded, false);
  assert.equal(parsedEn.title, 'Trip Completed Successfully 💰');
  assert.equal(parsedEn.description, 'Trip ended and your earnings have been recorded successfully.');
  assert.equal(parsedEn.hasTranslation, true);
});

test('resolveDynamicNotification translates Trip Completed (Captain)', () => {
  const item = {
    title: 'اكتملت الرحلة بنجاح 💰',
    description: 'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'Trip Completed Successfully 💰');
  assert.equal(parsedEn.description, 'Trip ended and your earnings have been recorded successfully.');

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'اكتملت الرحلة بنجاح 💰');
  assert.equal(parsedAr.description, 'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.');
});

test('resolveDynamicNotification translates Trip Completed (Rider)', () => {
  const item = {
    title: 'اكتملت الرحلة بنجاح ✅',
    description: 'شكراً لاختيارك رادار. نأمل أن تكون قد استمتعت برحلتك.',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'Trip Completed Successfully ✅');
  assert.equal(parsedEn.description, 'Thank you for choosing Radar. We hope you enjoyed your ride.');

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'اكتملت الرحلة بنجاح ✅');
  assert.equal(parsedAr.description, 'شكراً لاختيارك رادار. نأمل أن تكون قد استمتعت برحلتك.');
});

test('resolveDynamicNotification translates Trip Accepted (with captain/rider name)', () => {
  const item = {
    title: 'تم قبول عرضك 🎉',
    description: 'وافق karim ahmed على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'Your Offer Was Accepted 🎉');
  assert.equal(parsedEn.description, 'karim ahmed accepted your offer. Please start heading to the pickup location now.');

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'تم قبول عرضك 🎉');
  assert.equal(parsedAr.description, 'وافق karim ahmed على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.');
});

test('resolveDynamicNotification translates Captain Arrived', () => {
  const item = {
    title: 'وصل الكابتن إلى موقعك 📍',
    description: 'الكابتن dulamah faiz fa aljabali بانتظارك الآن في نقطة الانطلاق.',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'Captain Arrived At Your Location 📍');
  assert.equal(parsedEn.description, 'Captain dulamah faiz fa aljabali is waiting for you at the pickup location.');

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'وصل الكابتن إلى موقعك 📍');
  assert.equal(parsedAr.description, 'الكابتن dulamah faiz fa aljabali بانتظارك الآن في نقطة الانطلاق.');
});

test('resolveDynamicNotification translates Trip Started', () => {
  const item = {
    title: 'بدأت الرحلة 🚗',
    description: 'نتمنى لك رحلة آمنة ومريحة مع رادار.',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'Trip Started 🚗');
  assert.equal(parsedEn.description, 'Wishing you a safe and comfortable trip with Radar.');

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'بدأت الرحلة 🚗');
  assert.equal(parsedAr.description, 'نتمنى لك رحلة آمنة ومريحة مع رادار.');
});

test('resolveDynamicNotification translates New Captain Offer', () => {
  const item = {
    title: 'عرض كابتن جديد 🚗',
    description: 'وصلك عرض بقيمة 2.14 ج.م من الكابتن dulamah faiz fa aljabali (وصول خلال 1 د)',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'New Captain Offer 🚗');
  assert.equal(parsedEn.description, 'You received an offer of 2.14 EGP from Captain dulamah faiz fa aljabali (arrival in 1 min)');

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'عرض كابتن جديد 🚗');
  assert.equal(parsedAr.description, 'وصلك عرض بقيمة 2.14 ج.م من الكابتن dulamah faiz fa aljabali (وصول خلال 1 د)');
});

test('resolveDynamicNotification translates English Management Notice to Arabic', () => {
  const item = {
    title: 'Message from management',
    description: "Please renew your driver's license or vehicle documents to avoid account suspension.",
  };

  const parsedAr = parseNotificationContent(item, true);
  assert.equal(parsedAr.title, 'رسالة من الإدارة');
  assert.equal(parsedAr.description, 'يرجى تجديد رخصة القيادة أو وثائق المركبة لتجنب إيقاف الحساب.');

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'Message from management');
  assert.equal(parsedEn.description, "Please renew your driver's license or vehicle documents to avoid account suspension.");
});

test('resolveDynamicNotification translates Referral notifications', () => {
  const item = {
    title: 'انضمام راكب جديد عبر رابط الإحالة 🎉',
    description: 'انضم الراكب (أحمد علي) عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.',
  };

  const parsedEn = parseNotificationContent(item, false);
  assert.equal(parsedEn.title, 'New Referral Rider Joined 🎉');
  assert.equal(parsedEn.description, 'Rider (أحمد علي) joined via your referral link and was added to your favorite riders list.');
});

test('resolveDynamicNotification translates Bynkcom welcome and legal log notifications', () => {
  const welcome = {
    title: 'مرحباً بك في شبكة بينكم للإعلان الرقمي 🌟',
    description: 'تم تفعيل حسابك بنجاح وأصبح جاهزاً للاستخدام بالكامل. أهلاً بك في منصة بينكم للإعلان الرقمي.',
  };
  const welcomeEn = parseNotificationContent(welcome, false);
  assert.equal(welcomeEn.title, 'Welcome to Bynkcom Digital Ad Network 🌟');
  assert.equal(
    welcomeEn.description,
    'Your account has been successfully activated and is now ready for full use. Welcome to Bynkcom Digital Ad Network.'
  );
  assert.equal(welcomeEn.titleNeedsTranslation, false);
  assert.equal(welcomeEn.descriptionNeedsTranslation, false);

  const welcomeAr = parseNotificationContent(welcome, true);
  assert.equal(welcomeAr.title, welcome.title);

  const legal = {
    title: 'توثيق السجل القانوني الإلكتروني 🛡️',
    description: 'تم توثيق الإقرار وحفظه في السجل القانوني الإلكتروني في شاشة سجلاتي.',
  };
  const legalEn = parseNotificationContent(legal, false);
  assert.equal(legalEn.title, 'Electronic Legal Log Verification 🛡️');
  assert.equal(
    legalEn.description,
    'The declaration has been verified and saved in the Electronic Legal Log on the My Records screen.'
  );
  assert.equal(legalEn.titleNeedsTranslation, false);
  assert.equal(legalEn.descriptionNeedsTranslation, false);
});

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

  // Rule #16 regression check: 'رسالة من الإدارة' with non-license custom body must NOT overwrite body
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

  // English custom message viewed in Arabic UI triggers runtime translation flag
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
  // 1. Rider Status: ACTIVE
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

  // 2. Rider Status: IDLE (Ready Mode)
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

  // 3. Rider Status: SUSPENDED & BANNED
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

  // 4. Rider Behavioral Immunity Rehabilitation (reset_penalties)
  const riderRehab = parseNotificationContent(
    {
      title: 'إعادة تأهيل الحساب والنزاهة السلوكية 🛡️',
      description: 'تمت إعادة تأهيل حسابك واستعادة مؤشر النزاهة والمناعة السلوكية إلى 5.0 نجوم كاملة وتصفير أي عقوبات سابقة بنجاح.',
    },
    false
  );
  assert.equal(riderRehab.title, 'Account Rehabilitation & Behavioral Integrity 🛡️');
  assert.ok(riderRehab.description.includes('behavioral immunity index restored'));

  // 5. English-authored Admin-to-Rider Directive & Quick Template viewed in Arabic Rider UI
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

  // 6. Arabic Bulk Rider Notification & Quick Template viewed in English Rider UI
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

  // 7. English i18n envelope with missing Arabic translation triggers needsTranslation in Arabic UI even if title_ar !== title_en
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



