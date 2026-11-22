-- Migration: 20261123012000_disable_welcome_hours_in_favor_of_launch_package.sql
-- Description: Disables the automatic 20-hour welcome credit for new captains.
--              Captains now receive the comprehensive 30-day free Launch Package upon package activation.

BEGIN;

-- 1. Update app_flags to disable new_captain_welcome_credit
UPDATE public.app_flags
SET enabled = false,
    note = json_build_object(
      'hours', 0,
      'minutes', 0,
      'validity_days', 0,
      'enabled', false
    )::text,
    updated_at = now()
WHERE flag = 'new_captain_welcome_credit';

-- 2. Update trigger function so it returns NEW immediately
CREATE OR REPLACE FUNCTION public.grant_new_captain_welcome_hours_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Welcome hours disabled: Launch Package provides the 30-day free operating period
  RETURN NEW;
END;
$$;

COMMIT;
