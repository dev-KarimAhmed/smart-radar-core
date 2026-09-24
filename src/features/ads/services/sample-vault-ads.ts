/**
 * Sample / Test Ads for Testing the Sovereign Ad Vault and the Ad Stage.
 */

export interface SampleAdItem {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  posterUrl: string;
  imageUrl?: string;
  phone: string;
  whatsapp: string;
  geoLoc: string;
  adType: 'RIDER_BENEFIT' | 'CAPTAIN_PROFESSIONAL' | 'NEARBY';
  targetDistrict: string;
  targetGovernorate: string;
  targetLocationName: string;
  buttonText: string;
  content: {
    title: string;
    description: string;
    posterUrl: string;
  };
  savedAtTimestamp?: number;
  isPlaceholder?: boolean;
}

export const SAMPLE_VAULT_ADS: SampleAdItem[] = [
  {
    id: 'test-ad-dining-01',
    title: 'مطاعم وكافيهات البوليفارد',
    description: 'خصم 20% على جميع الوجبات والمشروبات عند إبراز تطبيق رادار الذكي.',
    bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    phone: '0791234567',
    whatsapp: '962791234567',
    geoLoc: 'https://maps.google.com/?q=Amman+Boulevard',
    adType: 'RIDER_BENEFIT',
    targetDistrict: 'العبدلي',
    targetGovernorate: 'العاصمة',
    targetLocationName: 'عمّان',
    buttonText: 'عرض العرض',
    content: {
      title: 'مطاعم وكافيهات البوليفارد',
      description: 'خصم 20% على جميع الوجبات والمشروبات عند إبراز تطبيق رادار الذكي.',
      posterUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    },
  },
  {
    id: 'test-ad-auto-02',
    title: 'مركز الأداء الذهبي لصيانة السيارات',
    description: 'فحص كمبيوتر شامل مجاني وخصم 25% على تبديل الزيوت وقطع الغيار.',
    bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200',
    phone: '0787654321',
    whatsapp: '962787654321',
    geoLoc: 'https://maps.google.com/?q=Amman+Car+Care',
    adType: 'RIDER_BENEFIT',
    targetDistrict: 'الجبيهة',
    targetGovernorate: 'العاصمة',
    targetLocationName: 'عمّان',
    buttonText: 'احجز موعدك',
    content: {
      title: 'مركز الأداء الذهبي لصيانة السيارات',
      description: 'فحص كمبيوتر شامل مجاني وخصم 25% على تبديل الزيوت وقطع الغيار.',
      posterUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200',
    },
  },
  {
    id: 'test-ad-mall-03',
    title: 'مهرجان التسوق - سيتي سنتر',
    description: 'قسائم شرائية فورية وتخفيضات تصل إلى 50% لرواد وعملاء رادار الذكي.',
    bannerUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=1200',
    phone: '0779998888',
    whatsapp: '962779998888',
    geoLoc: 'https://maps.google.com/?q=Amman+Mall',
    adType: 'RIDER_BENEFIT',
    targetDistrict: 'صويلح',
    targetGovernorate: 'العاصمة',
    targetLocationName: 'عمّان',
    buttonText: 'اكتشف العروض',
    content: {
      title: 'مهرجان التسوق - سيتي سنتر',
      description: 'قسائم شرائية فورية وتخفيضات تصل إلى 50% لرواد وعملاء رادار الذكي.',
      posterUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=1200',
    },
  },
];

