-- The market-status indicator should never fall back to a country-wide
-- count — that was borrowed from the pricing-average fallback, but it
-- doesn't fit here: for a green/red crowding signal, a governorate that
-- doesn't yet have enough priced captains to judge reliably isn't "unknown,
-- go check the whole country" — it just means there's room, i.e. green.
-- Pricing (market_average_tariff / captain_base_fare_floor) still falls
-- back to country-then-seed exactly as before; only this indicator changes.

create or replace function public.captain_market_indicator()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_caller uuid := auth.uid();
  v_governorate_id integer;
  v_governorate_sample integer;
  v_active_count integer;
  v_status text;
  -- Starting cutoff: more than twice the shared market-sample threshold (5)
  -- of currently-online captains in the governorate reads as a crowded/
  -- competitive market. Below that, there's room. Not derived from any live
  -- data — adjust if it doesn't match how the market actually feels once used.
  v_red_threshold constant integer := public.market_sample_threshold() * 2;
begin
  if v_caller is null then
    raise exception 'unauthenticated';
  end if;

  select rg.governorate_id into v_governorate_id
  from public.resolve_captain_governorate(v_caller) rg;

  if v_governorate_id is not null then
    select count(*) into v_governorate_sample
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.governorate_id = v_governorate_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and cp.base_fare is not null
      and cp.price_per_km is not null
      and cp.price_per_min is not null;

    select count(*) into v_active_count
    from public.profiles p
    where p.governorate_id = v_governorate_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and lower(coalesce(p.status::text, '')) = 'active';
  end if;

  if v_governorate_id is null or coalesce(v_governorate_sample, 0) < public.market_sample_threshold() then
    -- Not enough priced captains in this governorate to call it crowded —
    -- that itself means there's room, not "go look at the country instead".
    v_status := 'low';
  else
    v_status := case when coalesce(v_active_count, 0) > v_red_threshold then 'high' else 'low' end;
  end if;

  return jsonb_build_object(
    'activeCaptainCount', coalesce(v_active_count, 0),
    'threshold', v_red_threshold,
    'scope', 'governorate',
    'status', v_status
  );
end;
$fn$;

REVOKE ALL ON FUNCTION public.captain_market_indicator() FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_market_indicator() TO authenticated;

notify pgrst, 'reload schema';
