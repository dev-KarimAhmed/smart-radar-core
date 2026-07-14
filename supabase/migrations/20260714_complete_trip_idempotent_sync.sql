-- Make trip completion idempotent across rider and captain dashboards.
-- Business rule: one shared trip row. If either participant completes it,
-- both sides must observe COMPLETED. A second completion call from the
-- other participant returns the existing completed state instead of failing.

drop function if exists public.complete_ride_trip(uuid) cascade;

create or replace function public.complete_ride_trip(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
  final_amount numeric;
begin
  select *
  into req
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'ride_request_not_found';
  end if;

  if req.rider_id is distinct from auth.uid()
    and req.accepted_captain_id is distinct from auth.uid()
  then
    raise exception 'not_trip_participant';
  end if;

  final_amount := coalesce(req.final_fare, req.server_estimated_fare, 0);

  if upper(coalesce(req.status::text, '')) = 'COMPLETED' then
    return jsonb_build_object(
      'request_id', p_request_id,
      'status', 'COMPLETED',
      'final_fare', final_amount,
      'captain_id', req.accepted_captain_id,
      'rider_id', req.rider_id,
      'already_completed', true
    );
  end if;

  if req.accepted_captain_id is null then
    raise exception 'accepted_captain_required';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('TRIP_ACTIVE', 'ACTIVE') then
    raise exception 'ride_request_not_active';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'COMPLETED',
      final_fare = final_amount,
      completed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.trips_72h_ledger (
    request_id,
    rider_id,
    captain_id,
    settled_fare,
    accepted_at,
    started_at,
    ended_at,
    final_fare,
    status,
    completed_at,
    purge_at,
    metadata
  )
  values (
    p_request_id,
    req.rider_id,
    req.accepted_captain_id,
    final_amount,
    coalesce(req.arrived_at, req.started_at, now()),
    req.started_at,
    now(),
    final_amount,
    'COMPLETED',
    now(),
    now() + interval '72 hours',
    jsonb_build_object(
      'source', 'complete_ride_trip',
      'status_before_completion', req.status::text,
      'accepted_offer_id', req.accepted_offer_id
    )
  )
  on conflict (request_id) do update
  set settled_fare = excluded.settled_fare,
      final_fare = excluded.final_fare,
      status = excluded.status,
      completed_at = excluded.completed_at,
      ended_at = excluded.ended_at,
      purge_at = excluded.purge_at,
      metadata = public.trips_72h_ledger.metadata || excluded.metadata;

  return jsonb_build_object(
    'request_id', p_request_id,
    'status', 'COMPLETED',
    'final_fare', final_amount,
    'captain_id', req.accepted_captain_id,
    'rider_id', req.rider_id,
    'already_completed', false
  );
end;
$$;

grant execute on function public.complete_ride_trip(uuid) to authenticated;

notify pgrst, 'reload schema';
