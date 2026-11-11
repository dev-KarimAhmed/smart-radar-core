import { NextResponse } from 'next/server';
import {
  createUserScopedSupabaseClient,
  extractBearerToken,
  getServerSupabaseAdmin,
  getVerifiedUser,
  isValidUuid,
} from '@/shared/server/api-auth-guard';
import {
  cancelAndDeleteOtherCaptainOffers,
  findBusyCaptainTripMap,
} from '@/shared/server/captain-offer-cleanup';

export async function GET(req: Request) {
  try {
    const token = extractBearerToken(req);
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller || !token) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = String(searchParams.get('requestId') || '').trim();

    if (!isValidUuid(requestId)) {
      return NextResponse.json({ success: false, error: 'valid_request_id_required' }, { status: 400 });
    }

    const adminClient = getServerSupabaseAdmin();
    const { data: requestRow, error: reqErr } = await adminClient
      .from('ride_requests')
      .select('id, rider_id')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr) {
      return NextResponse.json({ success: false, error: 'request_lookup_failed' }, { status: 500 });
    }

    if (!requestRow) {
      return NextResponse.json({ success: true, offers: [] });
    }

    if (requestRow.rider_id !== caller.id && caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'not_request_owner' }, { status: 403 });
    }

    const userClient = createUserScopedSupabaseClient(token);
    const { data, error: rpcError } = await userClient.rpc('get_passenger_bids', {
      p_request_id: requestId,
    });

    if (rpcError) {
      const msg = String(rpcError.message || '');
      const status = msg.toLowerCase().includes('not_request_owner') ? 403 : 500;
      return NextResponse.json({ success: false, error: msg || 'offers_fetch_failed' }, { status });
    }

    const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    const captainIds = Array.from(
      new Set(
        rows
          .map((row) => String(row.captain_id || row.driver_id || '').trim())
          .filter(Boolean),
      ),
    );

    if (captainIds.length === 0) {
      return NextResponse.json({ success: true, offers: rows });
    }

    const busyMap = await findBusyCaptainTripMap(adminClient, captainIds, requestId);

    if (busyMap.size > 0) {
      await Promise.all(
        Array.from(busyMap.entries()).map(([capId, activeTripId]) =>
          cancelAndDeleteOtherCaptainOffers(adminClient, capId, activeTripId).catch(() => {}),
        ),
      );
    }

    const cleanRows = rows.filter((row) => {
      const capId = String(row.captain_id || row.driver_id || '').trim();
      return !capId || !busyMap.has(capId);
    });

    return NextResponse.json({ success: true, offers: cleanRows });
  } catch (err) {
    console.error('[trip/offers] unexpected error:', err);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
