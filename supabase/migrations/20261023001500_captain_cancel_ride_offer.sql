-- Migration: Allow captain to cancel their pending ride offer safely
CREATE OR REPLACE FUNCTION public.cancel_ride_offer(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.ride_offers%rowtype;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  -- Lock and find the offer
  SELECT * INTO v_offer
  FROM public.ride_offers
  WHERE request_id = p_request_id
    AND captain_id = auth.uid()
    AND upper(coalesce(status::text, '')) = 'PENDING'
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Check if it was already accepted
    IF EXISTS (
      SELECT 1 FROM public.ride_offers
      WHERE request_id = p_request_id
        AND captain_id = auth.uid()
        AND upper(coalesce(status::text, '')) = 'ACCEPTED'
    ) THEN
      RAISE EXCEPTION 'offer_already_accepted'
        USING HINT = 'تم قبول العرض بالفعل من قبل الراكب ولا يمكن إلغاؤه كعرض معلق.';
    END IF;

    -- Otherwise it might already be cancelled or removed
    RETURN jsonb_build_object('success', true, 'message', 'offer_already_gone');
  END IF;

  -- Update to CANCELLED to broadcast Realtime UPDATE
  UPDATE public.ride_offers
  SET status = 'CANCELLED',
      updated_at = clock_timestamp()
  WHERE id = v_offer.id;

  -- Delete row from ride_offers to broadcast Realtime DELETE and keep table clean
  DELETE FROM public.ride_offers
  WHERE id = v_offer.id;

  RETURN jsonb_build_object('success', true, 'offer_id', v_offer.id);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_ride_offer(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_ride_offer(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

