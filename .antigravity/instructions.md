# Antigravity Workspace Instructions — smart-radar-core

As the Antigravity AI assistant pair programming on `smart-radar-core`, you MUST strictly adhere to the instructions and rules outlined below during every turn of execution.

---

## Core Execution Guidelines

1. **Check Sovereign Architecture (`AGENTS.md`)**:
   - Verify zero-cost client-side calculation constraints.
   - Enforce OSRM routing with 1.3 Haversine offline fallback multiplier.
   - Respect market pricing rules (Amber Warning 10-14.9%, Crimson Block ≥15%).
   - Enforce 180s Zero-Captain Fallout buoy dissolution protocol.

2. **Modular File Sizes & Refactoring Rule**:
   - **Target File Length**: Keep individual source files between **200 to 300 lines maximum**.
   - When modifying large files (>300 lines), actively split and refactor them into sub-components, modular hooks, or service helpers under `features/<feature>/{components,hooks,services}` or `shared/`.

3. **Strict i18n JSON Localization**:
   - **Zero Hardcoded Text**: Never hardcode user-facing strings, buttons, toast alerts, dialog text, or errors directly in components.
   - Always define translations in `src/messages/ar.json` and `src/messages/en.json` and consume via translation hooks.

4. **Strict Security Enforcement**:
   - **Server-Authoritative Trust**: Re-verify identity and roles server-side; do not trust client state or local device clocks (use `Network Time Delta`).
   - All state-mutating endpoints MUST pass through server rate limiters (`rateLimiterMiddleware`), backend locks (`acquireBackendLock`), and cryptographic signature checks.
   - SSRF protection on short-link/URL scraping (`isSafeUrl`, `isSafeIp`, `secureFetch`).

5. **Check Layer Integrity (`CLAUDE.md`)**:
   - `src/app/`: Next.js pages only.
   - `src/features/<name>/`: Isolated feature modules. Cross-feature access MUST go through `@/features/<name>/contract`.
   - `src/shared/`: Utility functions and shared UI components (never import from `features/` or `app/`).
   - Check if legacy files (`src/core/`, `src/hooks/`, `src/lib/`, `src/components/`) are **re-export shims** before modifying them.

6. **Enforce TSX Styling Rule**:
   - Always place Tailwind class strings in a module-level `const styles = { ... } as const` object.
   - Never use raw Tailwind class strings in JSX `className` attributes.

7. **Mandatory Verification Protocol**:
   - After writing or editing code, ALWAYS run:
     ```bash
     npm run lint
     npm run test:architecture
     npm run test:unit
     ```
   - Before completing major features or plans, run:
     ```bash
     npm run verify
     ```
