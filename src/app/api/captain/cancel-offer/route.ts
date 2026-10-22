import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId || body.tripId || '').trim();
    const explicitUid = body.uid ? String(body.uid) : null;

    if (!requestId) {
      return NextResponse.json({ success: false, error: 'request_id_required' }, { status: 400 });
    }

    // 1. Resolve user ID from Authorization header or explicitUid
    let uid: string | null = null;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token) {
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user?.id) {
          uid = authData.user.id;
        }
      } catch {}
    }

    if (!uid && explicitUid) {
      uid = explicitUid;
    }

    if (!uid) {
      return NextResponse.json({ success: false, error: 'authentication_required' }, { status: 401 });
    }

    // 2. Check if the offer exists and its current status
    const { data: offers, error: findErr } = await supabaseAdmin
      .from('ride_offers')
      .select('id, status, request_id')
      .eq('request_id', requestId)
      .eq('captain_id', uid);

    if (findErr) {
      return NextResponse.json({ success: false, error: findErr.message }, { status: 500 });
    }

    if (!offers || offers.length === 0) {
      // Offer already cleared or does not exist
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

    // 3. Mark as CANCELLED (broadcasts Realtime UPDATE event to rider)
    await supabaseAdmin
      .from('ride_offers')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .eq('captain_id', uid);

    // 4. Delete the offer from ride_offers (broadcasts Realtime DELETE event and cleans table)
    const { error: delErr } = await supabaseAdmin
      .from('ride_offers')
      .delete()
      .eq('request_id', requestId)
      .eq('captain_id', uid);

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requestId,
      captainId: uid,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'internal_error' }, { status: 500 });
  }
}

