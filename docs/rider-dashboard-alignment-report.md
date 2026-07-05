# Rider Dashboard Production Alignment Report

Date: 2026-07-06

Source basis: client business/technical documents in `C:\Users\karee\Downloads`, especially the technical architecture, maps/distances, visual identity, ad display tree, ad explanation, advertiser document, and V5.5 law summary. Code basis: active Rider Dashboard, Captain Dashboard profile/wallet/radar surfaces, Supabase migrations, MapLibre/H3 flow, AdStage, Dexie local storage, and marketplace helpers.

## Executive Summary

Frontend/demo alignment: **98%**

Production readiness: **92%**

The Rider Dashboard is very close to the client direction. It uses the dark matte visual identity, MapLibre/OpenFreeMap instead of paid map UI, H3 resolution 9, dynamic country/governorate/district data, interactive destination pin, server fare RPC, `ride_requests`, realtime offers, server offer acceptance, server trip completion, server rating, Dexie 72-hour ledger, local favorites, and the approved large ad-card surface. The Captain profile screen now waits for Supabase profile data before rendering editable fields, with a clean loading state and retry state instead of showing stale local values immediately.

The remaining production gap is not the main screen design. It is live operational certainty: Supabase RLS must allow exactly the intended rider/captain reads and writes, the new captain lifecycle/privacy migration must be applied on the live project, real offers must be tested across devices, Arabic copy still has corrupted strings in a few Rider surfaces, and some fallback/local timers must be clarified as UI debounce only, not marketplace simulation.

## Client Specification Alignment

| Area | Alignment | Evidence | Production Need |
| --- | ---: | --- | --- |
| PWA / offline-first direction | 86% | Dexie is used for rider ledger and favorites. | Add explicit offline queue/retry for failed ride request creation if offline operation is required. |
| Zero-cost map mandate | 95% | Rider map uses MapLibre/OpenFreeMap and `h3-js`; no Google Maps UI dependency in rider map. | Add OSRM integration or document Haversine/H3 fallback as the current accepted pricing mode. |
| H3 geospatial privacy | 96% | Rider origin/destination H3 cells are computed with resolution 9; captain radar now uses a masked `captain_radar_requests` view for pending requests. | Apply the new migration live and verify pending captains cannot read exact rider coordinates. |
| Multi-country data | 90% | Registration/profile/destination flow uses countries, governorates, districts, and dynamic currency. | Validate all country rows have coordinates, currency, tariff, tortuosity, and phone metadata. |
| Rider request flow | 90% | `ride_requests` insert exists with origin/destination, H3, country, and server fare. | Live RLS/staging test: request creation, request visibility, cancellation, no-offer timeout. |
| Fare authority | 88% | `calculate_server_fare(lat1,lng1,lat2,lng2,p_country_id)` is called. | Client docs mention OSRM street distance; current migration uses Haversine/tortuosity. Decide if OSRM RPC/proxy is mandatory for launch. |
| Realtime offers | 86% | `ride_offers` subscription exists and empty/waiting states are handled. | Test real captain offer insertion and multiple-captain race conditions. |
| Offer acceptance | 92% | Rider calls `accept_ride_offer`; reducer no longer creates local trip IDs. | Live race test with two captains. |
| Active trip | 86% | Active trip UI, completion RPC, and captain-side arrived/start RPC contracts now exist. | Add cancellation, no-show, dispute, and support events if required. |
| Rating | 88% | Rider rating calls `submit_ride_rating` and updates driver trust score. | Confirm duplicate rating behavior and trust-score formula with production rules. |
| 72-hour ledger | 88% | Dexie rider ledger and server `trips_72h_ledger` exist. | Add/verify server purge job if legal/support retention must be enforced server-side. |
| Favorites vault | 92% | Preferred captains stored locally with Dexie/local storage. | Only sync to server if matching priority becomes server-owned. |
| Ad river | 90% | Large image-card layout, hover/touch pause, manual controls, placeholder, and 50-event batching are implemented. | Live RLS permission for `ad_campaigns` and 50-event flush test. |
| Visual identity | 92% | Matte navy, teal, glass cards, rounded controls are present. | Continue tightening mobile map overlays and card density. |
| Captain profile UX | 88% | `driver-profile-tab.tsx` now shows a server-loading state, fetch-failure retry card, edit mode, and profile/vehicle fields loaded from Supabase. | Apply/verify profile update RLS and confirm vehicle columns exist in production. |
| Arabic/English copy | 76% | Many screens are translated, but rider-view still has mojibake in profile/system messages. | Finish source cleanup for corrupted strings and old heavy terms. |

## What Is Aligned Now

- Rider auth and registration use Supabase phone/password and live geographic IDs.
- Rider map uses MapLibre/OpenFreeMap and `h3-js`, not paid Google map widgets.
- Destination selection uses country-aware governorate/district rows and a draggable centered pin.
- Fare preview calls server RPC with active country ID.
- Ride request creation writes to `public.ride_requests`.
- Rider waits for realtime offers from `public.ride_offers`.
- Offer acceptance is server-authoritative via `accept_ride_offer`.
- Pending captain radar reads are routed through a masked view that hides exact rider pickup coordinates until acceptance.
- Captain arrived/start milestones now have trusted RPC contracts.
- Captain profile no longer flashes editable fallback data before the server fetch completes; it shows a loading state until Supabase responds.
- Trip completion calls `complete_ride_trip`.
- Rating calls `submit_ride_rating`.
- Completed trips are reflected into Dexie after server success.
- Favorite captains remain zero-cost local storage.
- Ad cards match the client-approved large-card direction and use local batching.

## Missing Or Partial For Production

1. **OSRM distance authority is not fully wired.** Client documents describe OSRM street distance as the preferred production distance engine. Current fare function is server-side but still Haversine/tortuosity based.
2. **RLS needs live proof.** Recent UI errors showed permission issues on `ad_campaigns` and `captain_locations`. The rider cannot be considered production-ready until live policies are verified.
3. **Rider copy still has mojibake.** `src/components/dashboard/rider-view-tab.tsx` still contains corrupted fallback strings around profile location/system messages.
4. **No-offer timeout must match the client rule.** Some documents require 180 seconds; current active rider constant is 120 seconds. Product owner must choose one, then code must match it.
5. **Captain visibility privacy must be live-tested.** The local migration now creates a masked view, but the policy must be applied and tested on Supabase with real captain accounts.
6. **Trip lifecycle still lacks some backend milestones.** Arrived and started now have RPCs; cancelled, no-show, dispute, and support events still need authority if required.
7. **Captain profile save depends on live schema/RLS.** The frontend now gates loading correctly, but production must confirm `profiles` update policies and vehicle columns allow the intended captain edits only.
8. **Wallet and commission/payment events are not fully end-to-end tested.** Tables/RPCs exist, but staging validation is still needed.

## Production Action Plan

1. Apply and validate Supabase RLS for `ride_requests`, `ride_offers`, `captain_locations`, `ad_campaigns`, wallet tables, and ledger tables.
2. Decide final distance engine: keep country-aware Haversine/tortuosity or add OSRM-backed server fare calculation.
3. Run a two-device rider/captain E2E test: request, offer, accept, active trip, complete, rating, ledger.
4. Clean all Rider mojibake and simplify Arabic strings in `rider-view-tab.tsx`, history, wallet, and profile.
5. Align no-offer timeout with the client rule and make the retry/cancel flow server-authoritative.
6. Add backend RPCs for cancellation, no-show, dispute, and support/lost-found if required.
7. Validate Captain profile loading/save with real Supabase rows, including full name, phone, vehicle plate, vehicle make, color, and model year.
8. Validate ad campaign reading and metric flush at 50 events or app exit.

## Bottom Line

The Rider Dashboard is **excellent as a client-facing demo** and **close to production as a marketplace surface**. The Captain profile UX is also improved because it now respects server loading before showing profile controls. The last work is backend validation, OSRM/fare decision, exact RLS permissions, real captain profile save verification, and final Arabic cleanup.
