# Feature-Based Performance Refactor Design

**Date:** 2026-07-27  
**Status:** Approved  
**Scope:** Every role and route in the project

## Objective

Restructure the application around feature ownership, standardize component styling through one file-level `styles` object per `.tsx` file, and improve production loading and rendering performance without changing existing URLs, appearance, copy, backend behavior, offline behavior, or ride-state behavior.

## Compatibility Requirements

The refactor must preserve:

- All current route URLs and hash-based navigation.
- Existing visual appearance and responsive behavior.
- Arabic and English copy.
- Supabase, Firebase, OSRM, IndexedDB, PWA, and realtime behavior.
- Existing browser storage keys and external event names.
- Rider and captain state-machine behavior.
- OSRM timeout and Haversine fallback behavior.

Loading indicators and transition timing may change when required to improve performance or prevent layout shift.

## Target Architecture

Application routes become thin composition layers. Each route imports only its own feature entry point and required shared infrastructure.

```text
src/
  app/
    rider/
    captain/
    ...
  features/
    rider/
      components/
      hooks/
      services/
      state/
      styles/
      tests/
    captain/
    advertiser/
    delegate/
    admin/
    auth/
    ads/
    profile/
    wallet/
    history/
    vault/
  shared/
    components/
    hooks/
    services/
    styles/
    types/
```

A representative route composition is:

```text
app/rider/page.tsx
  -> RiderRoute
    -> RiderProvider
    -> RiderShell
    -> dynamically loaded rider screens and tabs
```

The same independent composition applies to captain, advertiser, delegate, admin, authentication, and registration flows.

## Feature Ownership

### Rider

`features/rider` owns destination selection, rider maps, captain offers, active trips, ratings, rider state, rider-specific hooks, and rider-facing Supabase services.

### Captain

`features/captain` owns radar discovery, bidding, active-trip tracking, captain profile and wallet integration, captain state, and captain-facing services.

### Advertiser

`features/advertiser` owns campaigns, targeting, payments, statistics, and advertiser portal screens.

### Delegate

`features/delegate` owns the delegate portal, commissions, recruited-account views, and related services.

### Admin

`features/admin` owns management panels, sovereign controls, heatmaps, simulations, and administrative reporting.

### Authentication

`features/auth` owns login, registration steps, authentication mapping, and post-authentication routing.

### Cross-Role Business Features

Ads, profile, wallet, history, and vault are independently owned features with explicit role-aware interfaces. They are not generic shared utilities.

### Shared Infrastructure

`shared` contains only generic design primitives, layout elements, error boundaries, localization infrastructure, backend clients, and utilities with no role-specific business policy.

Cross-feature imports must go through explicit public entry points. Performance-sensitive application code uses direct imports and does not rely on broad barrel modules.

## Data Flow and Rendering Boundaries

Data fetching and mutations live beside the feature that owns the data. UI components consume focused hooks instead of broad provider objects spanning multiple roles.

Provider values must be memoized and split by update frequency or responsibility. High-frequency GPS pulses, timers, realtime offers, and map movement must not rerender navigation, static page chrome, or unrelated tabs.

Derived values should be calculated during rendering when inexpensive. Effects use primitive dependencies and are reserved for synchronization with external systems. Identical startup requests must be deduplicated, while independent startup work should execute in parallel.

## Styling Standard

Every `.tsx` file defines exactly one module-level style object:

```tsx
const styles = {
  root: 'flex min-h-screen',
  card: 'rounded-2xl border',
  title: 'text-xl font-bold',
  activeCard: 'border-emerald-400',
} as const;
```

JSX uses `styles.key` or `cn(styles.key, condition && styles.variant)`.

Tailwind class strings must not appear directly inside JSX, callbacks, hooks, or component bodies. Each file owns its classes through its local `styles` object. Shared visual primitives keep styles local to their own files; the project must not replace inline strings with a single large global class catalog.

## Loading and Bundle Strategy

- Replace the shared all-role dashboard dispatcher with role-specific route shells.
- Dynamically import maps, charts, dialogs, portals, management panels, ratings, and inactive tabs.
- Add route and feature loading boundaries sized to match final content.
- Preload likely next tabs on hover, keyboard focus, or touch intent.
- Import large libraries only inside the feature chunks that use them.
- Defer ad-cache hydration, IndexedDB hydration, notification setup, and noncritical integrations until the initial interface is interactive.
- Preserve offline-first behavior by deferring only resources that are not required for the initial usable screen.
- Measure actual chunks and avoid dynamic imports that create additional waterfalls without reducing initial work.

## Error Handling

Each route has its own error and loading boundaries. Feature services normalize Supabase, Firebase, OSRM, geolocation, and IndexedDB failures before exposing them to UI components.

Existing Arabic and English user-facing errors remain unchanged. Routing failures continue to activate the existing OSRM-to-Haversine fallback. Feature errors must not crash other route shells or shared navigation.

## Migration Sequence

1. Capture production bundle and Lighthouse baselines and introduce architectural tests.
2. Extract shared infrastructure and layout primitives.
3. Migrate authentication and registration.
4. Migrate rider.
5. Migrate captain.
6. Migrate advertiser and delegate.
7. Migrate admin.
8. Migrate profile, wallet, history, vault, and ads.
9. Remove the legacy dashboard dispatcher and temporary compatibility adapters.
10. Convert all remaining `.tsx` files to the file-level style-object standard.
11. Run complete regression, production-build, bundle, and Lighthouse verification.

Each stage must leave the application runnable and independently testable.

## Testing Strategy

Behavioral work follows red-green-refactor testing. Existing state-machine, pricing, authentication, and service tests remain active.

The refactor adds:

- Architecture checks rejecting inline Tailwind class strings in `.tsx` JSX.
- Architecture checks rejecting forbidden cross-feature imports.
- Route smoke tests for every role and public route.
- Feature tests for provider isolation and critical state transitions.
- Request-count regression tests for startup data fetching.
- Production bundle-size measurements.
- Lighthouse runs against production builds with browser cache, IndexedDB, and other site storage cleared.

## Acceptance Criteria

- All existing URLs and hash-navigation flows work.
- Existing appearance, responsive behavior, Arabic/English copy, backend contracts, browser storage, offline behavior, and ride flows remain intact.
- Type checking, automated tests, production build, and route smoke tests pass.
- Every project `.tsx` file has exactly one module-level `styles` object.
- No `.tsx` file contains inline Tailwind class strings in JSX or component bodies.
- Lighthouse mobile Performance is at least 90 for `/rider` and `/captain`.
- Lighthouse mobile Performance is at least 80 for every other route.
- Lighthouse measurements use production builds in a clean browser context with cleared cache and IndexedDB.
- Before-and-after bundle and Lighthouse measurements are documented.

## Delivery Constraint

This is an incremental migration, not a one-pass rewrite. Compatibility adapters may exist only while their dependent stage is being migrated and must be removed before final acceptance.
