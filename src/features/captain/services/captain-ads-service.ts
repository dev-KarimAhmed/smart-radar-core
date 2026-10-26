import { CAPTAIN_ADS_CONFIG } from '../config/captain-ads-config';

export interface CaptainAdItem {
  id: string;
  captainId: string;
  seatNumber: number;
  seatLabel: string;
  imageUrl: string;
  caption?: string;
  createdAt: number;
  updatedAt: number;
  status: 'ACTIVE' | 'PAUSED';
}

export interface AdValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * التحقق من صحة نص الإعلان (اختياري، ولا يتجاوز الحد الأقصى المحدد)
 */
export function validateAdCaption(caption?: string): AdValidationResult {
  if (!caption) {
    return { valid: true };
  }
  const trimmed = caption.trim();
  if (trimmed.length > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) {
    return {
      valid: false,
      error: `نص الإعلان لا يجب أن يتجاوز ${CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH} حرفاً (الحالي: ${trimmed.length})`,
    };
  }
  return { valid: true };
}

/**
 * التحقق من صحة ملف صورة الإعلان
 */
export function validateAdImageFile(file: File): AdValidationResult {
  if (!file) {
    return { valid: false, error: 'يرجى اختيار ملف الصورة' };
  }

  const isTypeAllowed = (CAPTAIN_ADS_CONFIG.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
  if (!isTypeAllowed) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم، يرجى رفع صورة بصيغة (JPG, PNG, WEBP)',
    };
  }

  if (file.size > CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `حجم الصورة كبير جداً، الحد الأقصى هو ${sizeMb} ميجابايت`,
    };
  }

  return { valid: true };
}

/**
 * تحويل ملف الصورة محلياً إلى Base64 Data URL للرفع
 */
export function convertImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Image read error'));
    reader.readAsDataURL(file);
  });
}

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
 * يتم استدعاؤها في شاشة الراكب وشاشة الكابتن
 */
export async function fetchCaptainAds(captainId: string): Promise<CaptainAdItem[]> {
  if (!captainId) return [];

  try {
    const res = await fetch(`/api/captain/ads?captainId=${encodeURIComponent(captainId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.ads)) {
        const realAds = data.ads.filter((a: any) => !String(a?.id || '').startsWith('seed-ad-'));
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
        // تنقية وتجاهل أي إعلانات تجريبية تيست
        return parsed.filter((item) => !String(item?.id || '').startsWith('seed-ad-'));
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
    const res = await fetch('/api/captain/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success && data.ad) {
      // تحديث الكاش المحلي
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
    const res = await fetch('/api/captain/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId,
        captainId,
        ...updates,
      }),
    });

    if (res.ok) {
      const current = getCaptainAds(captainId);
      const updated = current.map((a) => (a.id === adId ? { ...a, ...updates } : a));
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
    const res = await fetch(
      `/api/captain/ads?captainId=${encodeURIComponent(captainId)}&adId=${encodeURIComponent(adId)}`,
      {
        method: 'DELETE',
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
