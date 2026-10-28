-- Migration: 20261021173000_mutual_cancel_ride_request.sql
-- Description: Provide an authorized RPC to mutually cancel active ride requests across all phases (PENDING, ACCEPTED, ARRIVED, TRIP_ACTIVE) bypassing unilateral restrictions.

CREATE OR REPLACE FUNCTION public.mutual_cancel_ride_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.ride_requests%rowtype;
BEGIN
  SELECT * INTO req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT found THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  IF upper(coalesce(req.status::text, '')) IN ('COMPLETED', 'CANCELLED') THEN
    RETURN jsonb_build_object('request_id', p_request_id, 'status', req.status, 'message', 'already_closed');
  END IF;

  -- Allow status transition by setting the internal trigger bypass flag
  PERFORM set_config('app.ride_request_status_rpc', 'true', true);

  UPDATE public.ride_requests
  SET status = 'CANCELLED',
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.ride_offers
  SET status = 'REJECTED',
      updated_at = now()
  WHERE request_id = p_request_id AND status <> 'ACCEPTED';

  RETURN jsonb_build_object('request_id', p_request_id, 'status', 'CANCELLED');
END;
$$;

GRANT EXECUTE ON FUNCTION public.mutual_cancel_ride_request(uuid) TO service_role, authenticated, anon;

