import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId || '').trim();
    const cancelledByRole = String(body.cancelledByRole || 'mutual').trim();

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'missing_request_id' }, { status: 400 });
    }

    // 1. Fetch current trip to verify existence and cancellable status
    const { data: requestRow, error: fetchErr } = await supabaseAdmin
      .from('ride_requests')
      .select('id, status, accepted_captain_id, rider_id')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchErr || !requestRow) {
      return NextResponse.json({ success: false, error: 'trip_not_found' }, { status: 404 });
    }

    const currentStatus = String(requestRow.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      return NextResponse.json({ success: true, status: currentStatus, message: 'trip_already_closed' });
    }

    // 2. Mark ride_request as CANCELLED with timestamp
    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from('ride_requests')
      .update({
        status: 'CANCELLED',
        cancelled_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', requestId);

    if (updateErr) {
      console.error('[mutual-cancel] update error:', updateErr);
      return NextResponse.json({ success: false, error: 'cancel_failed' }, { status: 500 });
    }

    // 3. Mark non-accepted offers as REJECTED
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
      cancelledBy: cancelledByRole,
    });
  } catch (error) {
    console.error('[mutual-cancel] unexpected error:', error);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}

