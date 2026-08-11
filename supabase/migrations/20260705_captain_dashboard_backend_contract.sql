-- Captain dashboard backend contract updates.
-- Normalizes pulse_captain_location to the production parameter name p_h3_cell.

drop function if exists public.pulse_captain_location(numeric, numeric, text) cascade;

create or replace function public.pulse_captain_location(
  p_lat numeric,
  p_lng numeric,
  p_h3_cell text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  captain_country_id integer;
begin
  select country_id into captain_country_id from public.profiles where id = auth.uid();

  insert into public.captain_locations (captain_id, location_lat, location_lng, h3_cell, country_id, is_available, updated_at)
  values (auth.uid(), p_lat, p_lng, p_h3_cell, captain_country_id, true, now())
  on conflict (captain_id) do update
    set location_lat = excluded.location_lat,
        location_lng = excluded.location_lng,
        h3_cell = excluded.h3_cell,
        country_id = excluded.country_id,
        is_available = true,
        updated_at = now();

  return jsonb_build_object('captain_id', auth.uid(), 'h3_cell', p_h3_cell, 'updated_at', now());
end;
$$;

grant execute on function public.pulse_captain_location(numeric, numeric, text) to authenticated;
