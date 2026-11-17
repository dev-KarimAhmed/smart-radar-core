import { NextResponse } from 'next/server';
import {
  getServerSupabaseAdmin,
  getVerifiedUser,
  isValidUuid,
} from '@/shared/server/api-auth-guard';
import { fetchCaptainCardsMapAdmin } from '@/shared/server/captain-vehicle-card';

export async function GET(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
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
      .select('id, rider_id, accepted_captain_id, accepted_offer_id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr) {
      return NextResponse.json({ success: false, error: 'request_lookup_failed' }, { status: 500 });
    }

    if (!requestRow) {
      return NextResponse.json({ success: false, error: 'request_not_found' }, { status: 404 });
    }

    if (requestRow.rider_id !== caller.id && caller.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'not_request_owner' }, { status: 403 });
    }

    let captainId = String(requestRow.accepted_captain_id || '').trim();

    if (!captainId && requestRow.accepted_offer_id) {
      const { data: offerRow } = await adminClient
        .from('ride_offers')
        .select('captain_id')
        .eq('id', requestRow.accepted_offer_id)
        .maybeSingle();
      captainId = String((offerRow as Record<string, unknown> | null)?.captain_id || '').trim();
    }

    if (!captainId) {
      return NextResponse.json({ success: true, captain: null });
    }

    const cardsMap = await fetchCaptainCardsMapAdmin(adminClient, [captainId], true);
    const captain = cardsMap.get(captainId) ?? null;

    return NextResponse.json({ success: true, captain });
  } catch (err) {
    console.error('[trip/captain-card] unexpected error:', err);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
