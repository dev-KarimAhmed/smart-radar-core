-- Migration: Prevent suspended or banned captains from activating themselves via set_captain_status

CREATE OR REPLACE FUNCTION public.set_captain_status(p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_status text := lower(trim(coalesce(p_status, '')));
  captain_role text;
  current_status text;
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

  SELECT upper(p.role::text), upper(coalesce(p.status::text, ''))
    INTO captain_role, current_status
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF captain_role NOT IN ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_role_required';
  END IF;

  -- Block any banned captain from changing status
  IF current_status = 'BANNED' THEN
    RAISE EXCEPTION 'captain_account_banned' USING HINT = 'حسابك محظور نهائياً من قبل إدارة المنظومة.';
  END IF;

  -- Block suspended captain from going active
  IF current_status = 'SUSPENDED' AND requested_status = 'active' THEN
    RAISE EXCEPTION 'captain_account_suspended' USING HINT = 'حسابك معلق مؤقتاً من قبل الإدارة، ولا يمكنك الاتصال بالرادار.';
  END IF;

  IF requested_status = 'active' THEN
    SELECT
      greatest(0, coalesce(w.paid_minutes_remaining, 0))
        + greatest(0, coalesce(w.bonus_minutes_remaining, 0)),
      w.time_bundle_expires_at
    INTO wallet_minutes, wallet_expiry
    FROM public.wallet_accounts w
    WHERE w.profile_id = auth.uid();

    -- Any captain with remaining minutes HAS an active bundle.
    -- Auto-heal expired window if remaining minutes > 0.
    has_bundle := wallet_minutes > 0;

    IF NOT has_bundle THEN
      RAISE EXCEPTION 'captain_time_bundle_required';
    END IF;

    IF wallet_expiry IS NOT NULL AND wallet_expiry <= clock_timestamp() THEN
      wallet_expiry := clock_timestamp() + interval '60 days';
      UPDATE public.wallet_accounts
      SET time_bundle_expires_at = wallet_expiry,
          updated_at = clock_timestamp()
      WHERE profile_id = auth.uid();
    END IF;
  END IF;

  UPDATE public.profiles
  SET status = status_value::public.user_status,
      updated_at = clock_timestamp()
  WHERE id = auth.uid();

  IF NOT found THEN
    RAISE EXCEPTION 'captain_profile_not_found';
  END IF;

  RETURN jsonb_build_object(
    'profile_id', auth.uid(),
    'status', requested_status,
    'wallet_minutes', wallet_minutes,
    'time_bundle_expires_at', wallet_expiry,
    'has_active_bundle', CASE WHEN requested_status = 'idle' THEN true ELSE has_bundle END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_captain_status(text) TO authenticated;

