-- Migration: Ensure offers are cancelled and deleted when captain goes IDLE,
-- enable REPLICA IDENTITY FULL for ride_offers for Realtime DELETE events,
-- and update get_passenger_bids to exclude inactive captains.

-- 1. Enable REPLICA IDENTITY FULL so Supabase Realtime can filter DELETE/UPDATE events by request_id
ALTER TABLE public.ride_offers REPLICA IDENTITY FULL;

-- 2. Update get_passenger_bids to strictly exclude inactive/idle captains
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
      AND (
        lower(coalesce(p.status::text, '')) IN ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
      )
    ORDER BY
        (ro.pricing_mode = v_pricing_preference) DESC,
        (f.captain_id IS NOT NULL) DESC,
        COALESCE(p.rating, p.trust_score, p.trust_rating, 0) DESC,
        ro.created_at ASC
    LIMIT 9;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_passenger_bids(uuid) TO authenticated;

-- 3. Update set_captain_status to mark pending offers CANCELLED then DELETE them when going IDLE
CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_status text := lower(trim(coalesce(p_status, '')));
  resolved_status text;
  captain_role text;
  wallet_minutes numeric := 0;
  wallet_expiry timestamptz;
  has_bundle boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  resolved_status := public.resolve_user_status(requested_status);
  IF resolved_status IS NULL THEN
    RAISE EXCEPTION 'invalid_captain_status';
  END IF;

  SELECT upper(p.role::text)
    INTO captain_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF captain_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  IF requested_status = 'active' OR public.is_active_captain_status(resolved_status) THEN
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

  -- When captain goes idle/offline, cancel and delete all their active/pending offers
  IF requested_status = 'idle' OR NOT public.is_active_captain_status(resolved_status) THEN
    UPDATE public.ride_offers 
    SET status = 'CANCELLED', updated_at = clock_timestamp() 
    WHERE captain_id = auth.uid() AND upper(coalesce(status, '')) = 'PENDING';
    
    DELETE FROM public.ride_offers WHERE captain_id = auth.uid();
  END IF;

  UPDATE public.profiles
  SET status     = resolved_status::public.user_status,
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

NOTIFY pgrst, 'reload schema';
