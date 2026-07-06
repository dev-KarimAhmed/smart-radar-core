# Driver / Captain Dashboard Alignment Report

Date: 2026-07-07

Scope: Captain dashboard shell, radar map, H3 presence pulse, nearby request feed, offer submission, rider acceptance handoff, active trip steps, wallet/time bundles, profile editing, logout, Supabase migrations, and current production gaps.

## Executive Summary

Frontend/demo alignment: **95%**

Repository backend-contract readiness: **92%**

Live production readiness: **84%**

The Captain Dashboard is now a real working dashboard rather than an ad-only surface. It has Radar, Wallet, Profile, logout, online/offline state, MapLibre/OpenFreeMap map, car marker, H3 pulse, nearby request queue, offer sheet, bid guard, profile editing/loading, wallet counters, and server RPC hooks for offer submission and trip milestones.

The largest remaining issue is the live server handoff after a captain submits an offer and the rider accepts it. The captain can see rider requests and open the offer sheet. The latest live test showed `ride_offers` had stricter required columns than the first RPC expected, and rider acceptance needed a hardened `accept_ride_offer` function. Both fixes are now versioned in migrations, but must be applied and tested live.

## Alignment By Area

| Area | Alignment | Status | Remaining Need |
| --- | ---: | --- | --- |
| Dashboard shell/navigation | 94% | Radar, Wallet, Profile, logout, online/offline are visible. | Continue mobile/small-height QA. |
| MapLibre radar | 92% | Map renders; captain marker is a car icon; recenter exists. | Polish Arabic map labels and clipped overlay areas. |
| H3 pulsed presence | 90% | `use-captain-location-pulse.ts` calls `pulse_captain_location` every 15 seconds. | Verify live TTL cleanup and availability rules. |
| Time-bundle gate | 84% | Radar reads `wallet_accounts` minutes and shows remaining time. | Server-side minute deduction/expiry still needs final enforcement. |
| Wallet counters | 86% | Wallet hook reads `balance`, `paid_minutes_remaining`, `bonus_minutes_remaining` by `profile_id`. | If no row exists, DB bootstrap must create one for that captain profile. |
| Nearby requests | 86% | `use-driver-radar.ts` reads `captain_radar_requests`. | Live view/RLS/H3 test with real rider request. |
| Request privacy | 88% | Pending requests are intended to be read through masked view. | Confirm exact pickup coordinates are hidden until acceptance. |
| Bid guard | 92% | 10% warning and 15% block are implemented. | Validate against real server fare for all countries. |
| Offer submission | 78% live / 94% repo | Frontend calls `submit_ride_offer`; migration now inserts required `eta_minutes`. | Apply latest migration and verify a real offer row is created. |
| Rider accept handoff | 76% live / 92% repo | Captain listens for accepted offers and loads active request. | Apply `accept_ride_offer` sync migration and test realtime transition. |
| Active trip tracker | 88% | Arrived/start/complete RPCs exist. | Add cancel/no-show/dispute support if required. |
| Profile | 90% | Loads from server, has edit mode, save/cancel/logout. | Confirm RLS allows only own editable fields. |
| Wallet/payment flows | 78% | Receipt/voucher UI exists; wallet reads server values. | Test storage bucket, voucher RPC, delegate charge and package purchase. |
| Arabic/English | 82% | Core labels improved, but language consistency is not complete. | Make all captain/rider toasts follow selected language. |
| Firebase cleanup | 86% | Active captain radar path is Supabase-first. | Peripheral old hooks still need isolation/migration. |

## What Is Aligned Now

- Captain dashboard is visible and navigable.
- Radar screen includes map and request queue.
- Captain marker uses a car icon instead of rider-like dot.
- Captain location pulses through Supabase every 15 seconds.
- Nearby requests come from `captain_radar_requests`.
- The bid sheet shows destination, base fare, distance and custom offer amount.
- Bid guard warns/block based on market deviation.
- Offer submission now targets `submit_ride_offer`, not direct client table logic.
- Wallet counters use minute-based server columns.
- Profile page loads server data before showing editable fields.
- Arrived/start/complete buttons use Supabase RPCs.

## Current Live Issues

1. **Offer submission failed until `eta_minutes` was added.** The live table requires `eta_minutes`. The latest `20260707_submit_ride_offer_rpc.sql` now inserts `eta_minutes = 5`.
2. **Rider acceptance failed after seeing the offer.** The repo now includes `20260707_accept_ride_offer_sync.sql`, which updates both `ride_requests` and `ride_offers` so captain realtime can move to active trip.
3. **Captain active trip is not proven live yet.** It depends on the rider accept migration and realtime payload.
4. **Wallet may show zero if no row exists.** Querying `wallet_accounts` by `profile_id` returns no data if the bootstrap row has not been created for the captain.
5. **History/active trip visibility is incomplete.** Captain should have a clearer “waiting for rider acceptance” state after submitting an offer, then active trip after server acceptance.

## Production Action Plan

1. Apply `20260707_submit_ride_offer_rpc.sql`.
2. Apply `20260707_accept_ride_offer_sync.sql`.
3. Create or verify a `wallet_accounts` row for each captain `profile_id`.
4. Run live E2E with two accounts:
   - Rider creates request.
   - Captain sees request.
   - Captain submits offer.
   - Rider sees offer.
   - Rider accepts.
   - Captain receives active trip.
   - Captain marks arrived/start/complete.
   - Rider rates.
5. Verify `captain_radar_requests` hides exact pickup coordinates before acceptance.
6. Add a clear captain “offer sent, waiting for rider” state.
7. Add cancel/no-show/dispute RPCs if required by production support.
8. Finish selected-language toasts and remaining Arabic/English consistency.
9. Decide and implement server-side time-bundle consumption rules.

## Bottom Line

The Captain Dashboard is **structurally strong and close to the intended production workflow**, but the live marketplace loop is still under validation. The two latest migrations are the key blockers: once offer submission and rider acceptance are applied and tested live, the captain side should move from “dashboard prototype” to “working marketplace operator screen.”
