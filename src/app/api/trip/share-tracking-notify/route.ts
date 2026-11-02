import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId || '').trim();
    let captainId = String(body.captainId || '').trim();

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'missing_request_id' }, { status: 400 });
    }

    // 1. Fetch trip from ride_requests to verify active trip and locate captain
    const { data: trip, error: tripErr } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, accepted_captain_id')
      .eq('id', requestId)
      .maybeSingle();

    if (tripErr || !trip) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    if (!captainId && trip.accepted_captain_id) {
      captainId = trip.accepted_captain_id;
    }

    if (!captainId) {
      return NextResponse.json({ success: false, error: 'no_captain_assigned' }, { status: 400 });
    }

    // 2. Prepare bilingual notification
    const { title, description } = encodeNotificationPayload(
      'مشاركة تتبع مسير الرحلة',
      'المستخدم فعل زر تتبع هاتفه مع الأقارب، ويتوقف مع انتهاء الخدمة.',
      'Trip Journey Tracking Shared',
      'The passenger has activated live trip tracking with relatives, which stops when the service ends.'
    );

    const notifId = `notif_trk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // 3. Insert notification directly into user_notifications
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
      return NextResponse.json({ success: false, error: notifErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notificationId: notifId });
  } catch (error: any) {
    console.error('[share-tracking-notify] Unexpected error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'internal_server_error' }, { status: 500 });
  }
}

