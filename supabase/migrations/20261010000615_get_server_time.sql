-- Create a function to get the current server time for client synchronization
DROP FUNCTION IF EXISTS public.get_server_time();

CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT now();
$$;
