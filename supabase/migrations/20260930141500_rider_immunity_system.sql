-- Migration: Sovereign Rider Behavioral Immunity & Anti-Cheat System
-- Chapter 4, Sovereign Constitution V2.6-Secured
-- Persists rider immunity score on the server to prevent localStorage wipe bypass.

BEGIN;

-- 1. Ensure profile columns exist for behavioral immunity tracking
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS immunity_score numeric NOT NULL DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS consecutive_cancellations integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_cancellation_timestamp timestamptz;

-- 2. Atomic RPC function to apply cancellation penalty on the server
CREATE OR REPLACE FUNCTION public.apply_rider_cancellation_penalty(p_rider_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consecutive integer;
  v_score numeric;
  v_suspended boolean;
  v_penalty_applied boolean := false;
BEGIN
  -- Ensure caller owns the profile or has service/admin privileges
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_rider_id THEN
    RAISE EXCEPTION 'unauthorized_penalty_call';
  END IF;

  SELECT
    coalesce(consecutive_cancellations, 0) + 1,
    coalesce(immunity_score, 5.0),
    coalesce(is_suspended, false)
  INTO v_consecutive, v_score, v_suspended
  FROM public.profiles
  WHERE id = p_rider_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'rider_profile_not_found';
  END IF;

  IF v_suspended THEN
    RETURN jsonb_build_object(
      'rider_id', p_rider_id,
      'immunity_score', v_score,
      'consecutive_cancellations', v_consecutive,
      'is_suspended', true,
      'penalty_applied', false,
      'reason', 'ACCOUNT_ALREADY_SUSPENDED'
    );
  END IF;

  -- Every 3 consecutive cancellations deducts 0.5 immunity points
  IF v_consecutive % 3 = 0 THEN
    v_score := greatest(0.0, round((v_score - 0.5)::numeric, 2));
    v_penalty_applied := true;
  END IF;

  -- Suspension threshold: score below 4.2
  v_suspended := v_score < 4.2;

  UPDATE public.profiles
  SET
    immunity_score = v_score,
    consecutive_cancellations = v_consecutive,
    is_suspended = v_suspended,
    last_cancellation_timestamp = now(),
    updated_at = now()
  WHERE id = p_rider_id;

  RETURN jsonb_build_object(
    'rider_id', p_rider_id,
    'immunity_score', v_score,
    'consecutive_cancellations', v_consecutive,
    'is_suspended', v_suspended,
    'penalty_applied', v_penalty_applied,
    'reason', CASE WHEN v_suspended THEN 'IMMUNITY_SCORE_DROPPED_BELOW_THRESHOLD' ELSE NULL END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_rider_cancellation_penalty(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.apply_rider_cancellation_penalty(uuid) TO authenticated;

-- 3. Reset consecutive cancellations streak upon successful trip completion
CREATE OR REPLACE FUNCTION public.reset_rider_cancellations_on_trip_completion(p_rider_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_rider_id THEN
    RAISE EXCEPTION 'unauthorized_reset_call';
  END IF;

  UPDATE public.profiles
  SET
    consecutive_cancellations = 0,
    updated_at = now()
  WHERE id = p_rider_id;

  RETURN jsonb_build_object('rider_id', p_rider_id, 'consecutive_cancellations', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.reset_rider_cancellations_on_trip_completion(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.reset_rider_cancellations_on_trip_completion(uuid) TO authenticated;

COMMIT;
