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

// [RANK-ENGINE-2026-08-22] ratings.ts and drivers.ts were deleted, not just unexported.
// Ranking and rating now live entirely in Postgres:
//   supabase/migrations/20260822090000_captain_rank_sovereign_engine.sql
// Gone with them: submitTripFeedback, submitRiderRating, generateWeeklyReport,
// enforceEmergencyDescent — none of which the app ever called. What they did beyond
// ranking, and which of it still has no Supabase home, is written down in
// docs/firebase-removal-plan.md.
//
// Deleting the source does NOT undeploy them. Run `firebase deploy --only functions`
// once (or delete them in the Firebase console) to remove them from the project.

// cleanup.ts
export { purgeExpiredBuffers, purgeExpiredTrips72Hours } from './handlers/cleanup';
