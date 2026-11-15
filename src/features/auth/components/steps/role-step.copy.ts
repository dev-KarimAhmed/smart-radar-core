export type Lang = 'ar' | 'en';
export type RoleKey = 'rider' | 'driver' | 'advertiser' | 'delegate' | 'admin';

export const copy = {
  ar: {
    switchLabel: 'English',
    ariaSwitch: 'تغيير اللغة إلى الإنجليزية',
    backToHome: 'العودة إلى الشاشة الافتتاحية',
    title: 'شبكة بينكم للإعلان الرقمي ترحب بكم',
    subtitle: 'اختر نوع حسابك وكمل دخولك بسهولة',
    underDevelopment: 'قيد التطوير',
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
        title: 'معلن',
        description: 'اعمل إعلانات موجهة لمنطقتك، وتابع المشاهدات والنقرات بسهولة.',
      },
      delegate: {
        title: 'مندوب تسويق',
        description: 'زيد من دخلك وأنت في عملك',
      },
    },
  },
  en: {
    switchLabel: 'العربية',
    ariaSwitch: 'Switch language to Arabic',
    backToHome: 'Back to Opening Screen',
    title: 'Welcome to byncom Digital Advertising Network',
    subtitle: 'Choose your account type and continue easily',
    underDevelopment: 'Under Development',
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
        title: 'Advertiser',
        description: 'Create targeted ads for your area, track views and clicks easily.',
      },
      delegate: {
        title: 'Marketing Delegate',
        description: 'Increase your income while working',
      },
    },
  },
} as const;
