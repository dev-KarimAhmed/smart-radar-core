import assert from 'node:assert/strict';
import { verifySingleSession } from './login-session-guard';

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
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
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

  console.log('All single session guard unit tests passed successfully!');
}

void runTests();
