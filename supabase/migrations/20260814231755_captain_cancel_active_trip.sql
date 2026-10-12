-- Lets the assigned captain cancel a trip they are already on (ACCEPTED /
-- ARRIVED / TRIP_ACTIVE). The existing cancel_ride_request() function only
-- accepts the rider — this is an additive, separate function so the rider
-- cancel path is untouched.

begin;

create or replace function public.captain_cancel_active_trip(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.ride_requests%rowtype;
begin
  select * into req from public.ride_requests where id = p_request_id for update;
  if not found then raise exception 'ride_request_not_found'; end if;

  if req.accepted_captain_id is distinct from auth.uid() then
    raise exception 'not_accepted_captain';
  end if;

  if upper(coalesce(req.status::text, '')) not in ('ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE') then
    raise exception 'ride_request_not_cancellable_by_captain';
  end if;

  perform set_config('app.ride_request_status_rpc', 'true', true);

  update public.ride_requests
  set status = 'CANCELLED', cancelled_at = now(), updated_at = now()
  where id = p_request_id;

  update public.ride_offers
  set status = 'REJECTED', updated_at = now()
  where request_id = p_request_id and status <> 'ACCEPTED';

  return jsonb_build_object('request_id', p_request_id, 'status', 'CANCELLED', 'cancelled_by', 'captain');
end;
$$;

grant execute on function public.captain_cancel_active_trip(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
