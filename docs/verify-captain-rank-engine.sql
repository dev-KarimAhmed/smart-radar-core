-- Verification harness for supabase/migrations/20260822090000_captain_rank_sovereign_engine.sql
--
-- Run it in the Supabase SQL editor AFTER applying the migration. It borrows one real
-- captain row as a probe (profiles.id has an FK to auth.users, so a synthetic row is not
-- an option) and does everything inside a transaction that is rolled back at the end —
-- no row keeps any of these changes.
--
-- Expected output: every `check_name` row reports PASS.

BEGIN;

CREATE TEMP TABLE probe ON COMMIT DROP AS
SELECT id
FROM public.profiles
WHERE upper(coalesce(role::text, '')) IN ('CAPTAIN', 'DRIVER')
ORDER BY created_at
LIMIT 1;

-- Known baseline: rating 5.00, no hearts, no penalties, no lock.
-- With the engine flag on, the trigger settles tier at calculate_sovereign_rank(5, 0) = SILVER.
SELECT set_config('radar.rank_engine', 'on', true);
UPDATE public.profiles
SET rating = 5, trust_score = 5, rating_sum = 0, rating_count = 0, heart_count = 0,
    penalty_count = 0, rank_penalty_expires_at = NULL, rank_audit_log = '{}'::text[]
WHERE id = (SELECT id FROM probe);
SELECT set_config('radar.rank_engine', '', true);

SELECT
  '0. baseline is SILVER' AS check_name,
  CASE WHEN tier = 'SILVER' THEN 'PASS' ELSE 'FAIL (' || tier || ')' END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- 1. calculate_sovereign_rank must reproduce RANKING_RULES exactly, hearts gate included.
SELECT
  '1. thresholds' AS check_name,
  CASE WHEN
       public.calculate_sovereign_rank(4.9, 60) = 'PLATINUM'
   AND public.calculate_sovereign_rank(4.9, 49) = 'GOLD'      -- rating is there, hearts are not
   AND public.calculate_sovereign_rank(4.9, 19) = 'SILVER'    -- neither hearts gate cleared
   AND public.calculate_sovereign_rank(4.6, 25) = 'GOLD'
   AND public.calculate_sovereign_rank(4.5, 20) = 'GOLD'      -- boundary, inclusive
   AND public.calculate_sovereign_rank(4.0, 0)  = 'SILVER'    -- boundary, inclusive
   AND public.calculate_sovereign_rank(3.99, 0) = 'BRONZE'
   AND public.calculate_sovereign_rank(NULL, NULL) = 'BRONZE'
  THEN 'PASS' ELSE 'FAIL' END AS result;


-- 2. The 0/1 criteria object must rescale to 0..5 regardless of how many criteria exist.
SELECT
  '2. star derivation' AS check_name,
  CASE WHEN
       public.sovereign_stars_to_rating('{"a":1,"b":1,"c":1,"d":1,"e":1}'::jsonb) = 5.00
   AND public.sovereign_stars_to_rating('{"a":1,"b":1,"c":1,"d":1,"e":0}'::jsonb) = 4.00
   AND public.sovereign_stars_to_rating('{"a":0,"b":0}'::jsonb) = 0.00
   AND public.sovereign_stars_to_rating('{"a":true,"b":false}'::jsonb) = 2.50
   AND public.sovereign_stars_to_rating('{}'::jsonb) IS NULL
   AND public.sovereign_stars_to_rating(NULL) IS NULL
  THEN 'PASS' ELSE 'FAIL' END AS result;


-- 2b. Every writer of an engine-owned column must declare itself to the engine, or its
--     write is silently rolled back by sync_captain_rank.
SELECT
  '2b. all rating writers are engine-aware' AS check_name,
  CASE WHEN
       (SELECT pg_get_functiondef(p.oid) ILIKE '%radar.rank_engine%'
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'apply_review_to_profile')
   AND (SELECT pg_get_functiondef(p.oid) ILIKE '%radar.rank_engine%'
        FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'submit_ride_rating')
  THEN 'PASS' ELSE 'FAIL — a rating writer will lose its writes' END AS result;


-- 3. A direct client write to any engine-owned column must be discarded.
UPDATE public.profiles
SET tier = 'PLATINUM', rating = 5.0, heart_count = 999, penalty_count = 0, rating_count = 500
WHERE id = (SELECT id FROM probe);

SELECT
  '3. engine-owned columns frozen' AS check_name,
  CASE WHEN tier = 'SILVER' AND heart_count = 0 AND rating_count = 0
       THEN 'PASS'
       ELSE 'FAIL (' || tier || '/' || heart_count || '/' || rating_count || ')'
  END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- 4. Promotion: rating AND hearts together lift the rank.
SELECT set_config('radar.rank_engine', 'on', true);
UPDATE public.profiles SET rating = 4.9, heart_count = 30 WHERE id = (SELECT id FROM probe);
SELECT set_config('radar.rank_engine', '', true);

SELECT
  '4. promotion to GOLD (4.9 / 30 hearts)' AS check_name,
  CASE WHEN tier = 'GOLD' THEN 'PASS' ELSE 'FAIL (' || tier || ')' END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- 5. Emergency descent: the third penalty strips the rank and arms the 72h lock.
SELECT set_config('radar.rank_engine', 'on', true);
UPDATE public.profiles SET penalty_count = 1 WHERE id = (SELECT id FROM probe);
UPDATE public.profiles SET penalty_count = 2 WHERE id = (SELECT id FROM probe);
UPDATE public.profiles SET penalty_count = 3 WHERE id = (SELECT id FROM probe);
SELECT set_config('radar.rank_engine', '', true);

SELECT
  '5. emergency descent' AS check_name,
  CASE WHEN tier = 'BRONZE'
        AND penalty_count = 0
        AND rank_penalty_expires_at > now() + interval '71 hours'
        AND rank_penalty_expires_at < now() + interval '73 hours'
        AND array_length(rank_audit_log, 1) >= 1
       THEN 'PASS'
       ELSE 'FAIL (' || tier || '/' || penalty_count || '/' || coalesce(rank_penalty_expires_at::text, 'no lock') || ')'
  END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- 6. While the lock runs, a captain who deserves PLATINUM stays at BRONZE.
SELECT set_config('radar.rank_engine', 'on', true);
UPDATE public.profiles SET rating = 5.0, heart_count = 100 WHERE id = (SELECT id FROM probe);
SELECT set_config('radar.rank_engine', '', true);

SELECT
  '6. 72h lock blocks promotion' AS check_name,
  CASE WHEN tier = 'BRONZE' THEN 'PASS' ELSE 'FAIL (' || tier || ')' END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- 7. Once the lock lapses, promotion resumes.
SELECT set_config('radar.rank_engine', 'on', true);
UPDATE public.profiles SET rank_penalty_expires_at = now() - interval '1 minute'
WHERE id = (SELECT id FROM probe);
UPDATE public.profiles SET rating = 5.0, heart_count = 100 WHERE id = (SELECT id FROM probe);
SELECT set_config('radar.rank_engine', '', true);

SELECT
  '7. promotion after lock expiry' AS check_name,
  CASE WHEN tier = 'PLATINUM' THEN 'PASS' ELSE 'FAIL (' || tier || ')' END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- 8. A review insert must aggregate into the profile and move the rank on its own.
--    3 of 5 captain criteria -> rating 3.00 -> BRONZE. The vehicle block must not count
--    (4 of 6 would give 3.33), and gave_heart must land on heart_count.
SELECT set_config('radar.rank_engine', 'on', true);
UPDATE public.profiles
SET rating = 5, rating_sum = 0, rating_count = 0, heart_count = 0, rank_penalty_expires_at = NULL
WHERE id = (SELECT id FROM probe);
SELECT set_config('radar.rank_engine', '', true);

INSERT INTO public.reviews (trip_id, reviewer_id, reviewee_id, detailed_stars, gave_heart)
SELECT gen_random_uuid(), id, id,
       '{"captain":{"a":1,"b":1,"c":1,"d":0,"e":0},"vehicle":{"x":1}}'::jsonb,
       true
FROM probe;

SELECT
  '8. review feeds rating + hearts + rank' AS check_name,
  CASE WHEN rating_count = 1 AND rating = 3.00 AND heart_count = 1 AND tier = 'BRONZE'
       THEN 'PASS'
       ELSE 'FAIL (' || rating_count || '/' || rating || '/' || heart_count || '/' || tier || ')'
  END AS result
FROM public.profiles WHERE id = (SELECT id FROM probe);


-- NOTE: generate_weekly_report / record_captain_penalty are not covered here — both read
-- auth.uid(), which is NULL in the SQL editor, so they would raise 'unauthenticated' and
-- abort this transaction. Exercise them from an authenticated session instead:
--   supabase.rpc('generate_weekly_report', { p_captain_id: null })
-- via generateWeeklyReport() in src/features/captain/services/captain-rank.ts.

ROLLBACK;
