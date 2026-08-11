-- Migration: Create reviews and user_blocks tables for rating/blocking systems

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  detailed_stars jsonb NOT NULL DEFAULT '{}'::jsonb,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can insert their own reviews
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.reviews;
CREATE POLICY "Enable insert for authenticated users" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Policy: Users can view reviews they wrote or received
DROP POLICY IF EXISTS "Enable select for users involved" ON public.reviews;
CREATE POLICY "Enable select for users involved" ON public.reviews
  FOR SELECT TO authenticated USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

GRANT SELECT, INSERT ON public.reviews TO authenticated;

-- Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- Enable RLS for user_blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own blocks
DROP POLICY IF EXISTS "Enable insert for blocker" ON public.user_blocks;
CREATE POLICY "Enable insert for blocker" ON public.user_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

-- Policy: Blockers and blocked can select blocks to allow drivers to filter radar requests
DROP POLICY IF EXISTS "Enable select for blocker or blocked" ON public.user_blocks;
CREATE POLICY "Enable select for blocker or blocked" ON public.user_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Policy: Blockers can delete their blocks (unblock)
DROP POLICY IF EXISTS "Enable delete for blocker" ON public.user_blocks;
CREATE POLICY "Enable delete for blocker" ON public.user_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;

-- Policy: Allow authenticated users to view profiles (needed to fetch blocked captain details)
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.profiles;
CREATE POLICY "Enable select for authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.profiles TO authenticated;


-- Override captain_radar_requests VIEW to exclude blocked relationships
DROP VIEW IF EXISTS public.captain_radar_requests;
CREATE VIEW public.captain_radar_requests
WITH (security_barrier = true)
AS
SELECT
  rr.id,
  rr.rider_id,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lat ELSE null::numeric END as origin_lat,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lng ELSE null::numeric END as origin_lng,
  rr.destination_lat,
  rr.destination_lng,
  rr.origin_h3,
  rr.origin_h3 as h3_cell,
  rr.destination_h3,
  rr.destination_address_ar,
  null::text as destination_address_en,
  rr.destination_address_ar as destination_address,
  rr.server_estimated_fare,
  rr.country_id,
  rr.status,
  rr.created_at,
  rr.accepted_offer_id,
  rr.accepted_captain_id,
  rr.final_fare,
  rr.arrived_at,
  rr.started_at,
  rr.completed_at,
  rr.updated_at
FROM public.ride_requests rr
WHERE
  (
    upper(coalesce(rr.status::text, '')) = 'PENDING'
    AND exists (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) in ('DRIVER', 'CAPTAIN')
        AND (rr.country_id is null or p.country_id = rr.country_id)
    )
    -- Filter out if blocker/blocked relationship exists
    AND NOT exists (
      SELECT 1
      FROM public.user_blocks ub
      WHERE (ub.blocker_id = rr.rider_id AND ub.blocked_id = auth.uid())
         OR (ub.blocker_id = auth.uid() AND ub.blocked_id = rr.rider_id)
    )
  )
  OR rr.rider_id = auth.uid();

REVOKE ALL ON public.captain_radar_requests FROM anon;
GRANT SELECT ON public.captain_radar_requests TO authenticated;


-- Override submit_ride_offer RPC function to enforce block boundaries during submission
CREATE OR REPLACE FUNCTION public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.ride_requests%rowtype;
  captain_profile public.profiles%rowtype;
  new_offer public.ride_offers%rowtype;
BEGIN
  IF p_request_id is null THEN
    RAISE EXCEPTION 'request_id_required';
  END IF;

  IF p_offer_price is null or p_offer_price <= 0 THEN
    RAISE EXCEPTION 'invalid_offer_price';
  END IF;

  SELECT *
  INTO captain_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT found or upper(coalesce(captain_profile.role::text, '')) not in ('CAPTAIN', 'DRIVER') THEN
    RAISE EXCEPTION 'captain_profile_required';
  END IF;

  SELECT *
  INTO req
  FROM public.ride_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT found THEN
    RAISE EXCEPTION 'ride_request_not_found';
  END IF;

  IF upper(coalesce(req.status::text, '')) not in ('PENDING', 'RECEIVING_OFFERS') THEN
    RAISE EXCEPTION 'ride_request_not_pending';
  END IF;

  IF req.country_id is not null
    AND captain_profile.country_id is not null
    AND req.country_id <> captain_profile.country_id
  THEN
    RAISE EXCEPTION 'request_outside_captain_country';
  END IF;

  -- BLOCK ENFORCEMENT check:
  IF exists (
    SELECT 1
    FROM public.user_blocks
    WHERE (blocker_id = req.rider_id AND blocked_id = auth.uid())
       OR (blocker_id = auth.uid() AND blocked_id = req.rider_id)
  ) THEN
    RAISE EXCEPTION 'user_block_active';
  END IF;

  INSERT INTO public.ride_offers (
    request_id,
    captain_id,
    offered_fare,
    offer_price,
    eta_minutes,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_request_id,
    auth.uid(),
    p_offer_price,
    p_offer_price,
    5,
    'PENDING',
    now(),
    now()
  )
  RETURNING * INTO new_offer;

  RETURN jsonb_build_object(
    'id', new_offer.id,
    'request_id', new_offer.request_id,
    'captain_id', new_offer.captain_id,
    'offer_price', coalesce(new_offer.offer_price, new_offer.offered_fare),
    'eta_minutes', new_offer.eta_minutes,
    'status', new_offer.status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_ride_offer(uuid, numeric) TO authenticated;

-- Create captain_profiles table
CREATE TABLE IF NOT EXISTS public.captain_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year integer,
  plate_number text,
  employment_type text,
  identity_url text,
  contact_page_url text,
  verification_status text DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.captain_profiles ENABLE ROW LEVEL SECURITY;

-- Select policy: Authenticated users can view captain profiles
DROP POLICY IF EXISTS "Enable select for authenticated captain profiles" ON public.captain_profiles;
CREATE POLICY "Enable select for authenticated captain profiles" ON public.captain_profiles
  FOR SELECT TO authenticated USING (true);

-- Insert policy: Authenticated users can insert their own captain profile
DROP POLICY IF EXISTS "Enable insert for self captain profiles" ON public.captain_profiles;
CREATE POLICY "Enable insert for self captain profiles" ON public.captain_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Update policy: Authenticated users can update their own captain profile
DROP POLICY IF EXISTS "Enable update for self captain profiles" ON public.captain_profiles;
CREATE POLICY "Enable update for self captain profiles" ON public.captain_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.captain_profiles TO authenticated;
