import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';
import { normalizeCancelRole } from '@/shared/hooks/mutual-cancellation-helpers';
import { UUID_PATTERN, ALLOWED_ACTIONS } from './mutual-cancel-broadcast';
import {
  handleMutualCancelRequest,
  handleMutualCancelDeclineOrRevoke,
  handleMutualCancelAccept,
} from './mutual-cancel-handlers';

export async function GET(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = String(searchParams.get('requestId') || '').trim();

    if (!requestId || !UUID_PATTERN.test(requestId)) {
      return NextResponse.json({ success: false, error: 'invalid_request_id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, rider_id, accepted_captain_id, cancel_requested_by, cancel_request_time')
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      console.error('[mutual-cancel] GET query error:', error);
      return NextResponse.json({ success: false, error: 'trip_query_failed' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    const isParticipant = data.rider_id === caller.id || data.accepted_captain_id === caller.id;
    if (!isParticipant && caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'forbidden_trip_access' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      requestId: data.id,
      status: data.status,
      cancel_requested_by: normalizeCancelRole(data.cancel_requested_by),
      cancel_request_time: data.cancel_request_time || null,
    });
  } catch (error) {
    console.error('[mutual-cancel] GET error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.requestId || '').trim();
    const action = String(body.action || 'ACCEPT').toUpperCase().trim();
    const tripDurationMinutes = Math.min(
      1440,
      Math.max(1, Math.round(Number(body.tripDurationMinutes || body.durationMinutes) || 20))
    );

    if (!requestId || !UUID_PATTERN.test(requestId)) {
      return NextResponse.json({ success: false, error: 'invalid_request_id' }, { status: 400 });
    }

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json({ success: false, error: 'invalid_action' }, { status: 400 });
    }

    const { data: requestRow, error: fetchErr } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, accepted_captain_id, rider_id, estimated_duration_minutes, cancel_requested_by')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr) {
      console.error('[mutual-cancel] POST fetch error:', fetchErr);
      return NextResponse.json({ success: false, error: 'trip_query_failed' }, { status: 500 });
    }

    if (!requestRow) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    const isRider = requestRow.rider_id === caller.id;
    const isCaptain = requestRow.accepted_captain_id === caller.id;
    const isAdmin = caller.role === 'ADMIN';

    if (!isRider && !isCaptain && !isAdmin) {
      return NextResponse.json({ success: false, error: 'forbidden_trip_access' }, { status: 403 });
    }

    const clientRole = body.cancelledByRole === 'captain' || body.cancelledByRole === 'rider'
      ? (body.cancelledByRole as 'captain' | 'rider')
      : undefined;
    const role: 'captain' | 'rider' = clientRole && (isAdmin || (clientRole === 'captain' ? isCaptain : isRider))
      ? clientRole
      : (isCaptain ? 'captain' : 'rider');

    const currentStatus = String(requestRow.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      return NextResponse.json({
        success: true,
        requestId,
        status: currentStatus,
        message: 'trip_already_closed',
      });
    }

    if (action === 'REQUEST') {
      return await handleMutualCancelRequest(requestId, role, tripDurationMinutes);
    }

    if (action === 'DECLINE' || action === 'REVOKE') {
      return await handleMutualCancelDeclineOrRevoke(requestId, role, action);
    }

    return await handleMutualCancelAccept(requestId, role, isAdmin, tripDurationMinutes);
  } catch (error) {
    console.error('[mutual-cancel] unexpected error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
