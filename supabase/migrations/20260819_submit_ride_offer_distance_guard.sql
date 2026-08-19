-- Server-side enforcement of the 9km radar visibility cutoff: a captain
-- further than this from the pickup point must never be able to submit an
-- offer at all, regardless of what the client radar filter shows them —
-- otherwise a stale/bypassed client could still get an offer to the rider.
-- Redefines submit_ride_offer (same signature) with an added distance guard.

create or replace function public.submit_ride_offer(
  p_request_id uuid,
  p_offer_price numeric
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
  captain_profile public.profiles%rowtype;
  captain_location public.captain_locations%rowtype;
  distance_km numeric;
  new_offer public.ride_offers%rowtype;
  max_distance_km constant numeric := 9;
begin
  if p_request_id is null then
    raise exception 'request_id_required';
  end if;

  if p_offer_price is null or p_offer_price <= 0 then
    raise exception 'invalid_offer_price';
  end if;

  select *
  into captain_profile
  from public.profiles
  where id = auth.uid();

  if not found or upper(coalesce(captain_profile.role::text, '')) not in ('CAPTAIN', 'DRIVER') then
    raise exception 'captain_profile_required';
  end if;

  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('PENDING', 'RECEIVING_OFFERS') then
    raise exception 'ride_request_not_pending';
  end if;

  if req.country_id is not null
    and captain_profile.country_id is not null
    and req.country_id <> captain_profile.country_id
  then
    raise exception 'request_outside_captain_country';
  end if;

  -- Distance guard: only enforced when the captain has a recorded location
  -- (matches the client-side radar filter's leniency for unknown location —
  -- it doesn't hide requests from a captain whose position isn't known yet).
  select * into captain_location
  from public.captain_locations
  where captain_id = auth.uid();

  if found then
    distance_km := 6371 * 2 * asin(sqrt(
      power(sin(radians(req.origin_lat - captain_location.location_lat) / 2), 2) +
      cos(radians(captain_location.location_lat)) * cos(radians(req.origin_lat)) *
      power(sin(radians(req.origin_lng - captain_location.location_lng) / 2), 2)
    ));

    if distance_km > max_distance_km then
      raise exception 'captain_too_far_from_pickup';
    end if;
  end if;

  insert into public.ride_offers (
    request_id,
    captain_id,
    offered_fare,
    offer_price,
    eta_minutes,
    status,
    created_at,
    updated_at
  )
  values (
    p_request_id,
    auth.uid(),
    p_offer_price,
    p_offer_price,
    5,
    'PENDING',
    now(),
    now()
  )
  returning * into new_offer;

  return jsonb_build_object(
    'id', new_offer.id,
    'request_id', new_offer.request_id,
    'captain_id', new_offer.captain_id,
    'offer_price', coalesce(new_offer.offer_price, new_offer.offered_fare),
    'eta_minutes', new_offer.eta_minutes,
    'status', new_offer.status
  );
end;
$$;

grant execute on function public.submit_ride_offer(uuid, numeric) to authenticated;

notify pgrst, 'reload schema';
