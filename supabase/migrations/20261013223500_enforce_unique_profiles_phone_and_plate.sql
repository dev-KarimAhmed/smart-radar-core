-- Migration: 20261013223500_enforce_unique_profiles_phone_and_plate.sql
-- Description: Enforce uniqueness on phone, vehicle_plate, and serial_id in public.profiles.

-- 1. Sync any drifted profile phones back to their sovereign auth.users phone
UPDATE public.profiles p
SET phone = u.phone
FROM auth.users u
WHERE p.id = u.id AND u.phone IS NOT NULL AND u.phone <> '' AND p.phone <> u.phone;

-- 2. Deduplicate any remaining phone conflicts if any exist
WITH dup_phones AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) AS rnum
  FROM public.profiles
  WHERE phone IS NOT NULL AND phone <> '' AND phone <> '0000000000'
)
UPDATE public.profiles
SET phone = phone || '-dup-' || substr(id::text, 1, 4)
WHERE id IN (
  SELECT id FROM dup_phones WHERE rnum > 1
);

-- 3. Create unique index on profiles.phone
CREATE UNIQUE INDEX IF NOT EXISTS unique_profiles_phone
ON public.profiles (phone)
WHERE phone IS NOT NULL AND phone <> '' AND phone <> '0000000000';

-- 4. Create unique index on profiles.serial_id
CREATE UNIQUE INDEX IF NOT EXISTS unique_profiles_serial_id
ON public.profiles (serial_id)
WHERE serial_id IS NOT NULL AND trim(serial_id) <> '';

-- 5. Deduplicate any vehicle_plate duplicates in profiles to match captain_profiles
WITH dup_plates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY upper(trim(vehicle_plate)) ORDER BY created_at ASC) AS rnum
  FROM public.profiles
  WHERE vehicle_plate IS NOT NULL AND trim(vehicle_plate) <> ''
)
UPDATE public.profiles
SET vehicle_plate = vehicle_plate || '-DUP-' || substr(id::text, 1, 4)
WHERE id IN (
  SELECT id FROM dup_plates WHERE rnum > 1
);

-- 6. Create unique index on profiles.vehicle_plate
CREATE UNIQUE INDEX IF NOT EXISTS unique_profiles_vehicle_plate
ON public.profiles (upper(trim(vehicle_plate)))
WHERE vehicle_plate IS NOT NULL AND trim(vehicle_plate) <> '';

