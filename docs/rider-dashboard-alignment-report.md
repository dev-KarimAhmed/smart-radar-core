# Rider Dashboard Alignment Report

Date: 2026-07-04

Scope: Rider Dashboard, rider authentication, profile editing, map/geospatial flow, Supabase ride request pipeline, realtime offers, ad cards, Dexie local storage, and production readiness.

## Executive Summary

Frontend/demo alignment: **97%**

Production readiness: **82%**

The Rider Dashboard is now strong as a working product prototype. It includes the seven-state reducer, MapLibre/OpenFreeMap map, browser GPS, H3 cells, Supabase phone/password authentication, multi-country registration, dynamic country/governorate/district dropdowns, country-aware destination selection, Supabase fare RPC, `ride_requests` insertion, realtime request and offer subscriptions, live captain-location lookup, live ad campaign fetching, local 72-hour ledger, local favorites, responsive desktop/mobile layout, and client-approved large ad cards.

The main production gap is no longer the basic UI. The remaining work is backend authority: selecting a driver, locking the offer, starting/completing/cancelling trips, wallet movements, commissions, ad billing, support-grade ledger sync, and RLS verification must be controlled by the server.

Recent profile note: profile editing now writes only the expected `profiles` fields: `full_name`, `phone`, `country_id`, `governorate_id`, and `district_id`. Save errors now identify whether the problem is RLS permission, missing columns, foreign keys, duplicates, or network failure.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 96% | `useReducer` state machine exists with bounded transitions. |
| MapLibre/OpenFreeMap | 94% | Free map renders with GPS/fallback and H3 markers. |
| H3 geospatial flow | 94% | Official `h3-js` is used for rider and destination cells. |
| Supabase auth | 90% | Phone/password, remember me, session check, logout, forgot-password support path, and dynamic signup metadata exist. |
| Profile editing | 82% | Fetches and saves through Supabase `profiles`; frontend fixed, but RLS/live schema must be verified. |
| Multi-country registration | 88% | Countries, governorates, and districts fetch from Supabase and pass integer IDs. |
| Country-aware destination selection | 86% | Rider request destinations now fetch governorates/districts from Supabase by the active user's country ID. |
| Server fare authority | 86% | `calculate_server_fare` RPC is used with origin, destination, and `p_country_id`. |
| Ride request creation | 82% | Inserts into `ride_requests` with rider ID, coords, H3 cells, destination label, country ID, fare, and `PENDING`. |
| Realtime request status | 78% | Subscribes to request row; still dispatches offers state immediately after insert as a UX shortcut. |
| Realtime offers | 76% | Subscribes to `ride_offers`; real offer display path exists, but offer selection is not server-authoritative yet. |
| Captain presence | 72% | Queries `captain_locations`; empty nearby regions are handled, but real captain app update pipeline is still needed. |
| Active trip lifecycle | 64% | UI exists, but trip start/complete/cancel/rating are still mostly local actions. |
| Dexie ledger | 86% | Local 72-hour ledger works for UX; production sync/support authority is missing. |
| Favorites | 84% | Local favorite drivers/favorite ads exist; backend sync depends on final product rules. |
| Ads surface | 86% | Fetches `ad_campaigns`, keeps large client-approved card style, hover pause, manual scroll, and placeholder empty state. |
| Arabic copy | 72% | Visible copy is simpler in many places, but source still contains mojibake and old dramatic terms in several files. |
| Legacy backend cleanup | 55% | Some Firebase listeners/hooks still emit permission warnings and should be isolated or removed from production rider flow. |

## What Is Aligned Now

- **State machine:** the Rider Dashboard has explicit screens for map, destination selection, receiving offers, active trip, rating, ledger, and favorites.
- **Map:** the rider screen uses MapLibre/OpenFreeMap instead of paid Google Maps.
- **Location:** browser location is requested and H3 cells are calculated at the rider flow level.
- **Fare:** the frontend calls `calculate_server_fare` instead of trusting only local Haversine pricing.
- **Destination selection:** the request screen fetches destination governorates and districts from Supabase using the active user's `country_id`, instead of forcing Jordan/Amman.
- **Ride request:** confirmed ride requests insert into `public.ride_requests`.
- **Realtime:** request status and `ride_offers` have Supabase realtime subscription helpers.
- **Offers empty state:** while no offers exist, the UI shows a loader instead of broken content.
- **Offer timeout:** after the wait window, the request can be cancelled and a retry card is shown.
- **Captain presence:** nearby driver dots come from `captain_locations`, not random local generation.
- **Ads:** ad cards fetch from `ad_campaigns`; if none are available, the dashboard shows a branded placeholder card.
- **Profile:** profile data is fetched from Supabase and editing uses backend IDs from live dropdowns.
- **Ad interaction:** hover/focus/touch pauses auto-scroll and users can move forward/back manually.
- **Responsive layout:** desktop uses a left sidebar, while mobile keeps the bottom navigation behavior.

## Missing Or Partial For Production

- **Offer selection is not locked by the server.** Choosing an offer should call an RPC or Edge Function that atomically accepts one offer and blocks double acceptance.
- **Trip lifecycle is not authoritative.** Start trip, arrive, complete trip, cancel, no-show, dispute, and rating should be server events.
- **Wallet and commissions are not protected.** Balances, payouts, delegate commissions, platform fees, refunds, and penalties need backend-controlled transactions.
- **Profile editing depends on RLS.** The frontend is now cleaner, but Supabase must allow a user to update only their own `profiles` row.
- **Destination coordinates depend on database quality.** District rows need valid latitude/longitude columns. If a row has no coordinates, the frontend blocks the request instead of using fake data.
- **Realtime transition has one shortcut.** After insert, the UI currently moves into receiving-offers state immediately; production should rely only on trusted server status.
- **Captain presence needs the driver-side publisher.** `captain_locations` is queried, but the production driver app must publish pulsed H3 updates safely.
- **Ledger is local-first only.** Dexie is good for UX, but support, disputes, and legal retention need server sync and purge rules.
- **Ad billing is not authoritative.** Views/clicks can be batched locally, but campaign budget and billing counters must be server-protected.
- **Firebase remnants remain.** Some dashboard listeners still produce permission warnings, which creates confusion and split backend authority.
- **Arabic source cleanup is unfinished.** Several source strings still show encoding corruption or heavy internal terms. This should be fixed before client delivery.

## Profile Save Diagnosis

Current frontend behavior is now correct:

- Saves only known profile columns.
- Uses `update` when the profile row exists.
- Uses `upsert` only when no profile row was found.
- Shows specific Arabic error messages for:
  - RLS/permission denial.
  - Missing `profiles` columns.
  - Invalid country/governorate/district foreign keys.
  - Duplicate profile row.
  - Network failure.

If saving still fails with an RLS message, Supabase needs policies similar to:

```sql
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
```

If new rows can be created from the profile screen, an insert/upsert policy may also be needed. If profile rows are created only by the auth trigger, insert from the client can stay blocked.

## Security And Backend Authority Gaps

These must not remain trusted only on the frontend:

- Driver offer creation and eligibility.
- Offer acceptance and prevention of double acceptance.
- Trip state transitions.
- Final fare locking and fare adjustment.
- Wallet balances and payment events.
- Payouts, commissions, refunds, and penalties.
- Ad views, clicks, campaign budget, and billing.
- Driver availability and H3 presence.
- Support-grade trip ledger records.
- Admin roles, kill switches, and moderation actions.

## Compliance Gaps

- **Zero-cost map:** aligned with MapLibre/OpenFreeMap.
- **No paid Google dependency:** rider map flow is aligned; continue scanning shared legacy surfaces.
- **Offline-first:** Dexie is used for ledger/favorites, but ride requests need offline queue/retry behavior if offline usage is required.
- **Pulsed tracking:** visual and data structure exist, but real driver-side pulsed updates are not complete.
- **Backend authority:** fare/request started; offer acceptance, trip lifecycle, wallet, and ads are still incomplete.

## Production Action Plan

1. **Verify Supabase schema and RLS**
   - Confirm `profiles` columns match frontend fields.
   - Add/select/update policies for own profile rows.
   - Test `countries`, `governorates`, `districts`, `profiles`, `ride_requests`, `ride_offers`, `captain_locations`, and `ad_campaigns` with real Jordan and Egypt rider accounts.
   - Confirm each district has usable coordinate fields such as `lat/lng`, `latitude/longitude`, or `anchor_lat/anchor_lng`.

2. **Make offer acceptance server-authoritative**
   - Add an RPC/Edge Function such as `accept_ride_offer`.
   - Lock one offer per request.
   - Reject stale, cancelled, or already accepted offers.

3. **Complete trip lifecycle backend**
   - Add server actions for start, arrive, complete, cancel, no-show, dispute, and rate.
   - Feed reducer state from trusted rows/events.

4. **Wire driver presence**
   - Implement low-frequency H3 updates from the driver app.
   - Store only active available drivers in `captain_locations`.
   - Add expiry to prevent stale dots.

5. **Harden wallet and commission**
   - Move all balance changes to database functions.
   - Add immutable ledger rows for payments, refunds, penalties, and commissions.

6. **Productionize ads**
   - Keep the current large card layout.
   - Move ad metric flush and budget decrement to a server-protected path.
   - Keep placeholder empty state for no campaigns.

7. **Remove or isolate Firebase**
   - Migrate production Rider dependencies to Supabase.
   - Gate legacy Firebase code as demo/admin-only if it is still needed.
   - Remove permission-warning noise from the Rider experience.

8. **Clean Arabic copy and encoding**
   - Replace mojibake in source files.
   - Use neutral, simple Arabic: "السائق", "طلب رحلة", "رحلاتي", "الرصيد", "المفضلة", "الإعلانات".
   - Avoid heavy words like "سيادي", "ذري", "دستوري", "نهر", and "نبض" in user-facing UI.

9. **QA before production**
   - Test mobile and desktop.
   - Test GPS allowed/denied/unavailable.
   - Test auth session restore, logout, profile edit, fare RPC failure, request insert failure, realtime disconnect, no offers timeout, and no ads empty state.

## Current Bottom Line

The Rider Dashboard is **nearly complete as a client-facing prototype** and much closer to production than before.

It is **not yet production-ready as a trusted marketplace** until the server owns offer acceptance, trip lifecycle, wallet/commission, ad billing, and RLS-backed permissions.

Recommended next milestone: **Supabase RLS verification + server-authoritative offer acceptance**.
