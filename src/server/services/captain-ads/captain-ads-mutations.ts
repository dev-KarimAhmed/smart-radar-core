import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CAPTAIN_ADS_CONFIG } from '@/features/captain/config/captain-ads-config';
import { isUuid, isValidSeatNumber, validateSafeImageInput } from './captain-ads-validator';
import { uploadAdImageIfDataUrl } from './captain-ads-media';

export async function handleCreateCaptainAd(caller: any, body: any): Promise<NextResponse> {
  const { captainId: rawCaptainId, seatNumber, seatLabel, imageUrl, caption } = body;
  const captainId = String(rawCaptainId || caller.id).trim();

  if (!isUuid(captainId) || !isValidSeatNumber(seatNumber) || !imageUrl) {
    return NextResponse.json(
      { success: false, error: 'missing_or_invalid_required_fields' },
      { status: 400 }
    );
  }

  const isAdmin = caller.role === 'ADMIN';
  const isCaptainOwner =
    caller.id === captainId && (caller.role === 'CAPTAIN' || caller.role === 'DRIVER');
  if (!isAdmin && !isCaptainOwner) {
    return NextResponse.json(
      { success: false, error: 'forbidden_captain_ad_access' },
      { status: 403 }
    );
  }

  const imageValidation = validateSafeImageInput(imageUrl);
  if (!imageValidation.ok) {
    return NextResponse.json(
      { success: false, error: imageValidation.error },
      { status: 400 }
    );
  }

  // التحقق من صحة الحد الأقصى لنص الإعلان (100 حرف)
  if (caption && typeof caption === 'string' && caption.trim().length > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `caption_exceeds_limit_${CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH}`,
      },
      { status: 400 }
    );
  }

  const trimmedCaption = caption ? String(caption).trim().slice(0, CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) : null;
  const safeSeatLabel = seatLabel ? String(seatLabel).trim().slice(0, 80) : 'إعلان ترويجي';
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  // التحقق من الحد الأقصى للإعلانات (4 إعلانات لكل كابتن)
  const { data: existingAds } = await supabaseAdmin
    .from('captain_ads')
    .select('id, seat_number')
    .eq('captain_id', captainId);

  const isSeatAlreadyOccupied = existingAds?.some((a) => Number(a.seat_number) === Number(seatNumber));
  if (!isSeatAlreadyOccupied && (existingAds?.length || 0) >= CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT) {
    return NextResponse.json(
      { success: false, error: 'ads_limit_reached_max_4' },
      { status: 400 }
    );
  }

  const uploadedImageUrl = await uploadAdImageIfDataUrl(captainId, Number(seatNumber), imageValidation.value);

  // الإدخال في Supabase
  const { data: savedRow, error: upsertErr } = await supabaseAdmin
    .from('captain_ads')
    .upsert(
      {
        captain_id: captainId,
        seat_number: Number(seatNumber),
        seat_label: safeSeatLabel,
        image_url: uploadedImageUrl,
        caption: trimmedCaption,
        status: 'ACTIVE',
        updated_at: nowIso,
      },
      { onConflict: 'captain_id,seat_number' }
    )
    .select()
    .single();

  if (upsertErr || !savedRow) {
    console.error('[Captain Ads API] Supabase upsert error:', upsertErr);
    return NextResponse.json(
      { success: false, error: 'captain_ad_save_failed' },
      { status: 500 }
    );
  }

  const createdAd = {
    id: savedRow.id,
    captainId,
    seatNumber: Number(seatNumber),
    seatLabel: safeSeatLabel,
    imageUrl: uploadedImageUrl,
    caption: trimmedCaption || undefined,
    status: 'ACTIVE' as const,
    createdAt: new Date(savedRow.created_at).getTime(),
    updatedAt: nowMs,
  };

  return NextResponse.json({ success: true, ad: createdAd });
}

export async function handleDeleteCaptainAd(caller: any, searchParams: URLSearchParams): Promise<NextResponse> {
  const captainId = (searchParams.get('captainId') || caller.id).trim();
  const adId = (searchParams.get('adId') || '').trim();
  const seatNumberParam = searchParams.get('seatNumber');

  if (!isUuid(captainId) || (!adId && !seatNumberParam)) {
    return NextResponse.json(
      { success: false, error: 'valid_captain_id_and_ad_identifier_required' },
      { status: 400 }
    );
  }

  const isAdmin = caller.role === 'ADMIN';
  const isCaptainOwner =
    caller.id === captainId && (caller.role === 'CAPTAIN' || caller.role === 'DRIVER');
  if (!isAdmin && !isCaptainOwner) {
    return NextResponse.json(
      { success: false, error: 'forbidden_captain_ad_access' },
      { status: 403 }
    );
  }

  if (seatNumberParam !== null && !isValidSeatNumber(seatNumberParam)) {
    return NextResponse.json(
      { success: false, error: 'invalid_seat_number' },
      { status: 400 }
    );
  }

  let query = supabaseAdmin.from('captain_ads').delete();
  if (adId && isUuid(adId)) {
    query = query.eq('id', adId).eq('captain_id', captainId);
  } else if (seatNumberParam) {
    query = query.eq('captain_id', captainId).eq('seat_number', Number(seatNumberParam));
  }
  const { error: deleteErr } = await query;
  if (deleteErr) {
    console.error('[Captain Ads API] Supabase delete error:', deleteErr);
    return NextResponse.json(
      { success: false, error: 'captain_ad_delete_failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
