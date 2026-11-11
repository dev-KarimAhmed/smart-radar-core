import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_ACTIONS = new Set(['REQUEST', 'ACCEPT', 'DECLINE', 'REVOKE']);

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

    if (error || !data) {
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
      cancel_requested_by: data.cancel_requested_by || null,
      cancel_request_time: data.cancel_request_time || null,
    });
  } catch (error) {
    console.error('[mutual-cancel] GET error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}

function isMissingRpcFunctionError(error: unknown): boolean {
  const errObj = error as { code?: string; message?: string } | null;
  const code = String(errObj?.code || '').toUpperCase();
  const message = String(errObj?.message || '').toLowerCase();
  return code === 'PGRST202' || code === '42883' || message.includes('could not find the function');
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

    // 1. Fetch current trip to verify participant authorization and cancellable status
    const { data: requestRow, error: fetchErr } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, accepted_captain_id, rider_id, estimated_duration_minutes, cancel_requested_by')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !requestRow) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    const isRider = requestRow.rider_id === caller.id;
    const isCaptain = requestRow.accepted_captain_id === caller.id;
    const isAdmin = caller.role === 'ADMIN';

    if (!isRider && !isCaptain && !isAdmin) {
      return NextResponse.json({ success: false, error: 'forbidden_trip_access' }, { status: 403 });
    }

    // Authoritative server-derived participant role
    const role: 'captain' | 'rider' = isCaptain ? 'captain' : 'rider';

    const currentStatus = String(requestRow.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      return NextResponse.json({ success: true, status: currentStatus, message: 'trip_already_closed' });
    }

    // 2. Handle sub-actions: REQUEST, DECLINE, REVOKE
    if (action === 'REQUEST') {
      let rpcSucceeded = false;
      let shouldFallback = false;
      try {
        const { error: rpcErr } = await supabaseAdmin.rpc('request_mutual_trip_cancellation', {
          p_request_id: requestId,
          p_role: role,
          p_action: 'REQUEST',
        });
        if (!rpcErr) {
          rpcSucceeded = true;
        } else if (isMissingRpcFunctionError(rpcErr)) {
          shouldFallback = true;
        } else {
          console.error('[mutual-cancel] REQUEST RPC error:', rpcErr);
          return NextResponse.json({ success: false, error: 'request_failed' }, { status: 400 });
        }
      } catch (err) {
        console.warn('[mutual-cancel] REQUEST RPC exception:', err);
        shouldFallback = true;
      }

      if (!rpcSucceeded && shouldFallback) {
        const { error: directErr } = await supabaseAdmin
          .from('ride_requests')
          .update({
            cancel_requested_by: role,
            cancel_request_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId)
          .not('status', 'in', '(COMPLETED,CANCELLED)');

        if (directErr) {
          console.error('[mutual-cancel] Direct update error:', directErr);
          return NextResponse.json({ success: false, error: 'request_failed' }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        action: 'REQUEST',
        cancel_requested_by: role,
        requestId,
      });
    }

    if (action === 'DECLINE' || action === 'REVOKE') {
      let rpcSucceeded = false;
      let shouldFallback = false;
      try {
        const { error: rpcErr } = await supabaseAdmin.rpc('request_mutual_trip_cancellation', {
          p_request_id: requestId,
          p_role: role,
          p_action: action,
        });
        if (!rpcErr) {
          rpcSucceeded = true;
        } else if (isMissingRpcFunctionError(rpcErr)) {
          shouldFallback = true;
        } else {
          console.error(`[mutual-cancel] ${action} RPC error:`, rpcErr);
          return NextResponse.json({ success: false, error: `${action.toLowerCase()}_failed` }, { status: 400 });
        }
      } catch (err) {
        console.warn(`[mutual-cancel] ${action} RPC exception:`, err);
        shouldFallback = true;
      }

      if (!rpcSucceeded && shouldFallback) {
        const { error: directErr } = await supabaseAdmin
          .from('ride_requests')
          .update({
            cancel_requested_by: null,
            cancel_request_time: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId)
          .not('status', 'in', '(COMPLETED,CANCELLED)');

        if (directErr) {
          console.error(`[mutual-cancel] ${action} direct update error:`, directErr);
          return NextResponse.json({ success: false, error: `${action.toLowerCase()}_failed` }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        action,
        cancel_requested_by: null,
        requestId,
      });
    }

    // 3. Action is ACCEPT: Mark ride_request as CANCELLED via mutual_cancel_ride_request RPC
    let cancelSucceeded = false;
    let shouldFallbackCancel = false;
    try {
      const { error: updateErr } = await supabaseAdmin.rpc('mutual_cancel_ride_request', {
        p_request_id: requestId,
      });
      if (!updateErr) {
        cancelSucceeded = true;
      } else if (isMissingRpcFunctionError(updateErr)) {
        shouldFallbackCancel = true;
      } else {
        console.error('[mutual-cancel] mutual_cancel_ride_request RPC error:', updateErr);
        return NextResponse.json({ success: false, error: 'cancel_failed' }, { status: 400 });
      }
    } catch (err) {
      console.warn('[mutual-cancel] mutual_cancel_ride_request exception:', err);
      shouldFallbackCancel = true;
    }

    if (!cancelSucceeded && shouldFallbackCancel) {
      const nowIso = new Date().toISOString();
      const { error: directErr } = await supabaseAdmin
        .from('ride_requests')
        .update({
          status: 'CANCELLED',
          cancelled_at: nowIso,
          cancel_requested_by: null,
          cancel_request_time: null,
          updated_at: nowIso,
        })
        .eq('id', requestId)
        .not('status', 'in', '(COMPLETED,CANCELLED)');

      if (directErr) {
        console.error('[mutual-cancel] direct cancel update error:', directErr);
        return NextResponse.json({ success: false, error: 'cancel_failed' }, { status: 500 });
      }
    }

    await supabaseAdmin
      .from('ride_requests')
      .update({ cancel_requested_by: null, cancel_request_time: null })
      .eq('id', requestId);

    // 4. Mark non-accepted offers as REJECTED (RPC also does this, kept for safety)
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from('ride_offers')
      .update({
        status: 'REJECTED',
        updated_at: nowIso,
      })
      .eq('request_id', requestId)
      .neq('status', 'ACCEPTED');

    return NextResponse.json({
      success: true,
      requestId,
      status: 'CANCELLED',
      cancelledBy: isAdmin ? 'admin' : role,
      tripDurationMinutes,
    });
  } catch (error) {
    console.error('[mutual-cancel] unexpected error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
