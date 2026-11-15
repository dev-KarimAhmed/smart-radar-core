import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CAPTAIN_ADS_CONFIG } from '@/features/captain/config/captain-ads-config';
import { isUuid, isValidSeatNumber, validateSafeImageInput } from './captain-ads-validator';
import { uploadAdImageIfDataUrl } from './captain-ads-media';

export async function handleUpdateCaptainAd(caller: any, body: any): Promise<NextResponse> {
  const { adId, captainId: rawCaptainId, seatNumber, caption, imageUrl, status } = body;
  const captainId = String(rawCaptainId || caller.id).trim();

  if (!isUuid(captainId) || (!adId && !seatNumber)) {
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

  if (seatNumber !== undefined && !isValidSeatNumber(seatNumber)) {
    return NextResponse.json(
      { success: false, error: 'invalid_seat_number' },
      { status: 400 }
    );
  }

  if (caption && typeof caption === 'string' && caption.trim().length > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `caption_exceeds_limit_${CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH}`,
      },
      { status: 400 }
    );
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (caption !== undefined) {
    updates.caption = caption ? String(caption).trim().slice(0, CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) : null;
  }

  let uploadedImageUrl = imageUrl;
  if (imageUrl !== undefined) {
    const imageValidation = validateSafeImageInput(imageUrl);
    if (!imageValidation.ok) {
      return NextResponse.json(
        { success: false, error: imageValidation.error },
        { status: 400 }
      );
    }
    uploadedImageUrl = await uploadAdImageIfDataUrl(captainId, seatNumber || 1, imageValidation.value);
    updates.image_url = uploadedImageUrl;
  }

  if (status !== undefined) {
    const normalizedStatus = String(status).toUpperCase().trim();
    if (normalizedStatus !== 'ACTIVE' && normalizedStatus !== 'PAUSED') {
      return NextResponse.json(
        { success: false, error: 'invalid_ad_status' },
        { status: 400 }
      );
    }
    updates.status = normalizedStatus;
  }

  if (seatNumber !== undefined) updates.seat_number = Number(seatNumber);

  let updatedInDb = false;
  if (adId && isUuid(String(adId))) {
    const { data, error } = await supabaseAdmin
      .from('captain_ads')
      .update(updates)
      .eq('id', String(adId))
      .eq('captain_id', captainId)
      .select();
    if (error) {
      console.error('[Captain Ads API] Supabase PUT update by id error:', error);
      return NextResponse.json(
        { success: false, error: 'captain_ad_update_failed' },
        { status: 500 }
      );
    }
    if (data && data.length > 0) {
      updatedInDb = true;
    }
  }

  if (!updatedInDb && seatNumber !== undefined) {
    // تحديث برقم المقعد ومعرف الكابتن
    const { data, error } = await supabaseAdmin
      .from('captain_ads')
      .update(updates)
      .eq('captain_id', captainId)
      .eq('seat_number', Number(seatNumber))
      .select();

    if (error) {
      console.error('[Captain Ads API] Supabase PUT update by seat error:', error);
      return NextResponse.json(
        { success: false, error: 'captain_ad_update_failed' },
        { status: 500 }
      );
    }

    if (data && data.length > 0) {
      updatedInDb = true;
    } else if (updates.image_url) {
      // محاولة Upsert فقط عند توفر صورة صالحة
      const { error: upsertErr } = await supabaseAdmin.from('captain_ads').upsert(
        {
          captain_id: captainId,
          seat_number: Number(seatNumber),
          ...updates,
        },
        { onConflict: 'captain_id,seat_number' }
      );
      if (upsertErr) {
        console.error('[Captain Ads API] Supabase PUT upsert error:', upsertErr);
        return NextResponse.json(
          { success: false, error: 'captain_ad_update_failed' },
          { status: 500 }
        );
      }
      updatedInDb = true;
    }
  }

  if (!updatedInDb) {
    return NextResponse.json(
      { success: false, error: 'captain_ad_not_found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, imageUrl: uploadedImageUrl });
}
