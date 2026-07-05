# Driver / Captain Dashboard Alignment Report

Date: 2026-07-06

Scope: active Driver/Captain dashboard, radar map, request list, bidding sheet, accepted trip flow, driver location pulse, wallet/time bundle gate, profile edit screen, Supabase RPC contracts, and remaining production readiness gaps.

## Executive Summary

Frontend/demo alignment: **94%**

Production readiness: **85%**

The Driver/Captain dashboard is now a real operational workspace, not an ad-only screen. It has a dashboard shell, Radar / Wallet / Profile navigation, MapLibre/OpenFreeMap radar map, H3 location pulse, nearby request list, bid proposal sheet, active trip tracker, wallet screen, editable profile screen, logout, and Supabase-backed hooks for radar/offers/trip steps.

Recent improvement: the Captain profile now shows a loading state while fetching profile data from Supabase and only renders editable profile fields after the server responds. If loading fails, it shows a retry card instead of immediately showing stale local values.

The remaining production gap is mainly live backend validation and UX hardening: real two-device rider/captain matching, RLS proof, time-bundle deduction, request privacy verification, complete support lifecycle events, and final map/mobile polish.

## Alignment By Area

| Area | Alignment | Current Status | Production Need |
| --- | ---: | --- | --- |
| Dashboard shell/navigation | 92% | `driver-view-tab.tsx` has Radar, Wallet, Profile, online/offline, logout, and scrolling layout. | Mobile and small-height QA. |
| Radar map | 88% | `radar-map-view.tsx` renders MapLibre/OpenFreeMap and request markers. | Improve Arabic map labels and map density. |
| Nearby requests | 84% | `use-driver-radar.ts` reads `captain_radar_requests` and filters by H3/country. | Live test that real rider requests appear for eligible captains. |
| H3 pulsed presence | 90% | `use-captain-location-pulse.ts` calls `pulse_captain_location` every 15s. | Verify RPC/RLS on live Supabase and availability rules. |
| Time-bundle gate | 82% | Radar checks `wallet_accounts` before subscribing. | Add server-side time deduction/expiry enforcement. |
| Bid guard | 92% | `bidding-proposal-sheet.tsx` warns above 10% and blocks at 15%. | Confirm live base fare is always present. |
| Offer submission | 84% | Captain inserts into `ride_offers` through Supabase. | Verify RLS and duplicate offer behavior. |
| Accepted trip transition | 80% | `use-driver-transactions.ts` listens for accepted offers and loads active request. | Real two-device test with rider accept. |
| Trip milestones | 86% | Arrived/start call `captain_arrived_to_pickup` and `start_ride_trip`; completion calls `complete_ride_trip`. | Add cancel/no-show/dispute if required. |
| Wallet | 82% | Wallet reads Supabase balances, receipt upload, voucher/delegate structures. | Validate bucket policy, vouchers, delegate charge, time bundles. |
| Profile | 88% | Profile fetches from Supabase, shows loading, supports edit mode, and saves basic/vehicle data. | Confirm profile update RLS and production vehicle columns. |
| Arabic/English copy | 82% | Active driver screens mostly react to language; some old strings still need cleanup. | Finish full i18n pass across driver wallet/profile/radar. |
| Firebase eviction | 86% | Active driver radar/transaction path is Supabase-first. | Peripheral Firebase hooks still need isolation/migration. |

## What Is Aligned Now

- Captain dashboard no longer opens as a full-screen ad-only surface.
- Radar, Wallet, and Profile screens are reachable from the driver dashboard.
- Radar map uses MapLibre/OpenFreeMap.
- Driver H3 cell is calculated locally.
- Captain location pulses to Supabase every 15 seconds.
- Nearby request loading uses H3/country filtering.
- Bid submission has the 10% warning and 15% block rule.
- Active trip milestone buttons call server RPCs before progressing.
- Wallet values are read from Supabase and are not directly editable from UI.
- Profile data waits for server loading before rendering editable fields.
- Driver profile supports edit/cancel/save and logout.

## Remaining Production Gaps

1. **Real request visibility is not proven yet.** The UI can show zero requests if RLS, country, H3, time bundle, or rider request rows do not match.
2. **Map UX still needs polish.** The map exists, but request visibility, Arabic labels, marker hierarchy, and mobile framing need QA.
3. **Time bundle enforcement is partial.** Radar access is gated, but actual time consumption and renewals must be database-controlled.
4. **Offer lifecycle needs E2E validation.** Captain offer insertion, rider acceptance, losing offer rejection, and accepted trip loading must be tested across two devices.
5. **Trip support states are incomplete.** Arrived/start/complete exist; cancel, no-show, dispute, and support escalation need backend routines if required.
6. **Profile save depends on live RLS/schema.** The frontend is ready, but Supabase must allow only the captain’s own editable fields.
7. **Wallet workflows need live proof.** Receipt upload, voucher redemption, delegate charge, and balance updates require staging tests.
8. **Peripheral Firebase remains.** Active driver path is mostly clean, but older admin/driver hooks still contain Firebase references.

## Production Action Plan

1. Run a real rider/captain two-device test from request creation through offer, accept, active trip, complete.
2. Apply and verify RLS for `captain_radar_requests`, `ride_requests`, `ride_offers`, `captain_locations`, `wallet_accounts`, and `profiles`.
3. Confirm Captain profile save works for `full_name`, `phone`, `vehicle_plate`, `vehicle_make`, `vehicle_color`, and `vehicle_year`.
4. Validate `pulse_captain_location` every 15 seconds and stale cleanup after 60 seconds.
5. Implement server-side time bundle deduction and renewal rules.
6. Add cancel/no-show/dispute RPCs if the client needs those production flows.
7. Polish driver map UI on desktop/mobile and finish Arabic/English translation consistency.

## Bottom Line

The Driver/Captain dashboard is **usable and structurally aligned**, but it is not fully production-proven yet. The next real milestone is a live E2E rider/captain staging test with RLS enabled, followed by time-bundle deduction and support-state completion.
