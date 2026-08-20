-- Adds: plain-text national ID / license numbers (replacing document image uploads for now),
-- optional social links, and the captain's price-per-km, to the captain profile.

alter table if exists public.captain_profiles
  add column if not exists national_id_number text,
  add column if not exists license_number text,
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists price_per_km numeric;
