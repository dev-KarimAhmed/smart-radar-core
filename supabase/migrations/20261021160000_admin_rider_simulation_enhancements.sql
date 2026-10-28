-- Migration: 20261021160000_admin_rider_simulation_enhancements.sql
-- Description: Enhances simulate_referral_inactivity to properly handle zero-day reset (active today)
--              and allow administrators to simulate inactivity/activity for any rider.

BEGIN;

CREATE OR REPLACE FUNCTION public.simulate_referral_inactivity(
  p_rider_id uuid,
  p_days_ago integer DEFAULT 11
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_referral RECORD;
  v_shift_interval interval;
  v_is_admin boolean := false;
BEGIN
  IF v_caller_id IS NOT NULL THEN
    SELECT (role = 'ADMIN' OR role = 'SUPER_ADMIN') INTO v_is_admin
    FROM public.profiles
    WHERE id = v_caller_id;
  END IF;

  -- 1. If caller is a captain (not admin), locate their own referred rider
  IF v_caller_id IS NOT NULL AND NOT coalesce(v_is_admin, false) THEN
    SELECT id, rider_id, captain_id INTO v_referral
    FROM public.captain_rider_referrals
    WHERE rider_id = p_rider_id AND captain_id = v_caller_id;
  END IF;

  -- 2. If admin or not found above, find any referral for this rider
  IF v_referral.id IS NULL THEN
    SELECT id, rider_id, captain_id INTO v_referral
    FROM public.captain_rider_referrals
    WHERE rider_id = p_rider_id
    LIMIT 1;
  END IF;

  -- 3. If no referral exists at all, link with first active captain for testing purposes
  IF v_referral.id IS NULL THEN
    DECLARE
      v_test_captain uuid;
    BEGIN
      SELECT id INTO v_test_captain
      FROM public.profiles
      WHERE role = 'CAPTAIN'
      LIMIT 1;

      IF v_test_captain IS NOT NULL THEN
        INSERT INTO public.captain_rider_referrals (rider_id, captain_id, last_interacted_at)
        VALUES (p_rider_id, v_test_captain, now())
        RETURNING id, rider_id, captain_id INTO v_referral;
      END IF;
    END;
  END IF;

  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'referral_not_found');
  END IF;

  -- 4. Apply shift: if days <= 0, set to now() (active today); otherwise shift back by p_days_ago days
  IF coalesce(p_days_ago, 0) <= 0 THEN
    UPDATE public.captain_rider_referrals
    SET last_interacted_at = now(),
        last_inactivity_notified_at = NULL
    WHERE id = v_referral.id;
  ELSE
    v_shift_interval := (p_days_ago || ' days')::interval;
    UPDATE public.captain_rider_referrals
    SET last_interacted_at = now() - v_shift_interval,
        last_inactivity_notified_at = NULL
    WHERE id = v_referral.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral.id,
    'rider_id', v_referral.rider_id,
    'captain_id', v_referral.captain_id,
    'simulated_days_ago', coalesce(p_days_ago, 0),
    'simulated_last_interacted_at', CASE WHEN coalesce(p_days_ago, 0) <= 0 THEN now() ELSE now() - v_shift_interval END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_referral_inactivity(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_referral_inactivity(uuid, integer) TO service_role;

COMMIT;

