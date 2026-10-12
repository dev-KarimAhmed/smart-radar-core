# Rating + rank system: end-to-end audit

2026-08-22. Verdict: **the rank engine is installed and correct. The rating UI that fed
it has been fixed, and all four problems found in the audit are now resolved.** Details below.

## Backend — verified working

The engine from `20260822090000_captain_rank_sovereign_engine.sql` is applied and live:

| Check | Result |
|---|---|
| 5 new `profiles` columns, `reviews.gave_heart` | present |
| 7 functions, 2 triggers | present |
| Installed `sync_captain_rank` has the freeze block **and** lock enforcement | yes — it is the final version, not a partial apply |
| `calculate_sovereign_rank` against all 8 threshold boundaries | PASS |
| `sovereign_stars_to_rating` against 6 cases | PASS |
| `SECURITY DEFINER` flags | correct (`sync_captain_rank` is not definer; the RPCs are) |

Not verified at runtime: the triggers have never fired in production — the newest review
predates the migration — and the MCP connection is read-only, so the promotion, descent and
72h-lock paths are covered only by `docs/verify-captain-rank-engine.sql`, which has to be
run manually.

## Frontend — the rating path works, the rank display works

Reachable and wired:

- Rider rates captain: `rider-state-machine` `SERVER_STATUS_COMPLETED` → `screen =
  'RATING_MODAL'` → `rider-modals.tsx` renders `RatingModal` → inserts into `reviews`
  with `gave_heart`.
- Captain rates rider: `captain-view.tsx:400` renders `DriverRatingModal` → inserts into
  `reviews`.
- Rank reaches the UI: the offer query uses `.select('*')`, so `profiles.tier` arrives;
  `bidding-proposal-sheet` reads it for the price ceiling; `driver-profile-tab` displays it;
  `rider-offer-ranking` sorts by it.

## Problem 1 — RESOLVED: silence was being scored as a complaint

The original blocker: `RANKING_RULES` thresholds (4.8 / 4.5 / 4.0) were written for a 1–5
star rating, but the UI was **five checkboxes that all start unticked**, and an unticked box
was sent as `0`. A rider who was broadly happy but left one box alone scored the captain
4.00 (SILVER); leaving two gave 3.00 (BRONZE). Across the 18 real reviews no captain could
reach GOLD, and averages ran as low as 1.00.

**Fix applied.** The criteria stay detailed and named — that requirement did not change —
but each one is now a 👍 / 👎 pair instead of a single checkbox, and **an unanswered
criterion is left out of the payload entirely** rather than sent as `0`. The server already
averaged `sum ÷ number of keys`, so no SQL change was needed for this; dropping the key is
what makes silence neutral.

Tapping the same verdict twice clears it, so a mis-tap returns to "no opinion".

Resulting behaviour, confirmed against the live function:

| What the rider does | Rating |
|---|---|
| 👍 on all 5 | 5.00 |
| 👍 on 4, silent on the 5th | 5.00 |
| 👍 on 2, silent on the rest | 5.00 |
| 👍 on 4, 👎 on 1 | 4.00 |
| 👍 on 3, 👎 on 2 | 3.00 |
| 👍 on 1, 👎 on 4 | 1.00 |
| nothing at all | no rating recorded |

One side effect had to be fixed in SQL: "answered nothing" used to be an edge case, and
`apply_review_to_profile` returned early on a NULL rating — which also discarded the heart
on that same review. Now that answering nothing is ordinary, rating and heart are applied
independently (`20260822140000_rank_engine_rating_source_fix.sql`).

Files changed: `src/components/dashboard/shared/rating-modal.tsx` (rider → captain, both the
vehicle and captain sections) and `src/features/captain/components/driver-rating-modal.tsx`
(captain → rider).

## Problem 2 — RESOLVED: the duplicate star-rating path is retired

`public.submit_ride_rating(request_id, captain_id, rating_value)` was an older star-based
path: it wrote `rider_ratings` and **recomputed** `profiles.rating / rating_sum /
rating_count / trust_score`. `apply_review_to_profile` **increments** the same columns from
a review. The two cannot coexist — whichever ran last wiped the other's contribution.

`public.reviews` is the rating system, because its detailed named criteria are the product
decision and it is what both live modals write. So the duplicate was retired, not revived:

- All three dead call sites removed — `handleSubmitRating` in `use-trip-completion.ts`, the
  RPC call in `use-rider-transactions.tsx`, and the `submitRideRating` wrapper (plus its
  orphaned `toStrictRating` helper) in `rider-server-marketplace.ts`.
- The RPC now raises `rating_path_retired` unconditionally and has `EXECUTE` revoked from
  `authenticated` and `anon`, so it cannot quietly become a second writer again. The
  function is kept rather than dropped because the 6 rows in `rider_ratings` are real
  history (avg 4.17).

`rateTrip` in `use-rider-transactions.tsx` survives as a no-op only because
`RiderOperationsContextType` still declares it; nothing consumes it.

## Problem 3 — RESOLVED: captain→rider rating already worked

It was never actually broken. `captain-view.tsx` renders `DriverRatingModal` on
`screen === 'RATING_MODAL'`, that writes the detailed criteria to `reviews`, and
`apply_review_to_profile` aggregates them onto the rider's profile.

What was broken was `rateAndFinishTrip` in `use-driver-transactions.ts` — a second,
redundant path calling `submit_ride_rating` with `p_captain_id = riderId`. That function
raises `not_request_owner` for any caller who is not the request's rider, and a captain
never is, so it always threw; had it ever succeeded it would have written the rider's id
into `rider_ratings.captain_id`. No component called it.

It is now reduced to closing the trip out after the modal, and its unused `rating`
parameter is gone (signature updated in `use-driver-operations.tsx` to match).

## Problem 4 — RESOLVED: the weekly-report button is wired

`driver-actions.tsx` has a real, visible "طلب تقرير الأداء" button, and
`requestWeeklyReport` in `use-driver-transactions.ts` was a placeholder showing only
"التقرير غير متاح حالياً". It now calls `generateWeeklyReport()` from
`src/features/captain/services/captain-rank.ts`:

| Server response | What the captain sees |
|---|---|
| success | `رتبتك: <rank>` plus average rating and heart count |
| `COURT_001` | no new ratings since the last report |
| `COURT_002` | promotion still locked by the 72h disciplinary window |
| thrown error | a destructive toast carrying the message |

## Still outstanding

- `docs/verify-captain-rank-engine.sql` has to be run by hand. The MCP connection is
  read-only, so the promotion, descent and 72h-lock paths have never been exercised at
  runtime.
- `resync_all_captain_ranks()` is deliberately called by no migration. Running it corrects
  the hand-seeded ranks (4 PLATINUM / 5 GOLD that do not meet the rules) downward.
