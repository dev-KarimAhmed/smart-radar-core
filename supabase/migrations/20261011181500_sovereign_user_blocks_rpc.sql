-- Migration: Sovereign user blocking & unblocking RPCs + real-time grants
-- Ensures atomic, reliable blocking and retrieval for both riders and captains

-- 1. block_user RPC
CREATE OR REPLACE FUNCTION public.block_user(p_blocked_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  IF p_blocked_id IS NULL THEN
    RAISE EXCEPTION 'blocked_id_required';
  END IF;

  IF v_caller_id = p_blocked_id THEN
    RAISE EXCEPTION 'cannot_block_self';
  END IF;

  -- Insert block with on conflict do nothing
  INSERT INTO public.user_blocks (blocker_id, blocked_id, created_at)
  VALUES (v_caller_id, p_blocked_id, now())
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;

  -- Cancel any pending ride offers between these two users
  UPDATE public.ride_offers
  SET status = 'CANCELLED'
  WHERE status = 'PENDING'
    AND (
      (captain_id = v_caller_id AND request_id IN (SELECT id FROM public.ride_requests WHERE rider_id = p_blocked_id))
      OR
      (captain_id = p_blocked_id AND request_id IN (SELECT id FROM public.ride_requests WHERE rider_id = v_caller_id))
    );

  RETURN jsonb_build_object(
    'success', true,
    'blocker_id', v_caller_id,
    'blocked_id', p_blocked_id
  );
END;
$$;

-- 2. unblock_user RPC
CREATE OR REPLACE FUNCTION public.unblock_user(p_blocked_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  IF p_blocked_id IS NULL THEN
    RAISE EXCEPTION 'blocked_id_required';
  END IF;

  DELETE FROM public.user_blocks
  WHERE blocker_id = v_caller_id
    AND blocked_id = p_blocked_id;

  RETURN jsonb_build_object(
    'success', true,
    'blocker_id', v_caller_id,
    'unblocked_id', p_blocked_id
  );
END;
$$;

-- 3. get_my_blocked_users RPC
CREATE OR REPLACE FUNCTION public.get_my_blocked_users()
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  rating numeric,
  serial_id text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ub.blocked_id AS id,
    coalesce(p.full_name, 'مستخدم محظور') AS name,
    coalesce(p.phone, '') AS phone,
    coalesce(p.rating, 5.0) AS rating,
    coalesce(p.serial_id, '') AS serial_id,
    coalesce(p.role::text, '') AS role,
    ub.created_at
  FROM public.user_blocks ub
  LEFT JOIN public.profiles p ON p.id = ub.blocked_id
  WHERE ub.blocker_id = auth.uid()
  ORDER BY ub.created_at DESC;
$$;

-- Permissions & Grants
GRANT EXECUTE ON FUNCTION public.block_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_blocked_users() TO authenticated;

-- Ensure RLS and publication for realtime on user_blocks
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for blocker" ON public.user_blocks;
CREATE POLICY "Enable insert for blocker" ON public.user_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Enable select for blocker or blocked" ON public.user_blocks;
CREATE POLICY "Enable select for blocker or blocked" ON public.user_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Enable delete for blocker" ON public.user_blocks;
CREATE POLICY "Enable delete for blocker" ON public.user_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;

-- Add user_blocks to realtime publication if not already included
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_blocks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if publication alteration is restricted
    NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
