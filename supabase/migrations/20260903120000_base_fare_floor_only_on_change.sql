-- The base-fare floor was locking captains out of their own profile.
--
-- Reported from the app: a captain edited their COMPANY NAME, and the write was refused with
--
--   base_fare_below_market_minimum: 17.47
--   فتحة العداد لا يمكن أن تقل عن الحد الأدنى المحسوب من متوسط الكباتن
--
-- enforce_captain_base_fare_floor validates NEW.base_fare on every INSERT and UPDATE, with
-- no check that base_fare is what changed. captain_profiles is one row per captain holding
-- the nickname, company name, company code, office phone, plate, social links AND the
-- tariff, so any edit to any of those re-submits the stored base_fare and re-triggers the
-- check on a value the captain never touched.
--
-- And the floor MOVES: captain_base_fare_floor() derives it from the market average. So a
-- captain who priced their meter when the floor was lower is not merely warned when the
-- average rises past them — they are locked out of editing anything on their profile, for
-- good, with no way to discover why. As the market average climbs, this silently locks out
-- more captains.
--
-- A validation that rejects unchanged data is not a validation, it is a trap. The floor
-- should gate what a captain is SUBMITTING, not what is already stored.
--
-- What this does not change: the floor still applies in full to any actual change of
-- base_fare, and offer-time protection is untouched — submit_ride_offer still refuses an
-- offer below 0.85x the market reference, which is what actually protects the market from
-- undercutting. A stored base_fare below the floor cannot produce an underpriced offer.

CREATE OR REPLACE FUNCTION public.enforce_captain_base_fare_floor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_country_id integer;
  v_floor numeric;
  v_existing_base numeric;
BEGIN
  IF NEW.base_fare IS NULL THEN
    RETURN NEW;  -- not set yet; the setup modal still owes us a value
  END IF;

  -- An UPDATE that leaves base_fare exactly as it was is not a pricing decision, so there
  -- is nothing here to accept or refuse. Without this, a floor that rises past a stored
  -- value freezes the whole row forever.
  IF TG_OP = 'UPDATE' AND NEW.base_fare IS NOT DISTINCT FROM OLD.base_fare THEN
    RETURN NEW;
  END IF;

  -- And the same for an upsert, which is how the profile screen writes.
  --
  -- This trigger is BEFORE INSERT OR UPDATE OF base_fare, and PostgREST's upsert is
  -- `INSERT ... ON CONFLICT (id) DO UPDATE`. The BEFORE INSERT trigger therefore fires
  -- FIRST, with TG_OP = 'INSERT' and no OLD row, before the conflict is even detected — so
  -- the UPDATE guard above is never reached on that path and the refusal stands. Guarding
  -- only TG_OP = 'UPDATE' fixed nothing for the screen that reported the bug.
  --
  -- The existing row is visible here: it is committed data, and its existence is precisely
  -- what makes this statement resolve to an update.
  IF TG_OP = 'INSERT' THEN
    SELECT cp.base_fare INTO v_existing_base
    FROM public.captain_profiles cp
    WHERE cp.id = NEW.id;

    IF found AND v_existing_base IS NOT DISTINCT FROM NEW.base_fare THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT p.country_id INTO v_country_id FROM public.profiles p WHERE p.id = NEW.id;

  IF v_country_id IS NULL THEN
    v_floor := 1.00;
  ELSE
    v_floor := public.captain_base_fare_floor(v_country_id);
  END IF;

  IF NEW.base_fare < v_floor THEN
    RAISE EXCEPTION 'base_fare_below_market_minimum: %', v_floor
      USING HINT = 'فتحة العداد لا يمكن أن تقل عن الحد الأدنى المحسوب من متوسط الكباتن';
  END IF;

  RETURN NEW;
END;
$fn$;


-- ---------------------------------------------------------------------------
-- Who was affected
--
--   -- Captains whose stored base_fare is under the current floor. Before this migration
--   -- every one of these was unable to save ANY profile change.
--   SELECT cp.id, cp.base_fare, public.captain_base_fare_floor(p.country_id) AS floor_now
--   FROM public.captain_profiles cp
--   JOIN public.profiles p ON p.id = cp.id
--   WHERE cp.base_fare IS NOT NULL
--     AND cp.base_fare < public.captain_base_fare_floor(p.country_id)
--   ORDER BY cp.base_fare;
--
-- They can now edit their profile again. Their meter opening is still below the floor, which
-- is a thing to ASK them about — the tariff modal already re-prompts on every activation
-- with their stored values prefilled, which is the right place for it. It is not a reason to
-- refuse an edit to their phone number.
--
-- Verification
--
--   -- An unrelated update must now succeed even when base_fare is under the floor.
--   -- As the captain, or with the service role:
--   --   UPDATE public.captain_profiles SET nickname = nickname WHERE id = '<captain-id>';
--   -- expect: UPDATE 1
--
--   -- And an actual attempt to LOWER it must still be refused.
--   --   UPDATE public.captain_profiles SET base_fare = 1 WHERE id = '<captain-id>';
--   -- expect: ERROR base_fare_below_market_minimum
