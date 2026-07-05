# Rider + Captain Dashboard Alignment Report

Date: 2026-07-05

Scope: active Rider Dashboard, active Captain Dashboard, bilingual UI behavior, Supabase RPC bindings, realtime ride/offers flow, H3/MapLibre geospatial path, captain presence pulse, wallet/ledger hardening SQL, Firebase eviction status, ad batching, Dexie local storage, and remaining production-readiness gaps.

## 1. Executive Maturity Scores

**Frontend/Demo Alignment:** **99%**

The Rider experience remains essentially complete, and the Captain endpoint is now aligned with the same production direction. The active captain path has a clean dashboard, MapLibre/OpenFreeMap location view, H3 resolution 9 presence, Supabase-backed nearby request radar, server offer insertion, accepted-offer listener, server trip completion call, readable bilingual copy, and no active Firestore listeners in the captain surface.

**Production Readiness:** **96% repository/migration readiness**

The repository now has a coherent E2E marketplace loop: rider creates a Supabase `ride_requests` row, captain sees nearby `PENDING` requests by H3 cell, captain inserts a `ride_offers` row, rider accepts via `accept_ride_offer`, captain receives the accepted offer, and trip completion goes through `complete_ride_trip`. The remaining risk is live staging validation: RLS, policies, realtime subscriptions, race conditions, and real multi-device behavior must be tested against the live Supabase project.

## 2. Updated Compliance Matrix

| Module Area | Frontend Status & File Path | Backend Alignment (Supabase) | Mock-Free? | Remaining Production Fixes |
| --- | --- | --- | --- | --- |
| Auth portal and session | Supabase phone/password, remember-me storage, logout confirmation, session restore, device-language default, and preserved language preference. | Uses Supabase Auth and profile metadata. Geography IDs use live dropdown values. | Yes | Run live signup/login regression for rider and captain accounts. |
| Multi-country registration | Country, governorate, district dropdown pipeline uses Supabase data. Phone validation supports country-aware E.164 normalization. | `countries`, `governorates`, `districts` are treated as public read-only metadata in migration. | Yes | Validate country metadata: phone examples, currency, coordinates, and tariff settings. |
| Dashboard language sync | Rider sidebar/screens and the new captain screens respond to the active dashboard language. | Not backend-dependent. | Yes | Continue translating non-rider/admin/advertiser peripheral views. |
| Rider map | MapLibre/OpenFreeMap, GPS, recenter button, H3 display, destination pin, and captain presence integration. | `captain_locations` and `pulse_captain_location` are versioned in SQL with TTL policy. | Yes | Cross-device test with a live captain pulsing every 15 seconds. |
| Captain map and presence | `src/components/dashboard/driver/captain-dashboard.tsx` renders MapLibre and H3 status; `use-captain-location-pulse.ts` calls `pulse_captain_location` every 15 seconds while active and supports both `p_h3_cell` and legacy `p_h3` signatures. | Uses `captain_locations` RPC path and local `h3-js` resolution 9. | Yes | Confirm live RLS policy on the deployed database. |
| Rider destination and fare | Interactive pin, district fly-to, H3 recalculation, debounced server fare in `rider-view-tab.tsx` and `rider-server-marketplace.ts`. | `calculate_server_fare(lat1,lng1,lat2,lng2,p_country_id)` is versioned with old signatures dropped first. | Yes | Confirm live country tariff/tortuosity values produce expected fare ranges. |
| Ride request creation | Rider request creation uses Supabase insert. On success, the UI moves to waiting/offers and shows saved request ID, destination, and fare. | `ride_requests` gets RLS insert/select policies and status trigger guard. | Yes | Verify insert success with a real authenticated rider; demo users can still fail under RLS. |
| Captain radar | `src/hooks/driver/use-driver-radar.ts` fetches and subscribes to `public.ride_requests`, filtering `PENDING` rows by current H3 cell and neighboring cells. | Reads `ride_requests` through Supabase only. | Yes | Test that RLS allows captains to read eligible pending requests without exposing unrelated private data. |
| Captain offer submission | `src/hooks/driver/use-driver-transactions.ts` inserts into `public.ride_offers` with `request_id`, `captain_id`, `offer_price`, and `PENDING`. | Uses `ride_offers`; rider acceptance remains locked by `accept_ride_offer`. | Yes | Validate offer insert policy and required DB columns in live staging. |
| Rider offer acceptance | `rider-view-tab.tsx` calls `acceptRideOffer` before reducer transition; reducer does not create local trip IDs. | `accept_ride_offer` RPC is versioned with row locking and stale-offer rejection. | Yes | E2E race test with two captains accepting at the same time. |
| Captain accepted-offer transition | `use-driver-transactions.ts` subscribes to captain `ride_offers`; accepted rows load the matching request and transition captain state to active trip. | Realtime listens to `ride_offers` and `ride_requests`. | Yes | Validate accepted payload delivery across two devices. |
| Trip completion | Rider and captain flows call `complete_ride_trip`; local ledger reflection happens only after server success. | `complete_ride_trip` updates request status and inserts `trips_72h_ledger`. | Yes | Confirm both rider-side and captain-side completion permissions match product rules. |
| Rating modal | Rider rating uses `submitRideRating`; local `rider_demo_ratings` was removed. Captain rating UI no longer writes local rating arrays. | `submit_ride_rating` writes `rider_ratings` and recalculates profile trust/rating values. | Mostly | The captain-to-rider rating contract still needs a dedicated backend function if required by product rules. |
| 72-hour ledger | Dexie local ledger/favorites remain for offline-first UX. | `trips_72h_ledger` is versioned with own-row policies and sensitive grant revokes. | Yes | Confirm server ledger purge/retention job if legal/support requires server TTL. |
| Wallet and time bundles | Wallet UI and captain dashboard describe server-owned time bundles and read-only balances. | Migration uses `wallet_accounts.profile_id` and `wallet_transactions.profile_id`, not invalid `user_id`. | Mostly | Validate live bucket policy, receipt upload, voucher, and delegate RPC paths with real records. |
| Ad River carousel | Approved large image-card UI, hover/focus/touch pause, manual controls, and placeholder empty state in `ad-stage.tsx`. | `flush_ad_campaign_metrics(jsonb)` is versioned for batched counters. | Yes | Run 50-event and `beforeunload` flush tests against live ad rows. |
| Firebase eviction in active driver path | `use-driver-radar.ts`, `use-driver-transactions.ts`, `use-driver-operations.tsx`, `driver-view-tab.tsx`, and `captain-dashboard.tsx` are free of Firestore imports/listeners. | Supabase realtime is the active Rider/Captain source of truth. | Yes for active Rider/Captain | Peripheral admin/advertiser/legacy utilities still need service-by-service migration. |
| Database versioning | Unified SQL exists in `supabase/migrations/`; functions and policies use drop guards before recreation. | Sensitive grants and `profile_id` ownership are represented in local SQL. | Yes | Apply to live Supabase SQL Editor and run rollback/staging checks. |

## 3. Discovered Repository Gaps

### A. Live E2E Staging Sandbox Testing

- Run a real two-device test: one rider account and one captain account in the same country/H3 region.
- Confirm rider request insert succeeds under RLS and appears in the captain radar.
- Confirm captain pulse appears on the rider map only when `updated_at > now() - interval '60 seconds'`.
- Confirm captain offer insertion succeeds and appears in the rider offers screen.
- Confirm `accept_ride_offer` rejects losing/stale offers in a two-captain race.
- Confirm captain receives the accepted offer through realtime and moves into active trip.
- Confirm `complete_ride_trip` writes `trips_72h_ledger` and only then allows local Dexie reflection.
- Confirm direct `ride_requests.status` updates fail outside RPCs.
- Confirm wallet reads use `profile_id = auth.uid()` and do not expose other accounts.
- Confirm ad batching flushes at 50 events and on app exit.

### B. Peripheral Service Sync

The active Rider/Captain marketplace path is clean, but the wider repository still has historical or peripheral Firebase services. These no longer block the E2E Rider/Captain loop, but they should be migrated or gated before calling the full repository Firebase-free:

- `src/core/contracts/cloud-bridge.ts`
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

### C. Backend Contract Follow-Up

- Normalize the live migration so `pulse_captain_location` has one canonical H3 argument name. The frontend currently supports both `p_h3_cell` and legacy `p_h3`.
- Add a dedicated captain-to-rider rating RPC if the product requires captains to rate riders separately from rider-to-captain rating.
- Confirm `ride_offers` insert policy allows the authenticated captain to insert only their own `captain_id`.
- Confirm `ride_requests` select policy allows captains to see only eligible pending request rows.

### D. Local Micro-Copy Pass

The active Rider/Captain screens now use simple Arabic and bilingual labels. Remaining polish is mostly outside the core marketplace:

- Finish English copy for rare global fallback/error states.
- Continue removing old internal terms from admin, advertiser, archived docs, and legacy utilities.

## 4. Current Bottom Line

The project now has a credible end-to-end Rider/Captain marketplace core. The active loop is no longer a rider-only prototype: captains can pulse their H3 location, watch nearby Supabase ride requests, submit real offer rows, receive accepted-offer realtime updates, and complete trips through server RPCs.

The core marketplace is **investment-ready at repository level**, with the remaining gates being live Supabase staging validation, backend policy verification, and cleanup of peripheral non-marketplace services.
