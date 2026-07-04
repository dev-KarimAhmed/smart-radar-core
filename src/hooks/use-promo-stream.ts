import { useEffect, useState } from 'react';
import type { SovereignAd } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { recordLocalClick } from '@/lib/ad-cache-sentry';
import { trackSovereignError } from '@/lib/error-tracker';

const USER_VAULT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 60 * 60 * 1000;

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
      buttonText: row.cta_ar || row.button_text || row.action?.buttonText || 'عرض التفاصيل',
      actionUrl: row.action_url || row.url || row.action?.actionUrl || '',
    },
    targetDistrict: row.district_id ? String(row.district_id) : row.targetDistrict,
    targetGovernorate: row.governorate_id ? String(row.governorate_id) : row.targetGovernorate,
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
  } as SovereignAd;
}

function readCachedAds() {
  if (typeof window === 'undefined') return null;

  try {
    const cachedRaw = localStorage.getItem('sovereign_local_ad_cache');
    if (!cachedRaw) return null;

    const cached = JSON.parse(cachedRaw);
    const age = Date.now() - Number(cached.timestamp || 0);
    if (age >= USER_VAULT_LIFETIME_MS) {
      localStorage.removeItem('sovereign_local_ad_cache');
      localStorage.removeItem('sovereign_local_ad_cache_history');
      localStorage.removeItem('sovereign_ad_vault_details');
      localStorage.removeItem('sovereign_hearted_ads');
      return null;
    }

    if (age < CACHE_TTL_MS && Array.isArray(cached.ads)) {
      return cached.ads as SovereignAd[];
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[Ads cache] read failed:', error);
  }

  return null;
}

function writeCachedAds(ads: SovereignAd[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('sovereign_local_ad_cache', JSON.stringify({ timestamp: Date.now(), ads }));
    localStorage.setItem('sovereign_local_ad_cache_history', JSON.stringify(ads));
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[Ads cache] write failed:', error);
  }
}

export function usePromoStream(district?: string, governorate?: string) {
  const [activeAds, setActiveAds] = useState<SovereignAd[]>([]);

  useEffect(() => {
    let active = true;
    const cachedAds = readCachedAds();
    if (cachedAds) setActiveAds(cachedAds);

    async function fetchAds() {
      try {
        const query = supabase
          .from('ad_campaigns')
          .select('*')
          .eq('status', 'active')
          .limit(20);

        const { data, error } = await query;
        if (error) throw error;
        if (!active) return;

        const ads = Array.isArray(data)
          ? data
            .map(mapCampaignRow)
            .sort((a, b) => scoreAd(b, district, governorate) - scoreAd(a, district, governorate))
          : [];
        setActiveAds(ads);
        writeCachedAds(ads);
      } catch (error) {
        if (!active) return;
        trackSovereignError(error, { context: 'PromoStreamSupabase' });
        setActiveAds(cachedAds || []);
      }
    }

    void fetchAds();

    const channel = supabase
      .channel('ad-campaigns-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_campaigns' }, () => {
        void fetchAds();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [district, governorate]);

  const registerClick = async (adId: string, _locationStr: string) => {
    try {
      recordLocalClick(adId);
    } catch (error) {
      trackSovereignError(error, { context: 'PromoStreamClick', adId });
    }
  };

  return { activeAds, registerClick };
}

function scoreAd(ad: SovereignAd, district?: string, governorate?: string) {
  let score = 0;
  if (district && ad.targetDistrict === district) score += 2;
  if (governorate && ad.targetGovernorate === governorate) score += 1;
  return score;
}

export default usePromoStream;
