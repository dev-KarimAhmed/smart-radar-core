import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeCancelRole } from '@/shared/hooks/mutual-cancellation-helpers';
import { broadcastMutualCancelEvent, isMissingRpcFunctionError } from './mutual-cancel-broadcast';

export async function handleMutualCancelRequest(
  requestId: string,
  role: 'captain' | 'rider',
  tripDurationMinutes: number,
) {
  let rpcSucceeded = false;
  let shouldFallback = false;
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
        return NextResponse.json(
          { success: false, error: String(rpcPayload.error || 'request_failed') },
          { status: 400 },
        );
      }
      rpcCancelRequestedBy = rpcPayload?.cancel_requested_by ?? role;
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
      .not('status', 'in', '("COMPLETED","CANCELLED")');

    if (directErr) {
      console.error('[mutual-cancel] Direct update error:', directErr);
      return NextResponse.json({ success: false, error: 'request_failed' }, { status: 500 });
    }
  }

  const confirmedRole = normalizeCancelRole(rpcCancelRequestedBy) ?? role;
  await broadcastMutualCancelEvent(requestId, 'REQUEST_CANCEL', {
    fromRole: confirmedRole,
    tripDurationMinutes,
    timestamp: Date.now(),
    source: 'server',
  });

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
  let shouldFallback = false;
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
        return NextResponse.json(
          { success: false, error: String(rpcPayload.error || `${action.toLowerCase()}_failed`) },
          { status: 400 },
        );
      }
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
      .not('status', 'in', '("COMPLETED","CANCELLED")');

    if (directErr) {
      console.error(`[mutual-cancel] ${action} direct update error:`, directErr);
      return NextResponse.json({ success: false, error: `${action.toLowerCase()}_failed` }, { status: 500 });
    }
  }

  await broadcastMutualCancelEvent(
    requestId,
    action === 'DECLINE' ? 'DECLINE_CANCEL' : 'REVOKE_CANCEL',
    {
      fromRole: role,
      timestamp: Date.now(),
      source: 'server',
    },
  );

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
  let shouldFallbackCancel = false;

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
      .not('status', 'in', '("COMPLETED","CANCELLED")');

    if (directErr) {
      console.error('[mutual-cancel] direct cancel update error:', directErr);
      return NextResponse.json({ success: false, error: 'cancel_failed' }, { status: 500 });
    }
  }

  await supabaseAdmin
    .from('ride_requests')
    .update({ cancel_requested_by: null, cancel_request_time: null })
    .eq('id', requestId);

  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from('ride_offers')
    .update({
      status: 'REJECTED',
      updated_at: nowIso,
    })
    .eq('request_id', requestId)
    .neq('status', 'ACCEPTED');

  await broadcastMutualCancelEvent(requestId, 'ACCEPT_CANCEL', {
    fromRole: role,
    tripDurationMinutes,
    timestamp: Date.now(),
    source: 'server',
  });

  return NextResponse.json({
    success: true,
    requestId,
    status: 'CANCELLED',
    cancelledBy: isAdmin ? 'admin' : role,
    tripDurationMinutes,
  });
}
