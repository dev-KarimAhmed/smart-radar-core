import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVerifiedUser } from '@/shared/server/api-auth-guard';
import { isUuid } from './captain-ads-validator';
import { resolveAdImageUrl } from './captain-ads-media';

/**
 * جلب جميع إعلانات الكابتن من الباك إند
 * يمكن لأي راكب يقبل عرض الكابتن استدعاء هذا الرابط لجلب إعلاناته
 */
export async function handleGetCaptainAds(req: Request, searchParams: URLSearchParams): Promise<NextResponse> {
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
}
