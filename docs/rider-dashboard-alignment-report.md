# Rider Dashboard Alignment Report

Date: 2026-07-02

Scope: current frontend Rider Dashboard implementation compared with the zero-cost delivery plan, SC55 offline-first direction, and the latest Rider Dashboard files in this repo.

## Executive Summary

Current alignment: **91%**

The Rider Dashboard is now a strong local frontend prototype. It has a real seven-state reducer, keyless MapLibre/OpenFreeMap rendering, official H3 captain-dot generation, browser current-location support, local mock ride offers, an active-trip demo flow, local rating storage, Dexie-backed rider ledger support, and the client-approved ad card style.

The remaining gaps are no longer basic screen structure. The main work now is production depth: larger local destination data, live distance/fare calculation from the rider's current location, better active-trip map movement, final Dexie wiring for completed local trips, full Arabic cleanup in older shared surfaces, and future backend authority.

Important ad note: dashboard ads should keep the client-style large image cards and existing dashboard placement. Do not move them into a new fixed bottom layout unless the client explicitly approves that visual change.

Backend security, Firestore rules, Supabase, Cloud Functions, wallet authority, and settlement authority are intentionally outside this score because the current phase asked to focus on frontend/local offline-first behavior only.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 94% | Full reducer exists with explicit actions and bounded local transitions. |
| Local ride lifecycle | 91% | Request, mock timer, offers, select captain, active trip, complete trip, rating, and return to map now work locally. |
| MapLibre / OpenFreeMap | 92% | Real keyless map canvas is implemented with Arabic RTL text support and browser geolocation. |
| H3 / zero-cost geospatial | 92% | Official `h3-js` is used for cells, neighbors, H3 captain dots, and distance support. |
| Current location | 88% | Uses browser geolocation and falls back to Cairo when GPS is blocked or unavailable. |
| Destination selection | 80% | Local selection works, but the dataset is still small and Jordan-focused. |
| Active trip UI | 84% | Demo ETA, captain, vehicle, plate, price, and complete-trip helper exist; map route progress is still basic. |
| Ad sections | 88% | Shared client-style ad cards are applied and state-based visibility is mostly correct. |
| 72-hour ledger | 82% | Dexie storage and countdown exist; completed reducer trips still need automatic ledger insertion. |
| Green Heart vault | 90% | Favorite captains use local/Dexie-backed storage. |
| Dark matte visual identity | 88% | Rider surfaces mostly follow navy, teal, glass, and matte styling. |
| Arabic copy | 82% | New rider flow is simpler; older shared/dashboard copy still needs cleanup. |

## What Is Aligned Now

- **State machine:** `src/components/dashboard/rider/rider-state-machine.ts` now contains `riderDashboardReducer()` and `useRiderDashboardMachine()` for the seven rider states.
- **Explicit actions:** the reducer supports destination open/confirm, request send, offer receive, offer select, trip complete, rating submit, ledger open, favorite captains open, and return to map.
- **Mock offer timer:** sending a ride request triggers local fake captain offers after a short timer.
- **MapLibre visual map:** `src/components/dashboard/rider/rider-map.tsx` renders a real OpenFreeMap/MapLibre map with no paid map key.
- **Arabic map labels:** the MapLibre RTL plugin is enabled, so Arabic labels render correctly when the tile data supports them.
- **Current location:** the map uses `navigator.geolocation.watchPosition()` and recenters to the rider's browser location when permission is granted.
- **Egypt fallback:** if GPS is denied or unavailable, the fallback is Cairo instead of Jordan.
- **Official H3 dots:** `src/components/dashboard/rider/rider-map-utils.ts` uses official H3 cells and `gridDisk()` to generate nearby fake captain dots.
- **Local active trip:** selecting an offer moves into an active-trip demo with ETA, captain ID, vehicle, plate, final price, and a testing completion button.
- **Local rating:** submitting a rating stores it locally and returns the rider to the idle map state.
- **Ad style:** `AdStage` and shared ad cards use the client-approved large image-card look across dashboard ad sections.
- **Local reports:** rider incident/report data is stored locally instead of creating new Firebase writes during this frontend phase.
- **Dexie surfaces:** rider trip ledger and favorite captain vault remain locally stored.

## Missing Or Partial Components

- **Destination data is still too small.** Current options are limited and still mostly Jordan-oriented, while the map can now locate the rider in Egypt or any browser-supported location.
- **Fare and distance are not fully live yet.** The UI still needs to calculate price from current rider location plus selected destination using local H3/Haversine/tortuosity logic.
- **Active-trip map progress is still prototype-level.** The screen has trip details and ETA, but it does not yet animate captain movement or route progress on the map.
- **Completed trips should write to the local ledger.** The reducer can complete a trip, but completed local demo trips should be inserted into the Dexie 72-hour ledger automatically.
- **Ad batching needs final consolidation.** The visual style is aligned, but impressions/clicks should be unified through one local batching utility with the 50-event threshold.
- **Some shared Arabic still needs cleanup.** The new rider flow is clearer, but older rider-adjacent cards, history, profile, and ad copy should be scanned again for heavy wording or mojibake.
- **Global shortcuts need review.** Header or nav request actions should be checked so they always enter the new local reducer flow and do not reopen older network-backed request logic.
- **Browser GPS needs clear UX.** Current location requires browser permission and usually HTTPS or localhost. The UI should keep explaining denied/unavailable location states in simple Arabic.

## Security And Backend Notes

- This report is frontend-only.
- Business-critical authority is still not production-ready until backend work is done.
- Pricing, wallet values, commission settlement, kill-switch behavior, registration authority, and Firestore/Supabase writes must eventually be enforced by backend rules/functions.
- Do not treat the current local reducer, mock fare, mock captain offers, or local storage values as trusted production data.

## Production Needs

1. **Connect destination and fare to real local coordinates**
   - Use the rider's live browser location as the origin.
   - Use a larger offline destination dataset for the destination.
   - Calculate distance and price with local H3/Haversine/tortuosity logic.

2. **Expand destination data**
   - Add city, district, and common landmark anchors.
   - Support Egypt/current-location testing instead of only Jordan examples.
   - Keep the dataset local and avoid geocoding APIs.

3. **Improve active-trip map behavior**
   - Move the selected captain dot toward the rider/destination using pulsed H3 updates.
   - Show clearer trip progress, ETA changes, and active route state.
   - Keep ads hidden during active trip unless the client approves another behavior.

4. **Wire completed trips into Dexie**
   - Save each completed local trip into the 72-hour ledger.
   - Show the purge countdown from the new completed trip data.
   - Keep this local until backend authority is added.

5. **Finish copy and shortcut cleanup**
   - Apply simple Arabic to all rider-adjacent dashboard surfaces.
   - Remove remaining mojibake or heavy phrasing.
   - Ensure top/header request actions use the same reducer flow as the main Rider Dashboard.

## Verification Evidence

The current implementation was previously verified with:

- `npx tsx src/components/dashboard/rider/rider-state-machine.test.ts`
- `npx tsx src/components/dashboard/rider/rider-map-utils.test.ts`
- `npm run lint`
- `npm run build`
- Playwright smoke test for local rider flow: map, request, offers, active trip, complete, rating, return to map.
- Playwright geolocation smoke test with mocked Egypt/Cairo coordinates.

Build note: MapLibre increases the Rider Dashboard bundle size, so the build may warn about a large rider chunk. That is expected for now and should be optimized later with route-level lazy loading if needed.

## Bottom Line

The Rider Dashboard is now **mostly aligned and demo-ready as a local offline-first frontend**.

The next best milestone is: **live local fare/distance from current location + bigger destination dataset + animated active-trip map + Dexie completed-trip insertion**.
