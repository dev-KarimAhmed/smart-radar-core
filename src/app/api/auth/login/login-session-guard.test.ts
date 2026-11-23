import assert from 'node:assert/strict';
import { verifySingleSession, claimActiveSession, clearActiveSession } from './login-session-guard';

async function runTests() {
  const mockAdminClient = {
    auth: {
      admin: {
        getUserById: async (id: string) => {
          if (id === 'user-meta-active') {
            return {
              data: {
                user: {
                  user_metadata: {
                    active_device_id: 'device-laptop',
                    last_seen_at: new Date().toISOString(),
                  },
                },
              },
            };
          }
          return { data: { user: { user_metadata: {} } } };
        },
        updateUserById: async () => ({ data: { user: {} }, error: null }),
      },
    },
    rpc: async (func: string) => {
      // Mock RPC not found to test fallback CAS
      return { data: null, error: { message: 'function not found' } };
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          or: () => ({
            select: async () => [{ id: 'mock' }],
          }),
        }),
      }),
    }),
  } as any;

  // Test 1: No active session -> allowed
  const res1 = await verifySingleSession({
    adminClient: mockAdminClient,
    userId: 'user-clean',
    incomingDeviceId: 'device-mobile',
    profileActiveDeviceId: null,
  });
  assert.equal(res1.allowed, true);

  // Test 2: Same device ID -> allowed
  const res2 = await verifySingleSession({
    adminClient: mockAdminClient,
    userId: 'user-existing',
    incomingDeviceId: 'device-laptop',
    profileActiveDeviceId: 'device-laptop',
    profileLastSeenAt: new Date().toISOString(),
  });
  assert.equal(res2.allowed, true);

  // Test 3: Different device ID with active session within 24h -> blocked with account_in_use
  const res3 = await verifySingleSession({
    adminClient: mockAdminClient,
    userId: 'user-existing',
    incomingDeviceId: 'device-mobile',
    profileActiveDeviceId: 'device-laptop',
    profileLastSeenAt: new Date().toISOString(),
  });
  assert.equal(res3.allowed, false);
  assert.equal(res3.code, 'account_in_use');

  // Test 4: Different device ID but abandoned > 24 hours -> allowed
  const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const res4 = await verifySingleSession({
    adminClient: mockAdminClient,
    userId: 'user-abandoned',
    incomingDeviceId: 'device-mobile',
    profileActiveDeviceId: 'device-laptop',
    profileLastSeenAt: yesterday,
  });
  assert.equal(res4.allowed, true);

  // Test 5: Profile column null/missing but active in user_metadata -> blocked with account_in_use
  const res5 = await verifySingleSession({
    adminClient: mockAdminClient,
    userId: 'user-meta-active',
    incomingDeviceId: 'device-mobile',
    profileActiveDeviceId: null,
  });
  assert.equal(res5.allowed, false);
  assert.equal(res5.code, 'account_in_use');

  // Test 6: Same-second concurrent claim race condition (Atomic CAS)
  // Device 1 (Laptop) claims first
  const claimLaptop = await claimActiveSession({
    adminClient: mockAdminClient,
    userId: 'user-race-condition',
    deviceId: 'device-laptop-winner',
  });
  assert.equal(claimLaptop.success, true);

  // Device 2 (Mobile) attempts to claim at the exact same second
  const claimMobile = await claimActiveSession({
    adminClient: mockAdminClient,
    userId: 'user-race-condition',
    deviceId: 'device-mobile-loser',
  });
  assert.equal(claimMobile.success, false);
  assert.equal(claimMobile.conflict, true);

  // Verification immediately rejects Device 2
  const verifyMobile = await verifySingleSession({
    adminClient: mockAdminClient,
    userId: 'user-race-condition',
    incomingDeviceId: 'device-mobile-loser',
  });
  assert.equal(verifyMobile.allowed, false);

  // Test 7: Clear session on logout releases lock
  await clearActiveSession({
    adminClient: mockAdminClient,
    userId: 'user-race-condition',
    deviceId: 'device-laptop-winner',
  });

  const claimAfterLogout = await claimActiveSession({
    adminClient: mockAdminClient,
    userId: 'user-race-condition',
    deviceId: 'device-mobile-now-allowed',
  });
  assert.equal(claimAfterLogout.success, true);

  // Test 8: Force takeover allows immediate claim
  const forceClaim = await claimActiveSession({
    adminClient: mockAdminClient,
    userId: 'user-race-condition',
    deviceId: 'device-mobile-forced',
    force: true,
  });
  assert.equal(forceClaim.success, true);

  console.log('All single session guard & atomic CAS unit tests passed successfully!');
}

void runTests();
