import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldSendExpirationReminder,
  EXPIRATION_REMINDER_THRESHOLD_MS,
  getReminderStorageKey,
} from './captain-package-reminder';
import type { CaptainAdPackage } from './captain-ads-types';

test('captain-package-reminder: shouldSendExpirationReminder rules', () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. Inactive / Unsubscribed package should NOT send reminder
  const unsubscribed: CaptainAdPackage = {
    packageId: 'PACKAGE_A',
    packageNameAr: 'الباقة الافتتاحية',
    packageNameEn: 'Launch Package',
    status: 'UNSUBSCRIBED',
    durationDays: 30,
    maxAds: 4,
    coverageMeters: 500,
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: unsubscribed, now }), false);

  // 2. Active package with 10 days remaining should NOT send reminder
  const tenDaysLeft: CaptainAdPackage = {
    ...unsubscribed,
    status: 'ACTIVE',
    subscribedAt: new Date(now - 20 * dayMs).toISOString(),
    expiresAt: new Date(now + 10 * dayMs).toISOString(),
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: tenDaysLeft, now }), false);

  // 3. Active package with 3 days remaining (> 48h) should NOT send reminder
  const threeDaysLeft: CaptainAdPackage = {
    ...unsubscribed,
    status: 'ACTIVE',
    subscribedAt: new Date(now - 27 * dayMs).toISOString(),
    expiresAt: new Date(now + 3 * dayMs).toISOString(),
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: threeDaysLeft, now }), false);

  // 4. Active package with exactly 48 hours remaining should send reminder
  const fortyEightHoursLeft: CaptainAdPackage = {
    ...unsubscribed,
    status: 'ACTIVE',
    subscribedAt: new Date(now - 28 * dayMs).toISOString(),
    expiresAt: new Date(now + EXPIRATION_REMINDER_THRESHOLD_MS).toISOString(),
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: fortyEightHoursLeft, now }), true);

  // 5. Active package with 24 hours remaining should send reminder
  const twentyFourHoursLeft: CaptainAdPackage = {
    ...unsubscribed,
    status: 'ACTIVE',
    subscribedAt: new Date(now - 29 * dayMs).toISOString(),
    expiresAt: new Date(now + 1 * dayMs).toISOString(),
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: twentyFourHoursLeft, now }), true);

  // 6. Active package with 2 hours remaining should send reminder
  const twoHoursLeft: CaptainAdPackage = {
    ...unsubscribed,
    status: 'ACTIVE',
    subscribedAt: new Date(now - 29.9 * dayMs).toISOString(),
    expiresAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: twoHoursLeft, now }), true);

  // 7. Active package already expired should NOT send reminder
  const alreadyExpired: CaptainAdPackage = {
    ...unsubscribed,
    status: 'ACTIVE',
    subscribedAt: new Date(now - 31 * dayMs).toISOString(),
    expiresAt: new Date(now - 1 * dayMs).toISOString(),
  };
  assert.equal(shouldSendExpirationReminder({ adPackage: alreadyExpired, now }), false);

  // 8. Idempotency: If already dispatched, should return false
  assert.equal(
    shouldSendExpirationReminder({
      adPackage: twentyFourHoursLeft,
      now,
      isDispatchedAlready: true,
    }),
    false
  );
});

test('captain-package-reminder: storage key generation', () => {
  const key = getReminderStorageKey('cpt_123', '2026-11-01T00:00:00.000Z');
  assert.equal(key, 'radar_ad_pkg_exp_reminder_dispatched_cpt_123_2026-11-01T00:00:00.000Z');
});
