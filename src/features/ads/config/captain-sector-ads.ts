export interface CaptainSectorAd {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  imageUrl: string;
  image: string;
  fallbackImageUrl?: string;
  buttonText: string;
  ctaText: string;
  badgeText: string;
  for_driver: boolean;
  forDriver: boolean;
  adType: 'CAPTAIN_PROFESSIONAL';
  isCaptainSectorAd: boolean;
  whatsapp?: string;
  phone?: string;
  content: {
    title: string;
    description: string;
    media: {
      url: string;
      type: 'image';
    };
  };
  action: {
    buttonText: string;
  };
}

/**
 * إعلانات قطاع الكباتن الرسمية في بينكم
 * المعروضة في شريط إعلانات الكابتن عند التواجد في وضع "غير متاح" (Offline)
 * مصدر الصور: public/اعلانات بينكم قطاع الكابين و public/captain-ads
 */
export const CAPTAIN_SECTOR_ADS: CaptainSectorAd[] = [
  {
    id: 'captain-sector-ad-1',
    title: 'أنت سائق؟ حوّل حركتك إلى فرصة للربح',
    description: 'أعلن، زد دخلك، واستفد من مزايا المنصة وارتق في التقييم من البرونزي إلى الألماسي بدون أي عمولات.',
    bannerUrl: '/captain-ads/1.jpeg',
    imageUrl: '/captain-ads/1.jpeg',
    image: '/captain-ads/1.jpeg',
    buttonText: 'اكتشف المزايا',
    ctaText: 'اكتشف المزايا',
    badgeText: 'للكباتن',
    for_driver: true,
    forDriver: true,
    adType: 'CAPTAIN_PROFESSIONAL',
    isCaptainSectorAd: true,
    whatsapp: '962790000000',
    phone: '0790000000',
    content: {
      title: 'أنت سائق؟ حوّل حركتك إلى فرصة للربح',
      description: 'أعلن، زد دخلك، واستفد من مزايا المنصة وارتق في التقييم من البرونزي إلى الألماسي بدون أي عمولات.',
      media: { url: '/captain-ads/1.jpeg', type: 'image' },
    },
    action: {
      buttonText: 'اكتشف المزايا',
    },
  },
  {
    id: 'captain-sector-ad-2',
    title: 'انتشار لا يتوقف - شبكة بينكم للإعلان الرقمي',
    description: 'أنت كابتن، صمم إعلانك وارفعه خلال دقائق وحدد نطاق نشاط مركبتك للوصول إلى جمهورك المستهدف.',
    bannerUrl: '/captain-ads/2.jpeg',
    imageUrl: '/captain-ads/2.jpeg',
    image: '/captain-ads/2.jpeg',
    buttonText: 'ارفع إعلانك',
    ctaText: 'ارفع إعلانك',
    badgeText: 'للكباتن',
    for_driver: true,
    forDriver: true,
    adType: 'CAPTAIN_PROFESSIONAL',
    isCaptainSectorAd: true,
    whatsapp: '962790000000',
    phone: '0790000000',
    content: {
      title: 'انتشار لا يتوقف - شبكة بينكم للإعلان الرقمي',
      description: 'أنت كابتن، صمم إعلانك وارفعه خلال دقائق وحدد نطاق نشاط مركبتك للوصول إلى جمهورك المستهدف.',
      media: { url: '/captain-ads/2.jpeg', type: 'image' },
    },
    action: {
      buttonText: 'ارفع إعلانك',
    },
  },
  {
    id: 'captain-sector-ad-3',
    title: 'رابطك الخاص هو البداية - بدون عمولات',
    description: 'مهما كان التطبيق الذي تعمل معه... أنت على شاشات هواتف الجميع مستخدمين بينكم. أعلن عن نفسك وكن حاضراً في المحيط.',
    bannerUrl: '/captain-ads/3.jpeg',
    imageUrl: '/captain-ads/3.jpeg',
    image: '/captain-ads/3.jpeg',
    buttonText: 'ابدأ الآن',
    ctaText: 'ابدأ الآن',
    badgeText: 'للكباتن',
    for_driver: true,
    forDriver: true,
    adType: 'CAPTAIN_PROFESSIONAL',
    isCaptainSectorAd: true,
    whatsapp: '962790000000',
    phone: '0790000000',
    content: {
      title: 'رابطك الخاص هو البداية - بدون عمولات',
      description: 'مهما كان التطبيق الذي تعمل معه... أنت على شاشات هواتف الجميع مستخدمين بينكم. أعلن عن نفسك وكن حاضراً في المحيط.',
      media: { url: '/captain-ads/3.jpeg', type: 'image' },
    },
    action: {
      buttonText: 'ابدأ الآن',
    },
  },
  {
    id: 'captain-sector-ad-4',
    title: 'من قمرة مركبة... إلى قائد إعلانات',
    description: 'اجعل قمرة مركبتك مساحة للإعلان، وافتح لنفسك فرصة دخل إضافي مع بينكم. ارتق بالرتب لتوسع صلاحياتك الإعلانية.',
    bannerUrl: '/captain-ads/4.jpeg',
    imageUrl: '/captain-ads/4.jpeg',
    image: '/captain-ads/4.jpeg',
    buttonText: 'مزايا الكابتن المعلن',
    ctaText: 'مزايا الكابتن المعلن',
    badgeText: 'للكباتن',
    for_driver: true,
    forDriver: true,
    adType: 'CAPTAIN_PROFESSIONAL',
    isCaptainSectorAd: true,
    whatsapp: '962790000000',
    phone: '0790000000',
    content: {
      title: 'من قمرة مركبة... إلى قائد إعلانات',
      description: 'اجعل قمرة مركبتك مساحة للإعلان، وافتح لنفسك فرصة دخل إضافي مع بينكم. ارتق بالرتب لتوسع صلاحياتك الإعلانية.',
      media: { url: '/captain-ads/4.jpeg', type: 'image' },
    },
    action: {
      buttonText: 'مزايا الكابتن المعلن',
    },
  },
  {
    id: 'captain-sector-ad-5',
    title: 'حوّل رحلاتك إلى فرصة دخل إضافي مع بينكم',
    description: 'هل أنت كابتن في قطاع النقل الذكي؟ ادخل إلى عالم الإعلان الرقمي داخل المركبات وشارك رابطك مع عملائك لزيادة دخلك المالي.',
    bannerUrl: '/captain-ads/5.png',
    imageUrl: '/captain-ads/5.png',
    image: '/captain-ads/5.png',
    buttonText: 'انضم الآن',
    ctaText: 'انضم الآن',
    badgeText: 'للكباتن',
    for_driver: true,
    forDriver: true,
    adType: 'CAPTAIN_PROFESSIONAL',
    isCaptainSectorAd: true,
    whatsapp: '962790000000',
    phone: '0790000000',
    content: {
      title: 'حوّل رحلاتك إلى فرصة دخل إضافي مع بينكم',
      description: 'هل أنت كابتن في قطاع النقل الذكي؟ ادخل إلى عالم الإعلان الرقمي داخل المركبات وشارك رابطك مع عملائك لزيادة دخلك المالي.',
      media: { url: '/captain-ads/5.png', type: 'image' },
    },
    action: {
      buttonText: 'انضم الآن',
    },
  },
];

