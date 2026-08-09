# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server: tsx server.ts → custom Express + Next.js 16 (App Router) on :3000
npm run build            # next build, then bundle server.ts → dist/server.cjs (esbuild)
npm run start            # Run the production bundle: node dist/server.cjs
npm run preview          # next start --port 3000 (serve the Next build directly, no Express wrapper)
npm run lint             # Type-check only: tsc --noEmit (there is no ESLint step)
npm run test:unit        # Runs ~7 plain-Node test files directly via tsx (node:assert/strict), chained with &&
npm run test:architecture# Enforces the layer-boundary and TSX-styling rules below (see scripts/check-*.mjs)
npm run test:routes      # Builds+starts Next, then runs the Playwright suite in tests/routes/*.spec.ts
npm run analyze:bundle   # Prints gzip size of .next/static/chunks against tests/performance/bundle-budget.json
npm run verify           # lint && test:unit && test:architecture && test:routes && build && analyze:bundle
```

To run a single unit test, call it directly with tsx, e.g.:

```bash
npx tsx src/features/rider/state/rider-state-machine.test.ts
```

To run a single route/e2e spec, start a production Next server on port 3101 and point Playwright at it (see `scripts/run-route-tests.mjs`), or pass a filter through `npm run test:routes -- tests/routes/rider.spec.ts`.

## Architecture: mid-migration to a layered `app/features/shared` structure

`src/` contains two generations of code side by side, and `npm run test:architecture` mechanically enforces the boundary between them (`scripts/check-feature-boundaries.mjs`). Recognized layers are **`app`**, **`features`**, **`shared`**:

- `shared/**` must never import from `features/**`.
- `features/**` must never import from `app/**`.
- A file in `features/<X>` may not reach into `features/<Y>`'s internals — cross-feature imports must go through that feature's `contract.ts` (e.g. `@/features/auth/contract`), which re-exports the feature's public surface.
- `app/**` (route files) may only import from `app`, `features`, or `shared` — never directly from the legacy layers below. As of now `src/app/**` is already clean of legacy imports; keep it that way.

Everything else — **`src/core/`, `src/hooks/`, `src/lib/`, `src/components/`, `src/server/`** — is the pre-migration "legacy" location and is *not* checked by the boundary rule, because it's being phased out, not built on. Many files at these legacy paths are now **one-line re-export shims** pointing at the real implementation under `features/*` or `shared/*` (e.g. `src/hooks/use-driver-operations.ts` is just `export * from '@/features/captain/hooks/use-driver-operations'`). Before editing a file under `core/hooks/lib/components/server`, check whether it's actually a shim — if so, edit the target under `features/` or `shared/` instead. Not everything there has migrated yet though (e.g. `src/hooks/use-auth.tsx`, `use-pricing-matrix.tsx`, `use-sovereign-wallet.ts` are still real implementations in place).

New feature work should live under `src/features/<feature>/{components,hooks,services}` (mirroring the existing `auth`, `rider`, `captain`, `admin`, `advertiser`, `delegate`, `account`, `ads`, `wallet` features) or `src/shared/{components,hooks,services}` for cross-feature-safe code, with a `contract.ts` at the feature root for anything other features need to consume.

## Architecture: mandatory TSX styling convention

`npm run test:architecture` also enforces a styling convention on every `.tsx` file (`scripts/check-tsx-styles.mjs`) — violating it fails `verify`/CI, not just lint:

- Every `.tsx` file must have **exactly one** module-level `const styles = { ... } as const` object.
- `className` must never be an inline string literal or template literal — always `className={styles.someKey}` or `className={cn(styles.a, cond ? styles.b : styles.c)}`.
- No Tailwind class string may appear as a literal anywhere inside a JSX `className` expression, and no component-local variable (declared inside a function) may hold a literal Tailwind class string either — all Tailwind values live in the top-level `styles` object.
- Existing files were mechanically migrated by `scripts/migrate-tsx-styles.mjs`, which is why style keys look like `style161_1` (`style<line>_<sequence>`) — follow the same shape (a flat, unstyled-looking key name) when adding new entries by hand; don't try to rename them into something semantic.

## Two backend surfaces: Express/Next server vs. standalone Firebase Cloud Functions

- **`server.ts` (LIVE, primary)** — the custom Express server described below; this is what `npm run dev`/`build`/`start` runs.
- **`functions/` (separate deployable, LIVE but independent)** — a standalone Firebase Cloud Functions package (own `package.json`/`tsconfig.json`, `firebase-admin` + `firebase-functions`) with its own `build`/`serve`/`shell`/`deploy`/`logs` scripts (`firebase deploy --only functions`). It is excluded from the root `tsconfig.json` and from `npm run lint`/`test:unit` — treat it as its own project. Handlers live in `functions/src/handlers/{ads,admin,cleanup,drivers,geo,ratings,trips,users}.ts` and are wired up in `functions/src/index.ts` (e.g. `requestRide`, `onTripHandshake`, `registerSovereignUser`, `enforceEmergencyDescent`, `submitTripFeedback`). Check `functions/src/index.ts` before assuming a piece of trip/ride/rating logic lives only in `server.ts` — it may be a Cloud Function instead.

## One frontend entry point — the Vite SPA is dead code, not a working legacy path

`vite.config.ts` and `index.html` still exist and `index.html` still references `/src/main.tsx`, but **`src/main.tsx` and `src/App.tsx` no longer exist in the repo**, and no npm script builds or serves through Vite. This is orphaned configuration, not a second running frontend — don't spend time keeping it in sync. `src/app/` (Next App Router) is the only live UI. Root is `src/app/layout.tsx` → `src/app/providers.tsx` → `src/app/page.tsx`. Routing is done with `next/navigation` (`useRouter`, `useSearchParams`, real route segments under `src/app/`) — never hand-rolled `pushState`/`popstate`.

Auth still has two separate registration implementations — confirm which one a page renders before editing:
- `src/features/auth/components/steps/*` (`personal-step`, `role-step`, `vehicle-step`, `advertiser-step`, `admin-step`, `affiliation-step`) driven by `use-registration` (`src/features/auth/hooks/use-registration.tsx`), the real Supabase-backed flow. `src/components/auth/*` and `src/hooks/use-registration.ts` are legacy shims pointing here.
- `src/app/(auth)/register/page.tsx` → `src/features/auth/components/register-route.tsx`, a self-contained flow driven by `?role=`/`?lang=` search params whose submit handler (`submitMockAuth`) is still a mock that just `router.push`es — it does not call Supabase.

## Server architecture (`server.ts`)

Custom Express server that wraps Next.js. Express registers first, then `app.all('*all', nextHandler)` forwards everything else to Next. Key concerns baked into the server:

- **`/api/*` sovereign endpoints** — Firebase/Firestore-backed operations (driver revive, voucher redeem, commute-driver, kill-switch, delegate dues/task state machine, magic links, signature verification/reconciliation, sovereign-digger). All state-mutating routes go through an in-memory **sliding-window rate limiter** (`rateLimiterMiddleware`) and per-key **backend locks** (`acquireBackendLock`) to enforce single-writer semantics. Routes are mostly defined inline in `server.ts`, but extraction into dedicated routers under `src/server/api/` has started (e.g. `cleanupRouter` in `src/server/api/cleanup.ts`, mounted via `import { cleanupRouter } from './src/server/api/cleanup'`) — prefer that pattern for new sovereign endpoints rather than adding more inline `app.post(...)` blocks.
- **Server-authoritative trust** — identity is re-verified server-side via `verifyFirebaseIdToken` (Google Identity Toolkit); role/authorization checks happen on the server, not trusted from the client. Cryptographic integrity signatures for delegates are computed server-side with a secret salt.
- **SSRF-hardened proxy** — `/api/sovereign-digger` (coordinate extraction from shortened map links) uses `isSafeUrl`/`isSafeIp`/`secureFetch` with manual DNS resolution to block private-network / metadata-endpoint access and DNS rebinding.

The Firebase API key is read server-side from `firebase-applet-config.json` (git-ignored), never shipped to the client.

## Backend duality: Supabase + Firebase

Both are used, for different things:

- **Supabase** (`src/lib/supabase-client.ts`, `supabase-auth.ts`) — user **auth** (phone + password) and reference data (`countries`/`governorates`/`districts` tables). `use-auth.tsx` (`AuthProvider`, `src/hooks/use-auth.tsx`, re-exported through `src/features/auth/contract.ts`) subscribes to `supabase.auth.onAuthStateChange` and maps sessions via `buildUserFromSupabaseAuth`.
- **Firebase/Firestore** (`src/lib/firebase.ts`, used from `server.ts` and from `functions/`) — live operational data: users, delegates, tasks, audit ledger, magic links, trips.

Client env is exposed via `NEXT_PUBLIC_*` (Next) — Supabase reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `vite.config.ts` also allows `VITE_` and `NEXT_PUBLIC_` prefixes, though (per above) nothing currently runs through it.

## App structure & conventions

- **Path alias**: `@/*` → `src/*` (tsconfig + vite.config.ts).
- **Roles**: `rider`, `driver` (labelled "Captain"), `advertiser`, `delegate`, `admin`. After login, `src/app/page.tsx` redirects `driver → /captain`, `rider → /rider`; other roles fall through. Role dashboards wrap `<Dashboard />` in role-specific operations providers (`RiderOperationsProvider` in `src/features/rider/components/rider-workspace.tsx`, `DriverOperationsProvider`-equivalent in `src/features/captain/components/captain-workspace.tsx`).
- **Domain model / business logic**: `src/core/` (types, contracts, logic, `RadarAntiCheatKernel.ts`) — this is the legacy `core` layer, not a `features/*/contract.ts`. `src/hooks/` and `src/features/*/hooks/` hold stateful feature logic (`use-registration`, `use-driver-operations`, `use-pricing-matrix`, `use-sovereign-*`, etc.) — check for a re-export shim before assuming which path has the real code.
- **Route guard**: `src/app/routes.ts` exports `useSovereignRouteGuard(user)` — client middleware that ejects a role from paths/hashes it may not access (e.g. rider hitting `/advertiser` or `/admin`) and logs a security breach via `trackSovereignError` (`@/shared/services/error-tracker`).
- **UI**: shadcn/Radix primitives in `src/components/ui`; Tailwind v4 (see the mandatory styles-object convention above). The app is **Arabic-first / RTL** (`<html lang="ar" dir="rtl">`), bilingual ar/en driven by `use-dashboard-language` (`getDeviceDashboardLanguage`/`persistDashboardLanguage` + a `DASHBOARD_LANGUAGE_EVENT`; real implementation under `src/shared/hooks/use-dashboard-language.ts`). Theme colors: teal `#14B8A6` accent on `#0B0F19`/`#0A0F1D` dark backgrounds.
- **Naming**: much of the codebase uses "sovereign" terminology (Arabic project framing) for security/ownership features — treat `sovereign*` files as core infra, not throwaway.

## Design philosophy (from README)

"Zero-cost, backend-first." Heavy geo math runs on-device (local Haversine, ~1.1km geo-grid cells for O(1) trip lookup, `src/lib/geo-grid.ts`) to avoid paid map APIs; the server (both `server.ts` and `functions/`) is the sole authority for security-sensitive decisions; Firestore documents model trips as ephemeral geo-scoped entries that expire/purge (see `cleanupRouter` and `functions/src/handlers/cleanup.ts`).
