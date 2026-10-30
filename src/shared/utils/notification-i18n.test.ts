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

