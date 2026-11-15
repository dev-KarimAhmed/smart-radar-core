import type { AdAudience } from './ad-audience';
import { PLACEHOLDER_BANNER_URL } from './ad-media-helpers';

export const AD_STAGE_COPY = {
  ar: {
    loadingTitle: 'جاري تحميل الإعلانات',
    loadingSubtitle: 'ثوانٍ من فضلك',
    title: 'إعلانات قريبة منك',
    count: (count: number) => `${count} إعلان`,
    riderBadge: 'للركاب',
    captainBadge: 'للكباتن',
    nearbyBadge: 'إعلان قريب',
    previous: 'الإعلان السابق',
    next: 'الإعلان التالي',
    noMoreAds: 'لا توجد إعلانات أخرى حالياً',
    trustedAd: 'إعلان موثق للتواصل المباشر',
    whatsapp: 'واتساب',
    call: 'اتصال',
    openLocation: 'فتح الموقع',
    whatsappMessage: (title: string) => `مرحباً، شاهدت إعلانكم في التطبيق: ${title}`,
    emptyTitle: 'مرحباً بك في منصة بينكم',
    emptyDescription: 'لا توجد إعلانات نشطة في منطقتك الآن. سنعرض لك العروض فور توفرها.',
    emptyFetchIssue: 'لا توجد إعلانات متاحة الآن. سنعرض لك العروض فور توفرها.',
    emptyButton: 'ابدأ رحلتك',
    emptyButtonRider: 'أعلن هنا',
    requestRide: 'اطلب رحلة',
    fallbackDistrict: 'عمّان',
    fallbackGovernorate: 'العاصمة',
  },
  en: {
    loadingTitle: 'Loading ads',
    loadingSubtitle: 'One moment please',
    title: 'Nearby ads',
    count: (count: number) => `${count} ad${count === 1 ? '' : 's'}`,
    riderBadge: 'For riders',
    captainBadge: 'For drivers',
    nearbyBadge: 'Nearby ad',
    previous: 'Previous ad',
    next: 'Next ad',
    noMoreAds: 'No other ads right now',
    trustedAd: 'Verified ad for direct contact',
    favorite: 'Favorite',
    removeFavorite: 'Remove favorite',
    whatsapp: 'WhatsApp',
    call: 'Call',
    openLocation: 'Open location',
    whatsappMessage: (title: string) => `Hello, I saw your ad in the app: ${title}`,
    emptyTitle: 'Welcome to bynkcom',
    emptyDescription: 'No active ads are available in your area right now. We will show offers as soon as they are available.',
    emptyFetchIssue: 'No ads are available right now. We will show offers as soon as they are available.',
    emptyButton: 'Start your ride',
    emptyButtonRider: 'Advertise here',
    requestRide: 'Request a ride',
    fallbackDistrict: 'Amman',
    fallbackGovernorate: 'Capital',
  },
} as const;

export type AdStageCopy = (typeof AD_STAGE_COPY)['ar' | 'en'];

export function filterAdsByLocalContext(
  userDistrict: string,
  userGovernorate: string,
  allAds: any[],
) {
  return allAds.filter((ad) => {
    if (!ad || !ad.targetScale) return true;
    if (ad.targetScale === 'Governorate') return ad.targetLocationName === userGovernorate;
    if (ad.targetScale === 'District') return ad.targetLocationName === userDistrict;
    return true;
  });
}

export function buildBrandPlaceholderAd(
  copy: AdStageCopy,
  description: string = copy.emptyDescription,
  audience?: AdAudience,
) {
  const isRider = audience === 'rider';
  return {
    id: 'brand-empty-state',
    title: copy.emptyTitle,
    description,
    bannerUrl: PLACEHOLDER_BANNER_URL,
    buttonText: isRider ? copy.emptyButtonRider : copy.emptyButton,
    content: {
      title: copy.emptyTitle,
      description,
    },
    isPlaceholder: true,
  };
}

