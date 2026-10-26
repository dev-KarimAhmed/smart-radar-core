import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CAPTAIN_ADS_CONFIG } from '@/features/captain/config/captain-ads-config';

export const dynamic = 'force-dynamic';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ذاكرة مساندة بالسيرفر في حال تعذر الاتصال بجدول Supabase قبل تطبيق الـ Migration
const inMemoryFallbackStore = new Map<string, any[]>();

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
        const formatted = rows.map((r) => ({
          id: r.id,
          captainId: r.captain_id,
          seatNumber: r.seat_number,
          seatLabel: r.seat_label || 'إعلان ترويجي',
          imageUrl: r.image_url,
          caption: r.caption || undefined,
          status: r.status || 'ACTIVE',
          createdAt: new Date(r.created_at).getTime(),
          updatedAt: new Date(r.updated_at).getTime(),
        }));
        return NextResponse.json({ success: true, ads: formatted });
      }
    } catch (dbErr) {
      console.warn('[Captain Ads API] Supabase query fallback:', dbErr);
    }

    // 2. استخدام الذاكرة المساندة بالسيرفر كـ Fallback فوري
    const fallbackList = inMemoryFallbackStore.get(captainId) || [];
    return NextResponse.json({ success: true, ads: fallbackList });
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

    let uploadedImageUrl = imageUrl;

    // إذا كانت الصورة Data URL كبيرة وكان UUID متاحاً، يمكن محاولة رفعها لمخزن Supabase Storage
    if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/') && isUuid(captainId)) {
      try {
        const matches = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const ext = contentType.split('/')[1] || 'png';
          const filePath = `${captainId}/seat_${seatNumber}_${Date.now()}.${ext}`;

          const { error: uploadErr } = await supabaseAdmin.storage
            .from('captain-documents')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from('captain-documents')
              .getPublicUrl(filePath);

            if (publicUrlData?.publicUrl) {
              uploadedImageUrl = publicUrlData.publicUrl;
            }
          }
        }
      } catch (storageErr) {
        console.warn('[Captain Ads API] Storage upload fallback to direct URL:', storageErr);
      }
    }

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
    if (imageUrl) updates.image_url = imageUrl;
    if (status) updates.status = status;
    if (seatNumber) updates.seat_number = Number(seatNumber);

    try {
      let query = supabaseAdmin.from('captain_ads').update(updates);
      if (adId && isUuid(adId)) {
        query = query.eq('id', adId);
      } else if (seatNumber) {
        query = query.eq('captain_id', captainId).eq('seat_number', Number(seatNumber));
      }
      await query;
    } catch (err) {
      console.warn('[Captain Ads API] Supabase update fallback:', err);
    }

    // تحديث الذاكرة المساندة بالسيرفر
    const existingList = inMemoryFallbackStore.get(captainId) || [];
    const updatedList = existingList.map((ad) => {
      if (ad.id === adId || (seatNumber && ad.seatNumber === Number(seatNumber))) {
        return {
          ...ad,
          ...updates,
          caption: updates.caption !== undefined ? (updates.caption || undefined) : ad.caption,
          updatedAt: Date.now(),
        };
      }
      return ad;
    });
    inMemoryFallbackStore.set(captainId, updatedList);

    return NextResponse.json({ success: true });
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
