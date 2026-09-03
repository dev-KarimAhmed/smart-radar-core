-- Favouriting a captain was stored per TRIP, on one device, and never reached the server.
--
-- Two symptoms, one cause. Reported from the rider's trip history: the same captain appears
-- three times, only one row shows a filled heart — and the captain still sees
-- "مش في مفضلته".
--
-- What the code actually did:
--
--   dexieDb.favoriteCaptains.where('tripId')          keyed by TRIP, not captain
--   favoriteCaptains.some(f => f.tripId === trip.tripId)   matched by TRIP, so only the one
--                                                          row that was tapped lights up
--   the history heart wrote Dexie + localStorage only    the server learned nothing
--
-- So "favourite" was really "I tapped a heart on this one receipt, in this one browser".
--
-- But favouriting is about a PERSON. A rider who favourites a captain means it for every trip
-- they have taken with them and every trip to come, on any device — and the captain is
-- supposed to be able to see it, which is impossible while the record never leaves the phone.
--
-- The rating modal did write reviews.gave_heart, which is why the captain's card worked at
-- all in testing but not from the history screen. One of the two places that set a favourite
-- told the server; the other did not.
--
--
-- THE FIX
--
-- A real table keyed by (rider, captain). reviews.gave_heart stays as the historical record
-- of "this rider hearted this captain when rating that trip" and is backfilled into here, so
-- no existing favourite is lost.


CREATE TABLE IF NOT EXISTS public.rider_favorite_captains (
  rider_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  captain_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- The pair IS the identity. One rider cannot favourite the same captain twice, and this is
  -- what makes the state per-captain instead of per-trip.
  PRIMARY KEY (rider_id, captain_id)
);

COMMENT ON TABLE public.rider_favorite_captains IS
  'Rider -> captain favourites. Keyed by the pair, not by trip: a favourite is about the person, and both sides can see it.';

-- The captain's radar asks "has this rider favourited me", so the lookup runs captain-first.
CREATE INDEX IF NOT EXISTS rider_favorite_captains_by_captain_idx
  ON public.rider_favorite_captains (captain_id, rider_id);


-- ---------------------------------------------------------------------------
-- RLS: a rider manages only their own list; a captain may read only rows about themselves.
-- ---------------------------------------------------------------------------

ALTER TABLE public.rider_favorite_captains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rider_manages_own_favorites ON public.rider_favorite_captains;
CREATE POLICY rider_manages_own_favorites
  ON public.rider_favorite_captains
  FOR ALL
  TO authenticated
  USING (rider_id = auth.uid())
  WITH CHECK (rider_id = auth.uid());

-- Read-only, and only about themselves: a captain can learn that a rider favourited THEM and
-- nothing about any other captain's list.
DROP POLICY IF EXISTS captain_reads_own_favorited_by ON public.rider_favorite_captains;
CREATE POLICY captain_reads_own_favorited_by
  ON public.rider_favorite_captains
  FOR SELECT
  TO authenticated
  USING (captain_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.rider_favorite_captains TO authenticated;


-- ---------------------------------------------------------------------------
-- Backfill from the hearts already recorded on reviews.
--
-- Only rider -> captain pairs: reviews also holds the captain's rating OF the rider, and a
-- captain hearting a rider is not a rider favouriting a captain.
-- ---------------------------------------------------------------------------

INSERT INTO public.rider_favorite_captains (rider_id, captain_id, created_at)
SELECT rv.reviewer_id, rv.reviewee_id, min(rv.created_at)
FROM public.reviews rv
JOIN public.profiles captain ON captain.id = rv.reviewee_id
WHERE rv.gave_heart
  AND rv.reviewer_id IS NOT NULL
  AND rv.reviewee_id IS NOT NULL
  AND upper(coalesce(captain.role::text, '')) IN ('CAPTAIN', 'DRIVER')
GROUP BY rv.reviewer_id, rv.reviewee_id
ON CONFLICT (rider_id, captain_id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- The radar now reads the table.
--
-- Kept as an OR with reviews.gave_heart so a heart recorded on a review still counts even if
-- the backfill above is ever re-run against newer data — the two must never disagree in a way
-- that makes a favourite silently vanish from the captain's card.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.captain_radar_requests
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

  (
    EXISTS (
      SELECT 1
      FROM public.rider_favorite_captains fav
      WHERE fav.rider_id = rr.rider_id
        AND fav.captain_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.reviews rv
      WHERE rv.reviewer_id = rr.rider_id
        AND rv.reviewee_id = auth.uid()
        AND rv.gave_heart
    )
  ) AS rider_favorited_me,

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


-- ---------------------------------------------------------------------------
-- Verification
--
--   -- What the backfill recovered from the hearts already on reviews.
--   SELECT count(*) AS favourites_recovered FROM public.rider_favorite_captains;
--
--   -- As a RIDER: your own list, one row per captain — not per trip.
--   SELECT captain_id, created_at FROM public.rider_favorite_captains ORDER BY created_at DESC;
--
--   -- As a CAPTAIN: only rows about you come back, whatever you ask for.
--   SELECT rider_id FROM public.rider_favorite_captains;
--
--   -- And the radar must now agree with the rider's own list.
--   SELECT id, rider_id, rider_favorited_me FROM public.captain_radar_requests LIMIT 10;
