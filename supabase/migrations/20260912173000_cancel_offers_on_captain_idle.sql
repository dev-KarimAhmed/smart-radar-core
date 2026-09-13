-- Migration: Cancel/delete pending ride_offers when captain goes IDLE and filter idle captains out of get_passenger_bids

-- 1. Ensure RLS allows captains to delete their own offers
DROP POLICY IF EXISTS "Captains can delete their own offers" ON public.ride_offers;
CREATE POLICY "Captains can delete their own offers"
ON public.ride_offers FOR DELETE
TO authenticated
USING (captain_id = auth.uid());

-- 2. Update set_captain_status to delete pending offers when going idle
CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_status text := lower(trim(coalesce(p_status, '')));
  captain_role text;
  status_value text;
  wallet_minutes numeric := 0;
  wallet_expiry timestamptz;
  has_bundle boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF requested_status NOT IN ('active', 'idle') THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  -- Resolve enum label
  SELECT e.enumlabel
    INTO status_value
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE n.nspname = 'public'
    AND t.typname = 'user_status'
    AND lower(e.enumlabel) = requested_status
  LIMIT 1;

  IF status_value IS NULL THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  SELECT upper(p.role::text)
    INTO captain_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF captain_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  IF requested_status = 'active' THEN
    SELECT
      greatest(0, coalesce(w.paid_minutes_remaining, 0))
        + greatest(0, coalesce(w.bonus_minutes_remaining, 0)),
      w.time_bundle_expires_at
    INTO wallet_minutes, wallet_expiry
    FROM public.wallet_accounts w
    WHERE w.profile_id = auth.uid();

    has_bundle := wallet_minutes > 0
      AND (wallet_expiry IS NULL OR wallet_expiry > clock_timestamp());

    IF NOT has_bundle THEN
      RAISE EXCEPTION 'captain_time_bundle_required';
    END IF;

    UPDATE public.wallet_accounts
    SET last_minute_tick_at = clock_timestamp(),
        updated_at          = clock_timestamp()
    WHERE profile_id = auth.uid();
  END IF;

  -- When captain goes idle, delete all their active/pending offers from ride_offers
  IF requested_status = 'idle' THEN
    DELETE FROM public.ride_offers WHERE captain_id = auth.uid();
  END IF;

  UPDATE public.profiles
  SET status     = status_value::public.user_status,
      updated_at = clock_timestamp()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'captain_profile_not_found';
  END IF;

  RETURN jsonb_build_object(
    'profile_id',           auth.uid(),
    'status',               requested_status,
    'wallet_minutes',       wallet_minutes,
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle',    CASE WHEN requested_status = 'idle' THEN true ELSE has_bundle END
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_captain_status(text) TO authenticated;

-- 3. Update get_passenger_bids to exclude offers from captains who are no longer active
CREATE OR REPLACE FUNCTION public.get_passenger_bids(p_request_id uuid)
RETURNS SETOF public.ride_offers
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pricing_preference text;
    v_rider_id uuid;
BEGIN
    SELECT pricing_preference, rider_id INTO v_pricing_preference, v_rider_id
    FROM public.ride_requests
    WHERE id = p_request_id;

    RETURN QUERY
    SELECT ro.*
    FROM public.ride_offers ro
    JOIN public.profiles p ON p.id = ro.captain_id
    LEFT JOIN public.rider_favorite_captains f ON f.captain_id = ro.captain_id 
        AND f.rider_id = v_rider_id
    WHERE ro.request_id = p_request_id
      AND upper(coalesce(ro.status, '')) = 'PENDING'
      AND upper(coalesce(p.status::text, '')) = 'ACTIVE'
    ORDER BY
        (ro.pricing_mode = v_pricing_preference) DESC,
        (f.captain_id IS NOT NULL) DESC,
        COALESCE(p.rating, p.trust_score, p.trust_rating, 0) DESC,
        ro.created_at ASC
    LIMIT 9;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_passenger_bids(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
