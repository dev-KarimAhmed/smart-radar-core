# Rider Dashboard Alignment Report

Date: 2026-07-04

Scope: current Rider Dashboard codebase, rider state machine, Supabase auth/profile/geography/fare/request/offers/presence integration, MapLibre/OpenFreeMap map flow, Dexie local storage, ad carousel, and remaining production gaps against the finalized Rider business specification.

Reference sources:

- `c:\Users\karee\Downloads\rider business.docx`
- Current repository scan under `src/components/dashboard`, `src/hooks`, `src/lib`, `src/core`, and related rider/driver workflow files.

## 1. Executive Summary And Maturity Scores

Frontend/demo alignment: **96%**

Production readiness: **74%**

The Rider Dashboard is close to the requested product experience. The UI now has a real MapLibre/OpenFreeMap map, device GPS, H3 resolution 9 cells, dynamic country/governorate/district data, destination pin movement, server fare RPC, Supabase ride request insertion, realtime request/offers subscription helpers, live captain presence lookup with TTL pruning, Supabase phone/password authentication, profile editing, Dexie ledger/favorites, and the approved large ad-card carousel with pause/manual controls.

The gap is production trust. Several critical marketplace actions are still local, simulated, Firestore-backed, or only partially Supabase-backed. The largest blockers are offer acceptance, trip lifecycle, driver offer submission, rating/trust-score mutation, wallet/time-bundle accounting, ad metric billing, and legacy Firebase listeners that still run in rider/driver operations.

| Area | Demo Alignment | Production Readiness | Current Status |
| --- | ---: | ---: | --- |
| Auth Portal | 92% | 82% | Supabase phone/password, remember me, session check, dynamic metadata. Needs final RLS/trigger verification and copy cleanup. |
| Default Map View | 94% | 80% | MapLibre/OpenFreeMap, GPS, H3, captain presence query. Needs precise live captain schema and country filtering. |
| Destination Pin Panel | 93% | 86% | District fly-to, centered pin, H3 recalculation, debounced fare RPC. Good frontend state. |
| Pricing And Realtime Offers | 86% | 62% | Request insert and offer subscription exist, but offer acceptance is not server-locked. |
| Active Trip Tracking | 74% | 45% | UI exists, driver pulse hook exists, but trip start/complete/cancel remain mostly local or legacy. |
| Rating Modal | 70% | 38% | Local rating UX exists; no server-side trust-score mutation path is complete. |
| 72-Hour Ledger | 88% | 68% | Dexie TTL ledger exists; support-grade server sync is missing. |
| Favorites Vault | 90% | 75% | Local Dexie/device cache aligns with zero-cost goal; backend sync depends on matching rules. |
| Ad River Carousel | 88% | 58% | Visual and interaction behavior are aligned; metrics still do not flush to Supabase billing counters. |
| Firebase Removal | 55% | 35% | Rider/driver hooks still contain active Firestore listeners and Firebase mutation paths. |
| Arabic Copy Quality | 72% | 60% | Many visible strings are simpler, but mojibake remains in active source files. |

## 2. Compliance Gain Matrix

| Module | Evidence In Code | Backend Binding | Mock-Free Status | Assessment |
| --- | --- | --- | --- | --- |
| MapLibre/OpenFreeMap map | `src/components/dashboard/rider/rider-map.tsx` | Keyless map tiles | Mostly mock-free | Aligned with zero-cost map requirement. No Google Maps dependency found in active rider map flow. |
| H3 geospatial cells | `src/components/dashboard/rider-view-tab.tsx`, `src/core/logic/geospatial-kernel.ts` | Local `h3-js` | Complete | H3 resolution 9 is used for rider/destination cells and request payloads. |
| Server fare preview | `src/components/dashboard/rider/rider-server-marketplace.ts` | `calculate_server_fare` RPC | Complete for preview | Fare preview now calls Supabase RPC with origin, destination, and `p_country_id`. |
| Ride request creation | `rider-server-marketplace.ts` | `public.ride_requests` insert | Mostly complete | Inserts rider ID, coordinates, H3 cells, country ID, Arabic destination label, fare, and `PENDING`. |
| Realtime request status | `rider-server-marketplace.ts` | Supabase realtime on `ride_requests` | Partial | Subscription exists, but UI still has shortcuts around request/offers flow. |
| Realtime offers stream | `rider-server-marketplace.ts`, `rider-view-tab.tsx` | Supabase realtime on `ride_offers` | Partial | Reads live offers, but selecting an offer does not call a server lock/accept RPC. |
| Captain presence display | `fetchAvailableCaptainPresence`, `use-captain-location-pulse.ts` | `captain_locations`, `pulse_captain_location` RPC | Mostly complete | Driver pulse every 15s and rider TTL filter exist. Schema still needs exact country/coordinate support. |
| Auth signup/login | `src/lib/supabase-auth.ts`, registration hook | Supabase Auth + metadata | Mostly complete | Phone/password and cascading geography metadata exist. Needs final trigger/RLS validation. |
| Profile editing | `src/components/dashboard/profile-tab.tsx` | Supabase `profiles` | Mostly complete | Reads/updates profile fields. Save requires correct RLS policies. |
| 72-hour ledger | `src/lib/dexie-db.ts`, rider dashboard flow | Dexie IndexedDB | Complete for local UX | Meets local TTL storage direction; not yet server support-grade. |
| Favorites vault | Dexie/local storage favorite captain/ad paths | Dexie/local storage | Complete for local UX | Aligns with zero-network favorite cache requirement. |
| Ad card UI | `src/components/dashboard/ad-stage.tsx` | Supabase `ad_campaigns` fetch | Partial | Visual and empty-state behavior are aligned. Billing/event flush is not production complete. |

## 3. Remaining Production Gaps

### A. Local Or Mock Logic Still Present

- `src/components/dashboard/rider/rider-state-machine.ts`
  - `SELECT_OFFER` creates `local-trip-${Date.now()}` instead of calling a server authority endpoint.
  - `COMPLETE_TRIP` moves to rating locally.
  - `SUBMIT_RATING` writes to `localStorage` under `rider_demo_ratings`.

- `src/components/dashboard/rider-view-tab.tsx`
  - Completed mock trips are inserted directly into Dexie for local UX.
  - The UI can move into receiving/offers flow before all transitions are fully server-owned.
  - Offer timeout/cancel behavior exists client-side; production should be backed by a server job or RPC.

- `src/components/dashboard/rider/request-ride-modal.tsx`
  - Legacy local destination arrays still exist. If this component is still reachable, it conflicts with the dynamic country-aware destination flow.

- `src/hooks/use-registration.tsx`
  - Random test data helper remains useful for development, but should be gated behind a development/test flag before production.

- `src/core/contracts/cloud-bridge.ts`
  - Contains simulated cloud behavior and Firebase-oriented command paths. This must not remain in the production marketplace path.

### B. Server Authority Still Missing

The following actions must be moved behind Supabase RPCs, Edge Functions, or database transactions:

1. **Accept offer**
   - Needed RPC: `accept_ride_offer`.
   - Must atomically lock one offer, reject stale offers, and prevent double acceptance.

2. **Trip lifecycle**
   - Needed server actions: start trip, arrive, complete trip, cancel, no-show, dispute, rate.
   - Frontend reducer should consume trusted server state, not local transitions.

3. **Driver bid creation**
   - Driver offer submission still depends on legacy Firestore/cloud bridge flows.
   - Driver bids should insert into `public.ride_offers` through a server-validated path.

4. **Rating and trust score**
   - Rating modal currently does not update driver trust score through the database.
   - Trust-score changes must be server-calculated and auditable.

5. **Wallet and time-bundle revenue**
   - Time bundle purchase, balance changes, payouts, refunds, and penalties must use server-side ledger transactions.
   - Client-side wallet mutation paths are not production-safe.

6. **Ad metrics and billing**
   - The UI logs events locally, but the required 50-event Supabase flush to `public.ad_campaigns` counters is not complete.
   - App-exit flush and server-side budget protection are still needed.

### C. Legacy Firebase / Firestore Still Active

These files still contain active Firebase/Firestore reads, writes, listeners, or cloud-bridge dependencies that can create permission noise and split backend authority:

- `src/hooks/rider/use-rider-trip-listener.ts`
- `src/hooks/use-rider-operations.tsx`
- `src/hooks/driver/use-driver-radar.ts`
- `src/hooks/driver/use-driver-transactions.ts`
- `src/hooks/use-driver-operations.tsx`
- `src/hooks/use-sovereign-wallet.ts`
- `src/hooks/use-promo-stream.ts`
- `src/lib/ad-cache-sentry.ts`
- `src/lib/audit-logger.ts`
- `src/core/contracts/cloud-bridge.ts`
- `src/lib/push-notifications.ts`
- `src/lib/ephemeral-messages.ts`
- `src/hooks/use-market-pulse.ts`
- `src/hooks/use-sovereign-controls.ts`
- `src/hooks/use-sovereign-fleet.ts`

Priority cleanup: remove `useRiderTripListener` from the rider production path first, then migrate driver transactions/offers, then wallet/ad metrics.

### D. Supabase Schema And Query Issues To Verify

- `captain_locations` must support the exact rider map requirements:
  - `captain_id`
  - `country_id`
  - `h3_cell`
  - `lat`
  - `lng`
  - `is_available`
  - `updated_at`
  - optional display fields such as captain name, vehicle, rating, ETA.

- Current frontend has fallback handling for alternate column names and H3 center-derived coordinates. That is useful during migration, but production should use a fixed schema.

- `ad_campaigns.status` query should match the real enum values exactly. A previous lowercase `active` path can fail if the enum only accepts `ACTIVE`.

- RLS must be tested with real rider accounts for:
  - `profiles`
  - `countries`
  - `governorates`
  - `districts`
  - `ride_requests`
  - `ride_offers`
  - `captain_locations`
  - `ad_campaigns`
  - wallet/time-bundle tables.

### E. Mojibake And Copy Cleanup Required

The following active or near-active files still contain corrupted Arabic text, placeholder question marks, or old heavy wording:

- `src/components/dashboard/rider-view-tab.tsx`
- `src/components/dashboard/rider/rider-state-machine.ts`
- `src/components/dashboard/rider/rider-map.tsx`
- `src/components/dashboard/rider/offer-gallery.tsx`
- `src/components/dashboard/rider/request-ride-modal.tsx`
- `src/components/dashboard/ad-stage.tsx`
- `src/components/dashboard/index.tsx`
- `src/components/dashboard/wallet-tab.tsx`
- `src/components/dashboard/history-tab.tsx`
- `src/lib/supabase-auth.ts`
- `src/lib/ad-cache-sentry.ts`
- `src/lib/dexie-db.ts`
- `src/hooks/driver/use-driver-transactions.ts`
- `src/hooks/rider/use-rider-trip-listener.ts`

Replace corrupted sequences such as `Ø`, `Ù`, `Ã`, `Â`, and `????` with simple Modern Standard Arabic. Avoid dramatic terms like sovereign, atomic, constitutional, and similar wording in user-facing screens.

## 4. Priority Production Punch-List

1. **Remove legacy rider Firestore listener from production flow**
   - Stop mounting `useRiderTripListener` for the Supabase rider dashboard.
   - Let `RiderViewTab` and its Supabase subscriptions own rider request state.

2. **Implement server-authoritative offer acceptance**
   - Add `accept_ride_offer` RPC/Edge Function.
   - Update reducer `SELECT_OFFER` to call it.
   - Transition to active trip only after the server confirms acceptance.

3. **Migrate driver bidding and trip lifecycle**
   - Replace Firestore driver transaction hooks with Supabase tables/RPCs.
   - Add server events for start, arrive, complete, cancel, no-show, dispute, and rate.

4. **Harden wallet/time-bundle revenue**
   - Move every balance or bundle mutation to Supabase ledger functions.
   - Remove client-controlled wallet updates and Firestore balance writes.

5. **Finish ad metric batching**
   - Keep the approved large ad cards.
   - Implement 50-event batching to Supabase counters.
   - Add page-exit flush and server-side budget protection.

6. **Finalize captain presence schema**
   - Ensure drivers pulse every 15 seconds through `pulse_captain_location`.
   - Ensure rider map filters by active country/H3 and hides rows older than 60 seconds.
   - Remove fallback-only presence assumptions once schema is stable.

7. **Clean Arabic copy and encoding**
   - Run a dedicated pass on all dashboard/auth/rider files listed above.
   - Add a small source scan check for mojibake patterns before delivery.

8. **Verify RLS with real accounts**
   - Test signup, profile edit, fare RPC, ride request insert, realtime offers, captain presence, empty ads, empty wallet, empty history, and logout/session restore.

## Current Bottom Line

The Rider Dashboard is **strong enough for a client walkthrough and very close as a frontend product prototype**.

It is **not yet a trusted production marketplace** because key money, offer, trip, rating, ad-billing, and driver lifecycle decisions are not fully server-authoritative, and legacy Firebase paths still exist in active rider/driver operations.

Recommended next milestone: **remove legacy Firestore rider/driver trip paths, then implement `accept_ride_offer` and server-owned trip lifecycle events.**
