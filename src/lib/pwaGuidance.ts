/**
 * Sovereign PWA Guidance Engine (SC55 Edge Zero-Cost)
 * Pure TypeScript diagnostic engine (0 KB footprint, zero UI dependencies).
 * Detects client platform, installation state, and provides deterministic
 * device-specific installation and background survival instructions.
 */

export interface PlatformEnvironment {
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isStandalone: boolean;
  supportsWakeLock: boolean;
}

export interface PwaGuidanceStep {
  number: number;
  titleAr: string;
  titleEn: string;
  instructionAr: string;
  instructionEn: string;
  iconType: 'share' | 'add' | 'menu' | 'install' | 'battery' | 'desktop';
}

export interface PwaGuidanceDetails {
  platform: 'ios' | 'android' | 'desktop';
  platformName: string;
  titleAr: string;
  titleEn: string;
  steps: PwaGuidanceStep[];
  batteryNoticeAr: string;
  batteryNoticeEn: string;
  webPushNoticeAr?: string;
  webPushNoticeEn?: string;
}

export function detectPlatform(): PlatformEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      isSafari: false,
      isChrome: false,
      isStandalone: false,
      supportsWakeLock: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  const supportsWakeLock = 'wakeLock' in navigator;

  return {
    isIOS,
    isAndroid,
    isDesktop,
    isSafari,
    isChrome,
    isStandalone,
    supportsWakeLock,
  };
}

export function getPwaGuidance(env?: PlatformEnvironment): PwaGuidanceDetails {
  const currentEnv = env || detectPlatform();

  if (currentEnv.isIOS) {
    return {
      platform: 'ios',
      platformName: 'Apple iOS (Safari)',
      titleAr: 'تثبيت التطبيق السيادي على iPhone',
      titleEn: 'Install Sovereign PWA on iPhone',
      steps: [
        {
          number: 1,
          titleAr: 'زر المشاركة',
          titleEn: 'Share Button',
          instructionAr: 'اضغط على زر المشاركة (Share) في أسفل متصفح Safari.',
          instructionEn: 'Tap the Share button at the bottom of Safari.',
          iconType: 'share',
        },
        {
          number: 2,
          titleAr: 'إضافة للشاشة الرئيسية',
          titleEn: 'Add to Home Screen',
          instructionAr: 'مرر لأسفل واختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).',
          instructionEn: 'Scroll down and select "Add to Home Screen".',
          iconType: 'add',
        },
        {
          number: 3,
          titleAr: 'تأكيد التثبيت',
          titleEn: 'Confirm Installation',
          instructionAr: 'اضغط "إضافة" في أعلى الزاوية ليظهر التطبيق كأيقونة مستقلة فوراً.',
          instructionEn: 'Tap "Add" in the top corner to launch as a standalone app.',
          iconType: 'install',
        },
      ],
      batteryNoticeAr: 'تنبيه: يُرجى تعطيل وضع حفظ الطاقة المنخفض (Low Power Mode) لضمان استمرار حسابات الرادار في الخلفية.',
      batteryNoticeEn: 'Notice: Please disable Low Power Mode to ensure continuous background radar tracking.',
      webPushNoticeAr: 'إلزامي: تثبيت التطبيق على الشاشة الرئيسية مطلوب لتفعيل الإشعارات اللحظية (Web Push) على أجهزة Apple.',
      webPushNoticeEn: 'Required: Home Screen installation is mandatory for Web Push notifications on Apple devices.',
    };
  }

  if (currentEnv.isAndroid) {
    return {
      platform: 'android',
      platformName: 'Android (Google Chrome)',
      titleAr: 'تثبيت التطبيق السيادي الميداني',
      titleEn: 'Install Sovereign Field PWA',
      steps: [
        {
          number: 1,
          titleAr: 'قائمة المتصفح',
          titleEn: 'Browser Menu',
          instructionAr: 'اضغط على قائمة الثلاث نقاط (⋮) في أعلى زاوية المتصفح.',
          instructionEn: 'Tap the three dots menu (⋮) at the top of the browser.',
          iconType: 'menu',
        },
        {
          number: 2,
          titleAr: 'تثبيت التطبيق',
          titleEn: 'Install Application',
          instructionAr: 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".',
          instructionEn: 'Select "Install App" or "Add to Home Screen".',
          iconType: 'install',
        },
        {
          number: 3,
          titleAr: 'الوصول المباشر',
          titleEn: 'Direct Field Access',
          instructionAr: 'افتح التطبيق من شاشتك الرئيسية للتشغيل بوضع ملء الشاشة المستقل دون شريط عناوين.',
          instructionEn: 'Open from Home Screen to run in standalone full-screen mode.',
          iconType: 'desktop',
        },
      ],
      batteryNoticeAr: 'هام للكابتن: يُرجى استثناء التطبيق من تحسين البطارية (Battery Optimization Whitelist) لمنع تجميد خلايا H3 عند الانتقال للملاحة.',
      batteryNoticeEn: 'Important for Captains: Exclude app from Battery Optimization to prevent H3 freeze when navigating.',
    };
  }

  return {
    platform: 'desktop',
    platformName: 'Desktop / Workstation',
    titleAr: 'تثبيت التطبيق المكتبي المستقل',
    titleEn: 'Install Sovereign Desktop PWA',
    steps: [
      {
        number: 1,
        titleAr: 'شريط العناوين',
        titleEn: 'Address Bar',
        instructionAr: 'اضغط على أيقونة التثبيت (⊕) داخل شريط عناوين المتصفح.',
        instructionEn: 'Click the install icon (⊕) inside the browser address bar.',
        iconType: 'install',
      },
      {
        number: 2,
        titleAr: 'تأكيد التثبيت',
        titleEn: 'Confirm Installation',
        instructionAr: 'اختر "تثبيت" لتشغيل النظام في نافذة تطبيق مستقلة فائقة السرعة.',
        instructionEn: 'Select "Install" to run the system in a standalone high-performance window.',
        iconType: 'desktop',
      },
    ],
    batteryNoticeAr: 'النظام يعمل بكامل طاقته التشغيلية على مدار الساعة.',
    batteryNoticeEn: 'System running with full operational performance 24/7.',
  };
}
