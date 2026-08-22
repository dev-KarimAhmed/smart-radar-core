# Rating + rank system: end-to-end audit

2026-08-22. Verdict: **the rank engine is installed and correct. The rating UI that fed
it has been fixed (Problem 1); three smaller issues remain, all in dead code.** Details below.

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

## Problem 2 — `submit_ride_rating` is a landmine

`public.submit_ride_rating(request_id, captain_id, rating_value)` is a proper 1–5 star
path: it writes `rider_ratings` and full-recomputes `profiles.rating / rating_sum /
rating_count / trust_score`. It holds the 6 real star ratings in the table (avg **4.17** —
healthy, unlike the derived numbers above).

**It is unreachable from the current UI.** All three call sites are dead:

| Call site | Why it is dead |
|---|---|
| `use-trip-completion.ts:109` (`handleSubmitRating`) | returned from the hook, but no component ever references it |
| `use-rider-transactions.tsx:69` (`rateTrip`) | `useRiderTransactions` has zero consumers, and `use-rider-operations.tsx:112` hard-codes `rateTrip: resolvedPromise` — a no-op stub |
| `use-driver-transactions.ts:493` (`rateAndFinishTrip`) | plumbed through `use-driver-operations` but no component calls it |

So `rider_ratings` is a fossil from an earlier UI. Two consequences:

- It did **not** break when the rank engine froze those columns, because it never runs.
  But it would have — silently, with no error. `20260822140000_rank_engine_rating_source_fix.sql`
  makes it engine-aware so that stays safe.
- If it is ever revived, it and `apply_review_to_profile` will fight: one recomputes the
  aggregate from `rider_ratings`, the other increments it from a review. Whichever runs
  last wipes the other. **Decide which table owns the rating before wiring it up.**

Note this is also the cleanest route out of Problem 1: option 1 above is essentially
"revive this RPC and point the modal at it".

## Problem 3 — the captain can never rate the rider (pre-existing)

`use-driver-transactions.ts:493` calls `submit_ride_rating` with
`p_captain_id = activeRequest.riderId`, but the function raises `not_request_owner` unless
`auth.uid() = req.rider_id`. When a captain calls it, that is false by definition, so it
always throws and the UI shows the generic "تعذر حفظ التقييم". If it ever did pass, it
would write the rider's id into `rider_ratings.captain_id` and corrupt the table.

Unrelated to the rank engine (rider ratings do not feed captain rank), and currently
harmless because the call site is dead — but it needs its own fix whenever captain→rider
rating is wanted.

## Problem 4 — `generate_weekly_report` has no caller

The RPC exists and `src/features/captain/services/captain-rank.ts` wraps it, but the
captain-facing `requestWeeklyReport` in `use-driver-transactions.ts:520` is a placeholder
that only shows a toast: "التقرير غير متاح حالياً". Wiring it to the real RPC is a small
change, and worth doing since the automatic trigger already keeps ranks current — the RPC
is mainly for an on-demand refresh and admin use.
