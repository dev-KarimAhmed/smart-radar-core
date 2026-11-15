import { CAPTAIN_ADS_CONFIG } from '../config/captain-ads-config';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import type { CaptainAdItem } from './captain-ads-types';
import { normalizeCaptainAdImageUrl } from './captain-ads-validation';

export * from './captain-ads-types';
export * from './captain-ads-validation';
export * from './captain-ads-package';

function getCacheKey(captainId: string): string {
  const safeId = captainId ? captainId.trim() : 'default_captain';
  return `cached_captain_ads_${safeId}`;
}

function notifyAdsUpdated(captainId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, {
        detail: { captainId },
      })
    );
  }
}

/**
 * جلب جميع إعلانات الكابتن من السيرفر (Backend API)
 */
export async function fetchCaptainAds(captainId: string): Promise<CaptainAdItem[]> {
  if (!captainId) return [];

  try {
    const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch(`/api/captain/ads?captainId=${encodeURIComponent(captainId)}`, {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.ads)) {
        const realAds = data.ads
          .filter((a: any) => !String(a?.id || '').startsWith('seed-ad-'))
          .map((a: any) => ({
            ...a,
            imageUrl: normalizeCaptainAdImageUrl(a.imageUrl),
          }));
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(getCacheKey(captainId), JSON.stringify(realAds));
        }
        return realAds;
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Captain Ads Service] Backend fetch error, fallback to cache:', error);
    }
  }

  return getCaptainAds(captainId);
}

/**
 * القراءة الفورية السريعة من الذاكرة المؤقتة (إعلانات الكابتن الحقيقية فقط)
 */
export function getCaptainAds(captainId: string): CaptainAdItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(getCacheKey(captainId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => !String(item?.id || '').startsWith('seed-ad-'))
          .map((item) => ({
            ...item,
            imageUrl: normalizeCaptainAdImageUrl(item.imageUrl),
          }));
      }
    }
  } catch {}

  return [];
}

/**
 * حفظ إعلان جديد في الباك إند
 */
export async function saveCaptainAd(
  captainId: string,
  adData: {
    seatNumber: number;
    seatLabel?: string;
    imageUrl: string;
    caption?: string;
  }
): Promise<CaptainAdItem | null> {
  const payload = {
    captainId,
    seatNumber: adData.seatNumber,
    seatLabel: adData.seatLabel || 'إعلان ترويجي',
    imageUrl: adData.imageUrl,
    caption: adData.caption ? adData.caption.trim().slice(0, CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) : undefined,
  };

  try {
    const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch('/api/captain/ads', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success && data.ad) {
      const current = getCaptainAds(captainId);
      const filtered = current.filter((a) => a.seatNumber !== payload.seatNumber);
      const updated = [...filtered, data.ad].sort((a, b) => a.seatNumber - b.seatNumber);
      sessionStorage.setItem(getCacheKey(captainId), JSON.stringify(updated));

      notifyAdsUpdated(captainId);
      return data.ad;
    }
  } catch (err) {
    console.error('[Captain Ads Service] Save to backend error:', err);
  }

  return null;
}

/**
 * تعديل إعلان موجود في الباك إند
 */
export async function updateCaptainAd(
  captainId: string,
  adId: string,
  updates: Partial<Pick<CaptainAdItem, 'imageUrl' | 'caption' | 'status' | 'seatNumber'>>
): Promise<boolean> {
  try {
    const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch('/api/captain/ads', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        adId,
        captainId,
        ...updates,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const finalImageUrl = data?.imageUrl || updates.imageUrl;
      const current = getCaptainAds(captainId);
      const updated = current.map((a) =>
        a.id === adId || (updates.seatNumber && a.seatNumber === updates.seatNumber)
          ? {
              ...a,
              ...updates,
              imageUrl: finalImageUrl ? normalizeCaptainAdImageUrl(finalImageUrl) : a.imageUrl,
            }
          : a
      );
      sessionStorage.setItem(getCacheKey(captainId), JSON.stringify(updated));
      notifyAdsUpdated(captainId);
      return true;
    }
  } catch (err) {
    console.error('[Captain Ads Service] Update backend error:', err);
  }
  return false;
}

/**
 * حذف إعلان من مقعد محدد في الباك إند
 */
export async function deleteCaptainAd(captainId: string, adId: string): Promise<boolean> {
  try {
    const authHeaders = await getSupabaseAuthHeaders();
    const res = await fetch(
      `/api/captain/ads?captainId=${encodeURIComponent(captainId)}&adId=${encodeURIComponent(adId)}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );

    if (res.ok) {
      const current = getCaptainAds(captainId);
      const filtered = current.filter((a) => a.id !== adId);
      sessionStorage.setItem(getCacheKey(captainId), JSON.stringify(filtered));
      notifyAdsUpdated(captainId);
      return true;
    }
  } catch (err) {
    console.error('[Captain Ads Service] Delete backend error:', err);
  }
  return false;
}

/**
 * تفعيل / تجميد إعلان
 */
export async function toggleCaptainAdStatus(captainId: string, adId: string): Promise<boolean> {
  const currentAds = getCaptainAds(captainId);
  const target = currentAds.find((ad) => ad.id === adId);
  if (!target) return false;

  const nextStatus = target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  return await updateCaptainAd(captainId, adId, { status: nextStatus });
}
