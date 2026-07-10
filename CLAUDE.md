# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server: tsx server.ts → custom Express + Next.js 16 (App Router) on :3000
npm run build    # next build, then bundle server.ts → dist/server.cjs (esbuild)
npm run start    # Run the production bundle: node dist/server.cjs
npm run lint     # Type-check only: tsc --noEmit  (there is no ESLint step)
```

There is **no `test` script**. Test files (e.g. `src/lib/supabase-auth.test.ts`) are plain Node scripts using `node:assert/strict` — run one directly:

```bash
npx tsx src/lib/supabase-auth.test.ts
```

`@playwright/test` is installed but there is no Playwright config or e2e suite yet.

## Critical: two parallel frontends — Next.js is authoritative

The repo contains **two entry points**. Only the Next.js one runs under `npm run dev`/`build`:

- **Next.js App Router (LIVE)** — `server.ts` calls `next()`; the real page tree is `src/app/`. Root is `src/app/layout.tsx` → `src/app/providers.tsx` → `src/app/page.tsx`. Routing is done with `next/navigation` (`useRouter`, `useSearchParams`, real route segments under `src/app/`).
- **Vite SPA (LEGACY / not used by dev or build)** — `src/main.tsx` + `src/App.tsx` + `vite.config.ts`. `App.tsx` imports `virtual:pwa-register/react` (a Vite-only virtual module) and does hand-rolled `window.history.pushState` + `popstate` routing. **Editing `App.tsx` has no effect on the running app.**

When changing navigation/routing, use Next route segments and `next/navigation` — not manual `pushState`/`popstate`. Shared leaf components (e.g. `src/components/auth/login-page.tsx`) are imported by *both* entries, so edits there do affect the live Next app.

Note: auth has overlapping implementations — `src/components/auth/*` (the step/`useRegistration` flow, wired to real Supabase) and the standalone `src/app/(auth)/register/page.tsx` (a self-contained Next route using `?role=` search params, mock submit). Confirm which one a page actually renders before editing.

## Server architecture (`server.ts`)

Custom Express server that wraps Next.js. Express registers first, then `app.all('*all', nextHandler)` forwards everything else to Next. Key concerns baked into the server:

- **`/api/*` sovereign endpoints** — Firebase/Firestore-backed operations (driver revive, voucher redeem, kill-switch, delegate dues/task state machine, magic links). All state-mutating routes go through an in-memory **sliding-window rate limiter** and per-key **backend locks** (`acquireBackendLock`) to enforce single-writer semantics.
- **Server-authoritative trust** — identity is re-verified server-side via `verifyFirebaseIdToken` (Google Identity Toolkit); role/authorization checks happen on the server, not trusted from the client. Cryptographic integrity signatures for delegates are computed server-side with a secret salt.
- **SSRF-hardened proxy** — `/api/sovereign-digger` (coordinate extraction from shortened map links) uses `isSafeUrl`/`isSafeIp`/`secureFetch` with manual DNS resolution to block private-network / metadata-endpoint access and DNS rebinding.

The Firebase API key is read server-side from `firebase-applet-config.json` (git-ignored), never shipped to the client.

## Backend duality: Supabase + Firebase

Both are used, for different things:

- **Supabase** (`src/lib/supabase-client.ts`, `supabase-auth.ts`) — user **auth** (phone + password) and reference data (`countries`/`governorates`/`districts` tables). `use-auth.tsx` (`AuthProvider`) subscribes to `supabase.auth.onAuthStateChange` and maps sessions via `buildUserFromSupabaseAuth`.
- **Firebase/Firestore** (`src/lib/firebase.ts`, used from `server.ts`) — live operational data: users, delegates, tasks, audit ledger, magic links.

Client env is exposed via `NEXT_PUBLIC_*` (Next) — Supabase reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `vite.config.ts` also allows `VITE_` and `NEXT_PUBLIC_` prefixes for the legacy entry.

## App structure & conventions

- **Path alias**: `@/*` → `src/*` (tsconfig + both bundlers).
- **Roles**: `rider`, `driver` (labelled "Captain"), `advertiser`, `delegate`, `admin`. After login, `src/app/page.tsx` redirects `driver → /captain`, `rider → /rider`; other roles fall through. Role dashboards wrap `<Dashboard />` in role-specific operations providers (`RiderOperationsProvider`, `DriverOperationsProvider`).
- **Domain model / business logic**: `src/core/` (types, contracts, logic, `RadarAntiCheatKernel.ts`). `src/hooks/` holds the stateful feature logic (`use-registration`, `use-driver-operations`, `use-pricing-matrix`, `use-sovereign-*`, etc.), grouped by role in `hooks/{admin,driver,rider}/`.
- **Route guard**: `src/app/routes.ts` exports `useSovereignRouteGuard(user)` — client middleware that ejects a role from paths/hashes it may not access (e.g. rider hitting `/advertiser` or `/admin`) and logs a security breach.
- **UI**: shadcn/Radix primitives in `src/components/ui`; Tailwind v4. The app is **Arabic-first / RTL** (`<html lang="ar" dir="rtl">`), bilingual ar/en driven by `use-dashboard-language` (`getDeviceDashboardLanguage`/`persistDashboardLanguage` + a `DASHBOARD_LANGUAGE_EVENT`). Theme colors: teal `#14B8A6` accent on `#0B0F19`/`#0A0F1D` dark backgrounds.
- **Naming**: much of the codebase uses "sovereign" terminology (Arabic project framing) for security/ownership features — treat `sovereign*` files as core infra, not throwaway.

## Design philosophy (from README)

"Zero-cost, backend-first." Heavy geo math runs on-device (local Haversine, ~1.1km geo-grid cells for O(1) trip lookup) to avoid paid map APIs; the server is the sole authority for security-sensitive decisions; Firestore documents model trips as ephemeral geo-scoped entries.
