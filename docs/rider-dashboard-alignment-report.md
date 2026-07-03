# Rider Dashboard Alignment Report

Date: 2026-07-03

Scope: current Rider Dashboard, Rider auth entry, responsive dashboard layout, MapLibre/OpenFreeMap map, H3 geospatial flow, Supabase fare/request integration, Dexie local ledger/favorites, and the client-approved ad card surface.

## Executive Summary

Frontend/demo alignment: **96%**

Production readiness: **78%**

The Rider Dashboard is now very strong as a frontend experience. It has the seven-state reducer, live MapLibre/OpenFreeMap map, browser GPS with fallback, H3 captain dots, responsive desktop sidebar/mobile bottom nav, Supabase phone/password auth, multi-country registration dropdowns, server fare RPC integration, `ride_requests` insertion, Realtime request-status subscription, Dexie 72-hour ledger, local favorite captains, and a stronger ad carousel with hover pause plus forward/back controls.

The production score is still lower because the trusted marketplace is only partially server-authoritative. Fare quoting and request creation have moved toward Supabase authority, but real captain offers, captain assignment, trip start/end, cancellation, wallet settlement, commission, ad billing, fraud controls, and support-grade ledger sync are not complete yet.

Important ad note: dashboard ads should keep the client-approved large image-card style and current dashboard placement. The latest ad behavior improves interaction only: hover/focus/touch pauses movement, and users can manually scroll forward/back.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 96% | `useReducer` state machine exists with bounded transitions. |
| Rider map experience | 94% | MapLibre/OpenFreeMap renders with live/fallback location and H3 captain dots. |
| Responsive layout | 92% | Desktop has left sidebar; mobile keeps header/bottom nav and no scroll trap. |
| Supabase rider auth | 88% | Phone/password login/signup, remember me, session check, logout dialog, forgot-password support flow, country/governorate/district dropdowns. |
| Multi-country registration | 86% | Countries, governorates, and districts fetch from Supabase; IDs are sent in auth metadata. |
| Server fare authority | 84% | `calculate_server_fare` RPC is called with origin/destination and `p_country_id`; needs live DB/RLS/performance verification. |
| Ride request creation | 78% | Inserts into `public.ride_requests` with rider ID, coords, H3 cells, destination name, fare, country, and `PENDING`. |
| Realtime ride transition | 72% | Subscribes to request row and moves to `RECEIVING_OFFERS`; real offer stream is not complete. |
| Offers and captain selection | 55% | UI exists, but offers are still local/mock after server status. |
| Active trip UI | 82% | ETA, captain/vehicle card, price, H3 movement, and test complete button exist; server trip lifecycle missing. |
| 72-hour ledger | 88% | Dexie stores completed local trip entries and purges expired items. Needs backend sync/rules. |
| Favorite captains vault | 88% | Dexie/local favorite captain storage exists. Needs backend sync only if matching priority depends on it. |
| Ads surface | 86% | Client large-card style preserved; carousel pauses on hover and supports manual navigation. Billing authority remains incomplete. |
| Arabic/UI copy | 72% | Auth visible copy was repaired, but source scan still shows mojibake in rider/dashboard/auth error strings. |
| Backend authority overall | 58% | Auth/fare/request started; offers, trips, wallets, commissions, ads, and admin authority still need backend enforcement. |

## What Is Aligned Now

- **Seven-state reducer:** `src/components/dashboard/rider/rider-state-machine.ts` defines `IDLE_MAP`, `DESTINATION_SELECTION`, `RECEIVING_OFFERS`, `TRIP_ACTIVE`, `RATING_MODAL`, `PURGE_LEDGER`, and `FAVORITE_CAPTAINS`.
- **Bounded transitions:** the reducer blocks ledger/favorites/map transitions during active offer, trip, and rating states.
- **MapLibre/OpenFreeMap:** `src/components/dashboard/rider/rider-map.tsx` renders a keyless free map with no Google visual dependency.
- **Browser location:** the map requests live GPS and falls back to the configured mock/fallback location when unavailable.
- **Official H3 usage:** H3 cells are generated through `h3-js` and attached to fare/request data.
- **Server fare RPC:** `src/components/dashboard/rider/rider-server-marketplace.ts` calls `calculate_server_fare` with `lat1`, `lng1`, `lat2`, `lng2`, and `p_country_id`.
- **Ride request insert:** Rider request creation inserts into `ride_requests` with coordinates, origin/destination H3 cells, Arabic destination address, server fare, country ID, and `PENDING`.
- **Realtime subscription:** the dashboard subscribes to the created request row and transitions when the server status becomes `RECEIVING_OFFERS`.
- **Supabase auth:** signup/login use Supabase Phone + Password and send `role`, `full_name`, `phone`, `country_id`, `governorate_id`, and `district_id`.
- **Session flow:** app startup checks the Supabase session; logout has a confirmation dialog above sidebars/sheets.
- **Responsive UI:** desktop uses a left sidebar and full map surface; mobile keeps the bottom nav and scrolls correctly.
- **Dexie ledger:** completed local trips are written to `riderTripLedger` with purge timestamps.
- **Favorites:** favorite captains use Dexie/local device storage.
- **Ads:** the client-approved large card layout remains; hover/touch/focus pauses movement, and next/previous controls are present.

## Missing Or Partial For Production

- **Real offers are not server-driven yet.** The app can move to `RECEIVING_OFFERS`, but actual captain offers are still local/mock UI data.
- **Captain assignment is not authoritative.** Selecting a captain does not yet call a server RPC/Edge Function to lock assignment.
- **Trip lifecycle is still local.** Start trip, active trip, complete trip, cancellation, disputes, and rating are not server-validated.
- **Active trip tracking is simulated.** H3 captain movement is useful for demo, but real pulsed captain presence is not integrated.
- **Ledger is not support-grade yet.** Dexie is good for offline UX, but production needs sync, conflict handling, and server-side support/legal rules.
- **Wallet/commission settlement is not protected.** Wallet balances, captain payments, delegate commissions, and platform fees still need backend authority.
- **Ad billing is not authoritative.** The ad UI is much better, but impressions/clicks/budget consumption still need one server-protected batching path.
- **Legacy Firebase remains.** Several hooks and dashboard surfaces still use Firestore/Firebase, creating permission warnings and split backend authority.
- **Arabic copy is not fully clean.** Visible auth copy is fixed, but scans still show mojibake in `rider-view-tab.tsx`, `rider-map.tsx`, `supabase-auth.ts`, old `login-page.tsx`, and other shared strings.
- **Supabase RLS/triggers need live verification.** Auth profile creation, foreign keys, `ride_requests`, Realtime, and fare RPC must be tested against live policies.
- **Geospatial data needs certification.** Jordan local district anchors and any future country anchors should be validated against client-approved or official GIS data.

## Security And Backend Authority Gaps

These items must not remain trusted only on the frontend:

- Real ride offer creation and captain eligibility.
- Captain assignment and prevention of double-acceptance.
- Trip start, complete, cancel, no-show, and dispute state.
- Final fare locking and fare adjustment rules.
- Wallet balances, payment events, payouts, and commission settlement.
- Rider/captain trust score penalties and anti-cheat rules.
- Ad impression/click counters, billing, campaign budget, and fraud filtering.
- 72-hour ledger records if used for support, disputes, or accounting.
- Favorite captains if they affect matching priority.
- Admin kill switch, role permissions, moderation, and audit logging.

## Compliance Gaps

- **SC55 zero-cost:** map and H3 flow are aligned, but Firestore/Firebase remnants still create cost and permission-noise risk.
- **Offline-first:** Dexie is used for ledger/favorites, but server-created ride requests need offline queue/retry behavior.
- **No paid Google APIs:** Rider/Driver map flow is clean; continue scanning shared/legacy tools before production.
- **Pulsed tracking:** visual pulse exists, but real captain pulsed H3 updates are not yet wired.
- **Ad River batching:** UI behavior is aligned; production billing/batching is not final.

## Production Action Plan

1. **Finish Supabase ride lifecycle authority**
   - Add server RPC/Edge Functions for create request, receive offer, select captain, cancel request, start trip, complete trip, and rate trip.
   - Keep the reducer, but feed it trusted server state.

2. **Build real offers and captain availability**
   - Add captain presence by H3 cell with low-frequency pulsed updates.
   - Subscribe to eligible `ride_offers` instead of local mock offers.
   - Prevent multiple active requests per rider and multiple accepted captains per request.

3. **Harden fare and wallet authority**
   - Keep `calculate_server_fare` as the only source for fare preview/final quote.
   - Store signed quote inputs and final fare.
   - Move wallet, payout, commission, and cancellation penalties fully server-side.

4. **Complete RLS and database verification**
   - Test `countries`, `governorates`, `districts`, `profiles`, `ride_requests`, Realtime, and fare RPC with real authenticated rider accounts.
   - Confirm policies block cross-user reads/writes.

5. **Remove or isolate Firebase**
   - Decide which Firebase paths are legacy/demo only.
   - Migrate production Rider dependencies to Supabase or hard-gate them outside production.
   - Eliminate permission-warning noise.

6. **Clean Arabic and old copy**
   - Replace all mojibake strings in Rider/auth/dashboard/error paths.
   - Keep Arabic simple and direct.
   - Add a small source scan check for `Ø`, `Ù`, `Ã`, `Â`, and replacement characters.

7. **Productionize ads**
   - Keep the large image-card layout and hover pause/manual scroll.
   - Implement protected ad metrics batching and server-side billing counters.
   - Keep local favorite/save behavior for UX, but sync when required.

8. **Validate geospatial data**
   - Certify district coordinates per supported country.
   - Add tests for fare ranges across common routes.
   - Decide whether OSRM is required for production-grade distance, with Haversine/H3 fallback.

9. **Mobile/desktop QA pass**
   - Test GPS allow/deny/unavailable.
   - Test slow Supabase network, failed RPC, failed insert, failed Realtime, logout, session restore, and mobile scrolling.
   - Verify sidebars, dialogs, map overlays, ads, and bottom nav stacking.

## Current Bottom Line

The Rider Dashboard is **very close for a frontend demo and client walkthrough**.

It is **not fully production-ready as a trusted marketplace** until real offers, trip lifecycle, wallet/commission, ad billing, and RLS-backed authority are complete.

Recommended next milestone: **server-authoritative offers and captain assignment**, followed by **trip lifecycle and wallet settlement**.
