export interface CaptainBuiltinAd {
  id: string;
  forDriver: true;
  for_driver: true;
  adType: 'CAPTAIN_PROFESSIONAL';
  isPosterOnly: true;
  isBuiltinCaptainPromo: true;
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl: string;
  imageUrl: string;
  content: {
    title: string;
    description: string;
    posterUrl: string;
  };
}

interface CaptainBuiltinAdSpec {
  id: string;
  filename: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
}

const CAPTAIN_BUILTIN_AD_SPECS: readonly CaptainBuiltinAdSpec[] = [
  {
    id: 'captain-builtin-ad-1',
    filename: '1.jpeg',
    title: {
      ar: 'أنت سائق؟ حوّل حركتك إلى فرصة للربح',
      en: 'Are you a driver? Turn your trips into earning opportunities',
    },
    description: {
      ar: 'أعلن، زد دخلك، وارتقِ في التقييم من البرونزي إلى الألماسي بدون عمولات.',
      en: 'Advertise, grow your income, and climb from Bronze to Diamond with zero commissions.',
    },
  },
  {
    id: 'captain-builtin-ad-2',
    filename: '2.jpeg',
    title: {
      ar: 'انتشار لا يتوقف — شبكة بينكم للإعلان الرقمي',
      en: 'Non-stop reach — Bynkcom Digital Ad Network',
    },
    description: {
      ar: 'صمم إعلانك وارفعه خلال دقائق وحدد نطاق نشاط مركبتك.',
      en: 'Design your ad in minutes and set your vehicle coverage zone.',
    },
  },
  {
    id: 'captain-builtin-ad-3',
    filename: '3.jpeg',
    title: {
      ar: 'رابطك الخاص هو البداية — بدون عمولات',
      en: 'Your private link is the start — Zero commissions',
    },
    description: {
      ar: 'أعلن عن نفسك وكن حاضراً في المحيط على شاشات هواتف مستخدمي بينكم.',
      en: 'Promote yourself and appear to nearby riders on Bynkcom without commissions.',
    },
  },
  {
    id: 'captain-builtin-ad-4',
    filename: '4.jpeg',
    title: {
      ar: 'من قمرة مركبة إلى قائد إعلانات',
      en: 'From a vehicle cabin to an ad leader',
    },
    description: {
      ar: 'اجعل قمرة مركبتك مساحة للإعلان وافتح لنفسك فرصة دخل إضافي وارتقِ بالرتب.',
      en: 'Turn your cabin into an ad stage and unlock higher ranks and extra income.',
    },
  },
  {
    id: 'captain-builtin-ad-5',
    filename: 'موجل.png',
    title: {
      ar: 'حوّل رحلاتك إلى فرصة دخل إضافي',
      en: 'Turn your rides into an extra income stream',
    },
    description: {
      ar: 'شارك رابطك مع عملائك وزد دخلك المالي من الإعلانات داخل المركبات.',
      en: 'Share your link with passengers and boost your ad earnings on every trip.',
    },
  },
];

export function buildCaptainAdPublicPath(filename: string): string {
  return `/captain_ads/${encodeURIComponent(filename)}`;
}

export function getCaptainBuiltinAds(language: 'ar' | 'en' = 'ar'): CaptainBuiltinAd[] {
  return CAPTAIN_BUILTIN_AD_SPECS.map((spec) => {
    const imageUrl = buildCaptainAdPublicPath(spec.filename);
    const title = spec.title[language];
    const description = spec.description[language];

    return {
      id: spec.id,
      forDriver: true,
      for_driver: true,
      adType: 'CAPTAIN_PROFESSIONAL',
      isPosterOnly: true,
      isBuiltinCaptainPromo: true,
      title,
      description,
      posterUrl: imageUrl,
      bannerUrl: imageUrl,
      imageUrl,
      content: {
        title,
        description,
        posterUrl: imageUrl,
      },
    };
  });
}

