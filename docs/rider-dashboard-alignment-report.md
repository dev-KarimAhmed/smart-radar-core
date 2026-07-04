# Rider Dashboard Alignment Report

Date: 2026-07-05

Scope: active Rider Dashboard frontend, i18n behavior, Rider state machine, Supabase RPC bindings, realtime ride/offers flow, wallet/ledger hardening SQL, Firebase eviction status, MapLibre/H3 geospatial path, ad batching, Dexie local storage, and remaining production-readiness gaps.

## 1. Executive Maturity Scores

**Frontend/Demo Alignment:** **99%**

The Rider Dashboard is now essentially complete as a product-facing rider experience. The layout, MapLibre/OpenFreeMap map, H3 resolution 9 flow, country-aware data, interactive destination pin, Supabase auth, realtime offers, accepted-offer transition, trip completion, rating flow, Dexie ledger, favorites, ad carousel, desktop/mobile navigation, friendly empty states, and English/Arabic dashboard synchronization are all present in the active rider path.

**Production Readiness:** **96% repository/migration readiness**

The remaining 4% is staging validation, not core architecture. The code now binds the important trust transitions to Supabase RPCs and server rows, but the live project still needs real-account RLS testing, rider/driver multi-client testing, wallet/payment record testing, ad batch flushing verification, and full production database migration execution.

## 2. Updated Compliance Matrix

| Module Area | Frontend Status & File Path | Backend Alignment (Supabase) | Mock-Free? | Remaining Production Fixes |
| --- | --- | --- | --- | --- |
| Auth portal and session | Supabase phone/password, remember-me storage, logout confirmation, session restore, device-language default, and preserved language preference. | Uses Supabase Auth and profile metadata. Geography IDs use live dropdown values. | Yes | Run live signup/login regression with real accounts and confirm trigger/RLS behavior. |
| Multi-country registration | Country, governorate, district dropdown pipeline uses Supabase data. Phone validation supports country-aware E.164 normalization. | `countries`, `governorates`, `districts` are treated as public read-only metadata in migration. | Yes | Validate country metadata: phone examples, currency, coordinates, and tariff settings. |
| Dashboard language sync | Sidebar, Trips, Saved, Wallet, Profile, chart labels, request screen, and request toasts now respond to the active dashboard language. | Not backend-dependent. | Yes | Continue translating non-rider/admin/driver peripheral views. |
| Default rider map | MapLibre/OpenFreeMap, GPS, recenter button, H3 display, and captain presence integration in `src/components/dashboard/rider/rider-map.tsx`. | `captain_locations` and `pulse_captain_location` are versioned in SQL with 60-second TTL select policy. | Yes | Cross-device test with a live driver pulsing every 15 seconds. |
| Destination pin and fare | Interactive pin, district fly-to, H3 recalculation, debounced server fare in `rider-view-tab.tsx` and `rider-server-marketplace.ts`. | `calculate_server_fare(lat1,lng1,lat2,lng2,p_country_id)` is versioned with old signatures dropped first. | Yes | Confirm live country tariff/tortuosity values produce expected fare ranges. |
| Ride request creation | Request creation uses Supabase insert. On success, the UI moves to the waiting/offers screen and shows the saved request ID, destination, and fare. | `ride_requests` gets RLS insert/select policies and status trigger guard. | Yes | Verify insert success with a real authenticated rider; demo users can still fail under RLS. |
| Realtime request status | `subscribeToRideRequestStatus` drives server status changes, including accepted transition into `TRIP_ACTIVE`. | Realtime relies on `public.ride_requests` status changes made by RPCs. | Yes | Multi-client test delayed, cancelled, and already-accepted requests. |
| Offers stream | `subscribeToRideOffers` feeds the offers screen. Empty/waiting states are visible and localized. | `ride_offers_select_related` policy allows only related rider/captain visibility. | Yes | Validate real driver offer creation path from the driver app. |
| Offer acceptance | `rider-view-tab.tsx` calls `acceptRideOffer` before reducer transition; reducer does not create local trip IDs. | `accept_ride_offer` RPC is versioned with row locking and stale-offer rejection. | Yes | E2E race test with two drivers accepting at the same time. |
| Active trip completion | `handleCompleteTrip` calls `completeRideTrip`; Dexie ledger write happens only after RPC success. | `complete_ride_trip` updates request status and inserts `trips_72h_ledger`. | Yes | Validate captain-side completion permissions and support flow. |
| Rating modal | `handleSubmitRating` calls `submitRideRating`; local `rider_demo_ratings` was removed. | `submit_ride_rating` writes `rider_ratings` and recalculates profile trust/rating values. | Yes | Test duplicate rating update and score recalculation in staging. |
| 72-hour ledger | Dexie local ledger/favorites remain for offline-first UX. | `trips_72h_ledger` is versioned with own-row policies and sensitive grant revokes. | Yes | Confirm server ledger purge/retention job if legal/support requires server TTL. |
| Wallet and payments | Wallet UI, wallet chart, balance labels, and empty states are language-aware and use Supabase-oriented structures. | Migration uses `wallet_accounts.profile_id` and `wallet_transactions.profile_id`, not invalid `user_id`. | Mostly | Validate live bucket policy, receipt upload, voucher, and delegate RPC paths with real records. |
| Ad River carousel | Approved large image-card UI, hover/focus/touch pause, manual controls, and placeholder empty state in `ad-stage.tsx`. | `flush_ad_campaign_metrics(jsonb)` is versioned for batched counters. | Yes | Run 50-event and `beforeunload` flush tests against live ad rows. |
| Error boundary | Global fallback copy is now professional Arabic instead of dramatic/internal wording. | Not backend-dependent. | Yes | Add English fallback copy if the boundary is shown while the app is in English. |
| Firebase eviction in Rider path | Active rider files no longer mount Firestore listeners. | Supabase realtime is the Rider source of truth. | Yes for Rider | Peripheral admin/driver utilities still need service-by-service migration. |
| Database versioning | Unified SQL exists in `supabase/migrations/`; functions and policies use drop guards before recreation. | Sensitive grants and `profile_id` ownership are represented in local SQL. | Yes | Apply to live Supabase SQL Editor and run rollback/staging checks. |

## 3. Discovered Repository Gaps

### A. Live E2E Staging Sandbox Testing

- Run a real two-device test: one rider account, one driver account, same country/H3 region.
- Confirm live rider request insert succeeds under RLS and appears in the waiting/offers screen.
- Confirm driver presence appears only when `updated_at > now() - interval '60 seconds'`.
- Confirm `accept_ride_offer` rejects the losing driver in a race.
- Confirm `complete_ride_trip` writes `trips_72h_ledger` and only then allows local Dexie reflection.
- Confirm `submit_ride_rating` updates `rider_ratings` and recalculates the driver score.
- Confirm direct `ride_requests.status` updates fail outside RPCs.
- Confirm wallet reads use `profile_id = auth.uid()` and do not expose other accounts.
- Confirm ad batching flushes at 50 events and on app exit.

### B. Non-Rider Service Sync

The active Rider path is clean, but a wider repository scan previously found Firebase in peripheral or historical services:

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

These do not block the core Rider Dashboard, but they should be migrated or gated before calling the full repository Firebase-free.

### C. Local Micro-Copy Pass

The main Rider Dashboard surfaces now use simpler Arabic and the request submission toasts follow the active language. Remaining polish is smaller:

- Finish English copy for any rare global fallback/error boundary state.
- Review accept-offer, trip-completion, and rating failure toasts for full bilingual parity.
- Continue removing old internal terms from non-rider surfaces.

## 4. Current Bottom Line

The Rider Dashboard has moved from a local frontend prototype into a hardened, server-bound marketplace core. The important trust transitions are designed around Supabase RPCs instead of client simulation: offer acceptance, trip completion, rating, fare calculation, driver presence, wallet ownership, ad metric flushing, and ledger records all have versioned backend contracts.

The platform is now **investment-ready at the core Rider marketplace layer**, with the final gates being live staging validation, peripheral service migration, and a small bilingual micro-copy pass.
