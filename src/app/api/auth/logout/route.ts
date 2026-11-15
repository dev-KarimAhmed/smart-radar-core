import { NextResponse } from 'next/server';
import { getServerSupabaseAdmin } from '@/shared/server/api-auth-guard';
import { clearActiveSession } from '../login/login-session-guard';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId ? String(body.userId).trim() : undefined;
    const deviceId = body.deviceId ? String(body.deviceId).trim() : undefined;

    const adminClient = getServerSupabaseAdmin();

    await clearActiveSession({
      adminClient,
      userId,
      deviceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth Logout API Error]:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
