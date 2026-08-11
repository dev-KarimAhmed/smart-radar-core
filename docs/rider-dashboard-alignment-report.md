# Rider Dashboard Alignment Report

Date: 2026-07-07

Scope: Rider Dashboard, Supabase auth/profile flow, MapLibre/OpenFreeMap map, H3 destination pin, server fare, ride request creation, realtime offers, rider offer acceptance, trip state transition, Dexie ledger, favorites, ads, and current production gaps.

## Executive Summary

Frontend/demo alignment: **98%**

Repository backend-contract readiness: **94%**

Live production readiness: **88%**

The Rider Dashboard is very close as a user-facing product experience. The rider can authenticate, load country/governorate/district data, see a MapLibre/OpenFreeMap map, choose a destination with a centered pin, calculate server fare, create a `ride_requests` row, wait for realtime `ride_offers`, cancel during search, and attempt server-authoritative offer acceptance.

The current production gap is not the main UI. It is the live marketplace handoff after a captain sends an offer. Recent testing exposed live database constraints and state mismatches in `ride_offers` and `accept_ride_offer`. The repo now includes corrective migrations:

- `supabase/migrations/20260707_submit_ride_offer_rpc.sql`
- `supabase/migrations/20260707_accept_ride_offer_sync.sql`

These must be applied and verified on the live Supabase project before the rider flow can be considered production-ready.

## Alignment By Area

| Area | Alignment | Status | Remaining Need |
| --- | ---: | --- | --- |
| Auth/session | 92% | Supabase phone/password, remember me, logout, session restore, country metadata. | Continue real account regression tests. |
| Multi-country data | 90% | Countries, governorates, districts, currency and IDs are dynamic. | Validate all production geography rows and phone/currency metadata. |
| Map and GPS | 95% | MapLibre/OpenFreeMap, browser GPS, recenter control, H3 R9 cells. | Continue mobile map overlay polish. |
| Destination pin | 94% | District fly-to, centered pin, dynamic H3 and fare recalculation. | Validate coordinates for all live districts. |
| Server fare | 88% | `calculate_server_fare` is used. | Client docs still mention OSRM; decide whether Haversine/tortuosity is accepted or OSRM must be added. |
| Ride request creation | 92% | Inserts `ride_requests` with rider, coordinates, H3 cells, country, destination and fare. | Live RLS and schema validation. |
| Search/cancel state | 92% | Search state and cancel button exist. | Align timeout with final business rule, 120s vs 180s. |
| Realtime offers | 88% | Rider subscribes to `ride_offers` and shows incoming captain bids. | Verify after `submit_ride_offer` migration is applied. |
| Offer acceptance | 78% live / 94% repo | Frontend calls `accept_ride_offer`; new migration hardens server accept and updates winning/losing offers. | Apply `20260707_accept_ride_offer_sync.sql` and test rider accept to captain active trip. |
| Active trip | 84% | Reducer can move to active trip from trusted server status. | Needs live accepted-request proof and more support states. |
| Trip completion | 88% | `complete_ride_trip` exists and Dexie writes happen after server success. | Test with real accepted trip. |
| Rating | 88% | `submit_ride_rating` exists. | Test duplicate rating and trust score update. |
| History/ledger | 82% | Dexie 72-hour ledger exists. | User history should show completed trips only after server completion; add clear pending/active request screen if needed. |
| Favorites | 90% | Local favorite captains/ads are device-local. | Sync only if matching priority needs backend authority. |
| Ads | 90% | Large image-card style, pause on hover/touch, manual controls, empty placeholder. | Test 50-event flush and live ad RLS. |
| Arabic/English | 80% | Many screens translate, but some strings still mix language or have mojibake. | Finish i18n pass in rider request/offer/history/wallet screens. |

## What Is Aligned Now

- Rider flow no longer depends on Google Maps or paid Places/Geocoding.
- H3 resolution 9 is used for rider origin, destination, captain presence and request matching.
- Destination selection is data-driven by country/governorate/district.
- Fare is fetched from Supabase RPC, not hardcoded in the UI.
- Ride requests are saved to Supabase.
- Rider can cancel a search/request.
- Rider sees captain offers from `ride_offers`.
- Rider acceptance calls `accept_ride_offer`, not a local mock trip transition.
- Active trip state waits for server request status updates.
- Trip completion and rating are server RPC paths.
- Dexie is kept for the local 72-hour UX ledger.
- Ads preserve the client-approved large card style.

## Current Live Issues

1. **Offer acceptance failed in live test.** The rider saw the captain offer, but `accept_ride_offer` rejected it. A new replacement migration was created to update `ride_requests.status`, `accepted_offer_id`, `accepted_captain_id`, `final_fare`, and winning/losing offer statuses.
2. **Captain offer insertion exposed schema drift.** Live `ride_offers` required `eta_minutes`. The `submit_ride_offer` migration now supplies `eta_minutes = 5`.
3. **Trip history is not expected to show a new request immediately.** It should show completed trips after `complete_ride_trip`. The UI should add a clearer active/pending request area for “current request” separate from history.
4. **Captain active trip depends on offer status realtime.** Once `accept_ride_offer` updates the winning offer to `ACCEPTED`, the captain dashboard should receive it.
5. **Some toasts remain Arabic while the dashboard can be English.** Toast copy should use the active dashboard language.

## Production Action Plan

1. Apply `20260707_submit_ride_offer_rpc.sql` on Supabase.
2. Apply `20260707_accept_ride_offer_sync.sql` on Supabase.
3. Hard refresh rider and captain clients.
4. Run E2E: rider request, captain offer, rider accept, captain active trip, arrived, start, complete, rider rating.
5. Verify `ride_requests.status` changes: `PENDING` or `RECEIVING_OFFERS` -> `ACCEPTED` -> `TRIP_ACTIVE` -> `COMPLETED`.
6. Verify `ride_offers.status`: winning offer becomes `ACCEPTED`, losing offers become `REJECTED`.
7. Add a current active-request section so riders can see pending/accepted requests separately from completed history.
8. Finish language sync for offer/search/cancel/accept toasts.
9. Decide OSRM vs current Haversine/tortuosity server pricing before final launch.

## Bottom Line

The Rider Dashboard is **excellent as a frontend and close as a backend-bound marketplace flow**, but it is not fully production-proven until the two latest SQL migrations are applied and the real rider/captain accept handoff passes live testing.
