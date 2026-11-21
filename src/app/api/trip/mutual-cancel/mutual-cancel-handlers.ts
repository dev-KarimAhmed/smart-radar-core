import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeCancelRole } from '@/shared/hooks/mutual-cancellation-helpers';
import { broadcastMutualCancelEvent } from './mutual-cancel-broadcast';

export async function handleMutualCancelRequest(
  requestId: string,
  role: 'captain' | 'rider',
  tripDurationMinutes: number,
) {
  let rpcSucceeded = false;
  let rpcCancelRequestedBy: unknown = role;

  try {
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('request_mutual_trip_cancellation', {
      p_request_id: requestId,
      p_role: role,
      p_action: 'REQUEST',
    });

    if (!rpcErr) {
      const rpcPayload = rpcData && typeof rpcData === 'object' ? (rpcData as Record<string, unknown>) : null;
      if (rpcPayload && rpcPayload.success === false) {
        if (rpcPayload.error === 'trip_already_closed') {
          return NextResponse.json({
            success: true,
            status: String(rpcPayload.status || 'CANCELLED').toUpperCase(),
            message: 'trip_already_closed',
          });
        }
      } else {
        rpcCancelRequestedBy = rpcPayload?.cancel_requested_by ?? role;
        rpcSucceeded = true;
      }
    } else {
      console.warn('[mutual-cancel] REQUEST RPC error, using fallback:', rpcErr);
    }
  } catch (err) {
    console.warn('[mutual-cancel] REQUEST RPC exception, using fallback:', err);
  }

  // Resilient fallback: direct update of cancel_requested_by
  if (!rpcSucceeded) {
    const { error: directErr } = await supabaseAdmin
      .from('ride_requests')
      .update({
        cancel_requested_by: role,
        cancel_request_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .not('status', 'in', '("COMPLETED","CANCELLED")');

    if (directErr) {
      console.error('[mutual-cancel] Direct update error:', directErr);
      return NextResponse.json({ success: false, error: 'request_failed' }, { status: 500 });
    }
  }

  const confirmedRole = normalizeCancelRole(rpcCancelRequestedBy) ?? role;
  try {
    await broadcastMutualCancelEvent(requestId, 'REQUEST_CANCEL', {
      fromRole: confirmedRole,
      tripDurationMinutes,
      timestamp: Date.now(),
      source: 'server',
    });
  } catch (bErr) {
    console.warn('[mutual-cancel] broadcast warning:', bErr);
  }

  return NextResponse.json({
    success: true,
    action: 'REQUEST',
    cancel_requested_by: confirmedRole,
    requestId,
  });
}

export async function handleMutualCancelDeclineOrRevoke(
  requestId: string,
  role: 'captain' | 'rider',
  action: 'DECLINE' | 'REVOKE',
) {
  let rpcSucceeded = false;
  try {
    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('request_mutual_trip_cancellation', {
      p_request_id: requestId,
      p_role: role,
      p_action: action,
    });

    if (!rpcErr) {
      const rpcPayload = rpcData && typeof rpcData === 'object' ? (rpcData as Record<string, unknown>) : null;
      if (rpcPayload && rpcPayload.success === false) {
        if (rpcPayload.error === 'trip_already_closed') {
          return NextResponse.json({
            success: true,
            status: String(rpcPayload.status || 'CANCELLED').toUpperCase(),
            message: 'trip_already_closed',
          });
        }
      } else {
        rpcSucceeded = true;
      }
    } else {
      console.warn(`[mutual-cancel] ${action} RPC error, using fallback:`, rpcErr);
    }
  } catch (err) {
    console.warn(`[mutual-cancel] ${action} RPC exception, using fallback:`, err);
  }

  if (!rpcSucceeded) {
    const { error: directErr } = await supabaseAdmin
      .from('ride_requests')
      .update({
        cancel_requested_by: null,
        cancel_request_time: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .not('status', 'in', '("COMPLETED","CANCELLED")');

    if (directErr) {
      console.error(`[mutual-cancel] ${action} direct update error:`, directErr);
      return NextResponse.json({ success: false, error: `${action.toLowerCase()}_failed` }, { status: 500 });
    }
  }

  try {
    await broadcastMutualCancelEvent(
      requestId,
      action === 'DECLINE' ? 'DECLINE_CANCEL' : 'REVOKE_CANCEL',
      {
        fromRole: role,
        timestamp: Date.now(),
        source: 'server',
      },
    );
  } catch (bErr) {
    console.warn('[mutual-cancel] broadcast warning:', bErr);
  }

  return NextResponse.json({
    success: true,
    action,
    cancel_requested_by: null,
    requestId,
  });
}

export async function handleMutualCancelAccept(
  requestId: string,
  role: 'captain' | 'rider',
  isAdmin: boolean,
  tripDurationMinutes: number,
) {
  let cancelSucceeded = false;

  try {
    const { data: acceptData, error: updateErr } = await supabaseAdmin.rpc('mutual_cancel_ride_request', {
      p_request_id: requestId,
    });

    if (!updateErr) {
      const acceptPayload = acceptData && typeof acceptData === 'object'
        ? (acceptData as Record<string, unknown>)
        : null;
      const closedStatus = String(acceptPayload?.status || '').toUpperCase();
      if (acceptPayload?.message === 'already_closed' && closedStatus === 'COMPLETED') {
        return NextResponse.json({
          success: true,
          requestId,
          status: 'COMPLETED',
          message: 'trip_already_closed',
        });
      }
      cancelSucceeded = true;
    } else {
      console.warn('[mutual-cancel] mutual_cancel_ride_request RPC error, checking DB state:', updateErr);
    }
  } catch (err) {
    console.warn('[mutual-cancel] mutual_cancel_ride_request exception, checking DB state:', err);
  }

  // If RPC returned an error or threw, verify if the trip is already CANCELLED in DB
  if (!cancelSucceeded) {
    const { data: checkRow } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status')
      .eq('id', requestId)
      .maybeSingle();

    const currentStatus = String(checkRow?.status || '').toUpperCase();
    if (currentStatus === 'CANCELLED') {
      cancelSucceeded = true;
    } else if (currentStatus === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        requestId,
        status: 'COMPLETED',
        message: 'trip_already_closed',
      });
    } else {
      // Retry RPC once after a short breath
      try {
        const { data: retryData, error: retryErr } = await supabaseAdmin.rpc('mutual_cancel_ride_request', {
          p_request_id: requestId,
        });
        if (!retryErr) {
          cancelSucceeded = true;
        } else {
          console.error('[mutual-cancel] mutual_cancel_ride_request retry failed:', retryErr);
        }
      } catch (retryExc) {
        console.error('[mutual-cancel] mutual_cancel_ride_request retry exception:', retryExc);
      }
    }
  }

  if (!cancelSucceeded) {
    // Final check on status before failing
    const { data: finalCheck } = await supabaseAdmin
      .from('ride_requests')
      .select('status')
      .eq('id', requestId)
      .maybeSingle();

    if (String(finalCheck?.status || '').toUpperCase() === 'CANCELLED') {
      cancelSucceeded = true;
    } else {
      return NextResponse.json({ success: false, error: 'cancel_failed' }, { status: 400 });
    }
  }

  // Safe secondary cleanup - MUST never fail the request once cancellation succeeded
  try {
    await supabaseAdmin
      .from('ride_requests')
      .update({ cancel_requested_by: null, cancel_request_time: null })
      .eq('id', requestId);
  } catch (cleanErr) {
    console.warn('[mutual-cancel] cancel_requested_by cleanup warning:', cleanErr);
  }

  try {
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from('ride_offers')
      .update({
        status: 'REJECTED',
        updated_at: nowIso,
      })
      .eq('request_id', requestId)
      .neq('status', 'ACCEPTED');
  } catch (offersErr) {
    console.warn('[mutual-cancel] ride_offers cleanup warning:', offersErr);
  }

  try {
    await broadcastMutualCancelEvent(requestId, 'ACCEPT_CANCEL', {
      fromRole: role,
      tripDurationMinutes,
      timestamp: Date.now(),
      source: 'server',
    });
  } catch (bErr) {
    console.warn('[mutual-cancel] broadcast warning:', bErr);
  }

  return NextResponse.json({
    success: true,
    requestId,
    status: 'CANCELLED',
    cancelledBy: isAdmin ? 'admin' : role,
    tripDurationMinutes,
  });
}
