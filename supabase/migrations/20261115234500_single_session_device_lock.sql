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
