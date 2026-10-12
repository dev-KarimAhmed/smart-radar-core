-- Add pricing_preference to captain_radar_requests view

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
  ) AS rider_completed_trips,

  rr.accepted_at,
  rr.pickup_eta_minutes,
  rr.pricing_preference

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

NOTIFY pgrst, 'reload schema';
