import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = String(searchParams.get('requestId') || '').trim();

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'missing_request_id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, cancel_requested_by, cancel_request_time')
      .eq('id', requestId)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId || '').trim();
    const action = String(body.action || 'ACCEPT').toUpperCase().trim();
    const role = String(body.cancelledByRole || body.role || 'mutual').toLowerCase().trim();
    const tripDurationMinutes = Math.max(
      1,
      Math.round(Number(body.tripDurationMinutes || body.durationMinutes) || 20)
    );

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'missing_request_id' }, { status: 400 });
    }

    // 1. Fetch current trip to verify existence and cancellable status
    const { data: requestRow, error: fetchErr } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, accepted_captain_id, rider_id, estimated_duration_minutes, cancel_requested_by')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !requestRow) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    const currentStatus = String(requestRow.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      return NextResponse.json({ success: true, status: currentStatus, message: 'trip_already_closed' });
    }

    // 2. Handle sub-actions: REQUEST, DECLINE, REVOKE
    if (action === 'REQUEST') {
      let rpcSucceeded = false;
      try {
        const { error: rpcErr } = await supabaseAdmin.rpc('request_mutual_trip_cancellation', {
          p_request_id: requestId,
          p_role: role === 'captain' ? 'captain' : 'rider',
          p_action: 'REQUEST',
        });
        if (!rpcErr) {
          rpcSucceeded = true;
        } else {
          console.warn('[mutual-cancel] REQUEST RPC error, falling back to direct table update:', rpcErr);
        }
      } catch (err) {
        console.warn('[mutual-cancel] REQUEST RPC exception, falling back to direct table update:', err);
      }

      if (!rpcSucceeded) {
        const { error: directErr } = await supabaseAdmin
          .from('ride_requests')
          .update({
            cancel_requested_by: role === 'captain' ? 'captain' : 'rider',
            cancel_request_time: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (directErr) {
          console.error('[mutual-cancel] Direct update error:', directErr);
          return NextResponse.json({ success: false, error: 'request_failed', details: directErr.message }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        action: 'REQUEST',
        cancel_requested_by: role === 'captain' ? 'captain' : 'rider',
        requestId,
      });
    }

    if (action === 'DECLINE' || action === 'REVOKE') {
      let rpcSucceeded = false;
      try {
        const { error: rpcErr } = await supabaseAdmin.rpc('request_mutual_trip_cancellation', {
          p_request_id: requestId,
          p_role: role,
          p_action: action,
        });
        if (!rpcErr) {
          rpcSucceeded = true;
        } else {
          console.warn(`[mutual-cancel] ${action} RPC error, falling back to direct table update:`, rpcErr);
        }
      } catch (err) {
        console.warn(`[mutual-cancel] ${action} RPC exception, falling back to direct table update:`, err);
      }

      if (!rpcSucceeded) {
        const { error: directErr } = await supabaseAdmin
          .from('ride_requests')
          .update({
            cancel_requested_by: null,
            cancel_request_time: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (directErr) {
          console.error(`[mutual-cancel] ${action} direct update error:`, directErr);
          return NextResponse.json({ success: false, error: `${action.toLowerCase()}_failed`, details: directErr.message }, { status: 500 });
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
    try {
      const { error: updateErr } = await supabaseAdmin.rpc('mutual_cancel_ride_request', {
        p_request_id: requestId,
      });
      if (!updateErr) {
        cancelSucceeded = true;
      } else {
        console.warn('[mutual-cancel] mutual_cancel_ride_request RPC error, falling back to direct update:', updateErr);
      }
    } catch (err) {
      console.warn('[mutual-cancel] mutual_cancel_ride_request exception, falling back to direct update:', err);
    }

    if (!cancelSucceeded) {
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
        .eq('id', requestId);

      if (directErr) {
        console.error('[mutual-cancel] direct cancel update error:', directErr);
        return NextResponse.json({ success: false, error: 'cancel_failed', details: directErr.message }, { status: 500 });
      }
    }

    // Also clear cancel_requested_by on cancel
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
      cancelledBy: role,
      tripDurationMinutes,
    });
  } catch (error) {
    console.error('[mutual-cancel] unexpected error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
