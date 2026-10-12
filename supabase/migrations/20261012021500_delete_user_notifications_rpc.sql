-- Migration: 20261012021500_delete_user_notifications_rpc.sql
-- Description: Atomic bulk delete RPC for user notifications.

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

GRANT EXECUTE ON FUNCTION public.delete_user_notifications(text[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
