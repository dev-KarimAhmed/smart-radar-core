import { NextResponse } from 'next/server';
import {
  createUserScopedSupabaseClient,
  extractBearerToken,
  getServerSupabaseAdmin,
  getVerifiedUser,
  isValidUuid,
} from '@/shared/server/api-auth-guard';
import {
  ACTIVE_TRIP_STATUSES,
  cancelAndDeleteOtherCaptainOffers,
  findBusyCaptainTripMap,
  withCaptainAcceptLock,
} from '@/shared/server/captain-offer-cleanup';

function resolveRpcDomainError(message: string): { status: number; code: string } | null {
  const normalized = message.toLowerCase();
  if (normalized.includes('captain_already_busy')) {
    return { status: 409, code: 'captain_already_busy' };
  }
  if (normalized.includes('ride_offer_not_pending')) {
    return { status: 409, code: 'ride_offer_not_pending' };
  }
  if (normalized.includes('ride_request_not_accepting_offers')) {
    return { status: 409, code: 'ride_request_not_accepting_offers' };
  }
  if (normalized.includes('ride_offer_not_found')) {
    return { status: 404, code: 'ride_offer_not_found' };
  }
  if (normalized.includes('ride_request_not_found')) {
    return { status: 404, code: 'ride_request_not_found' };
  }
  if (normalized.includes('not_request_owner')) {
    return { status: 403, code: 'not_request_owner' };
  }
  if (
    normalized.includes('offer_id_required')
    || normalized.includes('request_id_required')
    || normalized.includes('ride_offer_missing_captain')
  ) {
    return { status: 400, code: 'ride_offer_id_required' };
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const token = extractBearerToken(req);
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller || !token) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = String(body?.requestId || '').trim();
    const offerId = String(body?.offerId || '').trim();

    if (!isValidUuid(requestId) || !isValidUuid(offerId)) {
      return NextResponse.json({ success: false, error: 'ride_offer_id_required' }, { status: 400 });
    }

    const adminClient = getServerSupabaseAdmin();

    const [{ data: requestRow, error: reqErr }, { data: offerRow, error: offErr }] = await Promise.all([
      adminClient
        .from('ride_requests')
        .select('id, rider_id, status, accepted_offer_id, accepted_captain_id, final_fare, server_estimated_fare')
        .eq('id', requestId)
        .maybeSingle(),
      adminClient
        .from('ride_offers')
        .select('id, request_id, captain_id, status, offer_price, offered_fare')
        .eq('id', offerId)
        .eq('request_id', requestId)
        .maybeSingle(),
    ]);

    if (reqErr || offErr) {
      return NextResponse.json({ success: false, error: 'offer_lookup_failed' }, { status: 500 });
    }

    if (!requestRow) {
      return NextResponse.json({ success: false, error: 'ride_request_not_found' }, { status: 404 });
    }

    if (requestRow.rider_id !== caller.id) {
      return NextResponse.json({ success: false, error: 'not_request_owner' }, { status: 403 });
    }

    const currentReqStatus = String(requestRow.status || '').trim().toUpperCase();

    if (!offerRow) {
      if (ACTIVE_TRIP_STATUSES.has(currentReqStatus) && requestRow.accepted_offer_id === offerId) {
        if (requestRow.accepted_captain_id) {
          await cancelAndDeleteOtherCaptainOffers(
            adminClient,
            String(requestRow.accepted_captain_id),
            requestId,
            offerId,
          ).catch(() => {});
        }
        return NextResponse.json({
          success: true,
          data: {
            request_id: requestId,
            offer_id: offerId,
            captain_id: requestRow.accepted_captain_id,
            final_fare: requestRow.final_fare ?? requestRow.server_estimated_fare ?? 0,
            status: requestRow.status,
          },
        });
      }
      return NextResponse.json({ success: false, error: 'ride_offer_not_found' }, { status: 404 });
    }

    const captainId = String(offerRow.captain_id || '').trim();
    if (!captainId) {
      return NextResponse.json({ success: false, error: 'ride_offer_missing_captain' }, { status: 400 });
    }

    // Idempotent duplicate click on the same already-accepted offer
    if (ACTIVE_TRIP_STATUSES.has(currentReqStatus) && requestRow.accepted_offer_id === offerId) {
      await cancelAndDeleteOtherCaptainOffers(adminClient, captainId, requestId, offerId).catch(() => {});
      return NextResponse.json({
        success: true,
        data: {
          request_id: requestId,
          offer_id: offerId,
          captain_id: requestRow.accepted_captain_id || captainId,
          final_fare:
            offerRow.offer_price
            ?? offerRow.offered_fare
            ?? requestRow.final_fare
            ?? requestRow.server_estimated_fare
            ?? 0,
          status: requestRow.status,
        },
      });
    }

    if (currentReqStatus !== 'PENDING' && currentReqStatus !== 'RECEIVING_OFFERS') {
      return NextResponse.json({ success: false, error: 'ride_request_not_accepting_offers' }, { status: 409 });
    }

    const currentOfferStatus = String(offerRow.status || 'PENDING').trim().toUpperCase();
    if (currentOfferStatus !== 'PENDING' && currentOfferStatus !== '') {
      return NextResponse.json({ success: false, error: 'ride_offer_not_pending' }, { status: 409 });
    }

    return await withCaptainAcceptLock(captainId, async () => {
      // Re-verify captain availability under lock to stop double-booking races
      const busyMap = await findBusyCaptainTripMap(adminClient, [captainId], requestId);
      const activeOtherRequestId = busyMap.get(captainId);

      if (activeOtherRequestId) {
        await cancelAndDeleteOtherCaptainOffers(adminClient, captainId, activeOtherRequestId).catch(() => {});
        return NextResponse.json(
          {
            success: false,
            error: 'captain_already_busy',
            message: 'تم قبول رحلة أخرى لهذا الكابتن بالفعل. اختر عرضاً آخر متاحاً.',
          },
          { status: 409 },
        );
      }

      const userClient = createUserScopedSupabaseClient(token);
      const { data, error: rpcError } = await userClient.rpc('accept_ride_offer', {
        p_request_id: requestId,
        p_offer_id: offerId,
      });

      if (rpcError) {
        const mapped = resolveRpcDomainError(String(rpcError.message || ''));
        if (mapped?.code === 'captain_already_busy') {
          const latestBusyMap = await findBusyCaptainTripMap(adminClient, [captainId], requestId);
          await cancelAndDeleteOtherCaptainOffers(
            adminClient,
            captainId,
            latestBusyMap.get(captainId) ?? null,
          ).catch(() => {});
        }
        if (mapped) {
          return NextResponse.json({ success: false, error: mapped.code }, { status: mapped.status });
        }
        return NextResponse.json(
          { success: false, error: rpcError.message || 'accept_offer_failed' },
          { status: 500 },
        );
      }

      // Immediately cancel & delete any other pending offers from this captain on other requests
      await cancelAndDeleteOtherCaptainOffers(adminClient, captainId, requestId, offerId).catch(() => {});

      return NextResponse.json({ success: true, data });
    });
  } catch (err) {
    console.error('[trip/accept-offer] unexpected error:', err);
    return NextResponse.json({ success: false, error: 'internal_server_error' }, { status: 500 });
  }
}
