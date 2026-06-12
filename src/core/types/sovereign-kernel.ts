export type SovereignClearanceLevel = 'LEVEL_1_VERIFIED' | 'LEVEL_2_TACTICAL' | 'COMMANDING_GENERAL';

export interface ISovereignKillSwitch {
  isSystemActive: boolean;
  emergencyLockTriggered: boolean;
  blacklistedAtomicIds: string[];
}

export interface SovereignTimeCounter {
  paidMinutesRemaining: number;
  lastServerSyncedTimestamp: number; // الوقت الحقيقي الموثق من السيرفر
  localTimeDeltaMs: number;          // الفارق الرياضي بين ساعة السيرفر وساعة الهاتف
}

export interface RiderRequestThrottle {
  riderId: string;
  activeRequestsCount: number;
  consecutiveCancellations: number;
  trustRating: number;
}

// قمرة العمليات المركزية للمالك الحاكم
export interface IOperationsBlackBoxKernel {
  kernelId: string;
  version: "V5.5_PRO" | "V4.0_LEGACY";
  lastPulseSync: number;
  
  // البنيات المستقلة للقطاعات كمرجع قطعي للتحقق
  registry: {
    riders: Record<string, { atomicId: string; secureDinarBalance: number }>;
    transporters: Record<string, { atomicId: string; isZeroCommission: boolean }>;
    activeOrders: Record<string, { atomicId: string; isPriceFrozen: boolean }>;
    internationalZones: Record<string, { ledgerId: string; zoneCode: string }>;
    atomicAds: Record<string, { adId: string; cellIndex: string }>;
    advertisers: Record<string, { advertiserId: string; diamondCovenant: boolean }>;
  };

  // نظام مراقبة كوابح السوق والنواقص (15% التوازن)
  marketPulseMonitor: {
    deviationRate: number; // بحد أقصى 15%
    isMarketStabilized: boolean;
    activeAnomaliesCount: number;
  };

  // كوابح السيطرة التنفيذية الفورية للمالك
  controlCouncil: {
    killSwitch: ISovereignKillSwitch;
  };
}
