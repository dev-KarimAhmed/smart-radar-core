-- Make national ID and license number unique in captain_profiles

-- Handle existing duplicates for national_id_number by keeping the first row and setting duplicate values to NULL
WITH dup_national_ids AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY national_id_number ORDER BY ctid) AS rnum
  FROM public.captain_profiles
  WHERE national_id_number IS NOT NULL
)
UPDATE public.captain_profiles
SET national_id_number = NULL
WHERE id IN (
  SELECT id FROM dup_national_ids WHERE rnum > 1
);

-- Handle existing duplicates for license_number by keeping the first row and setting duplicate values to NULL
WITH dup_licenses AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY license_number ORDER BY ctid) AS rnum
  FROM public.captain_profiles
  WHERE license_number IS NOT NULL
)
UPDATE public.captain_profiles
SET license_number = NULL
WHERE id IN (
  SELECT id FROM dup_licenses WHERE rnum > 1
);

-- Create unique conditional indexes (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS unique_national_id_number ON public.captain_profiles (national_id_number) WHERE national_id_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_license_number ON public.captain_profiles (license_number) WHERE license_number IS NOT NULL;
