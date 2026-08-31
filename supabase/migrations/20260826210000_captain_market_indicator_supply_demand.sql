-- Replaces the fixed "more than N active captains = crowded" cutoff with an
-- actual supply-vs-demand comparison: many riders waiting and few captains
-- online = green ("there's work"); few/no riders waiting while captains are
-- online = red ("crowded, no work to go around"). No arbitrary constant —
-- the boundary between green and red is however many riders are currently
-- waiting in the captain's own governorate.

create or replace function public.resolve_governorate_from_point(p_lat numeric, p_lng numeric)
returns integer
language sql
stable
security definer
set search_path = public
as $fn$
  select d.governorate_id
  from public.districts d
  where d.center_lat is not null and d.center_lng is not null
  order by 6371 * 2 * asin(sqrt(
    power(sin(radians(d.center_lat - p_lat) / 2), 2) +
    cos(radians(p_lat)) * cos(radians(d.center_lat)) *
    power(sin(radians(d.center_lng - p_lng) / 2), 2)
  )) asc
  limit 1;
$fn$;

REVOKE ALL ON FUNCTION public.resolve_governorate_from_point(numeric, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_governorate_from_point(numeric, numeric) TO authenticated;


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
  v_pending_count integer;
  v_status text;
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

    -- "Demand" = riders currently waiting for a captain, originating in the
    -- same governorate. Bounded to the last 30 minutes as a safety net in
    -- case a request was left PENDING without ever being cleaned up.
    select count(*) into v_pending_count
    from public.ride_requests r
    where upper(coalesce(r.status::text, '')) in ('PENDING', 'RECEIVING_OFFERS')
      and r.created_at > now() - interval '30 minutes'
      and r.origin_lat is not null
      and r.origin_lng is not null
      and public.resolve_governorate_from_point(r.origin_lat, r.origin_lng) = v_governorate_id;
  end if;

  if v_governorate_id is null or coalesce(v_governorate_sample, 0) < public.market_sample_threshold() then
    -- Not enough priced captains in this governorate to call it a market —
    -- that itself means there's room, not "go compute something else".
    v_status := 'low';
  else
    -- At least as many riders waiting as captains online: there's enough
    -- work to go around. Fewer riders than captains: crowded.
    v_status := case when coalesce(v_pending_count, 0) >= coalesce(v_active_count, 0) then 'low' else 'high' end;
  end if;

  return jsonb_build_object(
    'activeCaptainCount', coalesce(v_active_count, 0),
    'pendingRequestCount', coalesce(v_pending_count, 0),
    'scope', 'governorate',
    'status', v_status
  );
end;
$fn$;

REVOKE ALL ON FUNCTION public.captain_market_indicator() FROM anon;
GRANT EXECUTE ON FUNCTION public.captain_market_indicator() TO authenticated;

notify pgrst, 'reload schema';
