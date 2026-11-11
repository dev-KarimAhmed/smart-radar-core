import assert from 'node:assert/strict';
import {
  interpretMutualCancelMutationResult,
  normalizeCancelRole,
  resolveRealtimeRideRequestUpdate,
  shouldAcceptServerSyncResult,
} from './mutual-cancellation-helpers';

// 1. Stale poll started before a newer mutation must NOT overwrite optimistic pendingRequestFrom
{
  const decision = shouldAcceptServerSyncResult({
    pollEpoch: 1,
    currentEpoch: 2,
    inFlightMutations: 0,
    serverStatus: 'TRIP_ACTIVE',
    serverCancelRequestedBy: null,
    postCommitLock: { expectedPendingFrom: 'captain', untilMs: 10_000 },
    nowMs: 2_000,
  });
  assert.deepEqual(decision, { accept: false, reason: 'stale_poll' });
}

// 2. Poll finishing while another mutation is still in flight must be ignored
{
  const decision = shouldAcceptServerSyncResult({
    pollEpoch: 2,
    currentEpoch: 2,
    inFlightMutations: 1,
    serverStatus: 'TRIP_ACTIVE',
    serverCancelRequestedBy: null,
    postCommitLock: null,
    nowMs: 2_000,
  });
  assert.deepEqual(decision, { accept: false, reason: 'stale_poll' });
}

// 3. Replica/cache lag returning null inside the post-commit grace window must NOT wipe pending banner
{
  const decision = shouldAcceptServerSyncResult({
    pollEpoch: 3,
    currentEpoch: 3,
    inFlightMutations: 0,
    serverStatus: 'TRIP_ACTIVE',
    serverCancelRequestedBy: null,
    postCommitLock: { expectedPendingFrom: 'captain', untilMs: 10_000 },
    nowMs: 9_500,
  });
  assert.deepEqual(decision, { accept: false, reason: 'within_post_commit_grace' });
}

// 4. After the grace window expires, server truth (e.g. null after revoke/decline) takes over
{
  const decision = shouldAcceptServerSyncResult({
    pollEpoch: 3,
    currentEpoch: 3,
    inFlightMutations: 0,
    serverStatus: 'TRIP_ACTIVE',
    serverCancelRequestedBy: null,
    postCommitLock: { expectedPendingFrom: 'captain', untilMs: 10_000 },
    nowMs: 10_001,
  });
  assert.deepEqual(decision, {
    accept: true,
    nextPendingFrom: null,
    terminalStatus: null,
  });
}

// 5. Terminal CANCELLED or COMPLETED from server always wins, even inside grace window
{
  const cancelledDecision = shouldAcceptServerSyncResult({
    pollEpoch: 3,
    currentEpoch: 3,
    inFlightMutations: 0,
    serverStatus: 'CANCELLED',
    serverCancelRequestedBy: null,
    postCommitLock: { expectedPendingFrom: 'captain', untilMs: 10_000 },
    nowMs: 9_000,
  });
  assert.deepEqual(cancelledDecision, {
    accept: true,
    nextPendingFrom: null,
    terminalStatus: 'CANCELLED',
  });
}

// 6. Realtime partial updates without cancel_requested_by field must not clear pending banner
{
  const decision = resolveRealtimeRideRequestUpdate({
    newRow: { id: 'req-1', status: 'TRIP_ACTIVE' },
    inFlightMutations: 0,
    postCommitLock: null,
    nowMs: 5_000,
  });
  assert.deepEqual(decision, { kind: 'ignore' });
}

// 7. Realtime updates during an in-flight mutation or mismatched grace window are ignored
{
  const blockedByMutation = resolveRealtimeRideRequestUpdate({
    newRow: { id: 'req-1', status: 'TRIP_ACTIVE', cancel_requested_by: null },
    inFlightMutations: 1,
    postCommitLock: null,
    nowMs: 5_000,
  });
  assert.deepEqual(blockedByMutation, { kind: 'ignore' });

  const blockedByGrace = resolveRealtimeRideRequestUpdate({
    newRow: { id: 'req-1', status: 'TRIP_ACTIVE', cancel_requested_by: null },
    inFlightMutations: 0,
    postCommitLock: { expectedPendingFrom: 'captain', untilMs: 10_000 },
    nowMs: 8_000,
  });
  assert.deepEqual(blockedByGrace, { kind: 'ignore' });

  const acceptedPeerRequest = resolveRealtimeRideRequestUpdate({
    newRow: { id: 'req-1', status: 'TRIP_ACTIVE', cancel_requested_by: 'rider' },
    inFlightMutations: 0,
    postCommitLock: null,
    nowMs: 8_000,
  });
  assert.deepEqual(acceptedPeerRequest, { kind: 'pending', nextPendingFrom: 'rider' });

  const terminalUpdate = resolveRealtimeRideRequestUpdate({
    newRow: { id: 'req-1', status: 'CANCELLED', cancel_requested_by: null },
    inFlightMutations: 0,
    postCommitLock: { expectedPendingFrom: 'captain', untilMs: 10_000 },
    nowMs: 8_000,
  });
  assert.deepEqual(terminalUpdate, { kind: 'terminal', status: 'CANCELLED' });
}

// 8. API mutation outcome interpretation handles 401/error JSON, closed trips, and pending roles
{
  assert.deepEqual(
    interpretMutualCancelMutationResult(false, { success: false, error: 'authentication_required' }),
    { ok: false, errorCode: 'authentication_required' },
  );

  assert.deepEqual(
    interpretMutualCancelMutationResult(true, { success: false, error: 'request_failed' }),
    { ok: false, errorCode: 'request_failed' },
  );

  assert.deepEqual(
    interpretMutualCancelMutationResult(true, {
      success: true,
      status: 'CANCELLED',
      message: 'trip_already_closed',
    }),
    { ok: true, isClosed: true, terminalStatus: 'CANCELLED' },
  );

  assert.deepEqual(
    interpretMutualCancelMutationResult(true, {
      success: true,
      action: 'REQUEST',
      cancel_requested_by: 'captain',
    }),
    { ok: true, isClosed: false, cancelRequestedBy: 'captain' },
  );

  assert.deepEqual(
    interpretMutualCancelMutationResult(true, {
      success: true,
      action: 'REVOKE',
      cancel_requested_by: null,
    }),
    { ok: true, isClosed: false, cancelRequestedBy: null },
  );
}

// 9. Case-insensitive role normalization works across all helpers for DB uppercase strings
{
  assert.equal(normalizeCancelRole('CAPTAIN'), 'captain');
  assert.equal(normalizeCancelRole('RIDER'), 'rider');
  assert.equal(normalizeCancelRole(' captain '), 'captain');
  assert.equal(normalizeCancelRole('Rider'), 'rider');
  assert.equal(normalizeCancelRole('ADMIN'), null);
  assert.equal(normalizeCancelRole(''), null);
  assert.equal(normalizeCancelRole(null), null);

  assert.deepEqual(
    shouldAcceptServerSyncResult({
      pollEpoch: 4,
      currentEpoch: 4,
      inFlightMutations: 0,
      serverStatus: 'TRIP_ACTIVE',
      serverCancelRequestedBy: 'CAPTAIN',
      postCommitLock: null,
      nowMs: 12_000,
    }),
    {
      accept: true,
      nextPendingFrom: 'captain',
      terminalStatus: null,
    },
  );

  assert.deepEqual(
    resolveRealtimeRideRequestUpdate({
      newRow: { id: 'req-upper', status: 'TRIP_ACTIVE', cancel_requested_by: 'CAPTAIN' },
      inFlightMutations: 0,
      postCommitLock: null,
      nowMs: 12_000,
    }),
    { kind: 'pending', nextPendingFrom: 'captain' },
  );

  assert.deepEqual(
    interpretMutualCancelMutationResult(true, {
      success: true,
      action: 'REQUEST',
      cancel_requested_by: 'RIDER',
    }),
    { ok: true, isClosed: false, cancelRequestedBy: 'rider' },
  );
}

console.log('mutual-cancellation-helpers tests passed');
