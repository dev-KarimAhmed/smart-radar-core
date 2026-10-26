-- Migration: 20261026040500_mutual_cancel_request_columns.sql
-- Description: Add persistent cancel_requested_by and cancel_request_time columns and RPC to ride_requests for reliable mutual cancellation synchronization.

ALTER TABLE public.ride_requests
ADD COLUMN IF NOT EXISTS cancel_requested_by text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cancel_request_time timestamptz DEFAULT NULL;

-- Atomic RPC function to request, decline, or revoke mutual cancellation
CREATE OR REPLACE FUNCTION public.request_mutual_trip_cancellation(
  p_request_id uuid,
  p_role text,
  p_action text -- 'REQUEST', 'DECLINE', 'REVOKE'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.ride_requests%rowtype;
BEGIN
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  SELECT * INTO v_req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  IF upper(coalesce(v_req.status::text, '')) IN ('COMPLETED', 'CANCELLED') THEN
    RETURN jsonb_build_object('success', false, 'error', 'trip_already_closed', 'status', v_req.status);
  END IF;

  IF p_action = 'REQUEST' THEN
    UPDATE public.ride_requests
    SET cancel_requested_by = p_role,
        cancel_request_time = now(),
        updated_at = now()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'action', 'REQUEST', 'cancel_requested_by', p_role);

  ELSIF p_action IN ('DECLINE', 'REVOKE') THEN
    UPDATE public.ride_requests
    SET cancel_requested_by = NULL,
        cancel_request_time = NULL,
        updated_at = now()
    WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'action', p_action, 'cancel_requested_by', NULL);

  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_mutual_trip_cancellation(uuid, text, text) TO service_role, authenticated, anon;

NOTIFY pgrst, 'reload schema';

