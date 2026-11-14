export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200';

export const AD_CARD_COPY = {
  ar: {
    fallbackTitle: 'إعلان قريب منك',
    fallbackDescription: 'اكتشف عرضاً مناسباً في منطقتك وتواصل مع المعلن مباشرة.',
    fallbackCta: 'عرض التفاصيل',
    defaultBadge: 'إعلان قريب',
    saveAd: 'حفظ الإعلان',
    removeAd: 'إزالة الإعلان من المفضلة',
  },
  en: {
    fallbackTitle: 'Nearby ad',
    fallbackDescription: 'Discover a useful offer in your area and contact the advertiser directly.',
    fallbackCta: 'View details',
    defaultBadge: 'Nearby ad',
    saveAd: 'Save ad',
    removeAd: 'Remove ad from vault',
  },
} as const;

export function getAdImage(ad: any): string {
  return (
    ad?.content?.posterUrl ||
    ad?.posterUrl ||
    ad?.bannerUrl ||
    ad?.imageUrl ||
    FALLBACK_IMAGE
  );
}

export function getAdTitle(
  ad: any,
  fallback: string = AD_CARD_COPY.ar.fallbackTitle,
  language?: 'ar' | 'en'
): string {
  const isEn = language === 'en' || fallback === AD_CARD_COPY.en.fallbackTitle;
  if (isEn) {
    return (
      ad?.titleEn ||
      ad?.title_en ||
      ad?.content?.titleEn ||
      ad?.content?.title_en ||
      ad?.content?.title ||
      ad?.title ||
      fallback
    );
  }
  return ad?.content?.title || ad?.title || fallback;
}

export function getAdDescription(
  ad: any,
  fallback: string = AD_CARD_COPY.ar.fallbackDescription,
  language?: 'ar' | 'en'
): string {
  const isEn = language === 'en' || fallback === AD_CARD_COPY.en.fallbackDescription;
  if (isEn) {
    return (
      ad?.descriptionEn ||
      ad?.description_en ||
      ad?.content?.descriptionEn ||
      ad?.content?.description_en ||
      ad?.content?.description ||
      ad?.description ||
      fallback
    );
  }
  return ad?.content?.description || ad?.description || fallback;
}

export function getAdCta(
  ad: any,
  fallback: string = AD_CARD_COPY.ar.fallbackCta,
  language?: 'ar' | 'en'
): string {
  const isEn = language === 'en' || fallback === AD_CARD_COPY.en.fallbackCta;
  if (isEn) {
    return (
      ad?.buttonTextEn ||
      ad?.button_text_en ||
      ad?.action?.buttonTextEn ||
      ad?.action?.button_text_en ||
      ad?.ctaTextEn ||
      ad?.cta_text_en ||
      ad?.action?.buttonText ||
      ad?.buttonText ||
      fallback
    );
  }
  return ad?.action?.buttonText || ad?.buttonText || fallback;
}

