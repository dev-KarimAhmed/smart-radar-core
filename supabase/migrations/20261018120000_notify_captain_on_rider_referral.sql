-- Migration: 20261018120000_notify_captain_on_rider_referral.sql
-- Description: Dispatches an instant notification to the captain when a rider joins via their referral link.
--              Maintains single parameter p_captain_ref text for 100% backward compatibility with PostgREST.

BEGIN;

-- 1. Trigger function to notify captain whenever a referral link is created
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
  -- Retrieve rider's full_name
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


-- 2. Update claim_captain_referral RPC with notification dispatch (keeps exact 1-arg signature: p_captain_ref text)
CREATE OR REPLACE FUNCTION public.claim_captain_referral(p_captain_ref text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_rider_name text;
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

  -- 6. Retrieve rider's full_name from public.profiles
  SELECT coalesce(nullif(trim(full_name), ''), '')
  INTO v_rider_name
  FROM public.profiles
  WHERE id = v_rider_id;

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
  ON CONFLICT (id) DO NOTHING;

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

COMMIT;
