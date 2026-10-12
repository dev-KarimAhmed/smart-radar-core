-- The "active captains" count was matched against each captain's REGISTERED
-- governorate (profiles.governorate_id) — set once at sign-up and never
-- updated afterwards. A captain who registered in one governorate but is
-- currently driving in another (very common near governorate borders) was
-- still counted toward their registration governorate, not where they
-- actually are right now — inflating or hiding supply in whichever
-- governorate the viewing captain is actually in.
--
-- Now matched the same way the demand side already is: resolved from the
-- captain's LIVE location (public.captain_locations, kept fresh by
-- pulse_captain_location while the captain is online) via the same
-- resolve_governorate_from_point() used for ride_requests, so supply and
-- demand always describe "right here, right now" consistently.

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
    select count(*) into v_active_count
    from public.profiles p
    join public.captain_locations cl on cl.captain_id = p.id
    where upper(coalesce(p.role::text, '')) in ('CAPTAIN', 'DRIVER')
      and lower(coalesce(p.status::text, '')) = 'active'
      and public.resolve_governorate_from_point(cl.location_lat, cl.location_lng) = v_governorate_id;

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

  if v_governorate_id is null then
    -- No resolvable governorate at all — nothing to compare.
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
