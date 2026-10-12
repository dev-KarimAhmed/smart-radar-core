-- Migration: 20261012020000_auto_generate_ride_notifications.sql
-- Description: Automated trigger-based user notifications for ride offers and trip lifecycle events, plus realtime publication.

-- 1. Enable realtime publication for user_notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'user_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  END IF;
END $$;

-- 2. Trigger function: Auto-create notification for rider when a captain submits an offer
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
      'عرض كابتن جديد 🚗',
      'وصلك عرض بقيمة ' || v_fare || ' ج.م من الكابتن ' || coalesce(v_captain_name, 'كابتن') || ' (وصول خلال ' || v_eta || ' د)',
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

DROP TRIGGER IF EXISTS trg_notify_rider_on_offer ON public.ride_offers;
CREATE TRIGGER trg_notify_rider_on_offer
  AFTER INSERT ON public.ride_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_rider_on_new_offer();

-- 3. Trigger function: Auto-create notifications on trip lifecycle status transitions
CREATE OR REPLACE FUNCTION public.notify_users_on_trip_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_captain_name text;
  v_rider_name text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- 1. Trip Accepted -> notify captain
  IF upper(NEW.status::text) = 'ACCEPTED' AND upper(coalesce(OLD.status::text, '')) <> 'ACCEPTED' THEN
    IF NEW.accepted_captain_id IS NOT NULL THEN
      SELECT coalesce(full_name, 'الراكب') INTO v_rider_name FROM public.profiles WHERE id = NEW.rider_id;
      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_acc_' || NEW.id::text,
        NEW.accepted_captain_id,
        'تم قبول عرضك 🎉',
        'وافق ' || coalesce(v_rider_name, 'الراكب') || ' على عرضك. ابدأ بالتحرك نحو نقطة الانطلاق الآن.',
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
      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_arr_' || NEW.id::text,
        NEW.rider_id,
        'وصل الكابتن إلى موقعك 📍',
        'الكابتن ' || coalesce(v_captain_name, '') || ' بانتظارك الآن في نقطة الانطلاق.',
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
      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_str_' || NEW.id::text,
        NEW.rider_id,
        'بدأت الرحلة 🚗',
        'نتمنى لك رحلة آمنة ومريحة مع رادار.',
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- 4. Trip Completed -> notify rider and captain
  IF upper(NEW.status::text) = 'COMPLETED' AND upper(coalesce(OLD.status::text, '')) <> 'COMPLETED' THEN
    IF NEW.rider_id IS NOT NULL THEN
      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_cmp_r_' || NEW.id::text,
        NEW.rider_id,
        'اكتملت الرحلة بنجاح ✅',
        'شكراً لاختيارك رادار. نأمل أن تكون قد استمتعت برحلتك.',
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
    IF NEW.accepted_captain_id IS NOT NULL THEN
      INSERT INTO public.user_notifications (id, user_id, title, description, type, is_read, created_at)
      VALUES (
        'notif_trip_cmp_c_' || NEW.id::text,
        NEW.accepted_captain_id,
        'اكتملت الرحلة بنجاح 💰',
        'تم تسجيل انتهاء الرحلة وأرباحك بنجاح.',
        'trip',
        false,
        now()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_users_trip_lifecycle ON public.ride_requests;
CREATE TRIGGER trg_notify_users_trip_lifecycle
  AFTER UPDATE ON public.ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_on_trip_lifecycle();

-- 4. Backfill recent offers (last 24 hours) into user_notifications
INSERT INTO public.user_notifications (
  id,
  user_id,
  title,
  description,
  type,
  is_read,
  created_at
)
SELECT
  'notif_offer_' || ro.id::text,
  rr.rider_id,
  'عرض كابتن جديد 🚗',
  'وصلك عرض بقيمة ' || coalesce(ro.offer_price, ro.offered_fare, 0) || ' ج.م من الكابتن ' || coalesce(p.full_name, 'كابتن'),
  'offer',
  false,
  ro.created_at
FROM public.ride_offers ro
JOIN public.ride_requests rr ON rr.id = ro.request_id
LEFT JOIN public.profiles p ON p.id = ro.captain_id
WHERE rr.rider_id IS NOT NULL
  AND ro.created_at > (now() - interval '24 hours')
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
