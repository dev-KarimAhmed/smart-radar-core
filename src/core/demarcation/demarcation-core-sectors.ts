import type { SovereignSectorId, ISovereignSector } from './demarcation-types';

export const coreSectors: Record<
  'SECTOR_CORES' | 'SECTOR_UTILITIES' | 'SECTOR_DELEGATE' | 'SECTOR_COMMON',
  ISovereignSector
> = {
  SECTOR_CORES: {
    id: 'SECTOR_CORES',
    nameAr: 'قطاع الملفات التقنية',
    nameEn: 'Technical Core Files Sector',
    descriptionAr: 'ملفات النواة الصلبة والمنطق الجنائي مثل خوارزميات محاكاة الملاحة، الكواشف الجغرافية، التحقق المونوتوني، وجدران الحماية.',
    descriptionEn: 'Solid mathematical core files, geospatial detection, cryptographic assertions, and anti-cheat guards.',
    frontend: {
      components: [],
      hooks: []
    },
    backend: {
      cores: [
        '/src/core/RadarAntiCheatKernel.ts',
        '/src/core/logic/geospatial-kernel.ts',
        '/src/core/logic/time-kernel.ts',
        '/src/core/logic/sovereign-market-kernel.ts'
      ],
      cloudFunctions: [],
      databaseCollections: []
    }
  },
  SECTOR_UTILITIES: {
    id: 'SECTOR_UTILITIES',
    nameAr: 'قطاع الادوات التقنية المساعدة',
    nameEn: 'Technical Utility & Helper Tools Sector',
    descriptionAr: 'الأدوات التقنية المساندة للتخزين المحلي المستقر والملاحة التصفوية والخرائط الحرة وحسابات هيرسين وجداول اللغات والترجمة.',
    descriptionEn: 'Auxiliary helper utilities for local caching, free maps integration, custom distance calculators, and dictionary files.',
    frontend: {
      components: [],
      hooks: [
        '/src/hooks/use-link-catcher.ts',
        '/src/hooks/use-geospatial-anchor.ts',
        '/src/hooks/use-market-pulse.ts',
        '/src/hooks/use-promo-stream.ts'
      ]
    },
    backend: {
      cores: [
        '/src/lib/sovereign-dictionary.ts',
        '/src/core/utils.ts'
      ],
      cloudFunctions: [],
      databaseCollections: []
    }
  },
  SECTOR_DELEGATE: {
    id: 'SECTOR_DELEGATE',
    nameAr: 'قطاع المندوبين والروابط السحرية',
    nameEn: 'Delegates & Magic Links Sector',
    descriptionAr: 'تسهيل انتساب الكباتن بالميدان لتوليد روابط الانضمام المشفرة وتتبع الأداء والعمولة الصفرية واستحقاقات الصندوق الأسود.',
    descriptionEn: 'Drives delegate magic onboarding invites creation, performance boards, and zero-commission tracking.',
    frontend: {
      components: [
        '/src/components/dashboard/delegate-portal.tsx',
        '/src/components/dashboard/admin/delegates-management-tab.tsx'
      ],
      hooks: []
    },
    backend: {
      cores: [],
      cloudFunctions: [
        '/functions/src/handlers/delegates.ts'
      ],
      databaseCollections: [
        'delegates',
        'delegate_links',
        'delegate_tasks'
      ],
      apiEndpoints: [
        '/api/delegate/magic-link',
        '/api/delegate/performance'
      ]
    }
  },
  SECTOR_COMMON: {
    id: 'SECTOR_COMMON',
    nameAr: 'القطاع الخدماتي المشترك والهوية الرقمية',
    nameEn: 'Common Services & Identity Sector',
    descriptionAr: 'خدمات مصادقة الـ OTP والتسجيل المعقم الجغرافي وخيارات الـ Wallet والدفع ومزامنة الإشعارات لجميع الفرسان.',
    descriptionEn: 'Shared OTP flow, county coordinates binding, transactions ledger, and push messaging channels.',
    frontend: {
      components: [
        '/src/components/auth/login-page.tsx',
        '/src/components/dashboard/wallet-tab.tsx',
        '/src/components/dashboard/profile-tab.tsx',
        '/src/components/dashboard/history-tab.tsx',
        '/src/components/dashboard/vault-tab.tsx',
        '/src/components/shared/geo-payment-gateway.tsx'
      ],
      hooks: [
        '/src/hooks/use-auth.tsx',
        '/src/hooks/use-registration.tsx',
        '/src/hooks/use-sovereign-wallet.ts',
        '/src/hooks/use-sovereign-fcm.ts'
      ]
    },
    backend: {
      cores: [
        '/src/lib/push-notifications.ts',
        '/src/lib/ephemeral-messages.ts'
      ],
      cloudFunctions: [
        '/functions/src/handlers/auth.ts'
      ],
      databaseCollections: [
        'users',
        'push_tokens',
        'ephemeral_messages'
      ],
      apiEndpoints: [
        '/api/auth/otp-send',
        '/api/auth/otp-verify',
        '/api/payment/wallet-load'
      ]
    }
  }
};
