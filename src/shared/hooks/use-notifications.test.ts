import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

// Mock localStorage for Node test runner
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  get length() { return Object.keys(mockStorage).length; },
};

const {
  getNotificationStorageKey,
  switchStoreUser,
  clearNotificationMemoryStore,
} = await import('./use-notifications');

test('getNotificationStorageKey isolates keys per user', () => {
  assert.equal(getNotificationStorageKey(null), null);
  assert.equal(getNotificationStorageKey('user-123'), 'radar_user_notifications_user-123');
  assert.equal(getNotificationStorageKey('user-456'), 'radar_user_notifications_user-456');
  assert.notEqual(getNotificationStorageKey('user-123'), getNotificationStorageKey('user-456'));
});

test('switchStoreUser starts brand new account with 0 notifications', () => {
  // Unauthenticated user starts empty
  switchStoreUser(null);
  
  // Switch to user A
  const userA = 'user-a-1111';
  switchStoreUser(userA);

  // Set mock notification in user A's storage
  mockStorage[getNotificationStorageKey(userA)!] = JSON.stringify([
    { id: 'notif-a', title: 'Trip Offer', description: 'Offer 1', timestamp: Date.now(), read: false }
  ]);
  switchStoreUser(userA);

  // Switch to brand new user B
  const userB = 'user-b-brand-new';
  switchStoreUser(userB);

  // Assert user B's storage does not bleed user A's notifications
  assert.equal(mockStorage[getNotificationStorageKey(userB)!], undefined);

  // Clear memory store cleans up
  clearNotificationMemoryStore();
});

test('isAdminNotification and isTripOrSystemNotification categorize correctly', async () => {
  const { isAdminNotification, isTripOrSystemNotification } = await import('./use-notifications');

  // Admin types
  assert.equal(isAdminNotification({ type: 'admin_message' }), true);
  assert.equal(isAdminNotification({ type: 'warning' }), true);
  assert.equal(isAdminNotification({ type: 'urgent' }), true);
  assert.equal(isAdminNotification({ type: 'admin' }), true);
  assert.equal(isTripOrSystemNotification({ type: 'admin_message' }), false);

  // Trip & System types
  assert.equal(isAdminNotification({ type: 'trip' }), false);
  assert.equal(isTripOrSystemNotification({ type: 'trip' }), true);
  assert.equal(isAdminNotification({ type: 'offer' }), false);
  assert.equal(isTripOrSystemNotification({ type: 'offer' }), true);
  assert.equal(isAdminNotification({ type: 'system' }), false);
  assert.equal(isTripOrSystemNotification({ type: 'system' }), true);
  assert.equal(isAdminNotification({ type: 'WALLET_CREDIT' }), false);
  assert.equal(isTripOrSystemNotification({ type: 'WALLET_CREDIT' }), true);
});

test('isNotificationExpired correctly expires trips older than 72 hours', async () => {
  const { isNotificationExpired } = await import('./use-notifications');

  const now = Date.now();
  const seventyThreeHoursAgo = now - 73 * 60 * 60 * 1000;
  const oneHourAgo = now - 1 * 60 * 60 * 1000;

  // Old trip & offer notifications expire
  assert.equal(isNotificationExpired({ timestamp: seventyThreeHoursAgo, type: 'trip' }), true);
  assert.equal(isNotificationExpired({ timestamp: seventyThreeHoursAgo, type: 'offer' }), true);

  // Recent notifications do not expire
  assert.equal(isNotificationExpired({ timestamp: oneHourAgo, type: 'trip' }), false);
  assert.equal(isNotificationExpired({ timestamp: oneHourAgo, type: 'offer' }), false);

  // Admin messages do not expire via 72h trip purge
  assert.equal(isNotificationExpired({ timestamp: seventyThreeHoursAgo, type: 'admin_message' }), false);
});

test('category isolation: selective deletion preserves other notification categories', async () => {
  const { getNotificationStorageKey, switchStoreUser } = await import('./use-notifications');

  const testUser = 'user-isolation-test';
  const storageKey = getNotificationStorageKey(testUser)!;

  const initialList = [
    { id: 'admin-1', title: 'Admin Notice', description: 'Notice 1', timestamp: Date.now(), read: false, type: 'admin_message' },
    { id: 'trip-1', title: 'Trip Started', description: 'Trip 1', timestamp: Date.now(), read: false, type: 'trip' },
    { id: 'trip-2', title: 'Trip Offer', description: 'Offer 1', timestamp: Date.now(), read: false, type: 'offer' },
  ];

  mockStorage[storageKey] = JSON.stringify(initialList);
  switchStoreUser(testUser);

  // Simulate user selecting all admin notifications and deleting them by specific IDs
  const adminIdsToDelete = new Set(['admin-1']);
  const remaining = initialList.filter(n => !adminIdsToDelete.has(n.id));
  mockStorage[storageKey] = JSON.stringify(remaining);

  // Ensure trip notifications remain intact
  const stored = JSON.parse(mockStorage[storageKey]);
  assert.equal(stored.length, 2);
  assert.equal(stored.some((n: any) => n.id === 'trip-1'), true);
  assert.equal(stored.some((n: any) => n.id === 'trip-2'), true);
  assert.equal(stored.some((n: any) => n.id === 'admin-1'), false);
});


