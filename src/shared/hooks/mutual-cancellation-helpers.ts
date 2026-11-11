export type MutualCancelRole = 'rider' | 'captain';

export interface PostCommitExpectationLock {
  expectedPendingFrom: MutualCancelRole | null;
  untilMs: number;
}

export type ServerSyncDecision =
  | { accept: false; reason: 'stale_poll' | 'within_post_commit_grace' }
  | { accept: true; nextPendingFrom: MutualCancelRole | null; terminalStatus: 'CANCELLED' | 'COMPLETED' | null };

export type RealtimeRideRequestDecision =
  | { kind: 'ignore' }
  | { kind: 'terminal'; status: 'CANCELLED' | 'COMPLETED' }
  | { kind: 'pending'; nextPendingFrom: MutualCancelRole | null };

export type MutualCancelMutationOutcome =
  | { ok: true; isClosed: true; terminalStatus: 'CANCELLED' | 'COMPLETED' }
  | { ok: true; isClosed: false; cancelRequestedBy: MutualCancelRole | null }
  | { ok: false; errorCode: string };

export function normalizeCancelRole(value: unknown): MutualCancelRole | null {
  if (typeof value !== 'string') return null;
  const lower = value.trim().toLowerCase();
  if (lower === 'captain' || lower === 'rider') return lower;
  return null;
}

export function normalizeTerminalTripStatus(value: unknown): 'CANCELLED' | 'COMPLETED' | null {
  const upper = String(value || '').toUpperCase();
  if (upper === 'CANCELLED') return 'CANCELLED';
  if (upper === 'COMPLETED') return 'COMPLETED';
  return null;
}

export function shouldAcceptServerSyncResult(params: {
  pollEpoch: number;
  currentEpoch: number;
  inFlightMutations: number;
  serverStatus?: unknown;
  serverCancelRequestedBy: unknown;
  postCommitLock: PostCommitExpectationLock | null;
  nowMs: number;
}): ServerSyncDecision {
  const {
    pollEpoch,
    currentEpoch,
    inFlightMutations,
    serverStatus,
    serverCancelRequestedBy,
    postCommitLock,
    nowMs,
  } = params;

  if (inFlightMutations > 0 || pollEpoch !== currentEpoch) {
    return { accept: false, reason: 'stale_poll' };
  }

  const terminalStatus = normalizeTerminalTripStatus(serverStatus);
  if (terminalStatus) {
    return {
      accept: true,
      nextPendingFrom: null,
      terminalStatus,
    };
  }

  const normalized = normalizeCancelRole(serverCancelRequestedBy);
  if (postCommitLock && nowMs < postCommitLock.untilMs && normalized !== postCommitLock.expectedPendingFrom) {
    return { accept: false, reason: 'within_post_commit_grace' };
  }

  return {
    accept: true,
    nextPendingFrom: normalized,
    terminalStatus: null,
  };
}

export function resolveRealtimeRideRequestUpdate(params: {
  newRow: Record<string, unknown> | null | undefined;
  inFlightMutations: number;
  postCommitLock: PostCommitExpectationLock | null;
  nowMs: number;
}): RealtimeRideRequestDecision {
  const { newRow, inFlightMutations, postCommitLock, nowMs } = params;
  if (!newRow || typeof newRow !== 'object') {
    return { kind: 'ignore' };
  }

  const terminalStatus = normalizeTerminalTripStatus(newRow.status);
  if (terminalStatus) {
    return { kind: 'terminal', status: terminalStatus };
  }

  if (inFlightMutations > 0) {
    return { kind: 'ignore' };
  }

  if (!Object.prototype.hasOwnProperty.call(newRow, 'cancel_requested_by')) {
    return { kind: 'ignore' };
  }

  const normalized = normalizeCancelRole(newRow.cancel_requested_by);
  if (postCommitLock && nowMs < postCommitLock.untilMs && normalized !== postCommitLock.expectedPendingFrom) {
    return { kind: 'ignore' };
  }

  return { kind: 'pending', nextPendingFrom: normalized };
}

export function interpretMutualCancelMutationResult(
  resOk: boolean,
  data: Record<string, unknown> | null | undefined,
): MutualCancelMutationOutcome {
  if (!resOk || !data || data.success === false) {
    return {
      ok: false,
      errorCode: String(data?.error || 'request_failed'),
    };
  }

  const terminalStatus = normalizeTerminalTripStatus(data.status);
  if (terminalStatus || data.message === 'trip_already_closed') {
    return {
      ok: true,
      isClosed: true,
      terminalStatus: terminalStatus || 'CANCELLED',
    };
  }

  return {
    ok: true,
    isClosed: false,
    cancelRequestedBy: normalizeCancelRole(data.cancel_requested_by),
  };
}
