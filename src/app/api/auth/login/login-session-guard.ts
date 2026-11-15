import type { SupabaseClient } from '@supabase/supabase-js';

export interface SessionGuardResult {
  allowed: boolean;
  code?: string;
  error?: string;
}

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

  let activeDeviceId = profileActiveDeviceId ? String(profileActiveDeviceId).trim() : null;
  let lastSeenAt = profileLastSeenAt;

  // 1. If not provided or column doesn't exist, check auth.users metadata
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
 * Claims the single active session for the device upon successful login.
 */
export async function claimActiveSession(params: {
  adminClient: SupabaseClient;
  userId: string;
  deviceId: string;
}): Promise<void> {
  const { adminClient, userId, deviceId } = params;
  if (!deviceId || !userId) return;

  const nowIso = new Date().toISOString();
  const cleanDevice = deviceId.trim();

  // 1. Authoritative sync to auth.users metadata
  try {
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
    const existingMeta = authUser?.user?.user_metadata || {};
    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...existingMeta,
        active_device_id: cleanDevice,
        last_seen_at: nowIso,
      },
    });
  } catch (err) {
    console.warn('[claimActiveSession] Failed to update user_metadata:', err);
  }

  // 2. Sync to profiles table (gracefully ignores if column pending migration)
  try {
    await adminClient
      .from('profiles')
      .update({
        active_device_id: cleanDevice,
        last_seen_at: nowIso,
      })
      .eq('id', userId);
  } catch {}
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
