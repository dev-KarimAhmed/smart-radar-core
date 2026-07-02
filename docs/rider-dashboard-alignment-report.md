# Rider Dashboard Alignment Report

Date: 2026-07-02

Scope: current Rider Dashboard frontend compared with the Jordan-first zero-cost delivery plan, SC55 offline-first direction, and latest rider workflow code in this repo.

## Executive Summary

Frontend/local prototype alignment: **96%**

Full production readiness including backend authority: **84%**

The Rider Dashboard is now very close to the agreed frontend target for the Jordan rollout. The seven-state reducer is in place, the map uses keyless MapLibre/OpenFreeMap, the GPS fallback is Amman, the destination flow is Jordan-only, fare quotes are calculated locally from rider location to district anchor using H3/Haversine/tortuosity, captain offers inherit the live guide price, active trip has a moving captain dot, and completed demo trips are inserted into the Dexie 72-hour ledger.

The remaining frontend gaps are mostly refinement: official validation of every district anchor coordinate, stronger active-trip route progress, ad metric batching consolidation, bundle optimization, and cleanup of older shared Arabic outside the newest rider flow.

Backend authority is still the biggest production gap. Pricing, wallets, commission settlement, registration, kill switches, and real trip writes must eventually be enforced by backend rules/functions before the system can be trusted in production.

Important ad note: dashboard ads now use the client-approved large image-card style and should keep the current dashboard placement. Do not move them into a fixed bottom strip unless the client explicitly approves that visual change.

## Alignment By Area

| Area | Alignment | Status |
| --- | ---: | --- |
| Seven rider states | 96% | Full reducer exists with bounded state transitions and tests. |
| Local ride lifecycle | 96% | Request, mock timer, offers, active trip, completion, rating, and return to map all work locally. |
| Jordan destination dataset | 92% | 12 governorates and 50+ district/directorate anchors are present locally; coordinates still need official GIS review. |
| GPS fallback | 100% | Fallback is now Amman, Jordan, not Cairo. |
| Live fare calculation | 95% | Uses rider location or Amman fallback plus selected district anchor with H3/Haversine/tortuosity. |
| MapLibre / OpenFreeMap | 94% | Keyless map works with Arabic RTL labels and no paid map key. |
| H3 compliance | 95% | Official `h3-js` is used for cells, grid disk captain dots, cell distance, and fare support. |
| Active trip UI | 90% | Shows ETA, captain, vehicle, price, distance, local H3 tracking, and animated captain movement. |
| 72-hour ledger | 93% | Completed demo trips are inserted into Dexie and shown with countdown. |
| Green Heart vault | 90% | Favorite captains remain local/Dexie-backed. |
| Ad sections | 88% | Client ad card style is preserved; batching still needs one final shared local utility. |
| Dark matte identity | 90% | Rider flow follows navy/teal/glass visual direction. |
| Arabic copy | 86% | New rider flow is clean and simple; older shared surfaces still need another cleanup pass. |
| Backend authority | 55% | Intentionally deferred; not yet production-trustworthy. |

## What Is Aligned Now

- **State machine:** `src/components/dashboard/rider/rider-state-machine.ts` contains the seven rider states and explicit reducer actions.
- **Jordan-only destination flow:** `src/components/dashboard/rider/jordan-destinations.ts` includes the 12 Jordan governorates and district/directorate anchors.
- **Amman fallback:** `src/components/dashboard/rider/rider-map-utils.ts` now uses Amman as the offline fallback location.
- **Live location:** `src/components/dashboard/rider/rider-map.tsx` watches browser GPS and reports rider location back to the dashboard.
- **MapLibre:** the rider map renders with OpenFreeMap tiles and MapLibre, with no Google Maps visual dependency.
- **Arabic map labels:** RTL text plugin support is enabled for Arabic labels.
- **H3 captain dots:** nearby fake captains are generated from official H3 cells with `gridDisk()`.
- **Live fare quote:** `src/core/logic/geospatial-kernel.ts` now exposes `calculateSovereignFareQuote()` with H3 cells, Haversine distance, road-distance estimate, tortuosity, and guide price.
- **Offer pricing:** mock captain offers are based on the selected destination's live guide price.
- **Active trip movement:** the selected captain dot moves toward the rider during `TRIP_ACTIVE`.
- **Dexie ledger insertion:** completing a demo trip writes it into `riderTripLedger`, so the 72-hour countdown appears immediately.
- **Ad style:** the client-approved large image ad card style remains in the dashboard.
- **Local-only behavior:** no new Firebase/Supabase/backend dependency was added for this sprint.

## Missing Or Partial Components

- **District coordinates need official validation.** The current anchors are stable local rollout anchors, but should be checked against an official GIS/source-of-truth dataset before production.
- **Active trip is still a prototype animation.** The captain dot moves toward the rider, but there is no full route polyline, turn-by-turn status, or destination-progress model yet.
- **Fare is a guide price, not authority.** The local quote is excellent for demo/offline UX, but production pricing must be signed or recalculated server-side.
- **Global request shortcut needs review.** The top/header request button can still be confused with the Rider Dashboard request button in tests; it should be wired to the same reducer path or hidden in this context.
- **Ad metrics batching needs consolidation.** Visual ad style is aligned, but impression/click batching should be one local utility with the 50-event flush rule.
- **Older Arabic remains outside the newest rider flow.** Some shared history/profile/ad/support surfaces still need a scan for heavy copy or mojibake.
- **Bundle size needs optimization.** MapLibre makes the rider chunk large; production should lazy-load map/dashboard code where practical.

## Security And Backend Notes

- Current implementation is a frontend offline-first prototype.
- Do not trust local fare, local offers, local wallet values, or local trip state as production authority.
- Backend work still needs to cover:
  - secure registration callable/function,
  - pricing authority,
  - trip lifecycle authority,
  - wallet and commission settlement,
  - Firestore/Supabase rules,
  - anti-tamper checks for local/offline data,
  - kill-switch and admin decisions.

## Production Needs

1. **Validate Jordan district anchors**
   - Compare all governorate/district coordinates against an official GIS or approved client dataset.
   - Keep the dataset local, versioned, and offline-first.

2. **Unify every request entry point**
   - Make header/nav "طلب رحلة" enter the same reducer-driven flow.
   - Avoid opening any older network-backed request modal during local prototype mode.

3. **Upgrade active-trip visualization**
   - Add route polyline or staged H3 path.
   - Show captain approach, pickup, trip start, destination progress, and completion as clear local states.

4. **Finalize ad metrics batching**
   - Keep the client ad style and placement.
   - Use one local batching path for impressions/clicks.
   - Flush at the 50-event threshold or page close.

5. **Prepare backend authority phase**
   - Move trusted pricing, wallet, registration, trip writes, and settlement to backend rules/functions.
   - Keep the frontend quote as a guide/preview only.

6. **Polish remaining Arabic**
   - Scan rider-adjacent shared pages.
   - Replace mojibake, heavy terms, and inconsistent Egyptian/Jordanian wording with simple Jordan-ready Arabic.

7. **Optimize the rider bundle**
   - Lazy-load MapLibre-heavy surfaces.
   - Keep first dashboard paint fast on mobile.

## Verification Evidence

Verified after the final Jordan sprint:

- `npx tsx src/components/dashboard/rider/rider-state-machine.test.ts`
- `npx tsx src/components/dashboard/rider/rider-map-utils.test.ts`
- `npx tsx src/core/logic/geospatial-kernel.test.ts`
- `npm run lint`
- `npm run build`
- Playwright desktop flow:
  - Rider demo
  - select `العقبة / القويرة`
  - live local quote appears
  - offers are generated from quote
  - select captain
  - active trip starts
  - captain movement state appears
  - complete trip
  - rating modal
  - completed trip appears in Dexie ledger with 72-hour countdown
- Playwright mobile smoke:
  - Rider demo
  - select `إربد / الرمثا`
  - quote renders correctly on mobile viewport

Build note: MapLibre still produces a large Rider Dashboard chunk. The build passes, but production should optimize this with lazy loading/code splitting.

## Bottom Line

The Rider Dashboard is now **frontend-complete for a Jordan-first offline local demo**.

The next milestone is no longer basic UI completion. It is: **official coordinate validation + route-progress polish + ad batching cleanup + backend authority phase**.
