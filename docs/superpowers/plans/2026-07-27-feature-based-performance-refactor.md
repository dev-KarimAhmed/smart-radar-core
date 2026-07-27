# Feature-Based Performance Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every application route and role to feature-owned modules, enforce one module-level `styles` object per `.tsx` file, and reach the approved Lighthouse mobile performance thresholds without changing behavior or appearance.

**Architecture:** Route files become thin server-compatible composition points that dynamically load role-specific client shells. Business code moves from the legacy `components/dashboard` and broad `hooks` folders into focused `features/*` packages, while generic infrastructure moves to `shared/*`. Compatibility re-exports keep each intermediate commit runnable and are deleted after all consumers migrate.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.8, Tailwind CSS, Supabase, Firebase, Dexie/IndexedDB, MapLibre, H3, OSRM, Node assertions through `tsx`, Playwright, Lighthouse CI.

## Global Constraints

- Preserve every existing URL, hash route, external event name, storage key, visual state, responsive layout, Arabic/English string, backend payload, offline behavior, and ride-state transition.
- Every `.tsx` file must define exactly one module-level `const styles = { ... } as const`.
- JSX and component bodies must contain no Tailwind class string literals; use `styles.key` or `cn(styles.key, condition && styles.variant)`.
- Use direct imports on performance-sensitive paths; do not introduce broad feature barrel imports.
- `/rider` and `/captain` must score at least 90 Lighthouse mobile Performance.
- Every other route must score at least 80 Lighthouse mobile Performance.
- Measure Lighthouse against a production build in a clean browser context with cache, service workers, local storage, and IndexedDB cleared.
- Follow red-green-refactor for behavior and architecture changes.
- Do not delete compatibility adapters until all consumers have migrated.
- Preserve unrelated working-tree changes.

---

## Target File Map

```text
src/
  app/
    (auth)/register/page.tsx
    captain/page.tsx
    rider/page.tsx
    page.tsx
  features/
    auth/{components,hooks,services}/
    rider/{components,hooks,services,state}/
    captain/{components,hooks,services,state}/
    advertiser/{components,hooks,services}/
    delegate/{components,hooks,services}/
    admin/{components,hooks,services}/
    ads/{components,hooks,services}/
    profile/{components,hooks,services}/
    wallet/{components,hooks,services}/
    history/{components,hooks,services}/
    vault/components/
  shared/
    components/{layout,providers,ui}/
    hooks/
    services/
    types/
    utils/
tests/
  architecture/
  performance/
  routes/
```

The old paths remain as direct compatibility re-exports until Task 11.

---

### Task 1: Establish Architecture and Performance Baselines

**Files:**
- Modify: `package.json`
- Create: `scripts/check-tsx-styles.mjs`
- Create: `scripts/check-feature-boundaries.mjs`
- Create: `tests/architecture/tsx-styles.test.mjs`
- Create: `tests/architecture/feature-boundaries.test.mjs`
- Create: `tests/performance/bundle-budget.mjs`
- Create: `docs/performance/2026-07-27-baseline.md`

**Interfaces:**
- Produces: `npm run test:architecture`, `npm run test:unit`, `npm run test:routes`, `npm run analyze:bundle`, and `npm run verify`.
- Produces: `checkTsxStyles(rootDir): Promise<Violation[]>` where `Violation` is `{ file: string; reason: string; line: number }`.
- Produces: `checkFeatureBoundaries(rootDir): Promise<Violation[]>`.

- [ ] **Step 1: Write failing architecture tests**

```js
// tests/architecture/tsx-styles.test.mjs
import assert from 'node:assert/strict';
import { checkTsxStyles } from '../../scripts/check-tsx-styles.mjs';

const violations = await checkTsxStyles(new URL('../../src', import.meta.url));
assert.deepEqual(violations, [], violations.map((item) =>
  `${item.file}:${item.line} ${item.reason}`
).join('\n'));
```

```js
// tests/architecture/feature-boundaries.test.mjs
import assert from 'node:assert/strict';
import { checkFeatureBoundaries } from '../../scripts/check-feature-boundaries.mjs';

assert.deepEqual(
  await checkFeatureBoundaries(new URL('../../src', import.meta.url)),
  [],
);
```

- [ ] **Step 2: Run the tests and record the expected RED state**

Run:

```powershell
node tests/architecture/tsx-styles.test.mjs
node tests/architecture/feature-boundaries.test.mjs
```

Expected: style test reports the existing inline `className` strings; boundary test reports missing checker implementation.

- [ ] **Step 3: Implement the scanners**

`checkTsxStyles` must parse every `.tsx` file and report:

- missing module-level `const styles = {`;
- more than one module-level `styles` object;
- `className="..."`;
- ``className={`...`}``;
- Tailwind-looking literals passed directly to `cn()` from inside JSX.

`checkFeatureBoundaries` must enforce:

```js
const allowed = {
  app: new Set(['features', 'shared']),
  features: new Set(['shared']),
  shared: new Set(),
};
```

Imports within the same feature are allowed. Cross-feature imports are allowed only through a declared public contract file named `contract.ts`.

- [ ] **Step 4: Add reproducible scripts**

```json
{
  "scripts": {
    "test:unit": "tsx src/core/logic/geospatial-kernel.test.ts && tsx src/lib/google-maps-location.test.ts && tsx src/lib/supabase-auth.test.ts && tsx src/components/dashboard/rider/rider-district-query.test.ts && tsx src/components/dashboard/rider/rider-server-marketplace.test.ts && tsx src/components/dashboard/rider/rider-state-machine.test.ts",
    "test:architecture": "node tests/architecture/tsx-styles.test.mjs && node tests/architecture/feature-boundaries.test.mjs",
    "test:routes": "playwright test tests/routes",
    "analyze:bundle": "node tests/performance/bundle-budget.mjs",
    "verify": "npm run lint && npm run test:unit && npm run test:architecture && npm run test:routes && npm run build && npm run analyze:bundle"
  }
}
```

- [ ] **Step 5: Capture the baseline without changing production code**

Run the production build, list `.next/static/chunks` by raw and gzip size, and run Lighthouse mobile against `/`, `/rider`, `/captain`, and `/register?role=rider`.

Record the exact command, timestamp, commit, environment, chunk sizes, LCP, INP/TBT, CLS, and Performance score in `docs/performance/2026-07-27-baseline.md`. Note the clean-profile requirement and the screenshot’s existing score of 33 as user-supplied evidence, not as the reproducible baseline.

- [ ] **Step 6: Commit**

```powershell
git add package.json scripts tests/architecture tests/performance docs/performance/2026-07-27-baseline.md
git commit -m "test: establish architecture and performance baselines"
```

---

### Task 2: Create Shared Providers and Route Infrastructure

**Files:**
- Create: `src/shared/components/providers/app-providers.tsx`
- Create: `src/shared/components/providers/deferred-client-tools.tsx`
- Create: `src/shared/components/layout/route-loading.tsx`
- Create: `src/shared/components/layout/route-error-boundary.tsx`
- Create: `src/shared/components/layout/app-header.tsx`
- Create: `src/shared/components/layout/bottom-nav.tsx`
- Modify: `src/app/providers.tsx`
- Modify: `src/components/app-header.tsx`
- Modify: `src/components/layout/bottom-nav.tsx`
- Test: `tests/routes/root-shell.spec.ts`

**Interfaces:**
- Produces: `AppProviders({ children }: PropsWithChildren)`.
- Produces: `DeferredClientTools()` dynamically containing `PwaUpdater`, `PwaInstallPrompt`, and `Toaster`.
- Produces: `RouteLoading({ label }: { label: string })`.

- [ ] **Step 1: Write a failing route-shell test**

```ts
import { test, expect } from '@playwright/test';

test('root shell becomes interactive before deferred PWA tools load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('[data-route-loading]')).toHaveCount(0);
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npx playwright test tests/routes/root-shell.spec.ts
```

Expected: failure because the route has no stable `main`/loading contract.

- [ ] **Step 3: Extract shared providers**

Keep `QueryProvider`, `LocaleProvider`, `AuthProvider`, and the top-level error boundary synchronous. Load noncritical PWA/update tools after hydration:

```tsx
const DeferredClientTools = dynamic(
  () => import('./deferred-client-tools').then((module) => module.DeferredClientTools),
  { ssr: false },
);
```

Every new or modified `.tsx` file must use its module-level `styles` object.

- [ ] **Step 4: Preserve old imports**

Make old layout files direct re-exports:

```tsx
export { AppHeader } from '@/shared/components/layout/app-header';
```

- [ ] **Step 5: Verify**

Run:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
npx playwright test tests/routes/root-shell.spec.ts
```

- [ ] **Step 6: Commit**

```powershell
git add src/app/providers.tsx src/shared src/components/app-header.tsx src/components/layout/bottom-nav.tsx tests/routes/root-shell.spec.ts
git commit -m "refactor: extract shared route infrastructure"
```

---

### Task 3: Migrate Authentication and Registration

**Files:**
- Create: `src/features/auth/components/login-page.tsx`
- Create: `src/features/auth/components/register-route.tsx`
- Create: `src/features/auth/components/steps/admin-step.tsx`
- Create: `src/features/auth/components/steps/advertiser-step.tsx`
- Create: `src/features/auth/components/steps/affiliation-step.tsx`
- Create: `src/features/auth/components/steps/personal-step.tsx`
- Create: `src/features/auth/components/steps/role-step.tsx`
- Create: `src/features/auth/components/steps/vehicle-step.tsx`
- Create: `src/features/auth/hooks/use-registration.tsx`
- Create: `src/features/auth/services/supabase-auth.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`
- Replace with re-exports: `src/components/auth/*.tsx`, `src/hooks/use-registration.tsx`, `src/lib/supabase-auth.ts`
- Test: `src/features/auth/services/supabase-auth.test.ts`
- Test: `tests/routes/auth.spec.ts`

**Interfaces:**
- Produces: `LoginPage`, `RegisterRoute`.
- Produces: existing `useRegistration` and Supabase auth exports without signature changes.

- [ ] **Step 1: Move the existing auth service test first**

Update imports in the copied test to `./supabase-auth`; run it before moving production code.

Expected: RED with module-not-found for `src/features/auth/services/supabase-auth.ts`.

- [ ] **Step 2: Move auth services and hooks with compatibility re-exports**

Use `Move-Item` only after resolving and verifying every source and destination path remains under the repository. Preserve git history with `git mv` where possible.

- [ ] **Step 3: Split registration route composition from the route file**

`src/app/(auth)/register/page.tsx` becomes:

```tsx
import { Suspense } from 'react';
import { RegisterRoute } from '@/features/auth/components/register-route';

const styles = {
  fallback: 'flex min-h-dvh items-center justify-center bg-[#0B0F19] text-slate-100',
} as const;

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className={styles.fallback}>Loading layout parameters...</div>}>
      <RegisterRoute />
    </Suspense>
  );
}
```

- [ ] **Step 4: Convert all auth `.tsx` files to local styles objects**

Convert these files completely:

```text
src/features/auth/components/login-page.tsx
src/features/auth/components/register-route.tsx
src/features/auth/components/steps/admin-step.tsx
src/features/auth/components/steps/advertiser-step.tsx
src/features/auth/components/steps/affiliation-step.tsx
src/features/auth/components/steps/personal-step.tsx
src/features/auth/components/steps/role-step.tsx
src/features/auth/components/steps/vehicle-step.tsx
src/features/auth/hooks/use-registration.tsx
src/app/page.tsx
src/app/(auth)/register/page.tsx
```

- [ ] **Step 5: Verify auth behavior**

Playwright must check language switching, login/register mode, role deep link, governorate/district selection, and existing redirect destinations.

- [ ] **Step 6: Commit**

```powershell
git add src/app src/features/auth src/components/auth src/hooks/use-registration.tsx src/lib/supabase-auth.ts tests/routes/auth.spec.ts
git commit -m "refactor: migrate authentication feature"
```

---

### Task 4: Build Independent Rider Route and Feature

**Files:**
- Create: `src/features/rider/components/rider-route.tsx`
- Create: `src/features/rider/components/rider-shell.tsx`
- Move: `src/components/dashboard/rider-view-tab.tsx` to `src/features/rider/components/rider-view.tsx`
- Move: `src/components/dashboard/rider/*.tsx` to `src/features/rider/components/`
- Move: `src/components/dashboard/rider/*.ts` to `src/features/rider/state/` or `src/features/rider/services/`
- Move: `src/hooks/rider/use-rider-trip-listener.ts` to `src/features/rider/hooks/use-rider-trip-listener.ts`
- Move: `src/hooks/use-rider-operations.tsx` to `src/features/rider/hooks/use-rider-operations.tsx`
- Move: `src/hooks/use-rider-sidebar-radar.ts` to `src/features/rider/hooks/use-rider-sidebar-radar.ts`
- Move: `src/hooks/use-rider-transactions.tsx` to `src/features/rider/hooks/use-rider-transactions.tsx`
- Modify: `src/app/rider/page.tsx`
- Test: `tests/routes/rider.spec.ts`
- Test: migrated rider unit tests

**Interfaces:**
- Produces: `RiderRoute()`.
- Preserves: `RiderOperationsProvider`, rider state-machine events, `rider-open-destination`, `exit-request-flow`, and current storage keys.

- [ ] **Step 1: Add failing rider route tests**

```ts
test('rider route does not load captain or admin chunks', async ({ page }) => {
  const scripts = new Set<string>();
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.add(request.url());
  });
  await page.goto('/rider');
  await expect(page.locator('main')).toBeVisible();
  expect([...scripts].join('\n')).not.toMatch(/admin|driver-view|advertiser-portal/);
});
```

Add tests for standby ads, opening destination selection, profile/history/vault hashes, active-trip hash lock, and the single districts request regression.

- [ ] **Step 2: Verify RED**

Expected: the current shared `Dashboard` loads cross-role dependencies and violates the route chunk assertion.

- [ ] **Step 3: Introduce the rider-only route shell**

`src/app/rider/page.tsx` dynamically imports only `RiderRoute`. `RiderRoute` owns `RiderOperationsProvider`; `RiderShell` owns rider navigation and lazy feature tabs.

- [ ] **Step 4: Isolate expensive rider chunks**

Use `next/dynamic` for:

```tsx
const RiderMap = dynamic(() => import('./rider-map').then((module) => module.RiderMap), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
const RiderHistory = dynamic(() => import('@/features/history/components/rider-history'));
const RiderProfile = dynamic(() => import('@/features/profile/components/rider-profile'));
const RiderVault = dynamic(() => import('@/features/vault/components/rider-vault'));
```

Do not load destination search, rating UI, or offer gallery before their state makes them visible.

- [ ] **Step 5: Split the 3,385-line rider view by state**

Extract destination selection, standby, searching/offers, active trip, completion/rating, and emergency-contact UI into separate focused files under `src/features/rider/components/`. Keep state orchestration in `rider-view.tsx`; do not duplicate subscriptions.

- [ ] **Step 6: Stabilize rendering**

Split contexts into state and actions, memoize provider values, keep map/GPS transient values in focused hooks, use primitive dependencies, and preserve request deduplication through `buildDistrictLoadKey`.

- [ ] **Step 7: Convert every rider `.tsx` file to the styles-object rule**

Run the architecture checker scoped to `src/features/rider` until it reports zero violations.

- [ ] **Step 8: Verify and commit**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\tsx.cmd src\features\rider\state\rider-state-machine.test.ts
.\node_modules\.bin\tsx.cmd src\features\rider\services\rider-server-marketplace.test.ts
npx playwright test tests/routes/rider.spec.ts
git add src/app/rider src/features/rider src/components/dashboard/rider* src/hooks tests/routes/rider.spec.ts
git commit -m "refactor: migrate rider feature and route"
```

---

### Task 5: Build Independent Captain Route and Feature

**Files:**
- Create: `src/features/captain/components/captain-route.tsx`
- Create: `src/features/captain/components/captain-shell.tsx`
- Move: `src/components/dashboard/driver-view-tab.tsx`
- Move: `src/components/dashboard/driver-pricing-card.tsx`
- Move: `src/components/dashboard/driver/*.tsx`
- Move: `src/components/dashboard/driver/*.ts`
- Move: `src/hooks/driver/*.ts`
- Move: `src/hooks/use-driver-lifecycle.ts`
- Move: `src/hooks/use-driver-operations.tsx`
- Modify: `src/app/captain/page.tsx`
- Test: `tests/routes/captain.spec.ts`

**Interfaces:**
- Produces: `CaptainRoute()`.
- Preserves: `DriverOperationsProvider`, current radar/bidding/trip events, state transitions, and storage keys.

- [ ] **Step 1: Write and run failing route/chunk tests**

Assert `/captain` loads no rider, advertiser, delegate, or admin chunks. Cover radar, bid submission, active trip, rating, profile, and wallet navigation.

- [ ] **Step 2: Create the captain-only route composition**

The route dynamically imports `CaptainRoute`, which owns the provider and shell without importing the legacy dashboard dispatcher.

- [ ] **Step 3: Split high-frequency rendering**

Keep location pulse, presence pruning, ETA, and map state below memoized shell boundaries. Load MapLibre only with `radar-map-view`; load the bidding sheet only when opened.

- [ ] **Step 4: Convert captain `.tsx` files to local style objects**

Run the scoped architecture checker and TypeScript after each extracted screen.

- [ ] **Step 5: Verify and commit**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
npx playwright test tests/routes/captain.spec.ts
git add src/app/captain src/features/captain src/components/dashboard/driver* src/hooks/driver src/hooks/use-driver*
git commit -m "refactor: migrate captain feature and route"
```

---

### Task 6: Add Explicit Routes for Advertiser, Delegate, and Admin

**Files:**
- Create: `src/app/advertiser/page.tsx`
- Create: `src/app/delegate/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/features/advertiser/components/advertiser-route.tsx`
- Move: `src/components/dashboard/advertiser-portal.tsx` and advertiser hooks/services
- Create: `src/features/delegate/components/delegate-route.tsx`
- Move: `src/components/dashboard/delegate-portal.tsx`
- Create: `src/features/admin/components/admin-route.tsx`
- Move: `src/components/dashboard/admin-view-tab.tsx`
- Move: `src/components/dashboard/admin/**`
- Move: `src/components/admin/pulse-heatmap.tsx`
- Move: `src/hooks/admin/useSovereignDashboard.ts`
- Test: `tests/routes/role-portals.spec.ts`

**Interfaces:**
- Produces: `AdvertiserRoute`, `DelegateRoute`, and `AdminRoute`.
- Updates post-auth routing so these roles reach their explicit routes.

- [ ] **Step 1: Write failing role redirect and chunk-isolation tests**

Test each authenticated role’s URL, main heading, hash navigation, and absence of other role chunks.

- [ ] **Step 2: Add thin route files and focused shells**

Each route dynamically imports its feature entry. Charts, heatmaps, simulators, campaign editors, and management panels load only when their tab opens.

- [ ] **Step 3: Move role-owned hooks and services**

Keep backend signatures unchanged and leave compatibility re-exports at old paths.

- [ ] **Step 4: Convert all migrated `.tsx` files to local style objects**

Large files must be split by visible screen or panel, not by arbitrary line count.

- [ ] **Step 5: Verify and commit**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
npx playwright test tests/routes/role-portals.spec.ts
git add src/app src/features/advertiser src/features/delegate src/features/admin src/components src/hooks
git commit -m "refactor: migrate role portal features"
```

---

### Task 7: Migrate Cross-Role Business Features

**Files:**
- Move: `src/components/dashboard/ad-stage.tsx`, `ad-display-card.tsx`, `ad-stage-scroll.ts` to `src/features/ads/`
- Move: `src/hooks/use-ad-campaigns.ts`, `use-admin-ads.ts`, `use-promo-stream.ts`
- Move: `src/components/dashboard/profile-tab.tsx` to `src/features/profile/components/profile-screen.tsx`
- Move: `src/components/dashboard/wallet-tab.tsx` to `src/features/wallet/components/wallet-screen.tsx`
- Move: `src/components/dashboard/history-tab.tsx` to `src/features/history/components/history-screen.tsx`
- Move: `src/components/dashboard/vault-tab.tsx` to `src/features/vault/components/vault-screen.tsx`
- Move matching hooks: `use-sovereign-wallet.ts`, `use-sovereign-fleet.ts`, and `use-sovereign-controls.ts` to their owning feature
- Test: `tests/routes/cross-role-tabs.spec.ts`

**Interfaces:**
- Produces role-aware props rather than reading all role providers internally:

```ts
interface RoleFeatureContext {
  role: 'rider' | 'driver' | 'advertiser' | 'delegate' | 'admin';
  userId: string;
  language: AppLanguage;
}
```

- [ ] **Step 1: Write failing tab compatibility tests**

For every role, verify existing hashes show the same profile, wallet, history, vault, and ad states allowed before the refactor.

- [ ] **Step 2: Extract feature contracts**

Replace broad provider reads with the narrow `RoleFeatureContext` and explicit callback props. Keep mutation and query hooks inside their feature.

- [ ] **Step 3: Lazy-load feature screens from each role shell**

Do not import history, profile, wallet, vault, or ad administration into a role’s initial home chunk.

- [ ] **Step 4: Convert styles and verify**

Run unit tests, scoped architecture checks, and the cross-role Playwright suite.

- [ ] **Step 5: Commit**

```powershell
git add src/features/ads src/features/profile src/features/wallet src/features/history src/features/vault src/components/dashboard src/hooks tests/routes/cross-role-tabs.spec.ts
git commit -m "refactor: migrate cross role business features"
```

---

### Task 8: Migrate Remaining Shared UI, Hooks, and Services

**Files:**
- Move: `src/components/ui/*.tsx` to `src/shared/components/ui/`
- Move: `src/components/providers/*.tsx` to `src/shared/components/providers/`
- Move: `src/components/shared/*.tsx` to the actual owning feature or `src/shared/components/`
- Move generic hooks: `src/hooks/use-auth.tsx`, `use-dashboard-language.ts`, `use-toast.ts`
- Move generic libraries from `src/lib` to `src/shared/services` or `src/shared/utils`
- Retain core domain kernels under `src/core`
- Test: existing unit suite
- Test: architecture suite

**Interfaces:**
- Preserves current exported component and hook signatures.
- Produces temporary direct re-exports at old paths.

- [ ] **Step 1: Write failing feature-boundary cases**

Add fixtures proving `shared` cannot import `features`, and one feature cannot import another feature’s internal file.

- [ ] **Step 2: Move generic modules**

Classify by ownership. Files containing rider, captain, advertiser, delegate, or admin policy belong to that feature even if multiple components use them.

- [ ] **Step 3: Convert all moved `.tsx` files to style objects**

Variants built with `class-variance-authority` may keep class strings in module-level variant definitions, but the file still has one `styles` object and JSX references only named module-level values.

- [ ] **Step 4: Verify and commit**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
node tests/architecture/feature-boundaries.test.mjs
git add src/shared src/components src/hooks src/lib tests/architecture
git commit -m "refactor: consolidate shared application infrastructure"
```

---

### Task 9: Complete Repository-Wide Styles Migration

**Files:**
- Modify: every remaining `src/**/*.tsx`
- Modify: `scripts/check-tsx-styles.mjs`
- Test: `tests/architecture/tsx-styles.test.mjs`

**Interfaces:**
- Produces zero style violations across all 92 currently identified `.tsx` files and any new `.tsx` files added during migration.

- [ ] **Step 1: Tighten the checker and verify RED**

Reject:

```tsx
className="..."
className={`...`}
className={cn('...', condition && '...')}
const localClass = '...'; // inside a component
```

Allow:

```tsx
const styles = { root: '...' } as const;
className={styles.root}
className={cn(styles.root, condition && styles.active)}
```

- [ ] **Step 2: Convert remaining route, provider, layout, PWA, boundary, and UI files**

Use semantic keys describing element purpose. Preserve class order and exact string values to avoid visual changes.

- [ ] **Step 3: Run the mutation check**

Temporarily add one inline class to a fixture `.tsx`; verify the checker fails with file and line, then remove the fixture and verify green.

- [ ] **Step 4: Verify and commit**

```powershell
node tests/architecture/tsx-styles.test.mjs
.\node_modules\.bin\tsc.cmd --noEmit
git add src scripts/check-tsx-styles.mjs tests/architecture/tsx-styles.test.mjs
git commit -m "style: enforce file level style objects"
```

---

### Task 10: Optimize Startup, Rendering, and Data Fetching

**Files:**
- Modify: role route shells and feature providers
- Modify: `src/shared/components/providers/deferred-client-tools.tsx`
- Create: `tests/performance/request-count.spec.ts`
- Create: `tests/performance/render-isolation.spec.ts`
- Modify: `tests/performance/bundle-budget.mjs`

**Interfaces:**
- Preserves public UI behavior while enforcing request and chunk budgets.

- [ ] **Step 1: Write failing performance regressions**

Measure:

- one countries request per route initialization;
- one governorates request per selected country;
- one districts request per selected governorate;
- no repeated request caused by a selected district or pin;
- no admin/captain/advertiser chunks on `/rider`;
- no rider/admin/advertiser chunks on `/captain`;
- no MapLibre chunk until a map becomes visible.

- [ ] **Step 2: Remove startup waterfalls**

Start independent authentication/reference-data requests together. Use React Query keys for deduplication where persistence already exists. Do not add a second cache beside React Query and Dexie for the same data.

- [ ] **Step 3: Isolate frequent updates**

Move GPS, ETA, scan animation, and realtime counters into leaf components or external-store selectors. Memoize only components with measured rerender pressure. Use `startTransition` for nonurgent tab/search updates and `useDeferredValue` for destination result rendering.

- [ ] **Step 4: Defer noncritical work**

Initialize notification permission, PWA update checks, ad cache cleanup, and long-lived IndexedDB maintenance after the first interaction or idle callback, with safe timeouts for browsers lacking `requestIdleCallback`.

- [ ] **Step 5: Verify request, render, and bundle budgets**

```powershell
npx playwright test tests/performance
npm run build
node tests/performance/bundle-budget.mjs
```

- [ ] **Step 6: Commit**

```powershell
git add src tests/performance
git commit -m "perf: isolate rendering and defer noncritical work"
```

---

### Task 11: Remove the Legacy Dispatcher and Compatibility Layer

**Files:**
- Delete: `src/components/dashboard/index.tsx`
- Delete: obsolete compatibility re-export files under `src/components/dashboard`, `src/components/auth`, and `src/hooks`
- Modify: all remaining imports identified by `rg`
- Modify: `src/core/demarcation-catalog.ts`
- Modify: `src/SOVEREIGN_CODE_ARCHIVE.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- All application imports resolve directly to `features/*`, `shared/*`, or `core/*`.

- [ ] **Step 1: Add a failing legacy-import architecture assertion**

Reject imports beginning with:

```text
@/components/dashboard
@/components/auth
@/hooks/use-rider
@/hooks/use-driver
```

- [ ] **Step 2: Verify every old path has zero consumers**

```powershell
rg -n "@/components/dashboard|@/components/auth|@/hooks/use-rider|@/hooks/use-driver" src
```

Expected before deletion: only compatibility modules or documentation references.

- [ ] **Step 3: Delete resolved compatibility files**

Resolve each target path before deletion and verify it is inside `D:\freelance\Radar\smart-radar-core\src`. Do not recursively delete broad directories until their complete file lists have been reviewed.

- [ ] **Step 4: Update architectural documentation**

Document the final feature ownership map and direct route compositions.

- [ ] **Step 5: Verify and commit**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
npm run test:architecture
npm run test:unit
git add -A src/components src/hooks src/core/demarcation-catalog.ts src/SOVEREIGN_CODE_ARCHIVE.md CLAUDE.md
git commit -m "refactor: remove legacy dashboard architecture"
```

---

### Task 12: Full Verification and Lighthouse Acceptance

**Files:**
- Create: `docs/performance/2026-07-27-final.md`
- Modify: `tests/performance/bundle-budget.mjs` only if the documented approved budgets need to be tightened

**Interfaces:**
- Produces final evidence for all acceptance criteria.

- [ ] **Step 1: Run complete automated verification**

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
npm run test:unit
npm run test:architecture
npm run test:routes
npm run build
npm run analyze:bundle
git diff --check
```

All commands must exit zero with no ignored failures.

- [ ] **Step 2: Run production Lighthouse in clean contexts**

For `/`, `/register?role=rider`, `/rider`, `/captain`, `/advertiser`, `/delegate`, and `/admin`:

- build and start the production server;
- create a new browser context per URL;
- unregister service workers;
- clear cache, cookies, local storage, session storage, Cache Storage, and IndexedDB;
- apply Lighthouse mobile throttling;
- run three samples and record the median.

- [ ] **Step 3: Enforce acceptance scores**

The recorded medians must satisfy:

```text
/rider   >= 90
/captain >= 90
all other tested routes >= 80
```

If a route fails, use the Lighthouse trace and bundle report to identify its largest remaining LCP, main-thread, waterfall, or chunk issue. Add a failing performance regression before changing production code.

- [ ] **Step 4: Document final results**

`docs/performance/2026-07-27-final.md` must contain:

- commit hash and environment;
- exact commands;
- baseline versus final route scores;
- baseline versus final initial JS and CSS;
- LCP, TBT/INP proxy, and CLS;
- request counts;
- remaining non-blocking observations.

- [ ] **Step 5: Apply verification-before-completion**

Read the full output of every command from Step 1 and the median score table from Steps 2–4 before making any completion claim.

- [ ] **Step 6: Commit**

```powershell
git add docs/performance/2026-07-27-final.md tests/performance
git commit -m "docs: record performance refactor verification"
```

