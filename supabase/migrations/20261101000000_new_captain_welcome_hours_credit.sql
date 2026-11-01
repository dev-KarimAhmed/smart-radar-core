-- Migration: 20261101000000_new_captain_welcome_hours_credit.sql
-- Description: Sovereign configurable welcome flight hours (e.g. 20 hours / 1200 minutes) 
--              automatically credited to any new captain upon account creation, controlled by app_flags.

BEGIN;

-- 1. Ensure sovereign flag exists in app_flags
INSERT INTO public.app_flags (flag, enabled, note)
VALUES (
  'new_captain_welcome_credit',
  true,
  json_build_object(
    'hours', 20,
    'minutes', 1200,
    'validity_days', 30,
    'enabled', true
  )::text
)
ON CONFLICT (flag) DO UPDATE
  SET note = coalesce(public.app_flags.note, excluded.note);

-- 2. Trigger function to automatically credit welcome hours upon captain profile creation
CREATE OR REPLACE FUNCTION public.grant_new_captain_welcome_hours_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag record;
  v_welcome_hours numeric := 20;
  v_welcome_mins numeric := 1200;
  v_validity_days integer := 30;
  v_enabled boolean := true;
  v_flag_data jsonb;
  v_current_wallet record;
  v_title_ar text;
  v_body_ar text;
  v_title_en text;
  v_body_en text;
  v_payload text;
BEGIN
  -- Read flag configuration
  SELECT * INTO v_flag FROM public.app_flags WHERE flag = 'new_captain_welcome_credit';
  IF v_flag IS NOT NULL THEN
    v_enabled := coalesce(v_flag.enabled, false);
    IF v_flag.note IS NOT NULL AND v_flag.note <> '' THEN
      BEGIN
        v_flag_data := v_flag.note::jsonb;
        IF v_flag_data ? 'hours' THEN
          v_welcome_hours := (v_flag_data->>'hours')::numeric;
          v_welcome_mins := v_welcome_hours * 60;
        END IF;
        IF v_flag_data ? 'validity_days' THEN
          v_validity_days := (v_flag_data->>'validity_days')::integer;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  IF NOT v_enabled OR v_welcome_mins <= 0 THEN
    RETURN NEW;
  END IF;

  -- Check existing wallet for this captain
  SELECT * INTO v_current_wallet
  FROM public.wallet_accounts
  WHERE profile_id = NEW.id;

  IF v_current_wallet IS NULL THEN
    INSERT INTO public.wallet_accounts (
      profile_id,
      balance,
      paid_minutes_remaining,
      bonus_minutes_remaining,
      active_package_name,
      time_bundle_expires_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      0,
      v_welcome_mins,
      0,
      'باقة ترحيبية للكابتن الجديد (' || v_welcome_hours || ' ساعة)',
      now() + (v_validity_days || ' days')::interval,
      now(),
      now()
    );
  ELSIF coalesce(v_current_wallet.paid_minutes_remaining, 0) = 0 AND (v_current_wallet.active_package_name IS NULL OR v_current_wallet.active_package_name = '') THEN
    UPDATE public.wallet_accounts
    SET paid_minutes_remaining = v_welcome_mins,
        active_package_name = 'باقة ترحيبية للكابتن الجديد (' || v_welcome_hours || ' ساعة)',
        time_bundle_expires_at = now() + (v_validity_days || ' days')::interval,
        updated_at = now()
    WHERE profile_id = NEW.id;
  ELSE
    -- Captain already has minutes or existing package; do not duplicate
    RETURN NEW;
  END IF;

  -- Dispatch welcoming notification
  v_title_ar := 'هدية ترحيبية: ' || v_welcome_hours || ' ساعة رادار مجاناً 🎁⚡';
  v_body_ar := 'أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره (' || v_welcome_hours || ') ساعة طيران رادار في محفظتك بنجاح لتنطلق في استقبال الرحلات فوراً. نتمنى لك رحلات موفقة وأرباحاً وفيرة!';
  v_title_en := 'Welcome Gift: ' || v_welcome_hours || ' Free Radar Hours 🎁⚡';
  v_body_en := 'Welcome Captain! A welcome credit of (' || v_welcome_hours || ') radar flight hours has been deposited into your wallet to start accepting rides immediately.';

  v_payload := v_body_ar || E'\n\n<!--i18n:' || json_build_object(
    'title_ar', v_title_ar,
    'body_ar', v_body_ar,
    'title_en', v_title_en,
    'body_en', v_body_en
  )::text || '-->';

  INSERT INTO public.user_notifications (
    id,
    user_id,
    title,
    description,
    type,
    is_read,
    created_at
  ) VALUES (
    'notif_welcome_hours_' || NEW.id::text,
    NEW.id,
    v_title_ar,
    v_payload,
    'WALLET_CREDIT',
    false,
    now()
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_welcome_hours_on_captain_profile ON public.captain_profiles;
CREATE TRIGGER trg_grant_welcome_hours_on_captain_profile
  AFTER INSERT ON public.captain_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_new_captain_welcome_hours_trigger();

COMMIT;
NOTIFY pgrst, 'reload schema';

