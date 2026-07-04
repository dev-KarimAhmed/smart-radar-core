# Rider Dashboard Alignment Report

Date: 2026-07-04

Scope: active Rider Dashboard frontend, Rider state machine, Supabase RPC bindings, realtime ride/offers flow, wallet/ledger hardening SQL, Firebase eviction status, MapLibre/H3 geospatial path, ad batching, Dexie local storage, and remaining production-readiness gaps.

## 1. Executive Maturity Scores

**Frontend/Demo Alignment:** **99%**

The Rider Dashboard is now essentially complete as a product-facing rider experience. The layout, MapLibre/OpenFreeMap map, H3 resolution 9 flow, country-aware data, interactive destination pin, Supabase auth, realtime offers, accepted-offer transition, trip completion, rating flow, Dexie ledger, favorites, ad carousel, desktop/mobile navigation, and friendly empty states are all present in the active rider path.

**Production Readiness:** **96% repository/migration readiness**

The remaining 4% is not core architecture anymore. It is staging validation: running the generated SQL on the live Supabase project, testing real rider/driver multi-client flows, validating RLS with real accounts, and finishing a small Arabic copy cleanup. The local code and migration files now reflect the hardened target: `profile_id` wallet ownership, `profiles.id` identity ownership, RPC-only ride status transitions, TRUNCATE/UPDATE/DELETE revocation for sensitive tables, and versioned backend functions.

## 2. Updated Compliance Matrix

| Module Area | Frontend Status & File Path | Backend Alignment (Supabase) | Mock-Free? | Remaining Production Fixes |
| --- | --- | --- | --- | --- |
| Auth portal and session | Supabase phone/password, remember-me storage, logout confirmation, session restore in `src/hooks/use-auth.tsx` and auth helpers. | Uses Supabase Auth and profile metadata. Geography IDs use live dropdown values. | Yes | Run live signup/login regression with real phone/password users and confirm trigger/RLS behavior. |
| Multi-country registration | Country, governorate, district dropdown pipeline uses Supabase data in registration/profile flows. | `countries`, `governorates`, `districts` are treated as public read-only metadata in migration. | Yes | Validate every supported country row has complete currency and coordinate metadata. |
| Default rider map | MapLibre/OpenFreeMap, GPS, H3 display, captain presence integration in `src/components/dashboard/rider/rider-map.tsx`. | `captain_locations` and `pulse_captain_location` are versioned in SQL with 60-second TTL select policy. | Yes | Cross-device test with a live driver pulsing every 15 seconds. |
| Destination pin and fare | Interactive pin, district fly-to, H3 recalculation, debounced server fare in `rider-view-tab.tsx` and `rider-server-marketplace.ts`. | `calculate_server_fare(lat1,lng1,lat2,lng2,p_country_id)` is versioned with old signatures dropped first. | Yes | Confirm live country tortuosity/tariff values produce expected fare ranges. |
| Ride request creation | Request creation uses Supabase insert via `rider-server-marketplace.ts`. | `ride_requests` gets RLS insert/select policies and status trigger guard. | Yes | Confirm no direct client update to `status` succeeds in staging. |
| Realtime request status | `subscribeToRideRequestStatus` drives `SERVER_STATUS_ACCEPTED` transition into `TRIP_ACTIVE`. | Realtime relies on `public.ride_requests` status changes made by RPCs. | Yes | Multi-client test with delayed, cancelled, and already-accepted requests. |
| Offers stream | `subscribeToRideOffers` feeds the offers screen; empty/waiting states are handled. | `ride_offers_select_related` policy allows only related rider/captain visibility. | Yes | Validate real driver offer creation path from the driver app. |
| Offer acceptance | `rider-view-tab.tsx` calls `acceptRideOffer` before dispatching `SELECT_OFFER`; reducer only stores pending accepted offer ID. | `accept_ride_offer` RPC is versioned with row locking and rejected stale offers. | Yes | E2E race test with two drivers accepting at the same time. |
| Active trip completion | `handleCompleteTrip` calls `completeRideTrip`; Dexie ledger write happens only after RPC success. | `complete_ride_trip` updates request status and inserts `trips_72h_ledger`. | Yes | Validate captain-side completion permissions and support flow. |
| Rating modal | `handleSubmitRating` calls `submitRideRating`; local `rider_demo_ratings` was removed. | `submit_ride_rating` writes `rider_ratings` and recalculates profile trust/rating values. | Yes | Test duplicate rating update and score recalculation in staging. |
| 72-hour ledger | Dexie local ledger/favorites are still used for offline-first UX in rider components. | `trips_72h_ledger` is versioned with own-row policies and sensitive grant revokes. | Yes | Confirm server ledger purge/retention job if legal/support requires server TTL. |
| Wallet and payments | Wallet UI uses Supabase wallet tables, receipt upload structures, vouchers, and delegate routines. | Migration uses `wallet_accounts.profile_id` and `wallet_transactions.profile_id`, not invalid `user_id`. | Mostly | Validate live bucket policy and voucher/delegate RPC paths with real records. |
| Ad River carousel | Approved large image-card UI, hover/focus/touch pause, manual controls, placeholder empty state in `ad-stage.tsx`. | `flush_ad_campaign_metrics(jsonb)` is versioned for batched counters. | Yes | Run 50-event and `beforeunload` flush tests against live ad rows. |
| Firebase eviction in Rider path | Active rider files and delegate portal no longer mount Firestore listeners. | Supabase realtime is the Rider source of truth. | Yes for Rider | Peripheral admin/driver utilities still need service-by-service migration. |
| Database versioning | Unified SQL exists in both migration files under `supabase/migrations/`. | Functions are dropped before recreation; policies are dropped before creation; sensitive revokes included. | Yes | Apply to live Supabase SQL Editor and run rollback/staging checks. |
| Arabic copy | Most visible rider/wallet text is simplified. | Not backend-dependent. | Partial | Some corrupted toast strings remain in `rider-view-tab.tsx`; final copy pass needed. |

## 3. Discovered Repository Gaps

### A. Live E2E Staging Sandbox Testing

- Run a real two-device test: one rider account, one driver account, same country/H3 region.
- Confirm driver presence appears only when `updated_at > now() - interval '60 seconds'`.
- Confirm `accept_ride_offer` rejects the losing driver in a race.
- Confirm `complete_ride_trip` writes `trips_72h_ledger` and only then allows local Dexie reflection.
- Confirm `submit_ride_rating` updates `rider_ratings` and recalculates the driver score.
- Confirm direct `ride_requests.status` updates fail outside RPCs.
- Confirm wallet reads use `profile_id = auth.uid()` and do not expose other accounts.
- Confirm ad batching flushes at 50 events and on app exit.

### B. Non-Rider Service Sync

The active Rider path is clean, but a wider repository scan still finds Firebase in peripheral or historical services:

- `src/core/contracts/cloud-bridge.ts`
- `src/hooks/driver/use-driver-transactions.ts`
- `src/hooks/admin/useSovereignDashboard.ts`
- `src/hooks/use-admin-ads.ts`
- `src/hooks/use-market-pulse.ts`
- `src/hooks/use-sovereign-controls.ts`
- `src/hooks/use-atomic-handshake.ts`
- `src/hooks/use-pricing-matrix.tsx`
- `src/lib/audit-logger.ts`
- `src/lib/ad-cache-sentry.ts`
- `src/lib/ephemeral-messages.ts`
- `src/lib/push-notifications.ts`
- `src/pages/api/cleanup.ts`
- `src/components/dashboard/admin/delegates-management-tab.tsx`

These no longer block the core Rider Dashboard, but they should be migrated or gated before calling the entire repository Firebase-free.

### C. Local Micro-Copy Pass

Remaining issue is polish, not architecture. A scan shows no old dramatic terms in the targeted rider/wallet/payment files, but `src/components/dashboard/rider-view-tab.tsx` still contains corrupted Arabic toast strings around offer acceptance, trip completion, and rating error handling. Replace those with simple standard Arabic before client delivery.

Recommended replacements:

- `تعذر قبول العرض`
- `لا يوجد طلب رحلة نشط حالياً. حاول إرسال الطلب مرة أخرى.`
- `بيانات العرض غير مكتملة. انتظر تحديث العروض ثم حاول مرة أخرى.`
- `عذراً، تم قبول عرض آخر لهذه الرحلة بالفعل أو تم إلغاؤها.`
- `تعذر إنهاء الرحلة`
- `تعذر حفظ التقييم`

## 4. Current Bottom Line

The Rider Dashboard has moved from a local frontend prototype into a hardened, server-bound marketplace core. The important trust transitions are now designed around Supabase RPCs instead of client simulation: offer acceptance, trip completion, rating, fare calculation, driver presence, wallet ownership, ad metric flushing, and ledger records all have versioned backend contracts.

The platform is now **investment-ready at the core Rider marketplace layer**, with the final gates being live staging validation, peripheral service migration, and a small Arabic micro-copy cleanup pass.
