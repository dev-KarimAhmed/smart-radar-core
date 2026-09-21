-- Migration: Rider Security, Flooding Guard & Active Trip Lock
-- 1. Partial unique index: prevents concurrent ride request flooding by a single rider
-- 2. Restricts cancel_ride_request: prevents unilateral mid-trip cancellation by rider when ARRIVED or TRIP_ACTIVE
-- 3. Server-side 72h ledger purge helper function

BEGIN;

-- 1. Prevent concurrent active ride requests per rider (Anti-Flooding)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_rider_request
ON public.ride_requests (rider_id)
WHERE status IN ('PENDING', 'ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE');

-- 2. Restrict cancel_ride_request so riders cannot unilaterally cancel in-progress trips
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

  -- Sovereign Lock: Forbid rider unilateral cancellation once captain arrives or trip is in progress
  IF upper(coalesce(req.status::text, '')) IN ('ARRIVED', 'TRIP_ACTIVE') THEN
    RAISE EXCEPTION 'cannot_cancel_active_trip'
      USING HINT = 'لا يمكن للراكب إلغاء الرحلة بعد وصول الكابتن أو أثناء سير الرحلة إلا عبر بروتوكول الطوارئ.';
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

-- 3. Function to purge expired 72-hour trip records on the server
CREATE OR REPLACE FUNCTION public.purge_expired_72h_trips()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.trips_72h_ledger
  WHERE purge_at IS NOT NULL AND purge_at < clock_timestamp();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_72h_trips() FROM public;
GRANT EXECUTE ON FUNCTION public.purge_expired_72h_trips() TO authenticated;

COMMIT;

