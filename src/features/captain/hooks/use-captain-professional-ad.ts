'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { RadarSovereignIntegrationKernel, type AdSovereignPass } from '@/core/logic/sovereign-market-kernel';

export interface CaptainProfessionalAd {
  adId: string;
  title: string;
  description: string;
  actionUrl: string;
  buttonText: string;
  bannerUrl: string;
}

const DEFAULT_PROFESSIONAL_AD: CaptainProfessionalAd = {
  adId: 'promo-captain-professional-default',
  title: '🛠️ مركز تكنولوجيا الزيوت والصيانة المعتمد للناقلين',
  description: 'للقباطنة والناقلين الأحرار: وفر وقت غضبك واستفد من التجميد السعري! احصل على غيار زيت توتال بخصم 25% مجاناً وفحص كمبيوتر فوري لمركبتك.',
  actionUrl: 'https://wa.me/962790000000',
  buttonText: 'احجز العرض الفوري للناقلين',
  bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200',
};

// Same real ad-matching pipeline the standing price-matrix screen
// (driver-pricing-card.tsx) already uses for spec 4.2's crimson "AI ad
// takeover" — pulled out so any other crimson-lockout screen (e.g. the
// per-bid bidding sheet) can show a real ad instead of duplicating this.
export function useCaptainProfessionalAd(deviationRatio: number, isActive: boolean): CaptainProfessionalAd | null {
  const { user } = useAuth();
  const { activeAds } = usePromoStream(user?.district || 'وادي السير', user?.governorate || 'عمان', 'captain');

  return useMemo(() => {
    if (!isActive) return null;

    const passAds: AdSovereignPass[] = activeAds
      .map((ad) => ({
        adId: ad.id,
        targetScale: (ad.targetDistrict ? 'District' : 'Governorate') as AdSovereignPass['targetScale'],
        targetLocationName: ad.targetDistrict || ad.targetGovernorate || 'وادي السير',
        adType: ad.adType as AdSovereignPass['adType'],
        bannerUrl: ad.content?.posterUrl || '',
      }))
      .filter((ad) => ad.adType === 'CAPTAIN_PROFESSIONAL');

    if (passAds.length === 0) return DEFAULT_PROFESSIONAL_AD;

    const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
      deviationRatio,
      { role: 'captain', district: user?.district || 'وادي السير', governorate: user?.governorate || 'عمان' },
      passAds,
    );

    if (!matchedPass) return DEFAULT_PROFESSIONAL_AD;

    const realAd = activeAds.find((ad) => ad.id === matchedPass.adId);
    return {
      adId: matchedPass.adId,
      title: realAd?.content?.title || DEFAULT_PROFESSIONAL_AD.title,
      description: realAd?.content?.description || DEFAULT_PROFESSIONAL_AD.description,
      actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || DEFAULT_PROFESSIONAL_AD.actionUrl,
      buttonText: realAd?.action?.buttonText || realAd?.buttonText || DEFAULT_PROFESSIONAL_AD.buttonText,
      bannerUrl: realAd?.content?.posterUrl || DEFAULT_PROFESSIONAL_AD.bannerUrl,
    };
  }, [activeAds, deviationRatio, isActive, user?.district, user?.governorate]);
}
