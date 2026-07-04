# Rider Dashboard Alignment Report

Date: 2026-07-04

Scope: Rider Dashboard frontend, rider authentication, profile editing, responsive map UI, interactive destination pin, Supabase fare/request pipeline, realtime offers, captain presence, ads, Dexie local storage, empty states, and production readiness.

## Executive Summary

Frontend/demo alignment: **98%**

Production readiness: **84%**

The Rider Dashboard is now very strong as a client-facing prototype. It has a seven-state reducer, MapLibre/OpenFreeMap map, browser GPS, official H3 cells, dynamic country/governorate/district data, interactive map pin destination selection, debounced server fare recalculation, Supabase phone/password auth, profile editing, ride request insertion, realtime request/offer listeners, live captain presence lookup, live ad campaign fetching, Dexie 72-hour ledger, local favorites, responsive desktop/mobile layout, and friendlier empty states.

The main remaining gap is backend authority. The UI is close, but production still needs server-owned offer acceptance, trip lifecycle, wallet/commission movements, ad billing, support-grade ledger sync, and verified RLS policies.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 96% | `useReducer` state machine exists with bounded transitions. |
| MapLibre/OpenFreeMap | 96% | Free map renders with GPS/fallback, H3 badges, destination fly-to, and mobile overlay fixes. |
| Interactive destination pin | 92% | District selection flies to the area, centered pin captures map center, H3/fare update from pin coordinates. |
| H3 geospatial flow | 95% | Official `h3-js` is used for rider, destination, and request cells. |
| Supabase auth | 90% | Phone/password, remember me, session check, logout, forgot-password support path, and dynamic signup metadata exist. |
| Profile editing | 84% | Fetches and saves through Supabase `profiles`; frontend is clean, live RLS must still be verified. |
| Multi-country registration | 89% | Countries, governorates, and districts fetch from Supabase and submit integer IDs. |
| Country-aware destination selection | 91% | Rider destinations fetch by active user `country_id`; no forced Jordan-only destination list. |
| Server fare authority | 89% | `calculate_server_fare` RPC is used with origin, dynamic pin destination, and `p_country_id`. |
| Ride request creation | 85% | Inserts into `ride_requests` with rider ID, origin/destination coords, H3 cells, country, fare, and `PENDING`. |
| Realtime request status | 78% | Subscribes to request row, but still has a UX shortcut after insert. |
| Realtime offers | 77% | Subscribes to `ride_offers`; real display path exists, offer acceptance is not authoritative yet. |
| Captain presence | 74% | Queries `captain_locations`; empty nearby regions are handled, driver publisher still needed. |
| Active trip lifecycle | 65% | UI exists, but start/complete/cancel/rating are still mostly local actions. |
| Dexie ledger | 87% | 72-hour local ledger works for UX; production server sync/support rules are missing. |
| Favorites | 85% | Local favorite drivers/ads exist; backend sync depends on final matching rules. |
| Ads surface | 88% | Fetches `ad_campaigns`, keeps client large-card style, hover pause, manual controls, and placeholder empty state. |
| Empty states | 90% | Ads, wallet, history, offers, and captain presence avoid scary popups for expected empty data. |
| Mobile UX | 88% | Bottom nav is preserved; map overlays were reduced and no longer collide during pin selection. |
| Arabic copy | 75% | Visible copy is simpler in many new areas, but older files still contain mojibake/heavy wording. |
| Legacy backend cleanup | 58% | Some Firebase listeners/hooks remain and should be isolated before production. |

## What Is Aligned Now

- **State machine:** Rider flow has explicit states for map, destination, offers, active trip, rating, ledger, and favorites.
- **Map:** Rider flow uses MapLibre/OpenFreeMap instead of paid Google Maps.
- **Interactive pin:** district selection flies the map to the district center, then the rider can move the map under a centered pin to fine-tune the destination.
- **Dynamic H3:** destination H3 is recalculated from the pin location, not only the district center.
- **Server fare:** the frontend calls `calculate_server_fare` with rider origin, pin destination, and active `country_id`.
- **Ride request:** confirmed requests insert into `public.ride_requests` with the exact pin coordinates and H3 cells.
- **Multi-country data:** registration and rider destination selection use Supabase country/governorate/district rows.
- **Realtime:** request status and `ride_offers` subscription helpers exist.
- **Offers empty state:** while no offers exist, the user sees a waiting card instead of broken UI.
- **Captain presence:** map dots come from `captain_locations`, not random local mock data.
- **Ads:** ad cards fetch from `ad_campaigns`; if empty/unavailable, a styled placeholder appears.
- **History/wallet empty states:** optional missing data now shows friendly empty states instead of destructive error toasts.
- **Profile:** profile data is fetched from Supabase and edited with live dropdown IDs.
- **Mobile map UI:** destination pin mode hides the off-peak alert and simplifies map labels on small screens.

## Missing Or Partial For Production

- **Offer acceptance is not locked by the server.** Selecting an offer should call an RPC or Edge Function that atomically accepts one offer and blocks double acceptance.
- **Trip lifecycle is not authoritative.** Start, arrive, complete, cancel, no-show, dispute, and rating must be server events.
- **Wallet and commissions are not protected.** Balances, payouts, delegate commissions, platform fees, refunds, and penalties need backend transactions.
- **Realtime transition still has a shortcut.** After request insert, the UI can move into receiving-offers immediately; production should rely only on server status.
- **Driver presence publisher is missing.** `captain_locations` is queried, but the driver app still needs safe pulsed H3 publishing with expiry.
- **Ledger is local-first only.** Dexie is good for UX, but support/dispute/legal records need server sync and purge rules.
- **Ad billing is not authoritative.** Views, clicks, budget consumption, and billing counters need a protected server path.
- **RLS verification is still required.** `profiles`, `ride_requests`, `ride_offers`, `captain_locations`, `ad_campaigns`, and public geography tables need tested policies.
- **Coordinate data quality matters.** Every district row must have valid coordinate fields; frontend now blocks missing coordinates instead of faking data.
- **Arabic cleanup is unfinished.** Older source files still contain corrupted or overly dramatic wording.
- **Firebase remnants remain.** Legacy Firebase listeners can create permission warnings and split backend authority.

## Security And Backend Authority Gaps

These must not remain trusted only on the frontend:

- Driver offer creation and eligibility.
- Offer acceptance and prevention of double acceptance.
- Trip state transitions.
- Final fare locking and fare adjustment.
- Wallet balances, payments, refunds, and penalties.
- Payouts and commission settlement.
- Ad impressions, clicks, campaign budgets, and billing.
- Driver availability and H3 presence.
- Support-grade trip ledger records.
- Admin roles, kill switches, moderation, and audit logs.

## Compliance Gaps

- **Zero-cost map:** aligned with MapLibre/OpenFreeMap.
- **No paid Google dependency:** rider map flow is aligned; shared legacy surfaces still need scanning.
- **Offline-first:** Dexie supports ledger/favorites, but ride request offline queue/retry is not complete.
- **Pulsed tracking:** visual structure exists; real driver-side H3 pulses are not complete.
- **Backend authority:** fare/request are partly server-backed; offers, trips, wallet, and ads still need full authority.

## Production Action Plan

1. **Verify Supabase schema and RLS**
   - Test `profiles`, `countries`, `governorates`, `districts`, `ride_requests`, `ride_offers`, `captain_locations`, and `ad_campaigns` using real rider accounts.
   - Confirm users can read/update only their own private rows.
   - Confirm public geography tables are readable safely.

2. **Make offer acceptance server-authoritative**
   - Add an RPC/Edge Function such as `accept_ride_offer`.
   - Lock one accepted offer per request.
   - Reject stale, cancelled, or already accepted offers.

3. **Complete trip lifecycle backend**
   - Add server actions for start, arrive, complete, cancel, no-show, dispute, and rate.
   - Feed the reducer from trusted server rows/events.

4. **Wire real driver presence**
   - Implement low-frequency H3 updates from the driver app.
   - Add expiry so stale drivers disappear automatically.
   - Keep updates pulsed, not expensive live GPS streaming.

5. **Harden wallet and commission**
   - Move every balance change to database functions.
   - Add immutable ledger rows for payments, refunds, penalties, payouts, and commissions.

6. **Productionize ads**
   - Keep the current large image-card layout.
   - Move ad metric batching and budget decrement to a server-protected path.
   - Keep the friendly placeholder when no campaigns are available.

7. **Finish Arabic and encoding cleanup**
   - Replace mojibake strings in old files.
   - Use simple standard Arabic for UI labels and buttons.
   - Avoid heavy terms such as "sovereign", "atomic", "constitutional", and similar dramatic wording in user-facing UI.

8. **Remove or isolate Firebase**
   - Migrate production rider dependencies to Supabase.
   - Gate Firebase-only pieces as demo/admin/legacy if still needed.
   - Remove permission-warning noise from rider production flows.

9. **Production QA pass**
   - Test mobile and desktop.
   - Test GPS allow/deny/unavailable.
   - Test profile edit, fare RPC failure, request insert failure, realtime disconnect, no offers timeout, no ads, empty history, wallet empty state, logout, and session restore.

## Current Bottom Line

The Rider Dashboard is **excellent for a client walkthrough and near-complete as a frontend product prototype**.

It is **not fully production-ready as a trusted marketplace** until Supabase/RLS and server functions own offer acceptance, trip lifecycle, wallet/commission, ads billing, and support-grade ledger records.

Recommended next milestone: **RLS verification + server-authoritative offer acceptance**.
