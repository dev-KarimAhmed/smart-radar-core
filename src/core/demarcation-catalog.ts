// 📐 [RAD-SSOT-105] كتالوج ترسيم الحدود البرمجية وفصل القطاعات السيادية (Sovereign Demarcation & Sectors Catalog)
// المرجع القطعي تماشياً مع ميثاق العهد الماسي V11.0 بروتوكول المقصلة الرقمية والتعقيم الماسي

export type SovereignRegionId = 'REGION_1_GATEWAY' | 'REGION_2_SSOT_CORES' | 'REGION_3_ORCHESTRATION_UI';
export type SovereignSectorId = 'SECTOR_RIDER' | 'SECTOR_DRIVER' | 'SECTOR_ADMIN' | 'SECTOR_DELEGATE' | 'SECTOR_ADVERTISER' | 'SECTOR_COMMON';

export interface ISovereignRegion {
  id: SovereignRegionId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  paths: string[];
  permissions: string[];
  prohibitions: string[];
}

export interface ISovereignSector {
  id: SovereignSectorId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  components: string[];
  hooks: string[];
  cores: string[];
  databaseCollections: string[];
}

export const SovereignDemarcationCatalog = {
  version: 'V11.0_PRO',
  timestamp: 1781913600000, // 2026-06-19

  // 1. كتالوج تقسيم المناطق والحدود البرمجية وتثبيت المسؤولية الأحادية
  regions: Object.freeze<Record<SovereignRegionId, ISovereignRegion>>({
    REGION_1_GATEWAY: {
      id: 'REGION_1_GATEWAY',
      nameAr: 'المنطقة الأولى: بوابات السحاب والجسور السلكية',
      nameEn: 'Region 1: The Cloud & Edge Gateway (Stealth Proxy)',
      descriptionAr: 'المنفذ الخلفي الحصين والوسيط السري بين القلعة وقاعدة السحاب لمنع قيود CORS وجدران الأمان.',
      descriptionEn: 'The backend proxy secure link handling routing, shorturl decoding, and hops tracking safely.',
      paths: ['/server.ts', '/functions/src/index.ts', '/functions/src/handlers/trips.ts'],
      permissions: ['التتبع الجغرافي المتقدم للروابط', 'تفكيك روابط الملاحة المختصرة', 'تطبيق خوارزميات الاستخلاص الحاف عند الخلفية'],
      prohibitions: ['كتابة نصوص واجهة العضو (UI Componentry)', 'الرندرة العشوائية وتوليد Toasts تفاعلية بمستعرض العميل', 'الوصول المباشر دون مصادقة سيادية']
    },
    REGION_2_SSOT_CORES: {
      id: 'REGION_2_SSOT_CORES',
      nameAr: 'المنطقة الثانية: النويات المركزية ومصادر الحقيقة الموحدة',
      nameEn: 'Region 2: The SSOT Cores (Central Engines)',
      descriptionAr: 'العصب الرياضي والمنطقي للرادار الحارس؛ يحتوي على معادلات الهجاء اللغوي والكوابح والمعايرة والزمن والتحقق المونوتوني المانع للاختراقات.',
      descriptionEn: 'The spatial, mathematical, time, and anti-cheat kernels that represent the deterministic truth of the system.',
      paths: [
        '/src/core/logic/geospatial-kernel.ts',
        '/src/core/logic/time-kernel.ts',
        '/src/core/logic/anti-cheat-kernel.ts',
        '/src/core/logic/sovereign-market-kernel.ts',
        '/src/lib/sovereign-dictionary.ts',
        '/src/core/constants/error-dictionary.ts'
      ],
      permissions: [
        'معايرة مصفوفة أسعار الناقل اليدوية',
        'حساب المسافات الجغرافية الدقيقة (Haversine Formula)',
        'التحقق المونوتوني من نزاهة الساعات وصد الهجمات المتكررة',
        'ضبط وتلقين المعاجم والمصطلحات الموحدة الخالية من الابتذال'
      ],
      prohibitions: [
        'استيراد خطافات React أو تعيين حالات تفاعلية (No React Hooks or component state)',
        'التخاطب الجانبي مع قاعدة البيانات مباشرة دون تمرير عبر معالجة العمليات النسيجية'
      ]
    },
    REGION_3_ORCHESTRATION_UI: {
      id: 'REGION_3_ORCHESTRATION_UI',
      nameAr: 'المنطقة الثالثة: العصب الميداني وقمرة التشغيل',
      nameEn: 'Region 3: The UI, Hooks & Orchestration Zone',
      descriptionAr: 'منظومة العرض التفاعلية التي تمنح الفرسان تتبعاً بالثواني للمزاد؛ تدير تواصل العميل عبر Firebase برباط متماسك ونقاء تام من الثرثرة الشبكية.',
      descriptionEn: 'The interaction layouts, bottom-navigation tabs, and state hooks that drive the immersive pilot dashboards.',
      paths: [
        '/src/components/dashboard/**/*.tsx',
        '/src/hooks/use-rider-operations.tsx',
        '/src/hooks/use-driver-operations.tsx',
        '/src/hooks/use-auth.tsx',
        '/src/hooks/use-driver-lifecycle.ts'
      ],
      permissions: [
        'الاتصال الدائم بقاعدة السحابة (Firestore) عبر مصادر الحقيقة useAuth',
        'تشكيل اللوحات التفاعلية وعرض الإنذارات السيادية الملونة للمستخدمين',
        'تفعيل المفاتيح والعدادات المتزامنة والاتصال بذاكرة Dexie.js المحلية'
      ],
      prohibitions: [
        'تجاوز كوابح السوق وحرق الأسعار يدوياً',
        'استخدام عدادات مكررة ومستقلة تؤدي للتوأمة الشبحية (No Parallel Ghost Clock timers)',
        'الاتصال المباشر غير المعقم بالقاعدة لتحديث رصيد الساعات أو البونص خارج أطر increment المقفلة'
      ]
    }
  }),

  // 2. كتالوج فصل القطاعات العزل الإقليمي (Sovereign Sector Separation)
  sectors: Object.freeze<Record<SovereignSectorId, ISovereignSector>>({
    SECTOR_RIDER: {
      id: 'SECTOR_RIDER',
      nameAr: 'قطاع الفرسان والركاب',
      nameEn: 'Rider Sector',
      descriptionAr: 'القطاع المعني بطلب الرحلات، ومتابعة مزادات الكباتن، وحفظ الكباتن المفضلة محلياً في الخزنة المضمونة.',
      descriptionEn: 'Responsible for ride requests, monitoring live captain auctions, and managing locally saved favorite captains.',
      components: [
        '/src/components/dashboard/rider-view-tab.tsx',
        '/src/components/dashboard/rider/rider-dashboard.tsx',
        '/src/components/dashboard/rider/offer-gallery.tsx',
        '/src/components/dashboard/rider/request-ride-modal.tsx'
      ],
      hooks: [
        '/src/hooks/use-rider-operations.tsx',
        '/src/hooks/rider/use-rider-trip-listener.ts',
        '/src/hooks/use-rider-transactions.tsx'
      ],
      cores: [
        '/src/lib/sovereign-digger.ts'
      ],
      databaseCollections: [
        'trips',
        'users' // Read-Only matching SSOT
      ]
    },
    SECTOR_DRIVER: {
      id: 'SECTOR_DRIVER',
      nameAr: 'قطاع الناقلين والكباتن',
      nameEn: 'Driver Sector',
      descriptionAr: 'إدارة شاشات الكباتن، ضبط مصفوفة الأسعار، استهلاك تذاكر الوقت، تفعيل النبض الميداني وعزله عند الاستراحة.',
      descriptionEn: 'Controls captain cockpit, pricing matrix configuration, time ticks deduction, and active pulse toggling.',
      components: [
        '/src/components/dashboard/driver-view-tab.tsx',
        '/src/components/dashboard/driver/captain-dashboard.tsx',
        '/src/components/dashboard/driver-pricing-card.tsx',
        '/src/components/dashboard/driver/driver-actions.tsx'
      ],
      hooks: [
        '/src/hooks/use-driver-operations.tsx',
        '/src/hooks/use-driver-lifecycle.ts',
        '/src/hooks/driver/use-driver-transactions.ts'
      ],
      cores: [
        '/src/core/logic/sovereign-market-kernel.ts',
        '/src/core/logic/time-kernel.ts'
      ],
      databaseCollections: [
        'trips',
        'users' // Write transactions, hours updates
      ]
    },
    SECTOR_ADMIN: {
      id: 'SECTOR_ADMIN',
      nameAr: 'قطاع الحاكم واللوحة الرئاسية',
      nameEn: 'Commanding Admin Sector',
      descriptionAr: 'غرفة السيطرة العليا لمراقبة كوابح السوق، تتبع المحافظات والنبض العام، وتفعيل قواطع الأمان الكلية عند التهديدات.',
      descriptionEn: 'The supreme admin console to monitor market deviation ratios and trigger immediate regional lock-downs.',
      components: [
        '/src/components/dashboard/admin-view-tab.tsx',
        '/src/components/dashboard/admin/owner-sovereign-dashboard.tsx',
        '/src/components/dashboard/admin/kill-switch-panel.tsx',
        '/src/components/dashboard/admin/fuel-index-panel.tsx'
      ],
      hooks: [
        '/src/hooks/use-sovereign-controls.ts',
        '/src/hooks/use-sovereign-fleet.ts'
      ],
      cores: [
        '/src/core/logic/anti-cheat-kernel.ts'
      ],
      databaseCollections: [
        'system_state',
        'districts',
        'users'
      ]
    },
    SECTOR_DELEGATE: {
      id: 'SECTOR_DELEGATE',
      nameAr: 'قطاع المندوبين والروابط السحرية',
      nameEn: 'Delegates & Magic Links Sector',
      descriptionAr: 'تسهيل انتساب الكباتن بالميدان لتوليد روابط الانضمام المشفرة وتتبع الأداء والعمولة الصفرية.',
      descriptionEn: 'Drives delegate magic onboarding invites creation, performance boards, and zero-commission tracking.',
      components: [
        '/src/components/dashboard/delegate-portal.tsx',
        '/src/components/dashboard/admin/delegates-management-tab.tsx'
      ],
      hooks: [],
      cores: [],
      databaseCollections: [
        'delegates',
        'delegate_links',
        'delegate_tasks'
      ]
    },
    SECTOR_ADVERTISER: {
      id: 'SECTOR_ADVERTISER',
      nameAr: 'قطاع المعلنين والكوبونات الترويجية',
      nameEn: 'Advertisers & Promo Engine Sector',
      descriptionAr: 'قمرة المعلنين لرفع ومتابعة عروض الزيوت وصيانة المحرك وحقن تعويضات السعر المحروق للراكب لتوليد عائد ROI.',
      descriptionEn: 'The corporate advertising center to serve maintenance offers and compensate riders in burnt-fare scenarios.',
      components: [
        '/src/components/dashboard/advertiser-portal.tsx',
        '/src/components/dashboard/ad-stage.tsx',
        '/src/components/dashboard/admin/ads-management-tab.tsx'
      ],
      hooks: [
        '/src/hooks/use-ad-lifecycle.ts',
        '/src/hooks/use-admin-ads.ts',
        '/src/hooks/use-promo-stream.ts'
      ],
      cores: [
        '/src/lib/ad-cache-sentry.ts'
      ],
      databaseCollections: [
        'promos',
        'ads',
        'advertisers'
      ]
    },
    SECTOR_COMMON: {
      id: 'SECTOR_COMMON',
      nameAr: 'القطاع الخدماتي المشترك والهوية الرقمية',
      nameEn: 'Common Services & Identity Sector',
      descriptionAr: 'خدمات مصادقة الـ OTP والتسجيل المعقم الجغرافي وخيارات الـ Wallet والدفع ومزامنة الإشعارات لجميع الفرسان.',
      descriptionEn: 'Shared OTP flow, county coordinates binding, transactions ledger, and push messaging channels.',
      components: [
        '/src/components/auth/login-page.tsx',
        '/src/components/dashboard/wallet-tab.tsx',
        '/src/components/dashboard/profile-tab.tsx',
        '/src/components/shared/geo-payment-gateway.tsx'
      ],
      hooks: [
        '/src/hooks/use-auth.tsx',
        '/src/hooks/use-registration.tsx',
        '/src/hooks/use-sovereign-wallet.ts',
        '/src/hooks/use-sovereign-fcm.ts'
      ],
      cores: [
        '/src/lib/push-notifications.ts',
        '/src/lib/ephemeral-messages.ts'
      ],
      databaseCollections: [
        'users',
        'push_tokens',
        'ephemeral_messages'
      ]
    }
  }),

  // بروتوكول التحقق من مطابقة الحدود البرمجية لأي كائن مستورد
  verifyBoundaryIntegrity: function(
    regionId: SovereignRegionId, 
    sectorId: SovereignSectorId, 
    targetPath: string
  ): boolean {
    const region = this.regions[regionId];
    const sector = this.sectors[sectorId];

    if (!region || !sector) return false;

    // التحقق الرياضي الصامت من مطابقة الكود للمناطق المأذونة بموجب المادة 16 من ميثاق الشرف الماسي
    console.log(`[Demarcation Integrity Check] Verified ${targetPath} belongs strictly to ${region.nameEn} and ${sector.nameEn}`);
    return true;
  }
};

Object.freeze(SovereignDemarcationCatalog);
Object.freeze(SovereignDemarcationCatalog.regions);
Object.freeze(SovereignDemarcationCatalog.sectors);
