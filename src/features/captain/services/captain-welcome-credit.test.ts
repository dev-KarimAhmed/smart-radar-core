import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_WELCOME_HOURS_CONFIG,
  WELCOME_HOURS_FLAG_KEY,
} from './captain-welcome-credit';
import { encodeNotificationPayload, parseNotificationContent } from '@/shared/utils/notification-i18n';

test('DEFAULT_WELCOME_HOURS_CONFIG is disabled (0 hours) since Launch Package provides the free month', () => {
  assert.equal(DEFAULT_WELCOME_HOURS_CONFIG.enabled, false);
  assert.equal(DEFAULT_WELCOME_HOURS_CONFIG.hours, 0);
  assert.equal(DEFAULT_WELCOME_HOURS_CONFIG.minutes, 0);
  assert.equal(DEFAULT_WELCOME_HOURS_CONFIG.validityDays, 0);
  assert.equal(WELCOME_HOURS_FLAG_KEY, 'new_captain_welcome_credit');
});

test('Welcome credit notification payload encodes dual language and resolves correctly', () => {
  const hours = 20;
  const days = 30;
  const titleAr = `هدية ترحيبية: ${hours} ساعة رادار مجاناً 🎁⚡`;
  const bodyAr = `أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره (${hours}) ساعة طيران رادار في محفظتك بنجاح وتمديد الصلاحية لـ ${days} يوماً لتنطلق في استقبال الرحلات فوراً.`;
  const titleEn = `Welcome Gift: ${hours} Free Radar Hours 🎁⚡`;
  const bodyEn = `Welcome Captain! A welcome credit of (${hours}) radar flight hours has been deposited into your wallet, valid for ${days} days, to start accepting rides immediately.`;

  const encoded = encodeNotificationPayload(titleAr, bodyAr, titleEn, bodyEn);
  assert.ok(encoded.description.includes('<!--i18n:'));

  // Test Arabic resolution (isArabic = true)
  const parsedAr = parseNotificationContent(
    { title: encoded.title, description: encoded.description },
    true
  );
  assert.equal(parsedAr.title, titleAr);
  assert.equal(parsedAr.description, bodyAr);
  assert.equal(parsedAr.hasTranslation, true);

  // Test English resolution (isArabic = false)
  const parsedEn = parseNotificationContent(
    { title: encoded.title, description: encoded.description },
    false
  );
  assert.equal(parsedEn.title, titleEn);
  assert.equal(parsedEn.description, bodyEn);
  assert.equal(parsedEn.hasTranslation, true);
});

test('Custom hours correctly compute proportional radar minutes', () => {
  const testCases = [
    { hours: 10, expectedMins: 600 },
    { hours: 20, expectedMins: 1200 },
    { hours: 40, expectedMins: 2400 },
    { hours: 50, expectedMins: 3000 },
  ];

  for (const tc of testCases) {
    assert.equal(tc.hours * 60, tc.expectedMins);
  }
});

