-- Adds: an optional nickname (shown to riders instead of the captain's legal
-- name when set, falling back to full_name otherwise), and an optional
-- company code for smart-app/independent captains who work under an
-- aggregator (Uber, Careem, ...) that assigns them a partner code distinct
-- from the aggregator's own name (already captured by employment_type).

alter table if exists public.captain_profiles
  add column if not exists nickname text,
  add column if not exists company_code text;
