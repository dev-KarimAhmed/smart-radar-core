import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const caller = await getVerifiedUser(req, { allowSuspended: true });
    if (!caller) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    if (caller.role !== 'CAPTAIN' && caller.role !== 'DRIVER') {
      return NextResponse.json({ success: false, error: 'forbidden_captain_only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.requestId || body.tripId || '').trim();

    if (!requestId || !UUID_PATTERN.test(requestId)) {
      return NextResponse.json({ success: false, error: 'valid_request_id_required' }, { status: 400 });
    }

    const uid = caller.id;

    // Check if the offer exists and its current status
    const { data: offers, error: findErr } = await supabaseAdmin
      .from('ride_offers')
      .select('id, status, request_id')
      .eq('request_id', requestId)
      .eq('captain_id', uid);

    if (findErr) {
      console.error('[captain/cancel-offer] find error:', findErr);
      return NextResponse.json({ success: false, error: 'offer_lookup_failed' }, { status: 500 });
    }

    if (!offers || offers.length === 0) {
      return NextResponse.json({ success: true, message: 'offer_already_cleared' });
    }

    const hasAcceptedOffer = offers.some(
      (o) => String(o.status || '').toUpperCase() === 'ACCEPTED'
    );
    if (hasAcceptedOffer) {
      return NextResponse.json(
        {
          success: false,
          error: 'offer_already_accepted',
          message: 'تم قبول العرض بالفعل من قبل الراكب ولا يمكن إلغاؤه.',
        },
        { status: 409 }
      );
    }

    // Mark pending offer as CANCELLED (never touch an already accepted offer)
    await supabaseAdmin
      .from('ride_offers')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .eq('captain_id', uid)
      .neq('status', 'ACCEPTED');

    // Delete only non-accepted offers from ride_offers (broadcasts Realtime DELETE event and cleans table)
    const { error: delErr } = await supabaseAdmin
      .from('ride_offers')
      .delete()
      .eq('request_id', requestId)
      .eq('captain_id', uid)
      .neq('status', 'ACCEPTED');

    if (delErr) {
      console.error('[captain/cancel-offer] delete error:', delErr);
      return NextResponse.json({ success: false, error: 'offer_delete_failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requestId,
      captainId: uid,
    });
  } catch (err) {
    console.error('[captain/cancel-offer] unexpected error:', err);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}

