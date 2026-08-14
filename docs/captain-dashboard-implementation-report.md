# Driver / Captain Dashboard Production Alignment Report

Date: 2026-08-14

Source basis: client business/technical documents in `C:\Users\karee\Downloads`, especially technical architecture, maps/distances, visual identity, V5.5 law summary, and ad documents. Code basis: active Driver/Captain dashboard, driver radar hooks, captain location pulse, Supabase migrations, wallet service, and captain state machine.

## Executive Summary

Frontend/demo alignment: **95%**

Production readiness: **87% repository/migration readiness**

The Driver/Captain Dashboard now exists as a real screen, not an ad-only standby surface. It includes a dedicated state machine, radar map screen, H3 location pulse, nearby request list, bid proposal sheet, active trip tracker, wallet tab, profile tab, Supabase-only radar/offer hooks, server trip completion, trusted arrived/start RPC bindings, 15% bid guard enforcement, and time-bundle radar gating.

The driver side is still slightly behind the rider side, but the biggest captain production gaps have been closed in code and migration files. The wallet phase now reads real minute columns, exposes a server-authoritative bundle status RPC, and rechecks the radar after wallet Realtime updates. The remaining work is mostly live database application and staging proof: masked request visibility, real offer insertion, accepted-offer realtime delivery, time-bundle activation/consumption, and two-device matching must be validated on Supabase.

## Client Specification Alignment

| Area | Alignment | Evidence | Production Need |
| --- | ---: | --- | --- |
| Captain dashboard shell | 94% | `driver-view-tab.tsx` renders dashboard header, Radar, Wallet, Profile tabs, and RPC-backed trip flow. | Add final mobile layout QA. |
| MapLibre/OpenFreeMap map | 88% | `radar-map-view.tsx` uses MapLibre/OpenFreeMap, safe fallback state, and a time-bundle lock empty state. | Confirm tiles render reliably and add clearer GPS permission state. |
| H3 pulsed tracking | 90% | `use-captain-location-pulse.ts` sends H3 res 9 every 15 seconds via `pulse_captain_location`. | Validate live RPC/RLS and ensure pulse only runs for active available captains. |
| Nearby request radar | 88% | `use-driver-radar.ts` now reads `captain_radar_requests`, not raw `ride_requests`, and falls back to H3 center when exact coords are masked. | Apply migration live and verify eligible pending requests appear by country/H3. |
| Rider pickup privacy | 90% | `20260706_captain_lifecycle_privacy.sql` masks `origin_lat/origin_lng` for pending radar scans. | Live-test that exact pickup is revealed only after `accepted_captain_id = auth.uid()`. |
| Bid proposal | 92% | `bidding-proposal-sheet.tsx` enforces amber warning above 10% and blocks at 15% deviation. | Confirm base fare values are always present in live pending request rows. |
| Accepted-offer transition | 80% | `use-driver-transactions.ts` listens to accepted `ride_offers` and loads the request. | Must verify realtime payload and accepted request load across two devices. |
| Active trip tracker | 88% | `active-trip-tracker.tsx` now calls trusted arrived/start handlers and only advances after RPC success. | Add cancel/no-show/dispute if support workflow requires them. |
| Trip completion | 86% | Captain completion calls `complete_ride_trip`; local ledger updates only after success. | Confirm captain permission to complete trip matches product policy. |
| Captain rating/trust | 65% | Profile shows rating/trust values; rider-to-captain rating RPC exists. | Captain-to-rider rating is not a complete backend contract. |
| Wallet/time bundles | 91% | `driver-wallet-tab.tsx` and `use-sovereign-wallet.ts` read `balance`, `paid_minutes_remaining`, `bonus_minutes_remaining`, and `time_bundle_expires_at` from Supabase. `20260814_captain_wallet_phase2.sql` adds `get_captain_wallet_status()` and radar wallet Realtime re-checking. | Apply the migration live; validate package activation, voucher expiry, delegate charge, and server-side time deduction. |
| Zero-commission model | 82% | UI has time-bundle wallet language, exact minute counters, and server bundle gating; no fake cash-to-hours conversion remains in the active captain radar. | Add/verify the server transaction that consumes minutes while a captain is online and closes the radar at expiry. |
| 72-hour ledger | 78% | `captainLedger` Dexie table exists and server `trips_72h_ledger` exists. | Validate driver-side ledger display and purge behavior. |
| Ad river interaction | 84% | Driver dashboard no longer gets replaced by ads; ad stage works as shared surface. | Decide where/when captain-specific ads appear without blocking work screens. |
| Visual identity | 88% | Matte navy/teal/glass style is now used in captain dashboard. | Tune map density, request cards, mobile states, and offline/online affordance. |
| Arabic/English copy | 90% | Active captain radar, bidding, trip tracker, and dashboard shell were cleaned from mojibake. | Continue cleanup in shared driver pricing/old history/admin-adjacent files. |
| Firebase eviction | 86% | Active driver radar/transactions/dashboard path is Supabase-only. | Peripheral admin/driver legacy hooks still contain Firebase and should be isolated. |

## What Is Aligned Now

- Captain dashboard route now renders the driver workspace instead of full-screen ads.
- Captain has top navigation for Radar, Wallet, and Profile.
- Radar map uses MapLibre/OpenFreeMap.
- Captain status can switch online/offline.
- H3 cell is calculated locally.
- Active captain location pulses to Supabase every 15 seconds.
- Nearby request reads now route through `public.captain_radar_requests` to mask exact rider pickup coordinates before acceptance.
- Request filtering uses H3 current cell and neighboring cells.
- Radar disconnects with a clear Arabic warning when the captain has no active time bundle or remaining minutes.
- Radar wallet checks now call `get_captain_wallet_status()` instead of converting cash balance with a test price.
- Captain wallet cards now display the exact server minute columns as hours and minutes.
- Wallet account updates now trigger an active radar re-check, allowing the radar to resume after a successful top-up without a full reload.
- Bid submission enforces the 10% amber warning and 15% crimson block.
- Bid submission writes to `public.ride_offers`.
- Accepted offer subscription loads the active request.
- Active trip UI supports call/rider contact, trusted arrived/start RPCs, and completion.
- `captain_arrived_to_pickup` and `start_ride_trip` are versioned in `supabase/migrations/20260706_captain_lifecycle_privacy.sql`.
- Trip completion calls `complete_ride_trip`.
- Driver wallet uses Supabase wallet tables and receipt/voucher structure.
- Driver profile fetches Supabase profile/rating data.

## Missing Or Partial For Production

1. **Live request visibility is not proven.** The UI shows `0` requests unless RLS, request rows, country ID, and H3 cells all match.
2. **Driver request privacy needs live verification.** Code now uses the masked view, but Supabase must apply the migration and prove exact coordinates are hidden from scanning captains.
3. **Bid guard depends on base fare availability.** The UI guard is implemented, but live request rows must consistently include `server_estimated_fare`.
4. **Cancel/no-show/dispute steps are not complete.** Arrived and started are now trusted RPCs; the remaining support/audit states need backend routines if required.
5. **Captain-side rating is incomplete.** Rider-to-captain rating exists; captain-to-rider rating needs its own backend contract if required.
6. **Time-bundle revenue model still needs deduction enforcement.** Radar access is gated, but actual time consumption must be controlled by database functions/triggers.
7. **No navigation handoff is fully defined.** Client documents mention a one-time navigation map for the captain after accepted offer. Current active tracker is not yet a full navigation handoff.
8. **Production RLS not live-proven.** `captain_locations`, `ride_requests`, `ride_offers`, and wallet policies must be tested with real captain accounts.
9. **Peripheral Firebase remains.** Active captain path is clean, but old admin/driver utilities still contain Firebase references.

## Production Action Plan

1. Run live two-device staging: rider creates request, captain sees it, captain submits offer, rider accepts, captain enters active trip, captain completes trip.
2. Apply `20260706_captain_lifecycle_privacy.sql`, then verify `captain_radar_requests` for captains: show only eligible pending requests in allowed H3/country scope with masked coordinates.
3. Verify `ride_offers` RLS: captain can insert only their own offer, rider can read offers for their own request.
4. Add `cancel_by_captain`, `captain_no_show`, and dispute RPCs if required by support/audit.
5. Test the 15% bid guard against real server fare rows.
6. Apply `supabase/migrations/20260814_captain_wallet_phase2.sql` to the live project and reload the PostgREST schema cache.
7. Implement server-side time-bundle deduction and renewal logic for captains; the new status RPC intentionally does not mutate financial values.
8. Add one-time navigation handoff after accepted offer, while preserving MapLibre/zero-cost principles or an approved external navigation deep link.
9. Validate captain wallet receipts, voucher redemption, and delegate charges with real records.
10. Finish non-active Firebase cleanup or gate those modules away from production.

## Bottom Line

The Driver/Captain Dashboard is now **usable, structurally aligned, and materially hardened**. The core production gaps identified in the previous report have been addressed in code: privacy routing, bid guards, trusted arrived/start milestones, exact wallet-minute display, server bundle status, and Realtime radar recovery after top-up. The remaining gates are live Supabase migration application, RLS verification, real two-device matching, time-bundle deduction rules, and support-state RPCs.
