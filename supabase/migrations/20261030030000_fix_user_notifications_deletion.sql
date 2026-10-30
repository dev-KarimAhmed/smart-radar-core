-- Migration: 20261030030000_fix_user_notifications_deletion.sql
-- Description: Ensure bulletproof atomic single, bulk, and clear-all deletions for user notifications.

BEGIN;

-- 1. Ensure explicit DELETE policy on user_notifications for authenticated users
DROP POLICY IF EXISTS users_delete_own_notifications ON public.user_notifications;
CREATE POLICY users_delete_own_notifications
  ON public.user_notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Bulk delete RPC by IDs
CREATE OR REPLACE FUNCTION public.delete_user_notifications(p_ids text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  WITH deleted AS (
    DELETE FROM public.user_notifications
    WHERE id = ANY(p_ids) AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM deleted;
  RETURN v_count;
END;
$$;

-- 3. Clear all notifications RPC for current user
CREATE OR REPLACE FUNCTION public.delete_all_user_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.user_notifications
    WHERE user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM deleted;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_notifications(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_user_notifications() TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
