-- Migration: Fix enum cast error in get_passenger_bids by explicitly casting status to text (ro.status::text = 'PENDING')

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
    LEFT JOIN public.profiles p ON p.id = ro.captain_id
    LEFT JOIN public.rider_favorite_captains f ON f.captain_id = ro.captain_id 
        AND f.rider_id = v_rider_id
    WHERE ro.request_id = p_request_id
      AND (ro.status IS NULL OR ro.status::text = 'PENDING' OR ro.status::text = 'pending')
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
