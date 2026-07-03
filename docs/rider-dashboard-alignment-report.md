# Rider Dashboard Alignment Report

Date: 2026-07-03

Scope: current Rider Dashboard, Rider authentication entry flow, Jordan-first geospatial flow, local ads surface, and production readiness compared with the zero-cost delivery plan and SC55 offline-first direction.

## Executive Summary

Frontend/local prototype alignment: **94%**

Production readiness: **72%**

The Rider Dashboard is now strong as a local Jordan-first prototype. It has the seven-state reducer, MapLibre/OpenFreeMap map, live browser GPS with Amman fallback, H3-based captain dots, Jordan governorate/district destination data, local fare guide calculation, local mock offers, active-trip animation, rating modal, Dexie 72-hour ledger insertion, and Dexie/local favorite captain storage.

The production score is lower because the trusted business layer is not finished yet. Real ride requests, captain assignment, final fare authority, wallets, commission settlement, ad billing, fraud checks, and operational kill switches still need backend enforcement before launch.

Rider authentication is now much better aligned: the app uses Supabase Phone + Password for rider signup/login, fetches governorates and districts from Supabase, sends raw database IDs in auth metadata, supports remember me, forgot password, and logout confirmation. This helps production readiness, but the database trigger/RLS setup still must be verified on the live Supabase project.

Important ad note: dashboard ads should keep the client-approved large image-card style and current dashboard placement. Do not move them into a fixed bottom strip unless the client explicitly approves that visual change.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 96% | `useReducer` state machine exists with bounded transitions. |
| Local ride lifecycle | 94% | Request, waiting, offers, active trip, complete trip, rating, and return-to-map work locally. |
| Rider auth entry | 86% | Supabase phone/password, remember me, forgot password, logout confirmation, and live location dropdowns exist. Needs live trigger/RLS verification. |
| Jordan destination data | 90% | 12 governorates and many districts are present locally for ride flow; production needs official coordinate validation. |
| GPS and fallback | 95% | Browser GPS is used when allowed; fallback is Amman, Jordan. |
| MapLibre/OpenFreeMap | 92% | Keyless map renders with OpenFreeMap and no paid map key. Arabic map labels depend on external tile/style rendering. |
| H3 geospatial logic | 94% | Official `h3-js` is used for cells, grid disks, and cell distance support. |
| Fare guide calculation | 90% | Uses rider/current fallback location, Haversine, H3, and tortuosity. Still not server-authoritative. |
| Active trip UI | 88% | ETA, captain, vehicle, price, distance, and animated captain movement exist. Needs route/progress polish. |
| 72-hour ledger | 90% | Demo completed trips are inserted into Dexie with purge countdown support. |
| Favorite captains vault | 88% | Local favorite captains are stored with Dexie/local storage. Needs server sync rules later. |
| Ads surface | 82% | Client card style is preserved; batching and billing authority are still incomplete. |
| Arabic/UI copy | 82% | New rider/auth surfaces are simpler, but older shared/dashboard strings still need a final cleanup pass. |
| Backend authority | 45% | Auth started; ride, pricing, wallet, ads, and settlement authority are still deferred. |

## What Is Aligned Now

- **State machine:** `src/components/dashboard/rider/rider-state-machine.ts` defines the seven screens: `IDLE_MAP`, `DESTINATION_SELECTION`, `RECEIVING_OFFERS`, `TRIP_ACTIVE`, `RATING_MODAL`, `PURGE_LEDGER`, and `FAVORITE_CAPTAINS`.
- **Bounded transitions:** request flow cannot jump into ledger/favorites while offers, trip, or rating states are active.
- **Mock offer timer:** `SEND_REQUEST` moves into waiting state, then local fake captain offers appear after the timer.
- **MapLibre map:** `src/components/dashboard/rider/rider-map.tsx` renders a real keyless map with OpenFreeMap.
- **Live location:** the rider map watches browser geolocation and reports the rider location back to the dashboard.
- **Amman fallback:** fallback location is Amman, Jordan, not Cairo.
- **H3 captain dots:** nearby captain dots are generated through official H3 utilities.
- **Jordan ride destinations:** `src/components/dashboard/rider/jordan-destinations.ts` contains local Jordan governorate/district anchors for the ride flow.
- **Live fare guide:** selecting a district calculates a local guide fare from current/fallback origin to destination anchor.
- **Active trip animation:** selected fake captain movement is animated toward the rider location.
- **Dexie ledger:** completing a mock trip inserts it into `riderTripLedger` so the 72-hour ledger can show it immediately.
- **Favorite captain vault:** favorite captain data uses Dexie/local device storage.
- **Rider auth:** Supabase phone/password signup/login is implemented, with live governorate/district dropdowns and integer IDs sent in auth metadata.
- **Auth UX:** remember me, forgot password, logout confirmation, random test data, and loading during location fetch are implemented.
- **Ads:** the client-approved large image-card ads are still used.

## Missing Or Partial For Production

- **Ride requests are still local/mock.** There is no production Supabase ride request, offer, acceptance, cancellation, or completion lifecycle yet.
- **Fare is not authoritative.** The frontend quote is useful for UX, but production must calculate or sign the final fare on the backend.
- **Captain discovery is fake.** H3 captain dots and offers are local demo data, not real captain presence or availability.
- **Trip completion is trusted on the client.** A user can complete a mock trip locally; production needs backend trip state validation.
- **Wallet and commission logic are not protected.** Any wallet, payout, commission, or settlement value must move behind server authority.
- **Ad metrics are not production-safe.** The current ad surface logs locally and can flush to Firestore for non-demo ads, but production needs one audited batching and billing path.
- **Legacy Firebase paths still exist.** Some dashboard/ad hooks still use Firebase/Firestore. These should be removed, isolated, or replaced with Supabase authority during the backend phase.
- **RLS and database triggers need live verification.** Rider auth depends on Supabase project configuration, phone provider settings, `on_auth_user_created`, profile serial sequence, and policies.
- **Official district coordinates are not certified.** The Jordan anchors should be checked against a client-approved or official GIS source before launch.
- **Arabic cleanup is not fully finished.** New rider/auth copy is simpler, but older shared surfaces still need a final scan.
- **Map bundle is heavy.** MapLibre should be lazy-loaded/code-split for mobile production performance.

## Security And Backend Authority Gaps

These items must not remain trusted only on the frontend:

- Final fare calculation and any price override.
- Ride request creation, offer eligibility, captain selection, cancellation, and completion.
- Captain location/presence and H3 availability.
- Rider/captain wallet balances.
- Commission settlement and payout records.
- 72-hour ledger records that affect support, disputes, or accounting.
- Favorite captain records if they affect future matching priority.
- Ad impressions, clicks, billing counters, and campaign budget consumption.
- Admin kill switch, role permissions, and moderation actions.
- Registration profile creation and role assignment beyond Supabase auth metadata.

## Production Action Plan

1. **Verify Supabase auth database setup**
   - Apply/confirm the `profile_serial_seq` repair.
   - Test `on_auth_user_created` with real phone signup.
   - Confirm `governorate_id` and `district_id` foreign keys accept the live IDs.
   - Add/verify RLS policies for profiles and public location tables.

2. **Build backend ride authority**
   - Add `ride_requests`, `ride_offers`, `trips`, and trip events.
   - Use RPC/Edge Functions for create request, accept offer, start trip, complete trip, and cancel trip.
   - Keep the frontend reducer, but make it consume trusted backend state.

3. **Move fare authority server-side**
   - Keep the frontend H3/Haversine quote as a preview.
   - Recalculate or sign fare quotes on the backend.
   - Store quote inputs: origin cell, destination cell, distance, tortuosity, timestamp, and final fare.

4. **Replace fake captain presence**
   - Add real captain availability and pulsed H3 updates.
   - Use low-frequency updates, not expensive live GPS streaming.
   - Show only captains eligible for the rider district and request type.

5. **Harden ads**
   - Keep the current large image-card layout.
   - Replace scattered local/Firestore metric handling with one production batching service.
   - Enforce the 50-event batching rule and protect billing counters server-side.

6. **Complete ledger and favorites sync**
   - Keep Dexie for offline UX.
   - Sync completed trips and favorites to backend when online.
   - Add conflict handling and 72-hour purge behavior that matches support/legal rules.

7. **Remove or isolate legacy Firebase dependencies**
   - Audit dashboard hooks that still read/write Firestore.
   - Either migrate them to Supabase or gate them clearly as demo-only.
   - Avoid permission-warning noise in production.

8. **Validate Jordan geospatial data**
   - Review every governorate/district anchor with official or client-approved data.
   - Version the dataset.
   - Add tests for distance/fare ranges across major Jordan routes.

9. **Polish UI and Arabic copy**
   - Final scan for mojibake/heavy wording.
   - Keep Arabic direct and simple.
   - Verify mobile layout, bottom nav, sidebars, ads, modals, and map overlays.

10. **Production QA**
    - Run mobile and desktop browser flows.
    - Test GPS allow/deny/unavailable.
    - Test slow network, Supabase auth failures, OTP reset, logout, and session persistence.
    - Add monitoring for auth errors, trigger failures, ride state failures, and ad metric flush failures.

## Current Bottom Line

The Rider Dashboard is **almost complete as a frontend local demo** and ready to be shown as the Jordan-first rider experience.

It is **not production-ready yet as a trusted marketplace system**. The next milestone should be backend authority: Supabase/RLS/functions for auth profile reliability, ride lifecycle, pricing, captain presence, ledger sync, wallet/commission, and ad metrics.

