# Client Business Alignment Report

Date: 2026-07-02
Project: `majdfayzabdalqadr-radar`
Branch reviewed: `rider-ui`

## Executive Summary

The current project is strongly aligned with the client's language, visual direction, and feature surface, but it is not yet a complete production implementation of the business constitution described in the client documents.

Estimated current alignment: **61%**

Interpretation:

| Level | Meaning |
| --- | --- |
| 0-30% | Mostly unrelated or early prototype |
| 31-55% | Some screens and concepts exist, but core business rules missing |
| 56-75% | Good MVP/prototype alignment, but production enforcement incomplete |
| 76-90% | Near complete product, needs hardening and QA |
| 91-100% | Full client-ready implementation with verified backend, security, QA, and operations |

The app currently looks and behaves like the intended product in many places: registration, role dashboards, ad river, advertiser portal, supervisor/admin controls, delegate screens, local cache, PWA files, H3-style geo logic, and Firebase functions are present. The main gap is that many critical rules are still client-side, simulated, permissive, or fallback-based. The client documents repeatedly require backend authority, strict Firestore security, real lifecycle enforcement, real payment/refill confirmation, real purge jobs, and very low Firebase read/write cost. Those are only partially implemented.

## Sources Reviewed

The following client documents were extracted from DOCX and compared against the repository:

| Client document | Main subject |
| --- | --- |
| `بنية النظام التقنية.docx` | PWA, offline-first, SC55, Firebase cost policy, ads, push, purge |
| `المسافات والخرائط.docx` | MapLibre, H3, no paid Google Maps visual dependency, distance/ETA |
| `الطابع البصري.docx` | Dark matte visual identity, teal/blue accents, glass/elevated cards |
| `الترقييم الذري.docx` | Atomic serial IDs, Firestore transactions, sector numbering |
| `المشرف.docx` | Supervisor dashboard tree, ads, delegates, drivers, users, capacity, broadcasts |
| `المالك.docx` | Owner governance, ads revenue model, kill switch, delegate commissions |
| `شجرة لاعلان.docx` | Advertising governance tree |
| `شرح الاعلانات.docx` | Ad model, advertiser flow, impression engine, capacity engine |
| `شجرة عرض الاعلانات.docx` | Smart ad billboard / ad river behavior |
| `دستور القوانين المختصر.docx` | Constitutional rules, security, purge, pricing, anti-cheat |
| `المعلن.docx` | Advertiser portal, pricing, AI moderation, premium vault, payments |

Code areas inspected included registration, geo kernels, ad stream, advertiser portal, admin ads, delegate portal, Firestore rules, Cloud Functions, push notifications, local cache/Dexie, pricing, wallet/refill, and anti-cheat kernels.

Limitations:

- This is a static implementation audit, not a complete QA certification.
- Some source files contain mojibake/encoding corruption in Arabic UI strings. The app may still compile, but this affects maintainability and user-facing Arabic quality.
- Product-design preflight tooling could not be run because Python is not installed on the machine.
- No Firebase emulator security test suite was run for this report.

## Alignment By Business Pillar

| Pillar | Current alignment | Status |
| --- | ---: | --- |
| Visual identity and UI direction | 82% | Strong match |
| Role model and registration | 72% | Good MVP, needs backend hardening |
| Atomic numbering | 70% | Present, but too client-trusted |
| PWA/offline/local-first architecture | 58% | Partial |
| Geo, maps, H3, distance/ETA | 48% | Concept present, not fully compliant |
| Ad river and impression model | 66% | Good surface, incomplete billing authority |
| Advertiser portal | 64% | Good UX prototype, simulated moderation/payment |
| Supervisor/admin/owner controls | 62% | Screens exist, enforcement incomplete |
| Delegate system | 60% | Feature-rich prototype, needs secure backend settlement |
| Payments/refill | 40% | Mostly UI/simulation |
| Push notifications | 50% | Hooks and documents exist, not full Web Push pipeline |
| Security and Firestore rules | 42% | Major hardening needed |
| Anti-cheat and pricing brakes | 52% | Kernels exist, incomplete enforcement |
| Data purge and retention | 55% | Some functions/client purge, not complete |
| Arabic/English copy and localization | 30% | Needs major cleanup |

## What Is Already Aligned

### 1. Visual Direction

Client requirement:

- Deep matte navy/black background.
- Elevated dark cards.
- Teal/blue accent colors.
- Premium dashboard feel.
- Arabic RTL interface.

Current implementation:

- Many screens use dark backgrounds, teal accents, glass/elevated cards, and RTL layout.
- Registration UI has been updated to match the older desired registration version.
- Dashboards, ad stage, advertiser portal, and admin sections broadly follow the requested visual tone.

Gap:

- Arabic text encoding is corrupted in several files.
- Some UI text is overly theatrical and may need product-copy cleanup for client handoff.
- The design system is not fully centralized, so visual consistency may drift.

Verdict: **Strong visual alignment, but needs Arabic text cleanup and design-system consolidation.**

### 2. Registration And Role Model

Client requirement:

- Roles: rider/passenger, driver/captain, advertiser, delegate, supervisor/admin/owner.
- Atomic registration with serial IDs per sector.
- Firestore transaction for counter increment and user creation.

Current implementation:

- `src/hooks/use-registration.tsx` supports rider, driver, advertiser, and delegate.
- It uses `runTransaction` and `system_counters`.
- Serial prefixes exist for passenger, driver, advertiser, and delegate.
- Demo dashboard buttons exist for role testing.

Gaps:

- Registration still runs mostly from the client.
- Firestore rules allow authenticated clients to write `system_counters`, which weakens atomic numbering integrity.
- Admin/owner registration is not a proper secured workflow.
- Phone/device uniqueness checks are client-side reads before write, which can race.
- Demo bypass must stay development-only and must be impossible in production.

Verdict: **Good functional MVP, not yet production-secure.**

### 2.1 Language, Translation, And Product Copy

Client/user requirement:

- Arabic must be simple, clear, and normal.
- English must be available for the same screens and messages.
- Avoid dramatic or confusing words in user-facing UI.
- Use one translation source of truth instead of hardcoded text across many files.

Current implementation:

- Some registration screens already support Arabic/English.
- Many other screens hardcode Arabic directly inside components.
- Several files contain corrupted Arabic/mojibake.
- Many user-facing messages use heavy terms such as "سيادي", "مقصلة", "إعدام", "فرسان", "العهد", and "النبض", which makes the product harder to understand.

Gaps:

- No complete app-wide i18n provider exists yet.
- Not all screens use one translation dictionary.
- Arabic and English are not consistently paired.
- Several labels, toasts, and dashboard texts need rewriting in plain language.

Required direction:

- Use simple role names:
  - `راكب / Rider`
  - `كابتن / Captain`
  - `معلن / Advertiser`
  - `مندوب / Delegate`
  - `مشرف / Admin`
  - `مالك / Owner`
- Replace dramatic wording:
  - `إعدام الإعلان` -> `رفض الإعلان` or `حذف الإعلان`
  - `مقصلة` -> `إيقاف` or `حظر`
  - `سيادي` -> remove unless legally needed; use `النظام`, `التطبيق`, or `الحساب`
  - `الفرسان` -> `الكباتن`
  - `النبض` -> `النشاط`, `التحديث`, or `الإعلانات`
- Create a bilingual copy catalog and migrate screens step by step.

Verdict: **Language is a product-quality blocker. It needs a dedicated cleanup pass before client delivery.**

### 3. PWA, Offline-First, And SC55

Client requirement:

- PWA with offline-first behavior.
- Move processing, filtering, pricing, maps, and ad selection to the edge/client.
- Avoid Firebase read/write chatter.
- Batch writes, especially ad impressions.
- Use IndexedDB/Dexie/localStorage.

Current implementation:

- PWA files exist under `public/`.
- Dexie is installed and used for favorite captains/logs.
- LocalStorage is used heavily for ad cache, demo users, local promos, wallet/delegate state, and vault.
- Ad metric batching exists in `src/lib/ad-cache-sentry.ts` with threshold `50`.
- `AdStage` has a local batch limit constant of `50`.

Gaps:

- Dexie is not the main offline database for ads, trips, pulse, queue, and user vault.
- Many critical data stores use localStorage instead of structured IndexedDB.
- Several `onSnapshot` listeners remain across auth, promo, admin, delegate, rider, fleet, history, and market pulse flows.
- Offline queue/replay is not consistently implemented across domains.
- There is no verified read/write budget test or dashboard.

Verdict: **SC55 concepts are present, but the architecture is not fully cost-controlled yet.**

### 4. Geo, Maps, H3, Distance, And ETA

Client requirement:

- Remove paid Google Maps visual dependency from rider/admin/driver visible screens.
- Use MapLibre GL JS and H3.
- Use H3 resolution 9 for local auction/privacy.
- Do not broadcast exact rider lat/lng.
- Calculate local distance with Haversine multiplied by district tortuosity.
- ETA based on 40 km/h.
- Driver precise navigation is the only limited Google/external navigation exception after handshake.

Current implementation:

- `h3-js` and `maplibre-gl` dependencies exist.
- `src/core/logic/geospatial-kernel.ts` implements Haversine, detour/tortuosity, estimated trip time at 40 km/h, and district lookup.
- H3-like cell strings are generated.
- Rider/driver files reference H3/grid IDs.

Gaps:

- There is no actual MapLibre usage found in source code, only the package dependency.
- No real `h3-js` usage found; current `latLngToH3Cell` is a custom approximation, not official H3.
- Google Maps links still appear in geo helper functions, ad stage, and advertiser portal.
- The privacy rule "do not broadcast exact rider lat/lng" needs full trip/radar data-model verification.
- Offline vector tiles and MapLibre visual map screens are not implemented.

Verdict: **Geo intent is partially implemented, but the core MapLibre/H3 requirement is not complete.**

### 5. Ad River And Impression-Based Revenue

Client requirement:

- Ads are the funding engine.
- Idle screen is a full ad river.
- Ad changes every 5 seconds/right-to-left.
- Billing unit is real impression per 5 seconds.
- No click auction.
- User interaction opens full takeover card.
- Premium green-heart ad vault lasts 30 days locally.
- Non-saved stats/records purge after 72 hours server-side.

Current implementation:

- `src/components/dashboard/ad-stage.tsx` implements a scrolling ad river and takeover card.
- Heart/vault logic exists using `sovereign_hearted_ads` and `sovereign_ad_vault_details`.
- `src/components/dashboard/vault-tab.tsx` reads and purges local vault entries.
- Ad metric batching exists.
- Admin ads have impressions, clicks, status, target impressions, expiry, pause/freeze/extend/archive.
- Advertiser portal includes packages, impression pricing, premium retention, AI-style audit, and capacity messaging.

Gaps:

- The visual stream scrolls continuously over 35 seconds, not a strict 5-second verified impression cycle.
- Impression logging in `AdStage` logs each ad on render/effect, not necessarily verified 5-second real display.
- There are two metric systems: `sovereign_ad_metrics_rollup` and `ad-cache-sentry` writing to `promos`; they should be unified.
- Billing is not authoritatively tied to paid impression balance.
- AI moderation is simulated, not real content moderation.
- Capacity engine is hardcoded in places.
- Advertiser uploads use URL fields, not a real media upload/storage/moderation lifecycle.

Verdict: **The ad product is one of the strongest areas, but monetization integrity is not production-ready.**

### 6. Advertiser Portal

Client requirement:

- Simple advertiser flow: choose governorate/district, upload ad, choose impressions, choose links, pay, wait for supervisor approval.
- AI checks content quality/morality/duration only.
- Pricing is impression-based.
- Capacity engine prevents overbooking and suggests alternatives.

Current implementation:

- `src/components/dashboard/advertiser-portal.tsx` has a rich portal with dashboard/create tabs.
- It supports governorate/district, poster URL, WhatsApp, phone, location URL, button text, impressions, packages, balance, simulated audit, and launch.
- Pricing packages exist in `src/lib/constants.ts`.
- Admin ad creation and moderation exists.

Gaps:

- Payment balance is simulated.
- AI moderation is simulated with timers/logs.
- Capacity is partly hardcoded.
- Campaign status flow is inconsistent between `active`, `ACTIVE`, `PENDING`, `REJECTED`, `paused`, `frozen`, `archived`.
- Advertiser can write to `promos` directly under current rules, which bypasses required supervisor/backend control.

Verdict: **Good UX prototype; needs real backend workflow and payment/moderation authority.**

### 7. Supervisor, Admin, And Owner Governance

Client requirement:

- Supervisor dashboard with stats, ads, delegates, drivers, users, broadcasts, capacity, pricing, system control, analytics.
- Owner must not manually manipulate fares; owner governs platform and ads.
- Kill switch for bad drivers with reports, conviction, trust reset, and active-hour confiscation.
- Admin ad actions: approve, reject/confiscate, stop, delete, freeze, extend.

Current implementation:

- Admin/owner files exist:
  - `admin-view-tab.tsx`
  - `ads-management-tab.tsx`
  - `delegates-management-tab.tsx`
  - `drivers-management-tab.tsx`
  - `kill-switch-panel.tsx`
  - `owner-sovereign-dashboard.tsx`
- Admin ad actions exist: pause, archive/delete, freeze, extend, approve, reject, annihilate.
- Cloud Function `toggleSovereignKillSwitch` exists for global radar state.
- Driver blackbox/kill-switch UI references banned drivers.

Gaps:

- Kill switch appears partially global, not a complete per-driver conviction workflow.
- Need backend enforcement for driver ban, wallet/hour confiscation, trust reset to 0, and radar access denial.
- Broadcasts are Firestore documents, not full Web Push delivery.
- Owner/supervisor authorization and separation need stronger rules and custom claims.
- Analytics are not fully source-backed.

Verdict: **Screens are present; governance needs authoritative backend enforcement.**

### 8. Delegate System

Client requirement:

- Delegate is field acquisition engine.
- Adds drivers/riders/advertisers.
- Magic links.
- Daily target, deficits, organic growth, churn, 45-day stability.
- Commission after 30-day stability only.
- Withdrawal and reactivation monitoring.
- Supervisor tasks and closure.

Current implementation:

- `delegates-management-tab.tsx` has delegates, magic links, tasks, performance.
- `delegate-portal.tsx` is large and feature-rich, with wallet, recharge, vault, offline queue, tasks, settlement concepts, local signatures, and payment channels.
- Firestore collections exist/rules mention `delegates`, `delegate_links`, and `delegate_tasks`.
- Some backend routes are referenced such as `/api/generate-magic-link`, `/api/delegate-task-transition`, `/api/verify-signatures`.

Gaps:

- Many delegate financial values are localStorage-based.
- Rules for `/delegates` are too permissive: authenticated users can read/write.
- Commission settlement is not clearly enforced by a 30-day backend clock.
- Magic link validation/security depends on API routes that must be verified and deployed.
- Device binding, signature verification, and anti-tamper are not complete unless backend routes are actually implemented and protected.

Verdict: **Feature-rich prototype, but high-risk until secured and server-authoritative.**

### 9. Payments And Refill

Client requirement:

- Geo-anchored refill/payment by homeDistrict.
- Local payment channels: CliQ, Zain Cash, Orange Money, eFawateercom.
- Payments should confirm packages/hours/impressions.
- Delegate payment settlement must be controlled.

Current implementation:

- Payment/refill UI references CliQ, Zain Cash, Orange Money, eFawateercom.
- `src/lib/refill-kernel.ts` has district-based wallet refill logic.
- Wallet and delegate portal have payment/recharge UI.

Gaps:

- No real payment provider/webhook confirmation is evident.
- User balances can be simulated in UI.
- Payment channels are not tied to authoritative backend ledger entries.
- No reconciliation flow between advertiser packages, delegate deposits, and ad impression balance.

Verdict: **Mostly UI and local simulation; production payment layer is still missing.**

### 10. Push Notifications

Client requirement:

- Web Push via VAPID.
- No external paid notification platform.
- Silent push for purge, broadcasts, orders, offers, professional broadcasts, geo broadcasts.

Current implementation:

- `public/firebase-messaging-sw.js` exists.
- `use-sovereign-fcm.ts` registers FCM token when VAPID key exists.
- `push-notifications.ts` writes `sovereign_pushes` and subscribes with Firestore listener.

Gaps:

- The current "silent push" system is mostly Firestore listener based, not true Web Push delivery.
- FCM is disabled in development and depends on env configuration.
- No Cloud Function was found that sends Web Push/FCM messages to tokens.
- Firestore listener-based push conflicts with the low-read SC55 goal if overused.

Verdict: **Push groundwork exists, but full Web Push pipeline is incomplete.**

### 11. Security, Rules, And Backend Authority

Client requirement:

- No client-side trust for financial/security decisions.
- Backend validation for pricing, registration, ad status, reports, delegate settlement, kill switch.
- Firestore rules should prevent role/data tampering.
- No extra `onSnapshot`.
- No empty catch or silent failures.

Current implementation:

- Firestore rules have default deny then collection-specific rules.
- Cloud Functions exist for admin state, users, ads, trips, ratings, cleanup, geo.
- Error tracking exists through `trackSovereignError`.
- Some callables verify admin or user access.

Critical gaps:

- `/delegates` allows read/write to any authenticated user.
- `/system_counters` allows read/write to any authenticated user.
- `/promos` allows advertiser writes directly.
- `/trips` allows broad authenticated reads and updates.
- `/sovereign_pushes` allows authenticated create.
- `syncAdStats` is an open HTTP function with permissive CORS and no auth verification.
- Several client flows fall back to local/mock data after Firebase errors.
- Backend registration callable exists but current registration hook uses direct client Firestore writes.

Verdict: **Security is the biggest blocker for a full client-ready release.**

## Key Contradictions In Client Documents

These should be resolved before final implementation:

1. **Google Maps conflict**
   - Some docs reference Google Maps as a source of truth or deep-link destination.
   - Later technical/map docs require removing paid Google Maps visual dependence and using MapLibre/H3.
   - Recommended decision: MapLibre/H3 is the product standard. Google/external maps only allowed as a post-handshake driver navigation deep link or optional advertiser location deep link, never as the core visual map engine.

2. **AI role**
   - Docs repeatedly say AI must not determine price or audience.
   - Some advertiser text suggests AI recommendations for targeting/time/package.
   - Recommended decision: AI can suggest copy/quality/capacity alternatives, but pricing and audience eligibility must be deterministic rules.

3. **30 vs 45 days for delegate stability**
   - Some docs mention 30-day commission stability.
   - Supervisor tree mentions 45-day stable users.
   - Recommended decision: use 30 days for commission eligibility, 45 days as a separate long-term quality metric.

4. **External links**
   - Docs say deep link engine should avoid leaving the app except OS-level tel/WhatsApp flows.
   - Current app opens WhatsApp, tel, and Google Maps/browser.
   - Recommended decision: use internal takeover card first, then OS-level actions only after explicit tap.

## What Is Needed To Be Full

### Phase 1: Lock The Business Source Of Truth

Deliverables:

- Create one canonical requirements matrix from the 11 client docs.
- Resolve the contradictions listed above.
- Define final role names and prefixes:
  - Rider/passenger: `P-`
  - Driver/captain: `D-`
  - Advertiser/ad account: `A-`
  - Delegate: choose one prefix only, currently `L-` in registration and `M-` in admin delegate creation.
  - Admin/owner: define separately.
- Define canonical campaign statuses:
  - `PENDING`
  - `ACTIVE`
  - `PAUSED`
  - `FROZEN`
  - `REJECTED`
  - `EXPIRED`
  - `ARCHIVED`

### Phase 2: Backend-First Security Rewrite

Must-have changes:

- Move registration to callable Cloud Function or secured backend route.
- Only backend can increment `system_counters`.
- Only backend/admin can create or approve active ads.
- Advertiser creates `PENDING` campaign request only.
- Only backend can settle payments, commissions, kill switch, and purge.
- Replace permissive Firestore rules:
  - Restrict `/delegates` to admin/server/delegate owner only.
  - Restrict `/system_counters` to server only.
  - Restrict `/trips` update rights by role and trip ownership.
  - Restrict `/promos` by advertiser ownership and status transitions.
  - Restrict `/sovereign_pushes` creation to server/admin.
- Add Firebase emulator tests for rules.

### Phase 3: Real Geo And Map Compliance

Must-have changes:

- Replace custom pseudo-H3 with real `h3-js` functions:
  - `latLngToCell`
  - `gridDisk`
  - `cellToBoundary`
- Implement MapLibre screens where maps are visible.
- Add offline/vector tile strategy or documented tile provider.
- Store/broadcast rider pickup as H3 cell where possible, not exact lat/lng.
- Allow exact coordinates only after trip handshake and only to matched driver.
- Purge precise navigation data after trip completion.
- Keep Haversine x district tortuosity and 40 km/h ETA as deterministic fallback.

### Phase 4: Complete The Ad Revenue Engine

Must-have changes:

- Build a verified impression scheduler:
  - one visible ad slot
  - 5-second minimum actual display
  - visibility check using IntersectionObserver/page visibility
  - no hidden tab impressions
- Unify metric batching into one store and one backend flush path.
- Flush at 50 verified impressions or app lifecycle boundary.
- Enforce paid impression balance server-side.
- Auto-expire campaign when target impressions or end date is reached.
- Implement campaign media upload and moderation queue.
- Add real AI/content moderation integration or a manual moderation fallback.
- Keep AI out of pricing and audience authority.
- Implement premium vault eligibility and 30-day purge in IndexedDB, not only localStorage.

### Phase 5: Complete Advertiser Workflow

Must-have changes:

- Advertiser submits campaign as `PENDING`.
- Payment must be confirmed before campaign can become `ACTIVE`.
- Supervisor/admin sees unified ad card with:
  - media
  - type
  - governorate/district/H3 scope
  - target impressions
  - executed impressions
  - WhatsApp/phone/location/Facebook/site links
  - dates
  - package
  - cost
  - audit report
  - status
- Admin actions:
  - approve launch
  - reject with reason
  - pause
  - freeze
  - extend impressions/date
  - archive/delete from river
- Add capacity engine based on real campaign load per district/time.

### Phase 6: Complete Supervisor, Owner, And Kill Switch

Must-have changes:

- Build source-backed supervisor stats:
  - driver count
  - rider count
  - active/pending ads
  - delegates
  - district capacity
  - system load/errors
- Implement dry reports:
  - price manipulation
  - misconduct
  - vehicle violation
  - ad violation
- Backend conviction workflow:
  - collect report(s)
  - admin decision
  - write immutable audit entry
  - update driver status
  - remove radar permission
  - confiscate active paid hours if required
  - set trust/rating impact according to final policy
- Owner must be governance-only, not direct fare manipulation.

### Phase 7: Complete Delegate System

Must-have changes:

- Backend-created magic links with expiry and device binding.
- Delegate task transitions through backend only.
- Commission ledger:
  - acquisition event
  - 30-day stability timer
  - churn/reversal logic
  - pending balance
  - payable balance
  - payout audit trail
- 45-day stable users as quality metric.
- Withdrawal/reactivation tracking.
- Remove localStorage authority from delegate wallet/commission values.

### Phase 8: Real Payment And Refill Layer

Must-have changes:

- Define payment confirmation model:
  - channel
  - district
  - payer
  - amount
  - package
  - reference
  - status
  - confirmedBy / webhook source
- Implement payment confirmation backend for:
  - CliQ
  - Zain Cash
  - Orange Money
  - eFawateercom
- Tie confirmed payments to:
  - driver hours/packages
  - advertiser impression balance
  - delegate deposit/commission ledger
- Add reconciliation dashboard for owner/admin.

### Phase 9: Push And Broadcasts

Must-have changes:

- Complete VAPID/FCM setup.
- Store FCM tokens securely.
- Add Cloud Function to send Web Push/FCM messages.
- Use Firestore `sovereign_pushes` as audit/control record, not as the main live push channel.
- Implement targeted broadcasts:
  - all riders
  - all drivers
  - governorate
  - district
  - H3 cell
  - professional captain type
- Add unsubscribe/token cleanup.

### Phase 10: Test And QA Completion

Required tests:

- Firestore rules emulator tests.
- Registration transaction tests.
- H3/geospatial unit tests.
- Pricing brake tests:
  - normal below 10%
  - amber 10-14.9%
  - crimson 15%+
- Ad impression timer tests.
- Ad billing balance tests.
- Premium vault 30-day purge tests.
- Server 72-hour purge tests.
- Delegate commission 30-day stability tests.
- Kill switch enforcement tests.
- Playwright flows for:
  - rider
  - driver
  - advertiser
  - delegate
  - admin/owner
- Offline/reconnect tests.
- Firebase read/write budget tests.

## Highest Priority Risks

1. **Firestore security rules are too permissive**
   - This blocks production release.

2. **Client-side authority for money/security**
   - Payment, counters, delegate values, ad state, and some pricing/security decisions must move server-side.

3. **MapLibre/H3 requirement is not actually fulfilled**
   - Dependencies exist, but real implementation is incomplete.

4. **Ad impressions are not yet verified 5-second billable events**
   - Without this, the core revenue model is not trustworthy.

5. **Mock/demo/fallback data is mixed into production paths**
   - Must be isolated behind development flags or removed.

6. **Arabic encoding corruption**
   - Needs cleanup before client presentation.

## Recommended Next Sprint

The fastest path to a client-ready foundation is:

1. Build the Arabic/English copy source of truth and migrate the highest-traffic screens.
2. Fix Arabic encoding in user-facing files.
3. Harden Firestore rules and add emulator tests.
4. Move registration counters and ad state transitions to backend.
5. Replace pseudo-H3 with real `h3-js`.
6. Implement verified 5-second ad impression logic.
7. Normalize campaign statuses and data model.
8. Remove production fallbacks/mocks.

## Final Verdict

The project currently has a **good MVP/prototype alignment** with the client's business vision. It captures the correct roles, visual tone, advertising concept, delegate/supervisor surfaces, local-first direction, and many of the constitutional phrases and mechanisms.

To be considered **full**, it must shift from a rich client-side prototype into a server-enforced system. The completion work is less about adding more screens and more about making the existing screens trustworthy: strict rules, backend transactions, verified ad billing, real payment reconciliation, real MapLibre/H3, and test coverage around the business-critical laws.
