-- Migration: 20261016223000_captain_rider_referrals.sql
-- Description: Implement Captain-Rider referral link system with mutual automatic favorites,
--              lock enforcement (cannot join via another captain while linked), and rider-driven disassociation.

BEGIN;

-- 1. Table for tracking Captain -> Rider referral links
CREATE TABLE IF NOT EXISTS public.captain_rider_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  -- One rider can only ever be linked to AT MOST one captain at any given time
  rider_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.captain_rider_referrals IS
  'Tracks active referral links between a Captain and a Rider. Enforces that a rider can only have one linked captain.';

CREATE INDEX IF NOT EXISTS idx_captain_rider_referrals_captain
  ON public.captain_rider_referrals (captain_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_captain_rider_referrals_rider
  ON public.captain_rider_referrals (rider_id);

ALTER TABLE public.captain_rider_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS captain_reads_own_referrals ON public.captain_rider_referrals;
CREATE POLICY captain_reads_own_referrals
  ON public.captain_rider_referrals
  FOR SELECT
  TO authenticated
  USING (captain_id = auth.uid());

DROP POLICY IF EXISTS rider_reads_and_deletes_own_referral ON public.captain_rider_referrals;
CREATE POLICY rider_reads_and_deletes_own_referral
  ON public.captain_rider_referrals
  FOR ALL
  TO authenticated
  USING (rider_id = auth.uid())
  WITH CHECK (rider_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.captain_rider_referrals TO authenticated;


-- 2. Table for Captain's favorite riders
CREATE TABLE IF NOT EXISTS public.captain_favorite_riders (
  captain_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (captain_id, rider_id)
);

COMMENT ON TABLE public.captain_favorite_riders IS
  'Captains -> rider favorites. Enables mutual favorites when a referral link is claimed.';

CREATE INDEX IF NOT EXISTS idx_captain_favorite_riders_captain
  ON public.captain_favorite_riders (captain_id, rider_id);

ALTER TABLE public.captain_favorite_riders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS captain_manages_own_favorite_riders ON public.captain_favorite_riders;
CREATE POLICY captain_manages_own_favorite_riders
  ON public.captain_favorite_riders
  FOR ALL
  TO authenticated
  USING (captain_id = auth.uid())
  WITH CHECK (captain_id = auth.uid());

DROP POLICY IF EXISTS rider_reads_captain_favorited ON public.captain_favorite_riders;
CREATE POLICY rider_reads_captain_favorited
  ON public.captain_favorite_riders
  FOR SELECT
  TO authenticated
  USING (rider_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON public.captain_favorite_riders TO authenticated;


-- 3. RPC: claim_captain_referral(p_captain_ref text, p_rider_name text)
-- Called when a rider joins via a captain's referral link.
-- Enforces:
--  - Looks up captain by serial_id or id (uuid).
--  - Rejects if rider is already linked to another captain.
--  - Adds captain to rider's favorites and rider to captain's favorites (mutual).
--  - Dispatches notification to captain in user_notifications table.
CREATE OR REPLACE FUNCTION public.claim_captain_referral(p_captain_ref text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_rider_name text := trim(coalesce(p_rider_name, ''));
  v_captain RECORD;
  v_existing_captain_id uuid;
  v_existing_captain_name text;
  v_existing_captain_serial text;
  v_clean_ref text := trim(coalesce(p_captain_ref, ''));
  v_notif_desc text;
BEGIN
  IF v_rider_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  IF v_clean_ref = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_referral_ref');
  END IF;

  -- 1. Find the captain by serial_id OR by uuid
  SELECT id, full_name, phone, serial_id, role
  INTO v_captain
  FROM public.profiles
  WHERE (
    (serial_id IS NOT NULL AND lower(serial_id) = lower(v_clean_ref))
    OR id::text = v_clean_ref
  )
  AND upper(coalesce(role::text, '')) IN ('CAPTAIN', 'DRIVER')
  LIMIT 1;

  IF v_captain.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'captain_not_found');
  END IF;

  -- 2. Cannot refer oneself
  IF v_captain.id = v_rider_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_refer_self');
  END IF;

  -- 3. Check existing referral for this rider
  SELECT r.captain_id, p.full_name, p.serial_id
  INTO v_existing_captain_id, v_existing_captain_name, v_existing_captain_serial
  FROM public.captain_rider_referrals r
  JOIN public.profiles p ON p.id = r.captain_id
  WHERE r.rider_id = v_rider_id;

  IF v_existing_captain_id IS NOT NULL THEN
    -- If already linked to this exact captain, make sure favorites are intact and return success
    IF v_existing_captain_id = v_captain.id THEN
      INSERT INTO public.rider_favorite_captains (rider_id, captain_id, created_at)
      VALUES (v_rider_id, v_captain.id, now())
      ON CONFLICT (rider_id, captain_id) DO NOTHING;

      INSERT INTO public.captain_favorite_riders (captain_id, rider_id, created_at)
      VALUES (v_captain.id, v_rider_id, now())
      ON CONFLICT (captain_id, rider_id) DO NOTHING;

      RETURN jsonb_build_object(
        'success', true,
        'status', 'already_linked_to_this_captain',
        'captain_id', v_captain.id,
        'captain_name', v_captain.full_name,
        'captain_serial', v_captain.serial_id,
        'captain_phone', v_captain.phone
      );
    ELSE
      -- Rider is already linked to another captain!
      -- Strictly forbidden to join through another referral link until current captain is removed!
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_linked_to_other_captain',
        'existing_captain_id', v_existing_captain_id,
        'existing_captain_name', v_existing_captain_name,
        'existing_captain_serial', v_existing_captain_serial
      );
    END IF;
  END IF;

  -- 4. Rider is free (حر طليق) -> Link with captain
  INSERT INTO public.captain_rider_referrals (captain_id, rider_id, created_at)
  VALUES (v_captain.id, v_rider_id, now());

  -- 5. Mutual automatic favorites:
  -- Add Captain to Rider favorites
  INSERT INTO public.rider_favorite_captains (rider_id, captain_id, created_at)
  VALUES (v_rider_id, v_captain.id, now())
  ON CONFLICT (rider_id, captain_id) DO NOTHING;

  -- Add Rider to Captain favorites
  INSERT INTO public.captain_favorite_riders (captain_id, rider_id, created_at)
  VALUES (v_captain.id, v_rider_id, now())
  ON CONFLICT (captain_id, rider_id) DO NOTHING;

  -- 6. Retrieve rider's full_name if not provided
  IF v_rider_name = '' THEN
    SELECT coalesce(nullif(trim(full_name), ''), '')
    INTO v_rider_name
    FROM public.profiles
    WHERE id = v_rider_id;
  END IF;

  -- 7. Dispatch notification to captain
  IF v_rider_name <> '' THEN
    v_notif_desc := 'انضم الراكب (' || v_rider_name || ') عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
  ELSE
    v_notif_desc := 'انضم راكب جديد عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
  END IF;

  INSERT INTO public.user_notifications (
    id,
    user_id,
    title,
    description,
    type,
    is_read,
    created_at
  )
  VALUES (
    'notif_ref_' || v_captain.id::text || '_' || v_rider_id::text,
    v_captain.id,
    'انضمام راكب جديد عبر رابط الإحالة 🎉',
    v_notif_desc,
    'referral',
    false,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET description = EXCLUDED.description,
      title = EXCLUDED.title;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'newly_linked',
    'captain_id', v_captain.id,
    'captain_name', v_captain.full_name,
    'captain_serial', v_captain.serial_id,
    'captain_phone', v_captain.phone
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_captain_referral(text) TO authenticated;

-- Trigger to ensure captain is notified on any referral record creation
CREATE OR REPLACE FUNCTION public.notify_captain_on_new_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_name text;
  v_notif_desc text;
BEGIN
  SELECT coalesce(nullif(trim(full_name), ''), '')
  INTO v_rider_name
  FROM public.profiles
  WHERE id = NEW.rider_id;

  IF v_rider_name <> '' THEN
    v_notif_desc := 'انضم الراكب (' || v_rider_name || ') عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
  ELSE
    v_notif_desc := 'انضم راكب جديد عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
  END IF;

  INSERT INTO public.user_notifications (
    id,
    user_id,
    title,
    description,
    type,
    is_read,
    created_at
  )
  VALUES (
    'notif_ref_' || NEW.captain_id::text || '_' || NEW.rider_id::text,
    NEW.captain_id,
    'انضمام راكب جديد عبر رابط الإحالة 🎉',
    v_notif_desc,
    'referral',
    false,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_captain_on_new_referral ON public.captain_rider_referrals;
CREATE TRIGGER trg_notify_captain_on_new_referral
AFTER INSERT ON public.captain_rider_referrals
FOR EACH ROW
EXECUTE FUNCTION public.notify_captain_on_new_referral();


-- 4. RPC: remove_captain_referral()
-- Rider removes association with their linked captain.
-- Removes both sides from each other's favorites and clears referral link.
CREATE OR REPLACE FUNCTION public.remove_captain_referral()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_captain_id uuid;
  v_captain_name text;
BEGIN
  IF v_rider_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  SELECT r.captain_id, p.full_name
  INTO v_captain_id, v_captain_name
  FROM public.captain_rider_referrals r
  JOIN public.profiles p ON p.id = r.captain_id
  WHERE r.rider_id = v_rider_id;

  IF v_captain_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_active_referral');
  END IF;

  -- 1. Remove the referral record (making the rider "حر طليق")
  DELETE FROM public.captain_rider_referrals
  WHERE rider_id = v_rider_id;

  -- 2. Remove captain from rider's favorites
  DELETE FROM public.rider_favorite_captains
  WHERE rider_id = v_rider_id AND captain_id = v_captain_id;

  -- 3. Remove rider from captain's favorites
  DELETE FROM public.captain_favorite_riders
  WHERE captain_id = v_captain_id AND rider_id = v_rider_id;

  RETURN jsonb_build_object(
    'success', true,
    'removed_captain_id', v_captain_id,
    'removed_captain_name', v_captain_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_captain_referral() TO authenticated;


-- 5. RPC: get_rider_linked_captain()
CREATE OR REPLACE FUNCTION public.get_rider_linked_captain()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('is_linked', false);
  END IF;

  SELECT jsonb_build_object(
    'is_linked', true,
    'captain_id', p.id,
    'captain_name', p.full_name,
    'captain_phone', p.phone,
    'captain_serial', p.serial_id,
    'linked_at', r.created_at,
    'rating', p.rating,
    'rating_count', p.rating_count
  )
  INTO v_result
  FROM public.captain_rider_referrals r
  JOIN public.profiles p ON p.id = r.captain_id
  WHERE r.rider_id = auth.uid();

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('is_linked', false);
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rider_linked_captain() TO authenticated;


-- 6. RPC: get_captain_referred_riders()
CREATE OR REPLACE FUNCTION public.get_captain_referred_riders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_riders jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rider_id', r.rider_id,
        'rider_name', p.full_name,
        'rider_phone', p.phone,
        'rider_serial', p.serial_id,
        'linked_at', r.created_at,
        'rating', p.rating,
        'rating_count', p.rating_count
      ) ORDER BY r.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_riders
  FROM public.captain_rider_referrals r
  JOIN public.profiles p ON p.id = r.rider_id
  WHERE r.captain_id = auth.uid();

  RETURN v_riders;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_captain_referred_riders() TO authenticated;


-- 7. Update captain_radar_requests view to include mutual favorite riders in rider_favorited_me
DROP VIEW IF EXISTS public.captain_radar_requests CASCADE;

CREATE VIEW public.captain_radar_requests
WITH (security_barrier = true)
AS
SELECT
  rr.id,
  rr.rider_id,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lat ELSE NULL::numeric END AS origin_lat,
  CASE WHEN rr.accepted_captain_id = auth.uid() THEN rr.origin_lng ELSE NULL::numeric END AS origin_lng,
  rr.destination_lat,
  rr.destination_lng,
  rr.origin_h3,
  rr.origin_h3 AS h3_cell,
  rr.destination_h3,
  rr.destination_address_ar,
  NULL::text AS destination_address_en,
  rr.destination_address_ar AS destination_address,
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
  rr.updated_at,
  rr.origin_address,
  CASE
    WHEN rr.origin_google_maps_url IS NOT NULL
      AND rr.origin_google_maps_url !~* '(^|[?&](query|q)=)0([.]0+)?(,|%2[cC]|%20|[[:space:]])+0([.]0+)?([^0-9]|$)'
    THEN rr.origin_google_maps_url
    ELSE NULL::text
  END AS origin_google_maps_url,
  rr.estimated_distance_km,
  rr.estimated_duration_minutes,

  (
    SELECT p.rating
    FROM public.profiles p
    WHERE p.id = rr.rider_id
      AND coalesce(p.rating_count, 0) > 0
  ) AS rider_rating,

  (
    SELECT coalesce(p.rating_count, 0)
    FROM public.profiles p
    WHERE p.id = rr.rider_id
  ) AS rider_rating_count,

  (
    EXISTS (
      SELECT 1
      FROM public.rider_favorite_captains fav
      WHERE fav.rider_id = rr.rider_id
        AND fav.captain_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.captain_favorite_riders cfr
      WHERE cfr.captain_id = auth.uid()
        AND cfr.rider_id = rr.rider_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.captain_rider_referrals crr
      WHERE crr.captain_id = auth.uid()
        AND crr.rider_id = rr.rider_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.reviews rv
      WHERE rv.reviewer_id = rr.rider_id
        AND rv.reviewee_id = auth.uid()
        AND rv.gave_heart
    )
  ) AS rider_favorited_me,

  (
    SELECT count(*)
    FROM public.ride_requests done
    WHERE done.rider_id = rr.rider_id
      AND upper(coalesce(done.status::text, '')) = 'COMPLETED'
  ) AS rider_completed_trips,

  rr.accepted_at,
  rr.pickup_eta_minutes,
  rr.pricing_preference

FROM public.ride_requests rr
WHERE
  (
    upper(coalesce(rr.status::text, '')) = 'PENDING'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND upper(coalesce(p.role::text, '')) IN ('DRIVER', 'CAPTAIN')
        AND (rr.country_id IS NULL OR p.country_id = rr.country_id)
    )
    -- Mutual block filtering: Hide request if captain blocked rider OR rider blocked captain
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_blocks ub
      WHERE (ub.blocker_id = rr.rider_id AND ub.blocked_id = auth.uid())
         OR (ub.blocker_id = auth.uid() AND ub.blocked_id = rr.rider_id)
    )
  )
  OR rr.accepted_captain_id = auth.uid();

GRANT SELECT ON public.captain_radar_requests TO authenticated;

COMMIT;
