-- Migration: Regional Hourly Rates for Governorates and Districts
-- Provides column-level storage for radar hour prices at the governorate and district level.

ALTER TABLE public.governorates 
  ADD COLUMN IF NOT EXISTS radar_hour_price numeric DEFAULT NULL;

ALTER TABLE public.districts 
  ADD COLUMN IF NOT EXISTS radar_hour_price numeric DEFAULT NULL;

COMMENT ON COLUMN public.governorates.radar_hour_price IS 
  'Custom radar hour price override for this governorate. If NULL, inherits from country.';

COMMENT ON COLUMN public.districts.radar_hour_price IS 
  'Custom radar hour price override for this district. If NULL, inherits from governorate or country.';

