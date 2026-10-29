-- Remove floor restriction on base_fare so captains can enter any base fare freely
CREATE OR REPLACE FUNCTION public.enforce_captain_base_fare_floor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  -- Permissive: Allow captain to set any base_fare freely
  RETURN NEW;
END;
$fn$;
