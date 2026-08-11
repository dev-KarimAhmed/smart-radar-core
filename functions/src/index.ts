import * as admin from "firebase-admin";

// تهيئة الخادم (Protocol 30)
if (!admin.apps.length) {
    admin.initializeApp();
}

// [SCR-2026-009] The Sovereign Function Manifest

// ads.ts
export { syncAdStats, createSovereignAd } from './handlers/ads';

// admin.ts
export { toggleSovereignKillSwitch, adminUpdateFuelIndex, syncMarketPulse } from './handlers/admin';

// geo.ts
export { getCurrentDistrictByCoords } from './handlers/geo';

// utils.ts
// [SCR-2026-GHOST-PURGE] تم إعدام دالة resolveShortUrl لإنهاء التوأمة الشبحية

// trips.ts
export {
  onTripHandshake,
  requestRide
} from './handlers/trips';

// users.ts
export {
  listSovereignFleet,
  registerSovereignUser,
  updateSovereignPricing
} from './handlers/users';

// drivers.ts (New Sovereign Command Center)
export { enforceEmergencyDescent } from './handlers/drivers';

// ratings.ts
export {
  submitTripFeedback,
  generateWeeklyReport,
  submitRiderRating
} from './handlers/ratings';

// cleanup.ts
export { purgeExpiredBuffers, purgeExpiredTrips72Hours } from './handlers/cleanup';
