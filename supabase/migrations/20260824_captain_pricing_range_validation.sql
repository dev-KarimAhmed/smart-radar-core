-- Server-authoritative anti-dumping/anti-gouging guard for captain pricing:
-- price_per_km and flag_fall_fee must each fall within 10% of the average
-- among other captains in the same governorate (falling back to the
-- country-wide average when the governorate has fewer than 3 priced peers,
-- and skipping the check entirely when there's no peer data anywhere yet —
-- e.g. the very first captain to price themselves). Enforced here, not just
-- client-side, since a captain could otherwise call the table update
-- directly and set any price.
--
-- The governorate used is the captain's LIVE location, not their registered
-- one — a captain can register in one governorate and actually work in
-- another, and their peers for pricing purposes should be whoever they're
-- actually competing with. There's no stored polygon/centroid for
-- governorates, but districts have center_lat/center_lng, so the live
-- governorate is resolved as "whichever district's center is nearest to the
-- captain's last reported GPS fix" (public.captain_locations — the same
-- table the 9km pickup-distance guard in submit_ride_offer already trusts
-- for live-location business logic). Falls back to the registered
-- governorate/country when no GPS fix has been recorded yet.

create or replace function public.set_captain_pricing(
  p_price_per_km numeric,
  p_flag_fall_fee numeric
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
  gov_peer_count integer;
  country_avg_price numeric;
  country_avg_flagfall numeric;
  country_peer_count integer;
  ref_avg_price numeric;
  ref_avg_flagfall numeric;
  has_reference boolean := false;
  tolerance constant numeric := 0.10;
  min_price numeric;
  max_price numeric;
  min_flagfall numeric;
  max_flagfall numeric;
begin
  if p_price_per_km is null or p_price_per_km <= 0 then
    raise exception 'invalid_price_per_km';
  end if;

  if p_flag_fall_fee is null or p_flag_fall_fee < 0 then
    raise exception 'invalid_flag_fall_fee';
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
    select avg(cp.price_per_km), avg(cp.flag_fall_fee), count(*)
    into gov_avg_price, gov_avg_flagfall, gov_peer_count
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.governorate_id = resolved_governorate_id
      and cp.id <> auth.uid()
      and cp.price_per_km is not null
      and cp.flag_fall_fee is not null;
  end if;

  if coalesce(gov_peer_count, 0) >= 3 then
    ref_avg_price := gov_avg_price;
    ref_avg_flagfall := gov_avg_flagfall;
    has_reference := true;
  elsif resolved_country_id is not null then
    select avg(cp.price_per_km), avg(cp.flag_fall_fee), count(*)
    into country_avg_price, country_avg_flagfall, country_peer_count
    from public.captain_profiles cp
    join public.profiles p on p.id = cp.id
    where p.country_id = resolved_country_id
      and cp.id <> auth.uid()
      and cp.price_per_km is not null
      and cp.flag_fall_fee is not null;

    if coalesce(country_peer_count, 0) > 0 then
      ref_avg_price := country_avg_price;
      ref_avg_flagfall := country_avg_flagfall;
      has_reference := true;
    end if;
  end if;

  if has_reference then
    min_price := ref_avg_price * (1 - tolerance);
    max_price := ref_avg_price * (1 + tolerance);
    min_flagfall := ref_avg_flagfall * (1 - tolerance);
    max_flagfall := ref_avg_flagfall * (1 + tolerance);

    if p_price_per_km < min_price or p_price_per_km > max_price then
      raise exception 'price_per_km_out_of_range'
        using detail = format('min=%s,max=%s,avg=%s', round(min_price, 2), round(max_price, 2), round(ref_avg_price, 2));
    end if;

    if p_flag_fall_fee < min_flagfall or p_flag_fall_fee > max_flagfall then
      raise exception 'flag_fall_fee_out_of_range'
        using detail = format('min=%s,max=%s,avg=%s', round(min_flagfall, 2), round(max_flagfall, 2), round(ref_avg_flagfall, 2));
    end if;
  end if;

  update public.captain_profiles
  set price_per_km = p_price_per_km,
      flag_fall_fee = p_flag_fall_fee
  where id = auth.uid();

  return jsonb_build_object(
    'price_per_km', p_price_per_km,
    'flag_fall_fee', p_flag_fall_fee,
    'governorate_id', resolved_governorate_id,
    'reference_applied', has_reference
  );
end;
$$;

grant execute on function public.set_captain_pricing(numeric, numeric) to authenticated;

notify pgrst, 'reload schema';
