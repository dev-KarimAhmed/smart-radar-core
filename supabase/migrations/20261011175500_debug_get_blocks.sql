-- Temporary inspection RPC for user_blocks
CREATE OR REPLACE FUNCTION public.debug_get_all_blocks()
RETURNS TABLE (
  block_id uuid,
  blocker_id uuid,
  blocked_id uuid,
  created_at timestamptz,
  blocker_name text,
  blocked_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ub.id,
    ub.blocker_id,
    ub.blocked_id,
    ub.created_at,
    p1.full_name as blocker_name,
    p2.full_name as blocked_name
  FROM public.user_blocks ub
  LEFT JOIN public.profiles p1 ON p1.id = ub.blocker_id
  LEFT JOIN public.profiles p2 ON p2.id = ub.blocked_id
  ORDER BY ub.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.debug_get_all_blocks() TO authenticated, anon;
