-- Migration: 20261012011000_user_notifications_system.sql
-- Description: Sovereign user notifications table, indexes, RLS, and atomic read RPCs.

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

COMMENT ON TABLE public.user_notifications IS
  'Sovereign user notifications table with cross-device sync and read receipts.';

CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx
  ON public.user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_notifications_user_unread_idx
  ON public.user_notifications (user_id)
  WHERE is_read = false;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_manage_own_notifications ON public.user_notifications;
CREATE POLICY users_manage_own_notifications
  ON public.user_notifications
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated;

-- RPC to mark a single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

-- RPC to mark all notifications as read for current user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.user_notifications
    SET is_read = true, read_at = now()
    WHERE user_id = auth.uid() AND is_read = false
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_read(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
