-- =============================================================================
-- Migration: 20261115234500_single_session_device_lock.sql
-- Purpose: Enforce strict single-device active session for users (captains & riders).
--          Prevents concurrent logins across multiple devices/browsers until
--          explicitly logged out from the currently active device.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_device_id text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.profiles.active_device_id IS
  'Unique device ID holding the single active session. Enforces strict single-device login.';

COMMENT ON COLUMN public.profiles.last_seen_at IS
  'Last heartbeat/activity timestamp for the active session.';

-- Index for fast lookup by active_device_id
CREATE INDEX IF NOT EXISTS idx_profiles_active_device_id
  ON public.profiles(active_device_id)
  WHERE active_device_id IS NOT NULL;

-- Atomic CAS Function: Prevents concurrent race conditions when two devices log in at the exact same millisecond
CREATE OR REPLACE FUNCTION public.claim_single_device_session(
  p_user_id uuid,
  p_device_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claimed boolean;
BEGIN
  UPDATE public.profiles
  SET active_device_id = p_device_id,
      last_seen_at = now()
  WHERE id = p_user_id
    AND (active_device_id IS NULL OR active_device_id = p_device_id);

  v_claimed := FOUND;
  RETURN v_claimed;
END;
$$;
