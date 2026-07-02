# Rider Dashboard Alignment Report

Date: 2026-07-02

Scope: current frontend Rider Dashboard implementation compared with the zero-cost delivery plan, SC55 offline-first direction, and the latest Rider Dashboard files in this repo.

## Executive Summary

Current alignment: **90%**

The Rider Dashboard is now much closer to the delivery plan. The frontend has a clearer seven-state model, official H3 usage, local destination selection, Dexie-backed 72-hour ledger storage, and Dexie/local-storage favorite captain support.

The remaining gap is mostly production authority and dataset depth. Sprint 1 added the real MapLibre/OpenFreeMap map, local H3 captain dots, and a reducer-driven local ride lifecycle.

Important ad note: the ad surface now uses the client’s latest large image-card style across dashboard ad sections. The existing dashboard placement is still preserved and should not be moved to a new fixed bottom layout unless the client explicitly approves that layout change.

Backend security and Firestore rule hardening are intentionally not included in this score because the current phase explicitly asked to leave backend integration for later.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 92% | Full local reducer exists with explicit actions and bounded transitions. |
| H3 / zero-cost geospatial | 92% | Official `h3-js` is used for cells, neighbors, map dots, and distance support. |
| Destination selection | 86% | Local destination choices work; needs larger district dataset. |
| Ad River behavior | 82% | Shared client-style ad cards are applied; placement is preserved and batching still needs final product rules. |
| 72-hour ledger | 80% | Dexie storage and countdown exist; needs real trip ingestion after backend phase. |
| Green Heart vault | 90% | Dexie/local storage favorite captains are implemented. |
| Dark matte visual identity | 88% | Main rider surfaces match navy/teal/glass direction; some older shared screens still need cleanup. |
| Arabic copy | 82% | New rider lifecycle copy is simpler; old wording remains in some non-core/shared areas. |

## What Is Now Aligned

- **State machine:** `riderDashboardReducer()` and `useRiderDashboardMachine()` now enforce the seven rider states in `src/components/dashboard/rider/rider-state-machine.ts`.
- **MapLibre map:** `src/components/dashboard/rider/rider-map.tsx` renders a keyless OpenFreeMap/MapLibre canvas.
- **H3 captain dots:** `src/components/dashboard/rider/rider-map-utils.ts` generates 3-5 nearby fake captains from H3 `gridDisk`.
- **Ad River:** The client’s latest ad-card visual style is shared across dashboard ad sections while preserving existing placement.
- **Official H3:** `src/core/logic/geospatial-kernel.ts` now uses `latLngToCell`, `gridDisk`, and `gridDistance` from `h3-js`.
- **Offline destination selection:** Rider request modal uses local governorate/district choices and coordinate strings instead of Google Maps UI helpers.
- **Dexie 72-hour ledger:** `riderTripLedger` is added to `src/lib/dexie-db.ts`, and the rider panel loads/purges ledger items locally.
- **Green Heart vault:** favorite captains continue to use Dexie plus local storage.
- **Google cleanup in Rider/Driver flow:** Rider/Driver scan is clean; remaining Google placeholders are in advertiser tooling only.

## Missing Or Partial Components

- **Active trip tracking is still prototype-grade.** It has ETA, captain, vehicle, price, and local completion, but production-grade route progress is still future work.
- **Destination dataset is too small.** Current dropdowns are good structurally, but production needs a full Jordan governorate/district list with stable local coordinates.
- **72-hour ledger is seeded from demo data.** It stores and counts down locally, but real completed trips must be inserted into Dexie when backend trip completion is ready.
- **Ad River batching still needs final product rules.** The visual style is now unified, but metrics batching should be unified into one local batching path.
- **Some shared UI copy is still older style.** Core rider request/dashboard copy is cleaner, but shared history/profile/ad areas still need the same simple Arabic standard.

## Production Needs

1. **Complete Active Trip UI**
   - Add pulsed H3-based captain approach status.
   - Show ETA, captain card, vehicle, final price, emergency/report action, and trip progress.
   - Keep the client-approved ad behavior unchanged during this state unless the client approves a new placement.

2. **Expand Local Destination Data**
   - Build a local JSON/table for governorates, districts, common landmarks, and coordinate anchors.
   - Keep it offline-first and avoid geocoding APIs.

3. **Unify Ad Metrics Batching**
   - Use one local batching utility for impressions/clicks.
   - Flush only after the 50-event threshold or page close.
   - Keep this separate from backend integration for now.

4. **Copy Cleanup Pass**
   - Apply the simple Arabic/English style to all rider-adjacent pages.
   - Remove remaining heavy terms from shared history/profile/ad components.

## Risk Notes

- This report covers frontend readiness only.
- Firestore rules, Cloud Functions authority, pricing authority, registration security, and wallet settlement are still future backend tasks.
- The current frontend is suitable for demo/testing, but not production trust until backend authority is completed.

## Bottom Line

The Rider Dashboard is now **strongly aligned on frontend structure and zero-cost direction**, but it is not fully production-ready yet.

The next best milestone is: **production-grade active trip progress + larger local destination data + backend authority later**.
