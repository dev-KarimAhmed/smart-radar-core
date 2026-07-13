import { useMemo } from 'react';
import type { SovereignAd } from '@/core/types';
import { recordLocalClick } from '@/lib/ad-cache-sentry';
import { trackSovereignError } from '@/lib/error-tracker';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';

function mapCampaignRow(row: Record<string, any>): SovereignAd {
  return {
    id: String(row.id),
    status: row.status || 'active',
    adType: row.ad_type || row.adType || 'PROMO',
    content: {
      title: row.title_ar || row.title || row.content?.title || '',
      description: row.description_ar || row.description || row.content?.description || '',
      posterUrl: row.image_url || row.poster_url || row.content?.posterUrl || '',
    },
    action: {
      buttonText: row.cta_ar || row.button_text || row.action?.buttonText || '',
      actionUrl: row.action_url || row.url || row.action?.actionUrl || '',
    },
    targetDistrict: row.district_id ? String(row.district_id) : row.targetDistrict,
    targetGovernorate: row.governorate_id ? String(row.governorate_id) : row.targetGovernorate,
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
  } as SovereignAd;
}

function scoreAd(ad: SovereignAd, district?: string, governorate?: string) {
  let score = 0;
  if (district && ad.targetDistrict === district) score += 2;
  if (governorate && ad.targetGovernorate === governorate) score += 1;
  return score;
}

/**
 * Local ad stream for a given district/governorate.
 *
 * Data comes from the shared `useAdCampaigns` React Query hook — a single
 * cached request that refetches at most every 10 minutes and is de-duplicated
 * across all consumers. (The previous per-mount fetch, Supabase realtime
 * subscription, and hand-rolled localStorage cache have been removed in favour
 * of React Query's cache + persistence.)
 */
export function usePromoStream(district?: string, governorate?: string) {
  const { data } = useAdCampaigns();

  const activeAds = useMemo<SovereignAd[]>(() => {
    const rows = Array.isArray(data) ? data : [];
    return rows
      .map(mapCampaignRow)
      .sort((a, b) => scoreAd(b, district, governorate) - scoreAd(a, district, governorate));
  }, [data, district, governorate]);

  const registerClick = async (adId: string, _locationStr: string) => {
    try {
      recordLocalClick(adId);
    } catch (error) {
      trackSovereignError(error, { context: 'PromoStreamClick', adId });
    }
  };

  return { activeAds, registerClick };
}

export default usePromoStream;
