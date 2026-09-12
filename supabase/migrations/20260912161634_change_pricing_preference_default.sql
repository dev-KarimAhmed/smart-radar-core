-- 1. Alter ride_requests column pricing_preference to drop the default
ALTER TABLE public.ride_requests 
ALTER COLUMN pricing_preference DROP DEFAULT;

-- 2. Alter the same column to default to NULL
ALTER TABLE public.ride_requests 
ALTER COLUMN pricing_preference SET DEFAULT NULL;
