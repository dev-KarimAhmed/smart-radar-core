import { NextResponse } from 'next/server';
import { getServerSupabaseAdmin } from '@/shared/server/api-auth-guard';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId ? String(body.userId).trim() : undefined;
    const deviceId = body.deviceId ? String(body.deviceId).trim() : undefined;

    if (!userId || !deviceId) {
      return NextResponse.json({ active: false, error: 'missing_params' }, { status: 400 });
    }

    const adminClient = getServerSupabaseAdmin();
    const nowIso = new Date().toISOString();

    // 1. Fetch user metadata and profile
    let currentActiveDevice: string | null = null;
    let existingMeta: Record<string, any> = {};

    try {
      const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
      existingMeta = authUser?.user?.user_metadata || {};
      if (existingMeta.active_device_id) {
        currentActiveDevice = String(existingMeta.active_device_id).trim();
      }
    } catch {}

    if (!currentActiveDevice) {
      try {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id, active_device_id, last_seen_at')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.active_device_id) {
          currentActiveDevice = String(profile.active_device_id).trim();
        }
      } catch {}
    }

    // 2. If no device currently claimed, claim it for this device
    if (!currentActiveDevice) {
      try {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMeta,
            active_device_id: deviceId,
            last_seen_at: nowIso,
          },
        });
      } catch {}

      try {
        await adminClient
          .from('profiles')
          .update({
            active_device_id: deviceId,
            last_seen_at: nowIso,
          })
          .eq('id', userId);
      } catch {}

      return NextResponse.json({ active: true, claimed: true });
    }

    // 3. If this is the active device, refresh heartbeat
    if (currentActiveDevice === deviceId) {
      try {
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMeta,
            last_seen_at: nowIso,
          },
        });
      } catch {}

      try {
        await adminClient
          .from('profiles')
          .update({
            last_seen_at: nowIso,
          })
          .eq('id', userId);
      } catch {}

      return NextResponse.json({ active: true });
    }

    // 4. Different device holds the active session
    return NextResponse.json({ active: false, conflict: true });
  } catch (error) {
    console.error('[Session Heartbeat Error]:', error);
    return NextResponse.json({ active: true }); // Fail-open on network hiccup so user is not kicked out accidentally
  }
}
