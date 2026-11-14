import type { SovereignSectorId, ISovereignSector } from './demarcation-types';

export const userSectors: Record<
  'SECTOR_RIDER' | 'SECTOR_DRIVER' | 'SECTOR_ADMIN' | 'SECTOR_ADVERTISER',
  ISovereignSector
> = {
  SECTOR_RIDER: {
    id: 'SECTOR_RIDER',
    nameAr: 'قطاع المستخدم',
    nameEn: 'Rider Sector',
    descriptionAr: 'القطاع المعني بطلب الرحلات ومتابعة مزادات الكباتن المعلنين والنبض البصري التركوازي صامت الخيارات.',
    descriptionEn: 'Responsible for ride requests, monitoring live captain auctions, and managing locally saved favorite captains.',
    frontend: {
      components: [
        '/src/components/dashboard/rider-view-tab.tsx',
        '/src/components/dashboard/rider-portal.tsx',
        '/src/components/dashboard/rider/rider-dashboard.tsx',
        '/src/components/dashboard/rider/offer-gallery.tsx',
        '/src/components/dashboard/rider/request-ride-modal.tsx',
        '/src/components/dashboard/rider/driver-sovereign-card.tsx'
      ],
      hooks: [
        '/src/hooks/use-rider-operations.tsx',
        '/src/hooks/rider/use-rider-trip-listener.ts',
        '/src/hooks/use-rider-transactions.tsx',
        '/src/hooks/use-rider-sidebar-radar.ts'
      ]
    },
    backend: {
      cores: [
        '/src/shared/services/google-maps-location.ts'
      ],
      cloudFunctions: [
        '/functions/src/handlers/trips.ts'
      ],
      databaseCollections: [
        'trips',
        'users' // Read-Only validation for driver metadata
      ],
      apiEndpoints: [
        '/api/rider/request',
        '/api/rider/cancel'
      ]
    }
  },
  SECTOR_DRIVER: {
    id: 'SECTOR_DRIVER',
    nameAr: 'قطاع الناقل',
    nameEn: 'Driver / Captain Sector',
    descriptionAr: 'إدارة شاشات الكباتن، ضبط مصفوفة الأسعار، استهلاك تذاكر الوقت، تفعيل النبض الميداني وعزله عند الاستراحة، وتجنب التوأمة الشبحية والثرثرة الشبكية.',
    descriptionEn: 'Controls captain cockpit, pricing matrix configuration, time ticks deduction, and active pulse toggling.',
    frontend: {
      components: [
        '/src/components/dashboard/driver-view-tab.tsx',
        '/src/components/dashboard/driver/captain-dashboard.tsx',
        '/src/components/dashboard/driver-pricing-card.tsx',
        '/src/components/dashboard/driver/driver-actions.tsx',
        '/src/components/dashboard/driver/driver-stats-card.tsx'
      ],
      hooks: [
        '/src/hooks/use-driver-operations.tsx',
        '/src/hooks/use-driver-lifecycle.ts',
        '/src/hooks/driver/use-driver-transactions.ts',
        '/src/hooks/driver/use-driver-radar.ts'
      ]
    },
    backend: {
      cores: [
        '/src/core/logic/sovereign-market-kernel.ts',
        '/src/core/logic/time-kernel.ts'
      ],
      cloudFunctions: [
        '/functions/src/handlers/drivers.ts'
      ],
      databaseCollections: [
        'trips',
        'users' // Write transactions, hours updates
      ],
      apiEndpoints: [
        '/api/driver/tick',
        '/api/driver/status-sync'
      ]
    }
  },
  SECTOR_ADMIN: {
    id: 'SECTOR_ADMIN',
    nameAr: 'قطاع المالك',
    nameEn: 'Owner / Commanding Admin Sector',
    descriptionAr: 'غرفة السيطرة العليا لمراقبة كوابح السوق، تتبع المحافظات والنبض العام، وتفعيل قواطع الأمان الكلية عند التهديدات.',
    descriptionEn: 'The supreme admin console to monitor market deviation ratios and trigger immediate regional lock-downs.',
    frontend: {
      components: [
        '/src/components/dashboard/admin-view-tab.tsx',
        '/src/components/dashboard/admin/kill-switch-panel.tsx',
        '/src/components/dashboard/admin/fuel-index-panel.tsx',
        '/src/components/dashboard/admin/drivers-management-tab.tsx'
      ],
      hooks: [
        '/src/hooks/use-sovereign-controls.ts',
        '/src/hooks/use-sovereign-fleet.ts',
        '/src/hooks/admin/useSovereignDashboard.ts'
      ]
    },
    backend: {
      cores: [
        '/src/core/RadarAntiCheatKernel.ts'
      ],
      cloudFunctions: [
        '/functions/src/handlers/admin.ts'
      ],
      databaseCollections: [
        'system_state',
        'districts',
        'users'
      ],
      apiEndpoints: [
        '/api/admin/killswitch',
        '/api/admin/fuel-price-override'
      ]
    }
  },
  SECTOR_ADVERTISER: {
    id: 'SECTOR_ADVERTISER',
    nameAr: 'قطاع المعلن',
    nameEn: 'Advertiser Sector',
    descriptionAr: 'قمرة المعلنين لرفع ومتابعة عروض الزيوت وصيانة المحرك وحقن تعويضات السعر المحروق للمستخدم لتوليد عائد ROI.',
    descriptionEn: 'The corporate advertising center to serve maintenance offers and compensate riders in burnt-fare scenarios.',
    frontend: {
      components: [
        '/src/components/dashboard/advertiser-portal.tsx',
        '/src/components/dashboard/ad-stage.tsx',
        '/src/components/dashboard/admin/ads-management-tab.tsx'
      ],
      hooks: [
        '/src/hooks/use-ad-lifecycle.ts',
        '/src/hooks/use-admin-ads.ts',
        '/src/hooks/use-promo-stream.ts'
      ]
    },
    backend: {
      cores: [
        '/src/lib/ad-cache-sentry.ts'
      ],
      cloudFunctions: [
        '/functions/src/handlers/ads.ts'
      ],
      databaseCollections: [
        'promos',
        'ads',
        'advertisers'
      ],
      apiEndpoints: [
        '/api/ads/serve',
        '/api/ads/click-track'
      ]
    }
  }
};
