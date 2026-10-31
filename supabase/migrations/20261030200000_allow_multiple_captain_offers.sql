-- Migration: Allow captain to submit multiple offers per trip and cancel all pending offers safely
CREATE OR REPLACE FUNCTION public.cancel_ride_offer(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  -- Check if any offer from this captain for this request was already accepted
  IF EXISTS (
    SELECT 1 FROM public.ride_offers
    WHERE request_id = p_request_id
      AND captain_id = auth.uid()
      AND upper(coalesce(status::text, '')) = 'ACCEPTED'
  ) THEN
    RAISE EXCEPTION 'offer_already_accepted'
      USING HINT = 'تم قبول العرض بالفعل من قبل الراكب ولا يمكن إلغاؤه كعرض معلق.';
  END IF;

  -- Update all pending offers from this captain for this request to CANCELLED to broadcast Realtime UPDATE
  UPDATE public.ride_offers
  SET status = 'CANCELLED',
      updated_at = clock_timestamp()
  WHERE request_id = p_request_id
    AND captain_id = auth.uid()
    AND upper(coalesce(status::text, '')) = 'PENDING';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Delete from ride_offers to broadcast Realtime DELETE and keep table clean
  DELETE FROM public.ride_offers
  WHERE request_id = p_request_id
    AND captain_id = auth.uid()
    AND upper(coalesce(status::text, '')) = 'CANCELLED';

  RETURN jsonb_build_object('success', true, 'cancelled_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_ride_offer(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_ride_offer(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
