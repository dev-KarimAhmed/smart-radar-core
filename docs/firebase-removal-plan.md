# Removing Firebase from Radar

Status as of 2026-08-22. Written after porting the captain-rank engine to Postgres
(`supabase/migrations/20260822090000_captain_rank_sovereign_engine.sql`), which was
phase 0 of this work and is already done.

Nothing below has been implemented yet. It is a proposal to approve or redirect.

---

## 1. Where Firebase actually sits today

Two independent Firebase surfaces:

- **Client SDK** — `src/lib/firebase.ts`, imported by 15 files. Firestore reads/writes
  straight from the browser, plus FCM.
- **Server** — `server.ts` and `src/server/api/cleanup.ts` use the same client SDK
  server-side, and `server.ts` additionally verifies identity against Google Identity
  Toolkit (4 call sites) using the key in the git-ignored `firebase-applet-config.json`.
- **Cloud Functions** — `functions/`, a separate deployable. After phase 0 it still holds
  `ads`, `admin`, `cleanup`, `geo`, `trips`, `users` handlers.

### Firestore collections in use, and whether Supabase already has a home for them

| Firestore collection | Used by | Supabase counterpart |
|---|---|---|
| `users` | `server.ts` (12 refs), `cleanup.ts`, `use-pricing-matrix`, `use-sovereign-fcm`, `useSovereignDashboard`, `functions/users` | ✅ `profiles` |
| `trips` | `cleanup.ts`, `functions/trips`, `functions/cleanup` | ✅ `ride_requests` / `ride_offers` / `trips_72h_ledger` |
| `promos`, `ads` | `use-admin-ads`, `ad-cache-sentry`, `functions/ads` | ✅ `ad_campaigns` (10 rows), `ad_impression_batches`, `ad_favorites` |
| `market_pulse` | `use-market-pulse`, `functions/admin` | ✅ `global_pulse` (empty) |
| `districts`, `geographical_registry` | `functions/geo` | ✅ `countries` / `governorates` / `districts` |
| `delegates`, `delegate_links`, `delegate_tasks` | `server.ts` (8 refs), `useSovereignDashboard`, `delegates-management-tab` | ❌ nothing (`referrals` exists but is empty and a different shape) |
| `audit_ledger` | `server.ts`, `cleanup.ts` | ❌ nothing |
| `settings` | `use-sovereign-controls` (kill switch, fuel index), `functions/admin` | ❌ nothing |
| `system_counters`, `system_states` | `use-admin-ads`, `cleanup.ts` | ❌ nothing |
| `sovereign_ephemeral_chats` | `ephemeral-messages` | ❌ nothing |
| `sovereign_pushes` | `push-driven` broadcast in `push-notifications` | ❌ no table, but Supabase Realtime replaces the mechanism — see 2a(b) |
| `users.fcmTokens` | `use-sovereign-fcm` | ⚠️ FCM stays on Firebase, but the tokens need a Postgres home — see phase 7 |

### Already dead — no migration needed, just deletion

| File | Importers | Note |
|---|---|---|
| `src/core/contracts/cloud-bridge.ts` | 0 | Its `generateWeeklyReport` branch returns hardcoded mock data |
| `src/hooks/use-atomic-handshake.ts` | 0 | |
| `src/lib/audit-logger.ts` | 0 | |

---

## 2. Two problems to settle before writing any code

### 2a. Notifications: DECIDED — FCM stays on Firebase

**Decision (2026-08-22): push notifications remain on Firebase.** Phase 6 is out of scope,
and phase 7 is scoped around it accordingly.

But "notifications" is two unrelated things in this repo, and only one of them is FCM:

**(a) Real FCM — `src/hooks/use-sovereign-fcm.ts`.** Requests permission, gets a token via
`firebase/messaging`, appends it to `users.fcmTokens` in Firestore. The service worker
`public/firebase-messaging-sw.js` handles `onBackgroundMessage`. This is genuinely
Firebase-only and stays.

Two caveats about its current state: **nothing calls `useSovereignFCM`** (the only
reference is the `src/core/demarcation-catalog.ts` manifest), and **nothing in the codebase
ever sends an FCM message** — no `sendMulticast`, no admin-SDK messaging call, in `src/`,
`server.ts`, or `functions/`. So tokens are never collected and nothing is ever delivered.
Keeping FCM keeps the scaffolding; it does not keep a working feature. Making push actually
work is separate, additive work.

**(b) `src/lib/push-notifications.ts` — not FCM.** Despite the name it never touches
`firebase/messaging`. It is a Firestore `onSnapshot` broadcast channel over a
`sovereign_pushes` collection. That is exactly what Supabase Realtime does, and the repo
already has realtime migrations (`20260815_ride_requests_realtime.sql`,
`20260821120000_ride_offers_realtime.sql`) to copy from — so **it is not covered by the
"keep notifications on Firebase" decision** and should move with the rest of Firestore.

It is also currently half-wired: `broadcastSilentPush` is called from
`kill-switch-panel.tsx` and `use-admin-ads.ts`, but `subscribeToSilentPushes` and all four
`dispatch*` helpers have **zero call sites**. It writes documents nobody reads. Porting it
should probably start by deciding whether the subscriber side is wanted at all.

### 2b. `server.ts` verifies the wrong provider's tokens

`verifyFirebaseIdToken` calls Google Identity Toolkit to re-verify identity on the
sovereign `/api/*` routes — but users authenticate with **Supabase**, not Firebase. Either
those routes are being called with Firebase tokens that Supabase never issues, or the
verification is failing and the routes are unreachable. Establish which before porting
them, because it decides whether phase 5 is a migration or a repair. Replacement is
`supabase.auth.getUser(jwt)` with the service role key, or local JWT verification against
the project's JWT secret.

---

## 3. Proposed phases

Ordered so each phase is independently shippable and low-risk before the risky ones.

### Phase 1 — delete dead code
`cloud-bridge.ts`, `use-atomic-handshake.ts`, `audit-logger.ts`. Zero importers, zero risk.
Removes 3 of the 17 Firebase-touching files immediately.

### Phase 2 — ads + market pulse
Target tables already exist. `use-admin-ads`, `ad-cache-sentry`, `use-market-pulse`,
`functions/ads`, the market-pulse half of `functions/admin`. Needs a one-off data copy for
the 10 live `promos` documents, plus a `system_counters` replacement (a small
`sequences` table or a Postgres sequence).

### Phase 3 — geo + trips in `functions/`
`functions/geo` and `functions/trips` duplicate logic that `ride_requests` / `ride_offers` /
`districts` already back. Mostly deletion once confirmed nothing calls the callables — the
same check that made phase 0 safe.

### Phase 4 — settings, pricing matrix, counters
New schema, but small: kill-switch state, fuel index, pricing matrix, system counters and
states. This also retires `toggleSovereignKillSwitch` and `adminUpdateFuelIndex`, the only
two Cloud Function callables the app actually invokes today.

### Phase 5 — delegates and the audit ledger *(the big one)*
`delegates`, `delegate_links`, `delegate_tasks`, `audit_ledger`, and the `/api/*` routes in
`server.ts` built on them: dues, task state machine, magic links, signature
verification/reconciliation, driver revive, voucher redeem. Needs new schema, a data
migration, and the auth decision from 2b. The server-side single-writer guarantees
(`acquireBackendLock`) become Postgres row locks or advisory locks.

### Phase 6 — ~~push notifications~~ OUT OF SCOPE
FCM stays on Firebase by decision (2a). What *does* move, as part of phase 2 or 4, is
`src/lib/push-notifications.ts` → Supabase Realtime, since it is a Firestore broadcast
channel rather than FCM.

### Phase 7 — teardown, scoped around FCM
Keeping FCM means Firebase cannot be removed completely. What the end state looks like:

**Goes away**
- `firebase/firestore` and `firebase/auth` imports everywhere
- `functions/` and `firebase.json` — no Cloud Function is FCM-related
- `verifyFirebaseIdToken` in `server.ts` (replaced per 2b)

**Stays**
- the `firebase` package in `package.json`, but only `firebase/app` + `firebase/messaging`
- `public/firebase-messaging-sw.js`
- `firebase-applet-config.json`, still needed to initialise the messaging app

**Has to change**
- `src/lib/firebase.ts` gets trimmed to an app + messaging initialiser. Today it also
  builds `db` (`initializeFirestore`) and `auth` (`getAuth`), and exports the
  `handleFirestoreError` / `OperationType` / `FirestoreErrorInfo` helpers — all of which go
  with Firestore.
- `users.fcmTokens` needs a Postgres home (a `device_tokens` table, or a column on
  `profiles`), because `use-sovereign-fcm.ts` currently writes tokens into the Firestore
  `users` document that phase 5 removes.

### Note on the key in `public/firebase-messaging-sw.js`
CLAUDE.md states the Firebase API key is read server-side and "never shipped to the
client", but that service worker has the full config, key included, hardcoded and served
from `public/`. For Firebase web configs the API key is a public identifier by design, so
this is not a credential leak — but it does contradict the documented design, and it is the
same project key `server.ts` passes to Identity Toolkit. Worth reconciling with whatever
2b concludes.

---

## 4. What phase 0 deleted that was never ported

`functions/src/handlers/ratings.ts` was removed. Its rating aggregation and rank logic are
now in Postgres, but it also did three things that have **no Supabase equivalent**. None of
them were reachable from the app — nothing ever called `submitTripFeedback` — so nothing
regressed. Recording them so they are not lost by accident:

1. **Vehicle rating aggregation.** Firestore `vehicles/{plate}` accumulated `ratingSum`,
   `ratingCount`, `quietnessSum`, `cleanlinessSum`, `adherenceSum`. Supabase stores the
   raw `reviews.detailed_stars.vehicle` object but aggregates nothing — there is no
   `vehicles` table.
2. **The rider's 24h trip buffer.** `isBufferActive` + `lastTripBuffer` (captain id, name,
   phone, `expiresAt`) let a rider reach their last captain for 24 hours after the trip.
3. **Server-side favourites.** `favoriteDrivers` was an array on the rider document. In
   Supabase, favourites live only in Dexie/localStorage, which is also why hearts needed a
   new `reviews.gave_heart` column in phase 0.

## 5. Loose end from phase 0

Deleting the handler source does not undeploy the functions. `enforceEmergencyDescent` was
a Firestore trigger on `users/{userId}`, and `server.ts` still writes those documents, so
while it stays deployed it can still fire and write a `rank` field that nothing reads.
Remove it with one `firebase deploy --only functions`, or delete the two functions in the
Firebase console.
