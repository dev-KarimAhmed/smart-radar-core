-- Learn the traffic factor from completed trips instead of guessing it.
--
-- Every estimate so far has come from a number someone chose: 2.2 min/km, then 40/100 km/h,
-- then a country traffic_factor of 1.25 picked by comparing ONE Cairo route against Google.
-- Meanwhile ride_requests has been recording, for every finished trip:
--
--   estimated_duration_minutes   what the rider was told
--   started_at, completed_at     what actually happened
--
-- So the correction factor does not have to be estimated at all. It can be measured, from
-- this system's own roads, cars and drivers — which is strictly better than any constant,
-- because it also absorbs whatever is specific to this market and cannot be modelled:
-- unmapped speed bumps, double-parking, how long a captain really waits at a pickup.
--
-- What this does NOT do: change any stored estimate retroactively, or touch a fare that has
-- already been agreed. It only corrects the factor future estimates are built from.


-- ---------------------------------------------------------------------------
-- 1. The measurement.
--
--    Deliberately conservative about what counts as a usable sample.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.measure_duration_accuracy(
  p_country_id integer DEFAULT NULL,
  p_days integer DEFAULT 30
) RETURNS TABLE (
  country_id integer,
  sample_size bigint,
  median_ratio numeric,
  mean_ratio numeric,
  p90_ratio numeric,
  median_estimated_minutes numeric,
  median_actual_minutes numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH samples AS (
    SELECT
      r.country_id,
      r.estimated_duration_minutes AS estimated,
      EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60.0 AS actual
    FROM public.ride_requests r
    WHERE r.started_at IS NOT NULL
      AND r.completed_at IS NOT NULL
      AND r.completed_at > r.started_at
      AND r.estimated_duration_minutes IS NOT NULL
      AND r.estimated_duration_minutes > 0
      AND r.completed_at > now() - make_interval(days => greatest(1, p_days))
      AND (p_country_id IS NULL OR r.country_id = p_country_id)
  ),
  clean AS (
    SELECT country_id, estimated, actual, actual / estimated AS ratio
    FROM samples
    -- Discard the impossible and the abandoned. A "trip" that ran 4 hours is a captain who
    -- forgot to end it, and letting one of those into the average would poison the factor
    -- for everyone. Likewise a 20-second trip is a mis-tap, not a journey.
    WHERE actual BETWEEN 1 AND 240
      AND actual / estimated BETWEEN 0.2 AND 5.0
  )
  SELECT
    country_id,
    count(*) AS sample_size,
    -- Median, not mean: the distribution has a long right tail (one blocked road, one
    -- captain who stopped for tea) and a mean chases those outliers.
    round(percentile_cont(0.5) WITHIN GROUP (ORDER BY ratio)::numeric, 3) AS median_ratio,
    round(avg(ratio)::numeric, 3) AS mean_ratio,
    round(percentile_cont(0.9) WITHIN GROUP (ORDER BY ratio)::numeric, 3) AS p90_ratio,
    round(percentile_cont(0.5) WITHIN GROUP (ORDER BY estimated)::numeric, 1),
    round(percentile_cont(0.5) WITHIN GROUP (ORDER BY actual)::numeric, 1)
  FROM clean
  GROUP BY country_id;
$fn$;

COMMENT ON FUNCTION public.measure_duration_accuracy(integer, integer) IS
  'Measured actual/estimated trip duration per country. median_ratio > 1 means riders are being told trips are shorter than they are.';

GRANT EXECUTE ON FUNCTION public.measure_duration_accuracy(integer, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. Applying it.
--
--    Writes the measured correction into countries.traffic_factor — the value the client
--    already reads and already multiplies a free-flow duration by. Nothing new has to be
--    plumbed through the app for this to take effect, which is the point: one number, one
--    place, already wired to both the displayed duration and the fare.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalibrate_traffic_factors(
  p_min_samples integer DEFAULT 30,
  p_dry_run boolean DEFAULT true
) RETURNS TABLE (
  country_id integer,
  sample_size bigint,
  measured_ratio numeric,
  old_factor numeric,
  new_factor numeric,
  applied boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  -- The floor exists because a factor below 1 would mean claiming trips finish faster than
  -- free-flow driving, which no traffic condition produces. The ceiling stops one very bad
  -- week from tripling every quote in the country.
  MIN_FACTOR constant numeric := 1.00;
  MAX_FACTOR constant numeric := 2.50;
  -- Move only part of the way to the new measurement each run. A factor that jumps around
  -- week to week makes quotes feel arbitrary to captains who watch them.
  SMOOTHING constant numeric := 0.5;
  row_data record;
BEGIN
  FOR row_data IN
    SELECT m.country_id, m.sample_size, m.median_ratio, c.traffic_factor AS current_factor
    FROM public.measure_duration_accuracy(NULL, 30) m
    JOIN public.countries c ON c.id = m.country_id
  LOOP
    country_id := row_data.country_id;
    sample_size := row_data.sample_size;
    measured_ratio := row_data.median_ratio;
    old_factor := coalesce(row_data.current_factor, 1.25);

    IF row_data.sample_size < p_min_samples THEN
      -- Not enough trips to say anything. Leave the factor alone rather than swing it on
      -- five data points.
      new_factor := old_factor;
      applied := false;
      RETURN NEXT;
      CONTINUE;
    END IF;

    -- The measured ratio is actual/estimated where the estimate ALREADY included the old
    -- factor, so the correction compounds onto it rather than replacing it.
    new_factor := least(MAX_FACTOR, greatest(MIN_FACTOR,
      round(old_factor + SMOOTHING * (old_factor * row_data.median_ratio - old_factor), 3)
    ));

    IF p_dry_run THEN
      applied := false;
    ELSE
      UPDATE public.countries SET traffic_factor = new_factor WHERE id = row_data.country_id;
      applied := true;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$fn$;

COMMENT ON FUNCTION public.recalibrate_traffic_factors(integer, boolean) IS
  'Corrects countries.traffic_factor from measured trip durations. Dry run by default — pass p_dry_run => false to write.';

REVOKE ALL ON FUNCTION public.recalibrate_traffic_factors(integer, boolean) FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- 3. Per-hour accuracy, to check the time-of-day curve in the app.
--
--    src/shared/services/trip-duration.ts carries an hourly curve whose SHAPE was assumed,
--    not measured. This is how to find out whether the assumed shape matches this market:
--    a column of ratios near 1.0 means the curve is right, and a bulge at some hour means
--    the curve is too low there.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.measure_duration_accuracy_by_hour(
  p_country_id integer DEFAULT NULL,
  p_days integer DEFAULT 60
) RETURNS TABLE (
  hour_of_day integer,
  sample_size bigint,
  median_ratio numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH clean AS (
    SELECT
      EXTRACT(HOUR FROM r.started_at)::integer AS hour_of_day,
      (EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60.0)
        / r.estimated_duration_minutes AS ratio
    FROM public.ride_requests r
    WHERE r.started_at IS NOT NULL
      AND r.completed_at IS NOT NULL
      AND r.completed_at > r.started_at
      AND r.estimated_duration_minutes > 0
      AND r.completed_at > now() - make_interval(days => greatest(1, p_days))
      AND (p_country_id IS NULL OR r.country_id = p_country_id)
      AND EXTRACT(EPOCH FROM (r.completed_at - r.started_at)) / 60.0 BETWEEN 1 AND 240
  )
  SELECT hour_of_day, count(*),
         round(percentile_cont(0.5) WITHIN GROUP (ORDER BY ratio)::numeric, 3)
  FROM clean
  WHERE ratio BETWEEN 0.2 AND 5.0
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
$fn$;

GRANT EXECUTE ON FUNCTION public.measure_duration_accuracy_by_hour(integer, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- How to use this
--
--   -- 1. See where you stand. Run this FIRST; it changes nothing.
--   SELECT * FROM public.measure_duration_accuracy();
--
--      median_ratio = 1.00  -> estimates are already right
--      median_ratio = 1.30  -> real trips take 30% longer than riders are told
--      median_ratio = 0.80  -> estimates are 20% too pessimistic
--
--   -- 2. See what a recalibration WOULD do. Still changes nothing.
--   SELECT * FROM public.recalibrate_traffic_factors();
--
--   -- 3. Apply it, once the sample is big enough to trust.
--   SELECT * FROM public.recalibrate_traffic_factors(p_min_samples => 30, p_dry_run => false);
--
--   -- 4. Check the assumed hourly shape against reality.
--   SELECT * FROM public.measure_duration_accuracy_by_hour();
--
-- Worth re-running monthly. It is also the only honest way to answer "are the estimates
-- accurate?" — every other answer in this project so far has been one route compared against
-- one screenshot.
