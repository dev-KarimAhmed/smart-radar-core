-- Migration: Filter out expired offers in get_passenger_bids so database never returns expired bids
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
      AND (ro.status IS NULL OR ro.status::text = 'PENDING' OR ro.status::text = 'pending')
      AND (
        lower(coalesce(p.status::text, '')) IN ('active', 'online', 'available', 'ready', 'on_duty', 'on-duty')
      )
      -- Exclude any offer whose captain wait window has elapsed
      AND (
        ro.created_at + (coalesce(ro.wait_seconds, 90) * interval '1 second') > clock_timestamp()
      )
      -- Exclude any offer if rider blocked captain or captain blocked rider
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_blocks ub
        WHERE (ub.blocker_id = v_rider_id AND ub.blocked_id = ro.captain_id)
           OR (ub.blocker_id = ro.captain_id AND ub.blocked_id = v_rider_id)
      )
    ORDER BY
        -- 1. Favorite captain (True comes first)
        (f.captain_id IS NOT NULL) DESC,
        -- 2. Mode matching (True comes next)
        (ro.pricing_mode = v_pricing_preference) DESC,
        -- 3. Lowest price first (highest price is at the very end)
        COALESCE(ro.offer_price, ro.offered_fare, 999999) ASC,
        -- 4. Highest rating as tie-breaker
        COALESCE(p.rating, p.trust_score, p.trust_rating, 0) DESC,
        -- 5. Oldest offer as fallback
        ro.created_at ASC
    LIMIT 9;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_passenger_bids(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';

