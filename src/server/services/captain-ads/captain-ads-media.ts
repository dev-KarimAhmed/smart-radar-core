import { supabaseAdmin } from '@/lib/supabase-admin';
import { isValidStorageRelativePath } from '@/shared/server/api-auth-guard';
import { SEAT_AD_PATH_PATTERN } from './captain-ads-validator';

export async function resolveAdImageUrl(url: string, captainId: string): Promise<string> {
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

export async function uploadAdImageIfDataUrl(
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
