-- Did 20260826090000_fare_uses_real_route.sql and 20260826110000_road_type_fallback_speed.sql
-- actually land? Paste this whole file into the Supabase SQL editor.
--
-- Read-only: it inspects catalogues and calls two pure functions. It writes nothing.
-- Every row must say PASS.

-- 1. The shared resolver exists at all (added by 20260826090000).
SELECT
  '1. resolve_trip_metrics exists' AS check_name,
  CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL — 20260826090000 did not run' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'resolve_trip_metrics';

-- 2. calculate_server_fare takes the route from its caller (7 args, not the old 5).
SELECT
  '2. calculate_server_fare accepts p_road_km / p_minutes' AS check_name,
  CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL — still the old 5-argument version' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'calculate_server_fare'
  AND pg_get_function_identity_arguments(p.oid) LIKE '%numeric, numeric';

-- 3. The old 5-argument overload is gone. Two overloads both callable with 5 arguments
--    would make every existing call ambiguous.
SELECT
  '3. old 5-argument overload dropped' AS check_name,
  CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL — both overloads exist, calls will be ambiguous' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'calculate_server_fare'
  AND pg_get_function_identity_arguments(p.oid) = 'lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric, p_country_id integer';

-- 4. Both pricing paths go through the resolver, so the ±15% band compares like with like.
SELECT
  '4. quote + offer both use resolve_trip_metrics' AS check_name,
  CASE WHEN bool_and(pg_get_functiondef(p.oid) ILIKE '%resolve_trip_metrics%')
       THEN 'PASS' ELSE 'FAIL — a pricing path still computes its own metrics' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('captain_offer_quote', 'submit_ride_offer');

-- 5. The road-type speeds are in place (added by 20260826110000).
SELECT
  '5. fallback uses 40 / 100 / 25' AS check_name,
  CASE WHEN pg_get_functiondef(p.oid) ILIKE '%CITY_SPEED_KMH%'
        AND pg_get_functiondef(p.oid) ILIKE '%HIGHWAY_SPEED_KMH%'
        AND pg_get_functiondef(p.oid) NOT ILIKE '%2.2%'
       THEN 'PASS' ELSE 'FAIL — 20260826110000 did not run, still the flat 2.2 min/km' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'resolve_trip_metrics';

-- 6. Behaviour: a stored routed duration must win over any estimate.
SELECT
  '6. routed values win' AS check_name,
  CASE WHEN (m->>'minutes')::numeric = 9
        AND (m->>'roadKm')::numeric = 10
        AND m->>'kmSource' = 'route'
        AND m->>'minutesSource' = 'route'
       THEN 'PASS' ELSE 'FAIL (' || m::text || ')' END AS result
FROM (SELECT public.resolve_trip_metrics(10, 9, 0, 0, 0, 0, 2) AS m) s;

-- 7. Behaviour: with no routed duration, a short trip is costed at city speed.
--    10 km / 40 km/h = 15 min.
SELECT
  '7. short trip = city speed' AS check_name,
  CASE WHEN (m->>'minutes')::numeric = 15 AND m->>'minutesSource' = 'estimate'
       THEN 'PASS' ELSE 'FAIL (' || m::text || ')' END AS result
FROM (SELECT public.resolve_trip_metrics(10, NULL, 0, 0, 0, 0, 2) AS m) s;

-- 8. Behaviour: a long trip blends into highway speed.
--    First 25 km at 40 = 37.5 min, remaining 175 km at 100 = 105 min, total 142.5.
SELECT
  '8. long trip blends to highway speed' AS check_name,
  CASE WHEN (m->>'minutes')::numeric = 142.5
       THEN 'PASS' ELSE 'FAIL (' || m::text || ') — expected 142.5' END AS result
FROM (SELECT public.resolve_trip_metrics(200, NULL, 0, 0, 0, 0, 2) AS m) s;

-- 9. The receipt records which numbers came from the router, so a disputed fare is traceable.
SELECT
  '9. breakdown records metric sources' AS check_name,
  CASE WHEN pg_get_functiondef(p.oid) ILIKE '%kmSource%'
        AND pg_get_functiondef(p.oid) ILIKE '%minutesSource%'
       THEN 'PASS' ELSE 'FAIL — submit_ride_offer is not recording them' END AS result
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'submit_ride_offer';
