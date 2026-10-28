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

