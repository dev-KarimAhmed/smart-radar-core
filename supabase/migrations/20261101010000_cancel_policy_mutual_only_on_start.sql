-- Migration: 20261101010000_cancel_policy_mutual_only_on_start.sql
-- Description: Unilateral cancellation is allowed for both parties (captain and rider) before trip starts (ACCEPTED, ARRIVED).
-- Mutual agreement cancellation is strictly enforced ONLY when the trip has actively started (TRIP_ACTIVE / started_at IS NOT NULL).

BEGIN;

-- 1. Redefine cancel_ride_request so rider can unilaterally cancel before trip starts (PENDING, ACCEPTED, ARRIVED)
CREATE OR REPLACE FUNCTION public.cancel_ride_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.ride_requests%rowtype;
BEGIN
  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT found THEN RAISE EXCEPTION 'ride_request_not_found'; END IF;
  IF req.rider_id <> auth.uid() THEN RAISE EXCEPTION 'not_request_owner'; END IF;

  IF upper(coalesce(req.status::text, '')) IN ('COMPLETED', 'CANCELLED') THEN
    RAISE EXCEPTION 'ride_request_closed';
  END IF;

  -- Only forbid rider unilateral cancellation once trip is actively in progress (started)
  IF upper(coalesce(req.status::text, '')) = 'TRIP_ACTIVE' OR req.started_at IS NOT NULL THEN
    RAISE EXCEPTION 'cannot_cancel_active_trip'
      USING HINT = 'لا يمكن للراكب إلغاء الرحلة بعد بدء سيرها إلا بموافقة الطرفين.';
  END IF;

  PERFORM set_config('app.ride_request_status_rpc', 'true', true);

  UPDATE public.ride_requests
  SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.ride_offers
  SET status = 'REJECTED', updated_at = now()
  WHERE request_id = p_request_id AND status <> 'ACCEPTED';

  RETURN jsonb_build_object('request_id', p_request_id, 'status', 'CANCELLED');
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_ride_request(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_ride_request(uuid) TO authenticated;


-- 2. Redefine captain_cancel_active_trip so captain can unilaterally cancel before trip starts (ACCEPTED, ARRIVED)
CREATE OR REPLACE FUNCTION public.captain_cancel_active_trip(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.ride_requests%rowtype;
BEGIN
  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT found THEN RAISE EXCEPTION 'ride_request_not_found'; END IF;

  IF req.accepted_captain_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_accepted_captain';
  END IF;

  IF upper(coalesce(req.status::text, '')) NOT IN ('ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE') THEN
    RAISE EXCEPTION 'ride_request_not_cancellable_by_captain';
  END IF;

  -- Only forbid captain unilateral cancellation once trip is actively in progress (started)
  IF upper(coalesce(req.status::text, '')) = 'TRIP_ACTIVE' OR req.started_at IS NOT NULL THEN
    RAISE EXCEPTION 'cannot_cancel_active_trip'
      USING HINT = 'لا يمكن للكابتن إلغاء الرحلة بعد بدء سيرها إلا بموافقة الطرفين.';
  END IF;

  PERFORM set_config('app.ride_request_status_rpc', 'true', true);

  UPDATE public.ride_requests
  SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.ride_offers
  SET status = 'REJECTED', updated_at = now()
  WHERE request_id = p_request_id AND status <> 'ACCEPTED';

  RETURN jsonb_build_object('request_id', p_request_id, 'status', 'CANCELLED', 'cancelled_by', 'captain');
END;
$$;

REVOKE ALL ON FUNCTION public.captain_cancel_active_trip(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.captain_cancel_active_trip(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
