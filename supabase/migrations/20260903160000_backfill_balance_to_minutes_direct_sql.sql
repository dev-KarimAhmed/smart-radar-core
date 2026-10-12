-- [FIX] Direct SQL back-fill: convert stranded cash balances to radar minutes.
--
-- The previous migration (20260903150000) called amount_to_radar_minutes() inside
-- a DO block which executed AFTER the function definition in the same migration.
-- PostgreSQL runs the DO block in the same transaction, but plpgsql STABLE functions
-- called from a DO block can fail silently when the session role differs from the
-- SECURITY DEFINER context. As a result, the DO block produced zero updates.
--
-- This migration replaces that approach with a direct UPDATE...FROM JOIN that runs
-- purely in SQL — no function calls, no plpgsql — guaranteeing the back-fill executes.
--
-- Formula:
--   v_minute_price = radar_hour_price / 60
--   minutes        = floor(balance / v_minute_price)
--   remainder      = balance - (minutes * v_minute_price)
--
-- Egypt (country_id = 2): radar_hour_price = 300  → minute_price = 5
--   balance 300 → 60 minutes, remainder 0
-- Jordan (country_id = 1): radar_hour_price = 1   → minute_price = 0.01667
--   (handled generically)
--
-- Captains who already have paid_minutes_remaining > 0 get their minutes extended.
-- The balance is zeroed (or reduced to the sub-minute remainder).

begin;

-- Step 1: compute conversion values per wallet and apply directly.
with conversion as (
  select
    wa.profile_id,
    wa.balance,
    c.radar_hour_price,
    c.radar_hour_price / 60.0                           as minute_price,
    floor(wa.balance / (c.radar_hour_price / 60.0))::integer as minutes_to_add,
    wa.balance - floor(wa.balance / (c.radar_hour_price / 60.0)) * (c.radar_hour_price / 60.0)
                                                         as new_remainder
  from public.wallet_accounts wa
  join public.profiles p on p.id = wa.profile_id
  join public.countries c on c.id = p.country_id
  where wa.balance > 0
    and c.radar_hour_price > 0
    and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
)
update public.wallet_accounts wa
set
  paid_minutes_remaining = wa.paid_minutes_remaining + cv.minutes_to_add,
  balance                = round(cv.new_remainder, 2),
  pending_seconds_debt   = 0,
  time_bundle_expires_at = case
    when cv.minutes_to_add > 0 then
      greatest(coalesce(wa.time_bundle_expires_at, now()), now())
      + make_interval(mins => cv.minutes_to_add)
    else wa.time_bundle_expires_at
  end,
  updated_at             = clock_timestamp()
from conversion cv
where wa.profile_id = cv.profile_id
  and cv.minutes_to_add > 0;

-- Step 2: insert conversion transaction records for audit trail.
insert into public.wallet_transactions (profile_id, type, amount, status, description_ar, metadata)
select
  wa.profile_id,
  'balance_converted_to_time',
  wa_before.old_balance,
  'COMPLETED',
  'تحويل تلقائي: رصيد نقدي قديم حُوِّل إلى وقت رادار.',
  jsonb_build_object(
    'autoMigration', true,
    'migrationVersion', '20260903160000',
    'hourPrice', c.radar_hour_price,
    'minutePrice', round(c.radar_hour_price / 60.0, 4)
  )
from public.wallet_accounts wa
join public.profiles p on p.id = wa.profile_id
join public.countries c on c.id = p.country_id
-- snapshot original balance before the update via a subquery
join lateral (
  select
    orig.balance as old_balance,
    floor(orig.balance / (c2.radar_hour_price / 60.0))::integer as minutes_added
  from public.wallet_accounts orig
  join public.countries c2 on c2.id = p.country_id
  where orig.profile_id = wa.profile_id
) wa_before on true
where wa.balance = 0  -- already zeroed by step 1 means conversion happened
  and wa_before.old_balance > 0  -- guard: only insert where something changed
  and wa_before.minutes_added > 0
  and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER');

-- Verify: show what changed (visible in migration log).
do $$
declare
  v_count integer;
  v_total_minutes integer;
begin
  select count(*), sum(paid_minutes_remaining)
  into v_count, v_total_minutes
  from public.wallet_accounts
  where balance = 0 and paid_minutes_remaining > 0;
  raise notice 'Back-fill complete. Accounts with balance now zeroed: %. Total paid minutes in DB: %.', v_count, v_total_minutes;
end;
$$;

notify pgrst, 'reload schema';

commit;
