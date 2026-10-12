-- Adds a "flag-fall" / meter-opening fee (a fixed starting fee, like a taxi
-- meter's opening charge) for every captain, not only taxi affiliations.
-- Stored the same way price_per_km already is: captain-set reference data,
-- editable from the profile screen and re-confirmed via the price-per-km
-- setup modal.

alter table if exists public.captain_profiles
  add column if not exists flag_fall_fee numeric;
