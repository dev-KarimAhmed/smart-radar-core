import type { SovereignRegionId, ISovereignRegion } from './demarcation-types';

export const sovereignRegions = Object.freeze<Record<SovereignRegionId, ISovereignRegion>>({
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
      '/src/core/RadarAntiCheatKernel.ts',
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
});
