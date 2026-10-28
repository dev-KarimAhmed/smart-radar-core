-- Migration: 20261022030000_admin_sectors_and_captain_language.sql
-- Description: Add preferred_language for users/captains and allowed_sectors for admin permissions control.

-- 1. Add preferred_language column to public.profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'ar';

-- 2. Add allowed_sectors column to public.profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS allowed_sectors text[] DEFAULT ARRAY['captains', 'riders', 'wallet', 'hourly_rates', 'delegates', 'admins'];

-- 3. Update existing admins to have full sectors by default
UPDATE public.profiles
SET allowed_sectors = ARRAY['captains', 'riders', 'wallet', 'hourly_rates', 'delegates', 'admins']
WHERE role = 'ADMIN' AND (allowed_sectors IS NULL OR array_length(allowed_sectors, 1) = 0);

-- 4. Set primary sovereign admin specifically
UPDATE public.profiles
SET allowed_sectors = ARRAY['captains', 'riders', 'wallet', 'hourly_rates', 'delegates', 'admins']
WHERE id = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' OR phone = '+201551981922';

-- 5. Add index for faster language-based filtering
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON public.profiles(preferred_language);

