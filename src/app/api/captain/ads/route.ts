import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CAPTAIN_ADS_CONFIG } from '@/features/captain/config/captain-ads-config';

export const dynamic = 'force-dynamic';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ذاكرة مساندة بالسيرفر في حال تعذر الاتصال بجدول Supabase قبل تطبيق الـ Migration
const inMemoryFallbackStore = new Map<string, any[]>();

async function resolveAdImageUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return url;

  // إذا كان الرابط هو رابط عام مكسور لسلة captain-documents الخاصة
  if (url.includes('/storage/v1/object/public/captain-documents/')) {
    const parts = url.split('/storage/v1/object/public/captain-documents/');
    const cleanPath = parts[1]?.replace(/^\/+/, '');
    if (cleanPath) {
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
      const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = contentType.split('/')[1] || 'png';
        const cleanFolder = captainId.replace(/[^a-zA-Z0-9_-]/g, '_') || 'captain';
        const filePath = `${cleanFolder}/seat_${seatNumber}_${Date.now()}.${ext}`;

        let uploadSuccess = false;

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

    if (!captainId) {
      return NextResponse.json(
        { success: false, error: 'captain_id_is_required' },
        { status: 400 }
      );
    }

    // 1. محاولة الاستعلام من جدول captain_ads في Supabase
    try {
      const { data: rows, error: fetchErr } = await supabaseAdmin
        .from('captain_ads')
        .select('*')
        .eq('captain_id', captainId)
        .order('seat_number', { ascending: true });

      if (!fetchErr && Array.isArray(rows)) {
        const formatted = await Promise.all(
          rows.map(async (r) => ({
            id: r.id,
            captainId: r.captain_id,
            seatNumber: r.seat_number,
            seatLabel: r.seat_label || 'إعلان ترويجي',
            imageUrl: await resolveAdImageUrl(r.image_url),
            caption: r.caption || undefined,
            status: r.status || 'ACTIVE',
            createdAt: new Date(r.created_at).getTime(),
            updatedAt: new Date(r.updated_at).getTime(),
          }))
        );
        return NextResponse.json({ success: true, ads: formatted });
      }
    } catch (dbErr) {
      console.warn('[Captain Ads API] Supabase query fallback:', dbErr);
    }

    // 2. استخدام الذاكرة المساندة بالسيرفر كـ Fallback فوري
    const fallbackList = inMemoryFallbackStore.get(captainId) || [];
    const formattedFallback = await Promise.all(
      fallbackList.map(async (ad) => ({
        ...ad,
        imageUrl: await resolveAdImageUrl(ad.imageUrl),
      }))
    );
    return NextResponse.json({ success: true, ads: formattedFallback });
  } catch (error: any) {
    console.error('[Captain Ads API GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * حفظ أو تحديث إعلان كابتن في مقعد محدد
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { captainId, seatNumber, seatLabel, imageUrl, caption } = body;

    if (!captainId || !seatNumber || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'missing_required_fields' },
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
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    const uploadedImageUrl = await uploadAdImageIfDataUrl(captainId, seatNumber, imageUrl);

    // 1. محاولة الإدخال في Supabase
    let savedRow: any = null;
    try {
      const { data, error: upsertErr } = await supabaseAdmin
        .from('captain_ads')
        .upsert(
          {
            captain_id: captainId,
            seat_number: Number(seatNumber),
            seat_label: seatLabel || 'إعلان ترويجي',
            image_url: uploadedImageUrl,
            caption: trimmedCaption,
            status: 'ACTIVE',
            updated_at: nowIso,
          },
          { onConflict: 'captain_id,seat_number' }
        )
        .select()
        .single();

      if (!upsertErr && data) {
        savedRow = data;
      }
    } catch (upsertErr) {
      console.warn('[Captain Ads API] Supabase upsert fallback:', upsertErr);
    }

    const createdAd = {
      id: savedRow?.id || `ad_${nowMs}_${Math.random().toString(36).substring(2, 7)}`,
      captainId,
      seatNumber: Number(seatNumber),
      seatLabel: seatLabel || 'إعلان ترويجي',
      imageUrl: uploadedImageUrl,
      caption: trimmedCaption || undefined,
      status: 'ACTIVE' as const,
      createdAt: savedRow ? new Date(savedRow.created_at).getTime() : nowMs,
      updatedAt: nowMs,
    };

    // مزامنة الذاكرة المساندة بالسيرفر
    const existingList = inMemoryFallbackStore.get(captainId) || [];
    const filtered = existingList.filter((a) => a.seatNumber !== Number(seatNumber));
    inMemoryFallbackStore.set(captainId, [...filtered, createdAd].sort((a, b) => a.seatNumber - b.seatNumber));

    return NextResponse.json({ success: true, ad: createdAd });
  } catch (error: any) {
    console.error('[Captain Ads API POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * تعديل إعلان موجود (تحديث النص أو الصورة أو الحالة)
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { adId, captainId, seatNumber, caption, imageUrl, status } = body;

    if (!captainId || (!adId && !seatNumber)) {
      return NextResponse.json(
        { success: false, error: 'captain_id_and_ad_identifier_required' },
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
    if (imageUrl) {
      uploadedImageUrl = await uploadAdImageIfDataUrl(captainId, seatNumber || 1, imageUrl);
      updates.image_url = uploadedImageUrl;
    }

    if (status) updates.status = status;
    if (seatNumber) updates.seat_number = Number(seatNumber);

    try {
      let updatedInDb = false;
      if (adId && isUuid(adId)) {
        const { data, error } = await supabaseAdmin
          .from('captain_ads')
          .update(updates)
          .eq('id', adId)
          .select();
        if (!error && data && data.length > 0) {
          updatedInDb = true;
        }
      }

      if (!updatedInDb && seatNumber) {
        // تحديث برقم المقعد ومعرف الكابتن
        const { data, error } = await supabaseAdmin
          .from('captain_ads')
          .update(updates)
          .eq('captain_id', captainId)
          .eq('seat_number', Number(seatNumber))
          .select();

        if (!error && data && data.length > 0) {
          updatedInDb = true;
        } else {
          // محاولة Upsert في حال لم يكن السجل موجوداً مسبقاً
          await supabaseAdmin.from('captain_ads').upsert(
            {
              captain_id: captainId,
              seat_number: Number(seatNumber),
              ...updates,
            },
            { onConflict: 'captain_id,seat_number' }
          );
        }
      }
    } catch (err) {
      console.warn('[Captain Ads API] Supabase update fallback:', err);
    }

    // تحديث الذاكرة المساندة بالسيرفر
    const existingList = inMemoryFallbackStore.get(captainId) || [];
    const updatedList = existingList.map((ad) => {
      if (ad.id === adId || (seatNumber && ad.seatNumber === Number(seatNumber))) {
        return {
          ...ad,
          imageUrl: uploadedImageUrl || ad.imageUrl,
          caption: updates.caption !== undefined ? (updates.caption || undefined) : ad.caption,
          status: updates.status || ad.status,
          seatNumber: updates.seat_number ? Number(updates.seat_number) : ad.seatNumber,
          updatedAt: Date.now(),
        };
      }
      return ad;
    });
    inMemoryFallbackStore.set(captainId, updatedList);

    return NextResponse.json({ success: true, imageUrl: uploadedImageUrl });
  } catch (error: any) {
    console.error('[Captain Ads API PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'internal_server_error' },
      { status: 500 }
    );
  }
}

/**
 * حذف إعلان من مقعد محدد
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const captainId = (searchParams.get('captainId') || '').trim();
    const adId = (searchParams.get('adId') || '').trim();
    const seatNumberParam = searchParams.get('seatNumber');

    if (!captainId || (!adId && !seatNumberParam)) {
      return NextResponse.json(
        { success: false, error: 'captain_id_and_ad_identifier_required' },
        { status: 400 }
      );
    }

    try {
      let query = supabaseAdmin.from('captain_ads').delete();
      if (adId && isUuid(adId)) {
        query = query.eq('id', adId).eq('captain_id', captainId);
      } else if (seatNumberParam) {
        query = query.eq('captain_id', captainId).eq('seat_number', Number(seatNumberParam));
      }
      await query;
    } catch (err) {
      console.warn('[Captain Ads API] Supabase delete fallback:', err);
    }

    // تحديث الذاكرة المساندة بالسيرفر
    const existingList = inMemoryFallbackStore.get(captainId) || [];
    const filtered = existingList.filter((ad) => {
      if (adId && ad.id === adId) return false;
      if (seatNumberParam && ad.seatNumber === Number(seatNumberParam)) return false;
      return true;
    });
    inMemoryFallbackStore.set(captainId, filtered);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Captain Ads API DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'internal_server_error' },
      { status: 500 }
    );
  }
}
