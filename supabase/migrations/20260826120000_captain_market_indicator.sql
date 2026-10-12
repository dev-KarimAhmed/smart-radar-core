-- Market-status indicator for the tariff modal (and a small persistent
-- version next to the dashboard tabs): green/"low" when the local market
-- has room, red/"high" when it's crowded with active captains — based on
-- how many captains are currently online ("active") in the same
-- governorate, following the exact same governorate-first/country-fallback
-- scoping used for the tariff averages (resolve_captain_governorate +
-- market_sample_threshold), so the indicator and the prices it sits next to
-- always agree on what "your area" means.

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
  v_country_id integer;
  v_governorate_sample integer;
  v_active_count integer;
  v_scope text;
  v_status text;
  -- Starting cutoff: more than twice the shared market-sample threshold (5)
  -- of currently-online captains in scope reads as a crowded/competitive
  -- market. Below that, there's room. Not derived from any live data —
  -- adjust if it doesn't match how the market actually feels once used.
  v_red_threshold constant integer := public.market_sample_threshold() * 2;
begin
  if v_caller is null then
    raise exception 'unauthenticated';
  end if;

  select rg.governorate_id, rg.country_id
  into v_governorate_id, v_country_id
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
  end if;

  if coalesce(v_governorate_sample, 0) >= public.market_sample_threshold() then
    v_scope := 'governorate';
    select count(*) into v_active_count
    from public.profiles p
    where p.governorate_id = v_governorate_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and lower(coalesce(p.status::text, '')) = 'active';
  elsif v_country_id is not null then
    v_scope := 'country';
    select count(*) into v_active_count
    from public.profiles p
    where p.country_id = v_country_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and lower(coalesce(p.status::text, '')) = 'active';
  else
    v_scope := 'unknown';
    v_active_count := 0;
  end if;

  v_status := case when coalesce(v_active_count, 0) > v_red_threshold then 'high' else 'low' end;

  return jsonb_build_object(
    'activeCaptainCount', coalesce(v_active_count, 0),
    'threshold', v_red_threshold,
    'scope', v_scope,
    'status', v_status
  );
end;
$fn$;

REVOKE ALL ON FUNCTION public.captain_market_indicator() FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_market_indicator() TO authenticated;

notify pgrst, 'reload schema';
