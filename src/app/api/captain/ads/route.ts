import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CAPTAIN_ADS_CONFIG } from '@/features/captain/config/captain-ads-config';
import {
  consumeRateLimit,
  getClientIp,
  getVerifiedUser,
  isValidStorageRelativePath,
} from '@/shared/server/api-auth-guard';

export const dynamic = 'force-dynamic';

const SEAT_AD_PATH_PATTERN = /^[a-zA-Z0-9_-]{8,128}\/seat_\d+_\d+(?:_[a-f0-9-]+)?\.(png|jpe?g|webp|gif)$/i;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const DATA_IMAGE_PATTERN = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/i;

function isValidSeatNumber(value: unknown): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 20;
}

function validateSafeImageInput(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'invalid_image_url' };
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 6_000_000) {
    return { ok: false, error: 'invalid_image_size' };
  }

  if (trimmed.startsWith('data:')) {
    const match = DATA_IMAGE_PATTERN.exec(trimmed);
    if (!match) {
      return { ok: false, error: 'unsupported_image_mime_type' };
    }
    const base64Clean = match[2].replace(/\s+/g, '');
    const estimatedBytes = Math.floor((base64Clean.length * 3) / 4);
    if (estimatedBytes <= 0 || estimatedBytes > CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES + 2048) {
      return { ok: false, error: 'image_exceeds_size_limit' };
    }
    return { ok: true, value: `data:${match[1].toLowerCase()};base64,${base64Clean}` };
  }

  if (
    trimmed.startsWith('/api/captain/ads/image?') ||
    trimmed.startsWith('/icons/') ||
    trimmed.startsWith('/images/')
  ) {
    return { ok: true, value: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || (parsed.protocol === 'http:' && process.env.NODE_ENV !== 'production')) {
      return { ok: true, value: trimmed };
    }
  } catch {
    return { ok: false, error: 'invalid_image_url' };
  }

  return { ok: false, error: 'disallowed_image_protocol' };
}

async function resolveAdImageUrl(url: string, captainId: string): Promise<string> {
  if (!url || typeof url !== 'string') return url;

  // إذا كان الرابط هو رابط عام مكسور لسلة captain-documents الخاصة
  if (url.includes('/storage/v1/object/public/captain-documents/')) {
    const parts = url.split('/storage/v1/object/public/captain-documents/');
    let cleanPath = '';
    try {
      cleanPath = decodeURIComponent(parts[1] || '').replace(/^\/+/, '').trim();
    } catch {
      return url;
    }

    if (
      cleanPath &&
      isValidStorageRelativePath(cleanPath) &&
      cleanPath.startsWith(`${captainId}/`) &&
      SEAT_AD_PATH_PATTERN.test(cleanPath)
    ) {
      try {
        const { data: signData } = await supabaseAdmin.storage
          .from('captain-documents')
          .createSignedUrl(cleanPath, 60 * 60 * 24 * 7);
        if (signData?.signedUrl) {
          return signData.signedUrl;
        }
      } catch (err) {
        console.warn('[Captain Ads API] Sign URL fallback:', err);
      }
      return `/api/captain/ads/image?bucket=captain-documents&path=${encodeURIComponent(cleanPath)}`;
    }
  }

  return url;
}

async function uploadAdImageIfDataUrl(
  captainId: string,
  seatNumber: number | string,
  imageUrl: string
): Promise<string> {
  if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
    try {
      const matches = imageUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
      if (matches) {
        const rawMime = matches[1].toLowerCase();
        const contentType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const extRaw = contentType.split('/')[1] || 'png';
        const ext = extRaw === 'jpeg' ? 'jpg' : extRaw;
        const cleanFolder = captainId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'captain';
        const filePath = `${cleanFolder}/seat_${Number(seatNumber)}_${Date.now()}.${ext}`;

        // أولاً: محاولة الرفع إلى سلة إعلانات الكباتن العامة captain-ads
        try {
          const { error: uploadAdsErr } = await supabaseAdmin.storage
            .from('captain-ads')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadAdsErr) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('captain-ads')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              return publicUrlData.publicUrl;
            }
          }
        } catch (adsErr) {
          console.warn('[Captain Ads API] Upload to captain-ads failed:', adsErr);
        }

        // ثانياً: بديل مساند في حال عدم جاهزية سلة captain-ads - الرفع إلى captain-documents
        try {
          const { error: uploadDocsErr } = await supabaseAdmin.storage
            .from('captain-documents')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadDocsErr) {
            const { data: signData } = await supabaseAdmin.storage
              .from('captain-documents')
              .createSignedUrl(filePath, 60 * 60 * 24 * 365);

            if (signData?.signedUrl) {
              return signData.signedUrl;
            } else {
              return `/api/captain/ads/image?bucket=captain-documents&path=${encodeURIComponent(filePath)}`;
            }
          }
        } catch (docsErr) {
          console.warn('[Captain Ads API] Upload to captain-documents failed:', docsErr);
        }
      }
    } catch (storageErr) {
      console.warn('[Captain Ads API] Storage upload fallback to direct URL:', storageErr);
    }
  }

  return imageUrl;
}

/**
 * جلب جميع إعلانات الكابتن من الباك إند
 * يمكن لأي راكب يقبل عرض الكابتن استدعاء هذا الرابط لجلب إعلاناته
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const captainId = (searchParams.get('captainId') || '').trim();

    if (!captainId || !isUuid(captainId)) {
      return NextResponse.json(
        { success: false, error: 'valid_captain_id_is_required' },
        { status: 400 }
      );
    }

    const caller = await getVerifiedUser(req, { allowSuspended: true });
    const canSeePaused = Boolean(caller && (caller.role === 'ADMIN' || caller.id === captainId));

    // الاستعلام من جدول captain_ads في Supabase
    let adsQuery = supabaseAdmin
      .from('captain_ads')
      .select('*')
      .eq('captain_id', captainId);

    if (!canSeePaused) {
      adsQuery = adsQuery.eq('status', 'ACTIVE');
    }

    const { data: rows, error: fetchErr } = await adsQuery.order('seat_number', { ascending: true });

    if (fetchErr) {
      console.error('[Captain Ads API] Supabase GET query error:', fetchErr);
      return NextResponse.json(
        { success: false, error: 'captain_ads_fetch_failed' },
        { status: 500 }
      );
    }

    const formatted = await Promise.all(
      (rows || []).map(async (r) => ({
        id: r.id,
        captainId: r.captain_id,
        seatNumber: r.seat_number,
        seatLabel: r.seat_label || 'إعلان ترويجي',
        imageUrl: await resolveAdImageUrl(r.image_url, r.captain_id),
        caption: r.caption || undefined,
        status: r.status || 'ACTIVE',
        createdAt: new Date(r.created_at).getTime(),
        updatedAt: new Date(r.updated_at).getTime(),
      }))
    );
    return NextResponse.json({ success: true, ads: formatted });
  } catch (error) {
    console.error('[Captain Ads API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * حفظ أو تحديث إعلان كابتن في مقعد محدد
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(`captain-ads-write:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
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
  } catch (error) {
    console.error('[Captain Ads API POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * تعديل إعلان موجود (تحديث النص أو الصورة أو الحالة)
 */
export async function PUT(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(`captain-ads-write:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
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
  } catch (error) {
    console.error('[Captain Ads API PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * حذف إعلان من مقعد محدد
 */
export async function DELETE(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(`captain-ads-write:${ip}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'rate_limit_exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const caller = await getVerifiedUser(req);
    if (!caller) {
      return NextResponse.json(
        { success: false, error: 'authentication_required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
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
  } catch (error) {
    console.error('[Captain Ads API DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: 'internal_server_error' },
      { status: 500 }
    );
  }
}
