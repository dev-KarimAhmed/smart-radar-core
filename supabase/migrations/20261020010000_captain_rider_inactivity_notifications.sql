-- Migration: 20261020010000_captain_rider_inactivity_notifications.sql
-- Description: System to track referred rider activity (interacting with ads or requesting rides)
--              and dispatch Arabic notifications to their referring captain every 10 days of inactivity.

BEGIN;

-- 1. Add activity and notification tracking columns to captain_rider_referrals
ALTER TABLE public.captain_rider_referrals
  ADD COLUMN IF NOT EXISTS last_interacted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_inactivity_notified_at timestamptz;

COMMENT ON COLUMN public.captain_rider_referrals.last_interacted_at IS
  'Timestamp of the rider''s last active interaction (requesting rides or watching/engaging with ads). Opening and closing immediately is NOT active.';

COMMENT ON COLUMN public.captain_rider_referrals.last_inactivity_notified_at IS
  'Timestamp of the last inactivity notification dispatched to the captain. Prevents spamming; dispatches once every 10 days of continued inactivity.';

CREATE INDEX IF NOT EXISTS idx_captain_rider_referrals_inactivity
  ON public.captain_rider_referrals (captain_id, last_interacted_at, last_inactivity_notified_at);


-- 2. Trigger on ride_requests to automatically record rider activity upon requesting a ride
CREATE OR REPLACE FUNCTION public.trg_record_rider_trip_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rider_id IS NOT NULL THEN
    UPDATE public.captain_rider_referrals
    SET last_interacted_at = now()
    WHERE rider_id = NEW.rider_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_referral_activity_on_ride ON public.ride_requests;
CREATE TRIGGER trg_update_referral_activity_on_ride
AFTER INSERT ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION public.trg_record_rider_trip_activity();


-- 3. RPC: record_rider_activity(p_activity_type text)
-- Called from client when the rider engages with ads (e.g., watching AdStage for >= 15s or interacting with ads)
CREATE OR REPLACE FUNCTION public.record_rider_activity(p_activity_type text DEFAULT 'ad_view')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_rows_updated integer := 0;
BEGIN
  IF v_rider_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  UPDATE public.captain_rider_referrals
  SET last_interacted_at = now()
  WHERE rider_id = v_rider_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'activity_type', p_activity_type,
    'updated_referral', v_rows_updated > 0,
    'recorded_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_rider_activity(text) TO authenticated;


-- 4. Update flush_ad_campaign_metrics to also record activity for authenticated riders viewing ads
CREATE OR REPLACE FUNCTION public.flush_ad_campaign_metrics(p_events jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_row jsonb;
  v_uid uuid := auth.uid();
BEGIN
  IF jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'events_must_be_array';
  END IF;

  FOR event_row IN SELECT * FROM jsonb_array_elements(p_events)
  LOOP
    UPDATE public.ad_campaigns
    SET impressions_count = impressions_count + CASE WHEN event_row->>'event_type' = 'impression' THEN 1 ELSE 0 END,
        clicks_count = clicks_count + CASE WHEN event_row->>'event_type' = 'click' THEN 1 ELSE 0 END,
        swipes_count = swipes_count + CASE WHEN event_row->>'event_type' = 'swipe' THEN 1 ELSE 0 END
    WHERE id::text = nullif(event_row->>'ad_id', '');
  END LOOP;

  -- If an authenticated rider flushed ad engagement events, register their activity
  IF v_uid IS NOT NULL AND jsonb_array_length(p_events) > 0 THEN
    UPDATE public.captain_rider_referrals
    SET last_interacted_at = now()
    WHERE rider_id = v_uid;
  END IF;

  RETURN jsonb_build_object('accepted', jsonb_array_length(p_events));
END;
$$;

GRANT EXECUTE ON FUNCTION public.flush_ad_campaign_metrics(jsonb) TO anon, authenticated;


-- 5. Core routine: check_captain_inactive_riders(p_captain_id uuid)
-- Checks inactive referred riders for a captain (> 10 days since last interaction)
-- and sends an Arabic notification if at least 10 days have elapsed since the last notification.
CREATE OR REPLACE FUNCTION public.check_captain_inactive_riders(p_captain_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_captain uuid := coalesce(p_captain_id, auth.uid());
  v_record RECORD;
  v_notif_count integer := 0;
  v_rider_name_ar text;
  v_rider_name_en text;
  v_notif_desc_ar text;
  v_notif_desc_en text;
  v_notif_desc text;
  v_notif_id text;
  v_days_inactive integer;
  v_i18n_payload jsonb;
BEGIN
  IF v_target_captain IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'captain_id_required');
  END IF;

  FOR v_record IN
    SELECT
      r.id AS referral_id,
      r.rider_id,
      r.captain_id,
      r.created_at,
      r.last_interacted_at,
      r.last_inactivity_notified_at,
      p.full_name,
      greatest(10, floor(extract(epoch from (now() - coalesce(r.last_interacted_at, r.created_at))) / 86400))::int AS days_inactive
    FROM public.captain_rider_referrals r
    JOIN public.profiles p ON p.id = r.rider_id
    WHERE r.captain_id = v_target_captain
      AND coalesce(r.last_interacted_at, r.created_at) < (now() - INTERVAL '10 days')
      AND (r.last_inactivity_notified_at IS NULL OR r.last_inactivity_notified_at <= (now() - INTERVAL '10 days'))
  LOOP
    v_days_inactive := v_record.days_inactive;
    v_rider_name_ar := coalesce(nullif(trim(v_record.full_name), ''), 'المسجل برابطك');
    v_rider_name_en := coalesce(nullif(trim(v_record.full_name), ''), 'Referred Client');

    -- Dual-language notification payloads:
    -- Arabic version
    v_notif_desc_ar := 'العميل (' || v_rider_name_ar || ') غير متفاعل منذ ' || v_days_inactive::text || ' يوماً. عدم تفاعله في طلب الرحلات أو مشاهدة الإعلانات يضيع عليك تجميع النقاط وترقية رتبتك! تواصل معه وشجعه على التفاعل والاستفادة من خدماتك.';

    -- English version
    v_notif_desc_en := 'Client (' || v_rider_name_en || ') has been inactive for ' || v_days_inactive::text || ' days. Their lack of ride requests or ad engagements prevents you from earning points and upgrading your rank! Reach out and encourage them to use your services.';

    -- Package into standard zero-cost i18n payload
    v_i18n_payload := jsonb_build_object(
      'title_ar', 'تنبيه عدم نشاط راكب ⚠️',
      'body_ar', v_notif_desc_ar,
      'title_en', 'Rider Inactivity Alert ⚠️',
      'body_en', v_notif_desc_en
    );

    v_notif_desc := v_notif_desc_ar || E'\n\n<!--i18n:' || v_i18n_payload::text || '-->';

    v_notif_id := 'notif_inact_' || v_record.captain_id::text || '_' || v_record.rider_id::text || '_' || to_char(now(), 'YYYYMMDD');

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
      v_notif_id,
      v_record.captain_id,
      'تنبيه عدم نشاط راكب ⚠️',
      v_notif_desc,
      'referral_inactivity',
      false,
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET description = EXCLUDED.description,
        created_at = now(),
        is_read = false;

    UPDATE public.captain_rider_referrals
    SET last_inactivity_notified_at = now()
    WHERE id = v_record.referral_id;

    v_notif_count := v_notif_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'captain_id', v_target_captain,
    'notifications_dispatched', v_notif_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_captain_inactive_riders(uuid) TO authenticated;


-- 6. Global routine: check_and_notify_inactive_referred_riders()
-- Sweeps all captain-rider referrals across the system for any 10-day inactivity intervals.
CREATE OR REPLACE FUNCTION public.check_and_notify_inactive_referred_riders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_captain RECORD;
  v_total_notifications integer := 0;
  v_result jsonb;
BEGIN
  FOR v_captain IN
    SELECT DISTINCT captain_id
    FROM public.captain_rider_referrals
    WHERE coalesce(last_interacted_at, created_at) < (now() - INTERVAL '10 days')
      AND (last_inactivity_notified_at IS NULL OR last_inactivity_notified_at <= (now() - INTERVAL '10 days'))
  LOOP
    v_result := public.check_captain_inactive_riders(v_captain.captain_id);
    v_total_notifications := v_total_notifications + coalesce((v_result->>'notifications_dispatched')::int, 0);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_notifications_dispatched', v_total_notifications,
    'checked_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_notify_inactive_referred_riders() TO authenticated;


-- 7. Update get_captain_referred_riders() to trigger the inactivity check & return activity status
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

  -- Proactively verify and notify this captain if any of their referred riders crossed the 10-day mark
  PERFORM public.check_captain_inactive_riders(auth.uid());

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rider_id', r.rider_id,
        'rider_name', p.full_name,
        'rider_phone', p.phone,
        'rider_serial', p.serial_id,
        'linked_at', r.created_at,
        'last_interacted_at', r.last_interacted_at,
        'is_active', (coalesce(r.last_interacted_at, r.created_at) >= (now() - INTERVAL '10 days')),
        'days_inactive', greatest(0, floor(extract(epoch from (now() - coalesce(r.last_interacted_at, r.created_at))) / 86400))::int,
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

-- 8. Testing / Simulation RPC: simulate_referral_inactivity(p_rider_id uuid, p_days_ago integer)
-- Allows captains/developers to simulate inactivity (e.g. setting last_interacted_at to 10 or 15 days ago)
-- and reset last_inactivity_notified_at to test instant notification delivery.
CREATE OR REPLACE FUNCTION public.simulate_referral_inactivity(
  p_rider_id uuid,
  p_days_ago integer DEFAULT 11
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_captain_id uuid := auth.uid();
  v_referral RECORD;
  v_shift_interval interval;
BEGIN
  IF v_captain_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication_required');
  END IF;

  v_shift_interval := (greatest(1, coalesce(p_days_ago, 11)) || ' days')::interval;

  -- Locate referral for this captain
  SELECT id, rider_id, captain_id INTO v_referral
  FROM public.captain_rider_referrals
  WHERE rider_id = p_rider_id AND captain_id = v_captain_id;

  IF v_referral.id IS NULL THEN
    -- Fallback: check by rider_id directly
    SELECT id, rider_id, captain_id INTO v_referral
    FROM public.captain_rider_referrals
    WHERE rider_id = p_rider_id;
  END IF;

  IF v_referral.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'referral_not_found');
  END IF;

  -- Set last_interacted_at to p_days_ago and clear last_inactivity_notified_at
  UPDATE public.captain_rider_referrals
  SET last_interacted_at = now() - v_shift_interval,
      last_inactivity_notified_at = NULL
  WHERE id = v_referral.id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral.id,
    'rider_id', v_referral.rider_id,
    'simulated_days_ago', coalesce(p_days_ago, 11),
    'simulated_last_interacted_at', now() - v_shift_interval
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_referral_inactivity(uuid, integer) TO authenticated;

COMMIT;
