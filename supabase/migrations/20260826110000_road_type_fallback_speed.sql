-- The fallback speed becomes road-type aware: 40 km/h in town, 100 km/h on open road.
--
-- 20260826090000 made the fare use the real routed duration whenever OSRM supplies one.
-- This only touches the OTHER branch — what happens when the router does not answer inside
-- its 1.5s timeout, which on the public demo endpoint is often.
--
-- That branch was a single flat 2.2 min/km (27.3 km/h), so an intercity run on open desert
-- road was costed as if it crawled through downtown: a 200 km trip billed 440 minutes of
-- time instead of roughly 143.
--
-- Offline there is no road-type data to consult, so distance is the only signal available:
-- a short trip is almost certainly urban, a long one is mostly open road. The first
-- URBAN_SEGMENT_KM are costed at CITY_SPEED_KMH and the remainder at HIGHWAY_SPEED_KMH.
--
--   3 km   ->   5 min   (40 km/h)
--   25 km  ->  38 min   (40 km/h)
--   50 km  ->  53 min   (57 km/h effective)
--   200 km -> 143 min   (84 km/h effective)
--
-- URBAN_SEGMENT_KM is a heuristic, not a measurement — 25 km is roughly a cross-Cairo trip.
-- These three values are mirrored in src/shared/services/trip-duration.ts, because a fare
-- estimated without the router has to match the duration the rider is shown. Change both
-- together or the two drift apart again.

CREATE OR REPLACE FUNCTION public.resolve_trip_metrics(
  p_stored_km numeric,
  p_stored_minutes numeric,
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric,
  p_country_id integer
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  CITY_SPEED_KMH constant numeric := 40;
  HIGHWAY_SPEED_KMH constant numeric := 100;
  URBAN_SEGMENT_KM constant numeric := 25;
  v_road_km numeric;
  v_minutes numeric;
  v_urban_km numeric;
  v_highway_km numeric;
  v_km_source text;
  v_minutes_source text;
BEGIN
  IF p_stored_km IS NOT NULL AND p_stored_km > 0 THEN
    v_road_km := p_stored_km;
    v_km_source := 'route';
  ELSE
    v_road_km := coalesce(public.trip_road_km(lat1, lng1, lat2, lng2, p_country_id), 0);
    v_km_source := 'estimate';
  END IF;

  IF p_stored_minutes IS NOT NULL AND p_stored_minutes > 0 THEN
    v_minutes := p_stored_minutes;
    v_minutes_source := 'route';
  ELSE
    v_urban_km := least(v_road_km, URBAN_SEGMENT_KM);
    v_highway_km := greatest(0, v_road_km - URBAN_SEGMENT_KM);
    v_minutes := (v_urban_km / CITY_SPEED_KMH) * 60 + (v_highway_km / HIGHWAY_SPEED_KMH) * 60;
    v_minutes_source := 'estimate';
  END IF;

  RETURN jsonb_build_object(
    'roadKm', round(v_road_km, 2),
    'minutes', round(greatest(1, v_minutes), 1),
    'kmSource', v_km_source,
    'minutesSource', v_minutes_source
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.resolve_trip_metrics(numeric, numeric, numeric, numeric, numeric, numeric, integer) TO authenticated;
