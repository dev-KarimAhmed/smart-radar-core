-- Migration: 20261030020000_dual_language_backend_notifications.sql
-- Description: Dual-language (Arabic & English) support for all backend-generated notifications
--              using standard <!--i18n:{...}--> JSON envelope for zero-cost client switching.

BEGIN;

-- 1. Dual-language notification on new captain offer
CREATE OR REPLACE FUNCTION public.notify_rider_on_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_id uuid;
  v_captain_name text;
  v_fare numeric;
  v_eta integer;
  v_title_ar text;
  v_desc_ar text;
  v_title_en text;
  v_desc_en text;
  v_payload text;
BEGIN
  -- Get rider_id from ride_requests
  SELECT rider_id INTO v_rider_id
  FROM public.ride_requests
  WHERE id = NEW.request_id;

  IF v_rider_id IS NOT NULL THEN
    -- Get captain's name from profiles
    SELECT coalesce(full_name, 'كابتن') INTO v_captain_name
    FROM public.profiles
    WHERE id = NEW.captain_id;

    v_fare := coalesce(NEW.offer_price, NEW.offered_fare, 0);
    v_eta := coalesce(NEW.eta_minutes, 5);

    v_title_ar := 'عرض كابتن جديد 🚗';
    v_desc_ar := 'وصلك عرض بقيمة ' || v_fare || ' ج.م من الكابتن ' || coalesce(v_captain_name, 'كابتن') || ' (وصول خلال ' || v_eta || ' د)';
    v_title_en := 'New Captain Offer 🚗';
    v_desc_en := 'You received an offer of ' || v_fare || ' EGP from Captain ' || coalesce(v_captain_name, 'Captain') || ' (arrival in ' || v_eta || ' min)';

    v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
      'title_ar', v_title_ar,
      'body_ar', v_desc_ar,
      'title_en', v_title_en,
      'body_en', v_desc_en
    )::text || '-->';

    -- Insert notification for rider
    INSERT INTO public.user_notifications (
      id,
      user_id,
      title,
      description,
      type,
      is_read,
      created_at
    ) VALUES (
      'notif_offer_' || NEW.id::text,
      v_rider_id,
      v_title_ar,
      v_payload,
      'offer',
      false,
      coalesce(NEW.created_at, now())
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Dual-language notifications on trip lifecycle transitions
CREATE OR REPLACE FUNCTION public.notify_users_on_trip_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_captain_name text;
  v_rider_name text;
  v_title_ar text;
  v_desc_ar text;
  v_title_en text;
  v_desc_en text;
  v_payload text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- 1. Trip Accepted -> notify captain
  IF upper(NEW.status::text) = 'ACCEPTED' AND upper(coalesce(OLD.status::text, '')) <> 'ACCEPTED' THEN
    IF NEW.accepted_captain_id IS NOT NULL THEN
      SELECT coalesce(full_name, 'الراكب') INTO v_rider_name FROM public.profiles WHERE id = NEW.rider_id;
      v_title_ar := 'تم قبول عرضك 🎉';
      v_desc_ar := 'وافق ' || coalesce(v_rider_name, 'الراكب') || ' على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.';
      v_title_en := 'Your Offer Was Accepted 🎉';
      v_desc_en := coalesce(v_rider_name, 'The rider') || ' accepted your offer. Please start heading to the pickup location now.';
      v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
        'title_ar', v_title_ar,
        'body_ar', v_desc_ar,
        'title_en', v_title_en,
        'body_en', v_desc_en
      )::text || '-->';

      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_acc_' || NEW.id::text,
        NEW.accepted_captain_id,
        v_title_ar,
        v_payload,
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- 2. Captain Arrived -> notify rider
  IF upper(NEW.status::text) = 'ARRIVED' AND upper(coalesce(OLD.status::text, '')) <> 'ARRIVED' THEN
    IF NEW.rider_id IS NOT NULL THEN
      SELECT coalesce(full_name, 'الكابتن') INTO v_captain_name FROM public.profiles WHERE id = NEW.accepted_captain_id;
      v_title_ar := 'وصل الكابتن إلى موقعك 📍';
      v_desc_ar := 'الكابتن ' || coalesce(v_captain_name, '') || ' بانتظارك الآن في نقطة الانطلاق.';
      v_title_en := 'Captain Arrived At Your Location 📍';
      v_desc_en := 'Captain ' || coalesce(v_captain_name, '') || ' is waiting for you at the pickup location.';
      v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
        'title_ar', v_title_ar,
        'body_ar', v_desc_ar,
        'title_en', v_title_en,
        'body_en', v_desc_en
      )::text || '-->';

      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_arr_' || NEW.id::text,
        NEW.rider_id,
        v_title_ar,
        v_payload,
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- 3. Trip In Progress / Started -> notify rider
  IF upper(NEW.status::text) IN ('TRIP_ACTIVE', 'ACTIVE', 'STARTED', 'IN_PROGRESS') 
     AND upper(coalesce(OLD.status::text, '')) NOT IN ('TRIP_ACTIVE', 'ACTIVE', 'STARTED', 'IN_PROGRESS') THEN
    IF NEW.rider_id IS NOT NULL THEN
      v_title_ar := 'بدأت الرحلة 🚗';
      v_desc_ar := 'نتمنى لك رحلة آمنة ومريحة مع رادار.';
      v_title_en := 'Trip Started 🚗';
      v_desc_en := 'Wishing you a safe and comfortable trip with Radar.';
      v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
        'title_ar', v_title_ar,
        'body_ar', v_desc_ar,
        'title_en', v_title_en,
        'body_en', v_desc_en
      )::text || '-->';

      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_str_' || NEW.id::text,
        NEW.rider_id,
        v_title_ar,
        v_payload,
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- 4. Trip Completed -> notify rider and captain
  IF upper(NEW.status::text) = 'COMPLETED' AND upper(coalesce(OLD.status::text, '')) <> 'COMPLETED' THEN
    IF NEW.rider_id IS NOT NULL THEN
      v_title_ar := 'اكتملت الرحلة بنجاح ✅';
      v_desc_ar := 'شكراً لاختيارك رادار. نأمل أن تكون قد استمتعت برحلتك.';
      v_title_en := 'Trip Completed Successfully ✅';
      v_desc_en := 'Thank you for choosing Radar. We hope you enjoyed your ride.';
      v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
        'title_ar', v_title_ar,
        'body_ar', v_desc_ar,
        'title_en', v_title_en,
        'body_en', v_desc_en
      )::text || '-->';

      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_cmp_r_' || NEW.id::text,
        NEW.rider_id,
        v_title_ar,
        v_payload,
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
    IF NEW.accepted_captain_id IS NOT NULL THEN
      v_title_ar := 'اكتملت الرحلة بنجاح 💰';
      v_desc_ar := 'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.';
      v_title_en := 'Trip Completed Successfully 💰';
      v_desc_en := 'Trip ended and your earnings have been recorded successfully.';
      v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
        'title_ar', v_title_ar,
        'body_ar', v_desc_ar,
        'title_en', v_title_en,
        'body_en', v_desc_en
      )::text || '-->';

      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_cmp_c_' || NEW.id::text,
        NEW.accepted_captain_id,
        v_title_ar,
        v_payload,
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Dual-language notification on new referral joining
CREATE OR REPLACE FUNCTION public.notify_captain_on_new_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_name text;
  v_title_ar text := 'انضمام راكب جديد عبر رابط الإحالة 🎉';
  v_title_en text := 'New Referral Rider Joined 🎉';
  v_desc_ar text;
  v_desc_en text;
  v_payload text;
BEGIN
  -- Retrieve rider's full_name
  SELECT coalesce(nullif(trim(full_name), ''), '')
  INTO v_rider_name
  FROM public.profiles
  WHERE id = NEW.rider_id;

  IF v_rider_name <> '' THEN
    v_desc_ar := 'انضم الراكب (' || v_rider_name || ') عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
    v_desc_en := 'Rider (' || v_rider_name || ') joined via your referral link and was added to your favorite riders list.';
  ELSE
    v_desc_ar := 'انضم راكب جديد عبر رابط الإحالة الخاص بك وتمت إضافته إلى قائمة الركاب المفضلين لديك.';
    v_desc_en := 'A new rider joined via your referral link and was added to your favorite riders list.';
  END IF;

  v_payload := v_desc_ar || E'\n\n<!--i18n:' || json_build_object(
    'title_ar', v_title_ar,
    'body_ar', v_desc_ar,
    'title_en', v_title_en,
    'body_en', v_desc_en
  )::text || '-->';

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
    v_title_ar,
    v_payload,
    'referral',
    false,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMIT;
NOTIFY pgrst, 'reload schema';

