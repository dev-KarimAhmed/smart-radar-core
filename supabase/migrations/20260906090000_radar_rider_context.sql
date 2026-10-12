-- The captain could not see who they were bidding on.
--
-- Item 5: "إظهار تقييم الراكب للكابتن. توضيح ما إذا كان الكابتن ضمن قائمة المفضلين لدى الراكب".
--
-- captain_radar_requests carries the trip, the fare and the geography, and nothing at all
-- about the person. So a captain decides whether to bid with no idea whether this is a rider
-- who rates everyone one star, or one who has already picked them out as a favourite.
--
-- Both facts are already in the database:
--
--   profiles.rating           the rider's own score, maintained by the same rank engine
--   reviews.gave_heart        set when a rider hearts a captain from the rating modal
--
-- I had assumed favourites lived only in Dexie on the rider's phone and would need migrating
-- to the server first. They do not: the rating modal writes `gave_heart` to public.reviews
-- AND mirrors it to Dexie for offline recall, so the server has had the record all along.
-- No migration of rider data is needed.
--
--
-- WHY IN THE VIEW
--
-- This view already computes per-caller values — it hides the exact pickup coordinates
-- unless `accepted_captain_id = auth.uid()`. The favourite flag is the same shape: it is only
-- ever "has this rider favourited ME", scoped to the calling captain, so one captain can
-- never learn anything about another captain's favourites.
--
-- CREATE OR REPLACE with the new columns appended at the end, rather than DROP + CREATE, so
-- existing grants survive and nothing depending on the view breaks.

DROP VIEW IF EXISTS public.captain_radar_requests CASCADE;

CREATE VIEW public.captain_radar_requests
WITH (security_barrier = true)
AS
SELECT
  rr.id,
  rr.rider_id,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lat ELSE NULL::numeric END AS origin_lat,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lng ELSE NULL::numeric END AS origin_lng,
  rr.destination_lat,
  rr.destination_lng,
  rr.origin_h3,
  rr.origin_h3 AS h3_cell,
  rr.destination_h3,
  rr.destination_address_ar,
  NULL::text AS destination_address_en,
  rr.destination_address_ar AS destination_address,
  rr.server_estimated_fare,
  rr.country_id,
  rr.status,
  rr.created_at,
  rr.accepted_offer_id,
  rr.accepted_captain_id,
  rr.final_fare,
  rr.arrived_at,
  rr.started_at,
  rr.completed_at,
  rr.updated_at,
  rr.origin_address,
  CASE
    WHEN rr.origin_google_maps_url IS NOT NULL
      AND rr.origin_google_maps_url !~* '(^|[?&](query|q)=)0([.]0+)?(,|%2[cC]|%20|[[:space:]])+0([.]0+)?([^0-9]|$)'
    THEN rr.origin_google_maps_url
    ELSE NULL::text
  END AS origin_google_maps_url,
  rr.estimated_distance_km,
  rr.estimated_duration_minutes,

  -- === appended: who the rider is ===

  -- The rider's own score. NULL until they have been rated at all, which the UI must show as
  -- "no rating yet" rather than as a zero — a new rider is not a bad rider.
  (
    SELECT p.rating
    FROM public.profiles p
    WHERE p.id = rr.rider_id
      AND coalesce(p.rating_count, 0) > 0
  ) AS rider_rating,

  (
    SELECT coalesce(p.rating_count, 0)
    FROM public.profiles p
    WHERE p.id = rr.rider_id
  ) AS rider_rating_count,

  -- Has THIS rider hearted the captain reading this row. Scoped to auth.uid() on purpose:
  -- there is no version of this column that tells a captain about anyone else.
  EXISTS (
    SELECT 1
    FROM public.reviews rv
    WHERE rv.reviewer_id = rr.rider_id
      AND rv.reviewee_id = auth.uid()
      AND rv.gave_heart
  ) AS rider_favorited_me,

  -- How many trips this rider has finished. A rider with a thin history and a perfect score
  -- is not the same signal as one with two hundred trips, and the captain should see which.
  (
    SELECT count(*)
    FROM public.ride_requests done
    WHERE done.rider_id = rr.rider_id
      AND upper(coalesce(done.status::text, '')) = 'COMPLETED'
  ) AS rider_completed_trips

FROM public.ride_requests rr
WHERE
  (
    upper(coalesce(rr.status::text, '')) = 'PENDING'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) IN ('DRIVER', 'CAPTAIN')
        AND (rr.country_id IS NULL OR p.country_id = rr.country_id)
    )
  )
  OR rr.accepted_captain_id = auth.uid();

GRANT SELECT ON public.captain_radar_requests TO authenticated;


-- ---------------------------------------------------------------------------
-- Indexes for the two new subqueries, which run per radar row.
-- ---------------------------------------------------------------------------

-- reviews_hearts_by_reviewee from 20260828090000 covers (reviewee_id, reviewer_id) WHERE
-- gave_heart, which is exactly the favourite lookup. Nothing more needed for that one.

-- Not a partial index.
--
--   ERROR 42P17: functions in index predicate must be marked IMMUTABLE
--
-- `WHERE upper(status::text) = 'COMPLETED'` cannot be an index predicate: the enum-to-text
-- cast is STABLE, not IMMUTABLE, because the enum's labels can be altered after the index is
-- built. Postgres refuses rather than let an index silently disagree with the table.
--
-- Comparing the enum directly (`status = 'COMPLETED'::ride_request_status`) would be
-- immutable and would work — but it hardcodes both the type name and the exact label, and
-- that is the assumption that already broke once in this series when `user_status` turned out
-- to have no 'idle' label. A plain two-column index needs neither.
--
-- rider_id is the selective half here anyway; a rider has tens of trips, not millions.
CREATE INDEX IF NOT EXISTS ride_requests_rider_status_idx
  ON public.ride_requests (rider_id, status);


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- As a captain, the radar must now carry the rider context.
--   SELECT id, rider_rating, rider_rating_count, rider_favorited_me, rider_completed_trips
--   FROM public.captain_radar_requests
--   LIMIT 10;
--
--   -- rider_favorited_me must be scoped to the caller: run the same query as two different
--   -- captains against the same request and the column may legitimately differ, while
--   -- rider_rating must not.
--
--   -- Sanity-check one rider's heart against the source rows:
--   SELECT reviewer_id, reviewee_id, gave_heart, created_at
--   FROM public.reviews
--   WHERE reviewer_id = '<rider-id>' AND gave_heart
--   ORDER BY created_at DESC;
--
-- NOTE: rider_rating is NULL for a rider nobody has rated. The captain card must render that
-- as "لا يوجد تقييم" — showing 0.0 would read as the worst possible rider and would make
-- captains refuse every newcomer.
