-- Per-country traffic factor, applied to routed durations.
--
-- OSRM's car profile uses free-flow road speeds and models no congestion at all. Measured
-- against Google on a real 20.6 km Cairo route: OSRM 23 min, Google 29 min — a 1.26 gap
-- that is pure traffic.
--
-- WHY NOT THE PUBLISHED CONGESTION INDEX DIRECTLY
--
-- TomTom's 2025 figures for Cairo are a 75.8% congestion level, 21.1 km/h city-wide
-- average, 28:26 per 10 km. Applying 1.758 to the OSRM duration would have produced 40
-- minutes for that trip against Google's 29 — a large over-correction. Two reasons:
--
--   * TomTom measures excess against ITS OWN free-flow baseline, which is not OSRM's speed
--     model. The percentages are not transferable between the two.
--   * A city-wide average is dominated by short dense-centre trips. A 20 km run mostly on
--     ring roads is far less congested than the city mean.
--
-- So Egypt is anchored on the measurement we actually have (1.25 ~ the observed 1.26), and
-- Jordan is scaled from the relative index scores — Amman 185.6 vs Cairo 241.2, so roughly
-- 77% of Cairo's excess: 1 + (0.25 * 0.77) ~ 1.19, rounded to 1.15 to stay conservative.
--
-- ONLY EGYPT'S NUMBER IS MEASURED. Jordan's is inferred and should be checked against two
-- or three real Amman routes before it is trusted.
--
-- APPLIED TO ROUTED DURATIONS ONLY. The estimate branch already assumes 40 km/h in town,
-- which is itself a congested speed (OSRM free-flow on that same route was ~54 km/h), so
-- multiplying it again would double-count.

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS traffic_factor numeric NOT NULL DEFAULT 1.25;

ALTER TABLE public.countries
  DROP CONSTRAINT IF EXISTS countries_traffic_factor_range;
ALTER TABLE public.countries
  ADD CONSTRAINT countries_traffic_factor_range CHECK (traffic_factor >= 1 AND traffic_factor <= 3);

COMMENT ON COLUMN public.countries.traffic_factor IS
  'Multiplier applied to a free-flow routed duration to approximate real traffic. 1.0 = no adjustment. Applies to routed durations only; the offline estimate already assumes congested city speed.';

UPDATE public.countries SET traffic_factor = 1.25 WHERE iso_code = 'EG';
UPDATE public.countries SET traffic_factor = 1.15 WHERE iso_code = 'JO';


-- ---------------------------------------------------------------------------
-- Expose it to the client, which is where the factor is applied — once, on the OSRM
-- response, so the duration the rider is shown, the one stored on the request, and the one
-- the fare is computed from are all the same number.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.country_traffic_factor(p_country_id integer)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT coalesce(
    (SELECT c.traffic_factor FROM public.countries c WHERE c.id = p_country_id),
    1.25
  );
$fn$;

REVOKE ALL ON FUNCTION public.country_traffic_factor(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.country_traffic_factor(integer) TO authenticated;
