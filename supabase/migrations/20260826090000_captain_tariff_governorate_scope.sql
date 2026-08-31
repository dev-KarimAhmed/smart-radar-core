-- Makes the captain tariff market reference governorate-first instead of
-- country-only: "your market" is whichever captains are actually nearby,
-- not the whole country. Falls back to the country-wide average when the
-- governorate doesn't have enough priced captains yet (same
-- market_sample_threshold() used everywhere else), and falls back further
-- to the country seed row when even the country doesn't have enough —
-- unchanged from before this migration.
--
-- "Nearby" is resolved from the captain's live GPS (public.captain_locations,
-- matched to the nearest district's center point — governorates have no
-- coordinates of their own, districts do), not their registered governorate:
-- a captain can register in one governorate and actually work in another.
-- Falls back to the registered governorate/country when no GPS fix exists
-- yet. This mirrors the resolution the standalone price-per-km/flag-fall
-- guard used before the tariff rewrite replaced it.

create or replace function public.resolve_captain_governorate(p_captain_id uuid)
returns table(governorate_id integer, country_id integer)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_profile public.profiles%rowtype;
  v_live_location public.captain_locations%rowtype;
  v_governorate_id integer;
  v_country_id integer;
begin
  select * into v_profile from public.profiles where id = p_captain_id;

  select * into v_live_location
  from public.captain_locations
  where captain_id = p_captain_id;

  if found then
    select d.governorate_id, g.country_id
    into v_governorate_id, v_country_id
    from public.districts d
    join public.governorates g on g.id = d.governorate_id
    where d.center_lat is not null and d.center_lng is not null
    order by 6371 * 2 * asin(sqrt(
      power(sin(radians(d.center_lat - v_live_location.location_lat) / 2), 2) +
      cos(radians(v_live_location.location_lat)) * cos(radians(d.center_lat)) *
      power(sin(radians(d.center_lng - v_live_location.location_lng) / 2), 2)
    )) asc
    limit 1;
  end if;

  if v_governorate_id is null then
    v_governorate_id := v_profile.governorate_id;
    v_country_id := v_profile.country_id;
  end if;

  return query select v_governorate_id, v_country_id;
end;
$fn$;

REVOKE ALL ON FUNCTION public.resolve_captain_governorate(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_captain_governorate(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- market_average_tariff: governorate tier, then country tier, then seed.
-- Old 1-arg signature dropped — every existing caller (calculate_server_fare,
-- captain_offer_quote) keeps compiling unchanged, since the new parameter
-- has a default of NULL, which reproduces the old country-only behavior
-- exactly. Only get_captain_tariff_context is updated to pass a governorate.
-- ---------------------------------------------------------------------------

drop function if exists public.market_average_tariff(integer);

create or replace function public.market_average_tariff(p_country_id integer, p_governorate_id integer default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_country public.countries%rowtype;
  v_base numeric;
  v_per_km numeric;
  v_per_min numeric;
  v_included_km numeric;
  v_captains integer;
  v_threshold integer := public.market_sample_threshold();
  v_scope text;
begin
  select * into v_country from public.countries where id = p_country_id;
  if not found then
    raise exception 'country_not_found';
  end if;

  if p_governorate_id is not null then
    select count(*),
           avg(cp.base_fare),
           avg(cp.price_per_km),
           avg(cp.price_per_min),
           avg(cp.included_km)
    into v_captains, v_base, v_per_km, v_per_min, v_included_km
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.governorate_id = p_governorate_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and cp.base_fare is not null
      and cp.price_per_km is not null
      and cp.price_per_min is not null;
  end if;

  if coalesce(v_captains, 0) >= v_threshold then
    v_scope := 'governorate';
  else
    select count(*),
           avg(cp.base_fare),
           avg(cp.price_per_km),
           avg(cp.price_per_min),
           avg(cp.included_km)
    into v_captains, v_base, v_per_km, v_per_min, v_included_km
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.country_id = p_country_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and cp.base_fare is not null
      and cp.price_per_km is not null
      and cp.price_per_min is not null;

    if coalesce(v_captains, 0) >= v_threshold then
      v_scope := 'country';
    else
      -- Seed from the country row. per_km_rate first, tariff_per_km only as the legacy
      -- fallback, matching what calculate_server_fare has always done.
      v_base := v_country.base_fare;
      v_per_km := coalesce(v_country.per_km_rate, v_country.tariff_per_km, 0.35);
      v_per_min := coalesce(v_country.tariff_per_min, 0);
      v_included_km := coalesce(v_country.included_km, 0);
      v_scope := 'country_seed';
    end if;
  end if;

  -- The market can never average its way below the regulated minimum.
  v_base := greatest(coalesce(v_base, v_country.base_fare), v_country.min_base_fare);

  return jsonb_build_object(
    'baseFare', round(v_base, 4),
    'perKm', round(coalesce(v_per_km, 0), 4),
    'perMin', round(coalesce(v_per_min, 0), 4),
    'includedKm', round(coalesce(v_included_km, 0), 4),
    'captainCount', coalesce(v_captains, 0),
    'threshold', v_threshold,
    'scope', v_scope,
    'source', case when v_scope = 'country_seed' then 'country_seed' else 'captain_average' end
  );
end;
$fn$;

REVOKE ALL ON FUNCTION public.market_average_tariff(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.market_average_tariff(integer, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- captain_base_fare_floor: same governorate-first, country-fallback cascade.
-- Old 1-arg signature dropped for the same reason as above — every existing
-- caller (the enforce_captain_base_fare_floor trigger) keeps working via the
-- default NULL governorate, unchanged behavior. get_captain_tariff_context
-- is the only caller updated to pass a governorate.
-- ---------------------------------------------------------------------------

drop function if exists public.captain_base_fare_floor(integer);

create or replace function public.captain_base_fare_floor(p_country_id integer, p_governorate_id integer default null)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  -- 0.85 = the average minus the same 15% the anti-dumping brake allows. A plain average
  -- would ratchet: every captain sits above the floor, so their average sits above it too,
  -- so the floor climbs and never comes back down.
  FLOOR_TOLERANCE constant numeric := 0.85;
  v_country public.countries%rowtype;
  v_avg_base numeric;
  v_captains integer;
  v_floor numeric;
begin
  select * into v_country from public.countries where id = p_country_id;
  if not found then
    return 1.00;
  end if;

  if p_governorate_id is not null then
    select count(*), avg(cp.base_fare)
    into v_captains, v_avg_base
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.governorate_id = p_governorate_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and cp.base_fare is not null
      and cp.price_per_km is not null
      and cp.price_per_min is not null;
  end if;

  if coalesce(v_captains, 0) < public.market_sample_threshold() then
    -- Governorate sample (if any) wasn't enough — try country-wide before giving up.
    select count(*), avg(cp.base_fare)
    into v_captains, v_avg_base
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.country_id = p_country_id
      and upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and cp.base_fare is not null
      and cp.price_per_km is not null
      and cp.price_per_min is not null;
  end if;

  if coalesce(v_captains, 0) < public.market_sample_threshold() or v_avg_base is null then
    -- Too few captains to call it a market: the country's default figure is the reference.
    v_floor := v_country.base_fare;
  else
    v_floor := v_avg_base * FLOOR_TOLERANCE;
  end if;

  return round(greatest(v_floor, v_country.min_base_fare), 2);
end;
$fn$;

REVOKE ALL ON FUNCTION public.captain_base_fare_floor(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_base_fare_floor(integer, integer) TO authenticated;


-- ---------------------------------------------------------------------------
-- get_captain_tariff_context: resolve the caller's live governorate and pass
-- it through, and surface the full market-average object (not just the
-- floor's source label) so the modal can show a market-average line under
-- every field, not only the base fare.
-- ---------------------------------------------------------------------------

create or replace function public.get_captain_tariff_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_caller uuid := auth.uid();
  v_row record;
  v_floor numeric;
  v_market jsonb;
  v_governorate_id integer;
  v_country_id integer;
begin
  if v_caller is null then
    raise exception 'unauthenticated';
  end if;

  select cp.base_fare, cp.price_per_km, cp.price_per_min, cp.included_km,
         c.currency_ar, c.currency_en, c.id as country_id
  into v_row
  from public.profiles p
  left join public.captain_profiles cp on cp.id = p.id
  left join public.countries c on c.id = p.country_id
  where p.id = v_caller;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_row.country_id is null then
    v_floor := 1.00;
    v_market := null;
  else
    select rg.governorate_id, rg.country_id
    into v_governorate_id, v_country_id
    from public.resolve_captain_governorate(v_caller) rg;

    v_floor := public.captain_base_fare_floor(v_row.country_id, v_governorate_id);
    v_market := public.market_average_tariff(v_row.country_id, v_governorate_id);
  end if;

  return jsonb_build_object(
    'baseFare', v_row.base_fare,
    'pricePerKm', v_row.price_per_km,
    'pricePerMin', v_row.price_per_min,
    'includedKm', v_row.included_km,
    'minBaseFare', v_floor,
    -- 'captain_average' once enough captains have a tariff, 'country_seed' before that.
    'minBaseFareSource', coalesce(v_market->>'source', 'country_seed'),
    'marketAverage', v_market,
    'countryId', v_row.country_id,
    'currencyAr', v_row.currency_ar,
    'currencyEn', v_row.currency_en
  );
end;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;

notify pgrst, 'reload schema';
