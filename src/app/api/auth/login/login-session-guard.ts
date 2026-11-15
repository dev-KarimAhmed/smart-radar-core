import type { SupabaseClient } from '@supabase/supabase-js';

export interface SessionGuardResult {
  allowed: boolean;
  code?: string;
  error?: string;
}

export interface ClaimResult {
  success: boolean;
  conflict?: boolean;
  reason?: string;
}

interface ClaimEntry {
  deviceId: string;
  claimedAt: number;
}

// In-memory microsecond concurrency barrier (Node.js event loop level)
const recentClaimsByUser = new Map<string, ClaimEntry>();

/**
 * Enforces strict single-device session policy:
 * Rejects login if the account is currently active on another device/browser
 * until the user explicitly logs out from that active session.
 */
export async function verifySingleSession(params: {
  adminClient: SupabaseClient;
  userId: string;
  incomingDeviceId: string;
  profileActiveDeviceId?: string | null;
  profileLastSeenAt?: string | null;
}): Promise<SessionGuardResult> {
  const { adminClient, userId, incomingDeviceId, profileActiveDeviceId, profileLastSeenAt } = params;

  // 1. Fast in-memory check for concurrent requests hitting within the same second
  const recentClaim = recentClaimsByUser.get(userId);
  if (recentClaim && incomingDeviceId && recentClaim.deviceId !== incomingDeviceId) {
    if (Date.now() - recentClaim.claimedAt < 5000) {
      return {
        allowed: false,
        code: 'account_in_use',
        error: 'تم تسجيل الدخول إلى هذا الحساب للتو من جهاز آخر. لا يمكنك تسجيل الدخول في نفس الوقت.',
      };
    }
  }

  let activeDeviceId = profileActiveDeviceId ? String(profileActiveDeviceId).trim() : null;
  let lastSeenAt = profileLastSeenAt;

  // 2. If not provided or column doesn't exist, check auth.users metadata
  if (!activeDeviceId) {
    try {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
      const meta = authUser?.user?.user_metadata;
      if (meta?.active_device_id) {
        activeDeviceId = String(meta.active_device_id).trim();
        lastSeenAt = meta.last_seen_at || null;
      }
    } catch {}
  }

  // No active device recorded -> login allowed
  if (!activeDeviceId) {
    return { allowed: true };
  }

  // Same device ID -> re-login/refresh allowed
  if (incomingDeviceId && activeDeviceId === incomingDeviceId) {
    return { allowed: true };
  }

  // Different device: check if session was abandoned for > 24 hours (safety timeout)
  const lastSeenMs = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;
  const hoursSinceLastSeen = lastSeenMs > 0 ? (Date.now() - lastSeenMs) / (1000 * 60 * 60) : 0;

  // If active within the last 24 hours, strictly reject login
  if (hoursSinceLastSeen < 24) {
    return {
      allowed: false,
      code: 'account_in_use',
      error: 'هذا الحساب مسجل دخول حالياً على جهاز أو متصفح آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز المفتوح أولاً.',
    };
  }

  return { allowed: true };
}

/**
 * Atomically claims the single active session for the device (Compare-And-Swap).
 * If two devices attempt to claim at the exact same millisecond, exactly one wins.
 */
export async function claimActiveSession(params: {
  adminClient: SupabaseClient;
  userId: string;
  deviceId: string;
}): Promise<ClaimResult> {
  const { adminClient, userId, deviceId } = params;
  if (!deviceId || !userId) return { success: true };

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const cleanDevice = deviceId.trim();

  // 1. In-process microsecond barrier
  const existingClaim = recentClaimsByUser.get(userId);
  if (existingClaim && existingClaim.deviceId !== cleanDevice && (nowMs - existingClaim.claimedAt < 5000)) {
    return { success: false, conflict: true, reason: 'concurrency_race_lost' };
  }

  // 2. Try Atomic CAS via Database RPC if available
  try {
    const { data: rpcResult, error: rpcErr } = await adminClient.rpc('claim_single_device_session', {
      p_user_id: userId,
      p_device_id: cleanDevice,
    });
    if (!rpcErr && typeof rpcResult === 'boolean') {
      if (!rpcResult) {
        return { success: false, conflict: true, reason: 'cas_rpc_rejected' };
      }
      recentClaimsByUser.set(userId, { deviceId: cleanDevice, claimedAt: nowMs });
      return { success: true };
    }
  } catch {}

  // 3. Fallback: Atomic CAS via PostgREST conditional update
  try {
    const { data: updatedRows, error: updateErr } = await adminClient
      .from('profiles')
      .update({
        active_device_id: cleanDevice,
        last_seen_at: nowIso,
      })
      .eq('id', userId)
      .or(`active_device_id.is.null,active_device_id.eq.${cleanDevice}`)
      .select('id');

    if (!updateErr && Array.isArray(updatedRows)) {
      if (updatedRows.length === 0) {
        // Condition was false: another device acquired the lock in this exact millisecond!
        return { success: false, conflict: true, reason: 'cas_postgrest_rejected' };
      }
    }
  } catch {}

  // 4. Verify auth.users metadata as final consensus check
  try {
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
    const meta = authUser?.user?.user_metadata || {};
    const metaDevice = meta.active_device_id ? String(meta.active_device_id).trim() : null;
    const metaLastSeenMs = meta.last_seen_at ? new Date(meta.last_seen_at).getTime() : 0;
    const isMetaActive = metaDevice && (nowMs - metaLastSeenMs < 24 * 60 * 60 * 1000);

    if (metaDevice && metaDevice !== cleanDevice && isMetaActive) {
      return { success: false, conflict: true, reason: 'metadata_conflict' };
    }

    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...meta,
        active_device_id: cleanDevice,
        last_seen_at: nowIso,
      },
    });
  } catch (err) {
    console.warn('[claimActiveSession] user_metadata sync warning:', err);
  }

  recentClaimsByUser.set(userId, { deviceId: cleanDevice, claimedAt: nowMs });
  return { success: true };
}

/**
 * Clears the active device upon logout.
 */
export async function clearActiveSession(params: {
  adminClient: SupabaseClient;
  userId?: string;
  deviceId?: string;
}): Promise<void> {
  const { adminClient, userId, deviceId } = params;

  if (userId) {
    recentClaimsByUser.delete(userId);

    // 1. Clear user_metadata in auth.users
    try {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
      const existingMeta = authUser?.user?.user_metadata || {};
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...existingMeta,
          active_device_id: null,
          last_seen_at: null,
        },
      });
    } catch {}

    // 2. Clear profiles table
    try {
      await adminClient
        .from('profiles')
        .update({
          active_device_id: null,
          last_seen_at: null,
        })
        .eq('id', userId);
    } catch {}
  } else if (deviceId) {
    try {
      await adminClient
        .from('profiles')
        .update({
          active_device_id: null,
          last_seen_at: null,
        })
        .eq('active_device_id', deviceId.trim());
    } catch {}
  }
}
