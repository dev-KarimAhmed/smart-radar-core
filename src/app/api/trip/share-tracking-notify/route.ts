import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';
import {
  consumeRateLimit,
  getClientIp,
  getVerifiedUser,
  signTrackingToken,
} from '@/shared/server/api-auth-guard';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRACKING_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(`share-tracking:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.requestId || '').trim();

    if (!requestId || !UUID_PATTERN.test(requestId)) {
      return NextResponse.json({ success: false, error: 'valid_request_id_required' }, { status: 400 });
    }

    // 1. Fetch trip from ride_requests to verify rider ownership, active status, and authoritative captainId
    const { data: trip, error: tripErr } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, rider_id, accepted_captain_id')
      .eq('id', requestId)
      .maybeSingle();

    if (tripErr || !trip) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    if (trip.rider_id !== caller.id && caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'forbidden_trip_access' }, { status: 403 });
    }

    const normalizedStatus = String(trip.status || '').toUpperCase();
    if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'trip_already_closed' }, { status: 409 });
    }

    const captainId = trip.accepted_captain_id ? String(trip.accepted_captain_id).trim() : '';
    if (!captainId) {
      return NextResponse.json({ success: false, error: 'no_captain_assigned' }, { status: 400 });
    }

    // 2. Mint time-bounded signed tracking token (strictly bound to this trip ID)
    const expiresAtMs = Date.now() + TRACKING_TOKEN_TTL_MS;
    const trackingToken = signTrackingToken(requestId, expiresAtMs);

    // 3. Prepare bilingual notification
    const { title, description } = encodeNotificationPayload(
      'مشاركة تتبع مسير الرحلة',
      'المستخدم فعل زر تتبع هاتفه مع الأقارب، ويتوقف مع انتهاء الخدمة.',
      'Trip Journey Tracking Shared',
      'The passenger has activated live trip tracking with relatives, which stops when the service ends.'
    );

    const notifId = `notif_trk_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // 4. Insert notification directly into user_notifications for authoritative captainId
    const { error: notifErr } = await supabaseAdmin
      .from('user_notifications')
      .insert({
        id: notifId,
        user_id: captainId,
        title,
        description,
        type: 'trip',
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (notifErr) {
      console.error('[share-tracking-notify] Error inserting user notification:', notifErr);
      return NextResponse.json({ success: false, error: 'notification_insert_failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notificationId: notifId,
      trackingToken,
      expiresAtMs,
    });
  } catch (error) {
    console.error('[share-tracking-notify] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
