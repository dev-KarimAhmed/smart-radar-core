export type Lang = 'ar' | 'en';
export type RoleKey = 'rider' | 'driver' | 'advertiser' | 'delegate' | 'admin';

export const copy = {
  ar: {
    switchLabel: 'English',
    ariaSwitch: 'تغيير اللغة إلى الإنجليزية',
    backToHome: 'العودة إلى الشاشة الافتتاحية',
    title: 'شبكة بينكم للإعلان الرقمي ترحب بكم',
    subtitle: 'اختر نوع حسابك وكمل دخولك بسهولة',
    underDevelopment: '30 يوم مجاناً',
    free30DaysBadge: '30 يوم مجاناً',
    roles: {
      rider: {
        title: 'مستخدم',
        description: 'ابحث عن عروض الكباتن المعلنين في محيطك واختار العرض المناسب',
      },
      driver: {
        title: 'كابتن معلن',
        description: 'اعلن عن نفسك، انتظر الطلبات، قدم عرضك',
      },
      admin: {
        title: 'مشرف',
        description: 'مدخل خاص بإدارة وتشغيل النظام.',
      },
      advertiser: {
        title: 'إعلانات منشآت تجارية',
        description: 'احجز أولوية الظهور المجاني',
      },
      delegate: {
        title: 'إعلانات مهن يدوية والحرفيين',
        description: 'احجز أولوية الانتشار',
      },
    },
  },
  en: {
    switchLabel: 'العربية',
    ariaSwitch: 'Switch language to Arabic',
    backToHome: 'Back to Opening Screen',
    title: 'Welcome to byncom Digital Advertising Network',
    subtitle: 'Choose your account type and continue easily',
    underDevelopment: '30 Days Free',
    free30DaysBadge: '30 Days Free',
    roles: {
      rider: {
        title: 'User',
        description: 'Search for advertiser captain offers in your area and choose the best offer',
      },
      driver: {
        title: 'Advertiser Captain',
        description: 'Advertise yourself, wait for requests, present your offer',
      },
      admin: {
        title: 'Admin',
        description: 'Private entrance for system administration and operations.',
      },
      advertiser: {
        title: 'Commercial Establishments Ads',
        description: 'Book free priority visibility',
      },
      delegate: {
        title: 'Handcrafts & Artisans Ads',
        description: 'Book priority reach',
      },
    },
  },
} as const;
