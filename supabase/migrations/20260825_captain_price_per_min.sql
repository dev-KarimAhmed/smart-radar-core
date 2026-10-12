-- Adds price_per_min (per-minute waiting/traffic-time rate) alongside the
-- existing price_per_km and flag_fall_fee — same table, same mandatory
-- setup modal, same edit-profile screen, and the same anti-dumping/
-- anti-gouging peer-average guard in set_captain_pricing.

alter table if exists public.captain_profiles
  add column if not exists price_per_min numeric;

drop function if exists public.set_captain_pricing(numeric, numeric);

create or replace function public.set_captain_pricing(
  p_price_per_km numeric,
  p_flag_fall_fee numeric,
  p_price_per_min numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  captain_profile public.profiles%rowtype;
  live_location public.captain_locations%rowtype;
  resolved_governorate_id integer;
  resolved_country_id integer;
  gov_avg_price numeric;
  gov_avg_flagfall numeric;
  gov_avg_permin numeric;
  gov_peer_count integer;
  country_avg_price numeric;
  country_avg_flagfall numeric;
  country_avg_permin numeric;
  country_peer_count integer;
  ref_avg_price numeric;
  ref_avg_flagfall numeric;
  ref_avg_permin numeric;
  has_reference boolean := false;
  tolerance constant numeric := 0.10;
  min_price numeric;
  max_price numeric;
  min_flagfall numeric;
  max_flagfall numeric;
  min_permin numeric;
  max_permin numeric;
begin
  if p_price_per_km is null or p_price_per_km <= 0 then
    raise exception 'invalid_price_per_km';
  end if;

  if p_flag_fall_fee is null or p_flag_fall_fee < 0 then
    raise exception 'invalid_flag_fall_fee';
  end if;

  if p_price_per_min is null or p_price_per_min < 0 then
    raise exception 'invalid_price_per_min';
  end if;

  select *
  into captain_profile
  from public.profiles
  where id = auth.uid();

  if not found or upper(coalesce(captain_profile.role::text, '')) not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  select * into live_location
  from public.captain_locations
  where captain_id = auth.uid();

  if found then
    select d.governorate_id, g.country_id
    into resolved_governorate_id, resolved_country_id
    from public.districts d
    join public.governorates g on g.id = d.governorate_id
    where d.center_lat is not null and d.center_lng is not null
    order by 6371 * 2 * asin(sqrt(
      power(sin(radians(d.center_lat - live_location.location_lat) / 2), 2) +
      cos(radians(live_location.location_lat)) * cos(radians(d.center_lat)) *
      power(sin(radians(d.center_lng - live_location.location_lng) / 2), 2)
    )) asc
    limit 1;
  end if;

  -- No GPS fix yet, or no district carries center coordinates — fall back
  -- to the registered governorate/country instead of skipping the guard.
  if resolved_governorate_id is null then
    resolved_governorate_id := captain_profile.governorate_id;
    resolved_country_id := captain_profile.country_id;
  end if;

  if resolved_governorate_id is not null then
    select avg(cp.price_per_km), avg(cp.flag_fall_fee), avg(cp.price_per_min), count(*)
    into gov_avg_price, gov_avg_flagfall, gov_avg_permin, gov_peer_count
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.governorate_id = resolved_governorate_id
      and cp.id <> auth.uid()
      and cp.price_per_km is not null
      and cp.flag_fall_fee is not null
      and cp.price_per_min is not null;
  end if;

  if coalesce(gov_peer_count, 0) >= 3 then
    ref_avg_price := gov_avg_price;
    ref_avg_flagfall := gov_avg_flagfall;
    ref_avg_permin := gov_avg_permin;
    has_reference := true;
  elsif resolved_country_id is not null then
    select avg(cp.price_per_km), avg(cp.flag_fall_fee), avg(cp.price_per_min), count(*)
    into country_avg_price, country_avg_flagfall, country_avg_permin, country_peer_count
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.country_id = resolved_country_id
      and cp.id <> auth.uid()
      and cp.price_per_km is not null
      and cp.flag_fall_fee is not null
      and cp.price_per_min is not null;

    if coalesce(country_peer_count, 0) > 0 then
      ref_avg_price := country_avg_price;
      ref_avg_flagfall := country_avg_flagfall;
      ref_avg_permin := country_avg_permin;
      has_reference := true;
    end if;
  end if;

  if has_reference then
    min_price := ref_avg_price * (1 - tolerance);
    max_price := ref_avg_price * (1 + tolerance);
    min_flagfall := ref_avg_flagfall * (1 - tolerance);
    max_flagfall := ref_avg_flagfall * (1 + tolerance);
    min_permin := ref_avg_permin * (1 - tolerance);
    max_permin := ref_avg_permin * (1 + tolerance);

    if p_price_per_km < min_price or p_price_per_km > max_price then
      raise exception 'price_per_km_out_of_range'
        using detail = format('min=%s,max=%s,avg=%s', round(min_price, 2), round(max_price, 2), round(ref_avg_price, 2));
    end if;

    if p_flag_fall_fee < min_flagfall or p_flag_fall_fee > max_flagfall then
      raise exception 'flag_fall_fee_out_of_range'
        using detail = format('min=%s,max=%s,avg=%s', round(min_flagfall, 2), round(max_flagfall, 2), round(ref_avg_flagfall, 2));
    end if;

    if p_price_per_min < min_permin or p_price_per_min > max_permin then
      raise exception 'price_per_min_out_of_range'
        using detail = format('min=%s,max=%s,avg=%s', round(min_permin, 2), round(max_permin, 2), round(ref_avg_permin, 2));
    end if;
  end if;

  update public.captain_profiles
  set price_per_km = p_price_per_km,
      flag_fall_fee = p_flag_fall_fee,
      price_per_min = p_price_per_min
  where id = auth.uid();

  return jsonb_build_object(
    'price_per_km', p_price_per_km,
    'flag_fall_fee', p_flag_fall_fee,
    'price_per_min', p_price_per_min,
    'governorate_id', resolved_governorate_id,
    'reference_applied', has_reference
  );
end;
$$;

grant execute on function public.set_captain_pricing(numeric, numeric, numeric) to authenticated;

notify pgrst, 'reload schema';
