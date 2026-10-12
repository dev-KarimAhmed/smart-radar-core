-- Fixes an inconsistency from the previous migration: get_captain_tariff_context
-- resolved the captain's LIVE-GPS country via resolve_captain_governorate()
-- but then never used it, passing the REGISTERED country (profiles.country_id)
-- into captain_base_fare_floor/market_average_tariff instead — while
-- captain_market_indicator (added the same day) correctly used the resolved
-- one. So the market-status indicator and the tariff floor/average could
-- silently disagree about which country's "market" they meant.
--
-- Now both use the same resolved country consistently: live GPS location
-- when a fix exists, the registered country only as a fallback.

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
         p.country_id
  into v_row
  from public.profiles p
  left join public.captain_profiles cp on cp.id = p.id
  where p.id = v_caller;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_row.country_id is null then
    v_floor := 1.00;
    v_market := null;
    v_country_id := null;
  else
    select rg.governorate_id, rg.country_id
    into v_governorate_id, v_country_id
    from public.resolve_captain_governorate(v_caller) rg;

    -- resolve_captain_governorate only falls back to the registered country
    -- when there's no GPS fix; it should never return null here given
    -- v_row.country_id is already known not-null, but guard anyway.
    v_country_id := coalesce(v_country_id, v_row.country_id);

    v_floor := public.captain_base_fare_floor(v_country_id, v_governorate_id);
    v_market := public.market_average_tariff(v_country_id, v_governorate_id);
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
    'countryId', coalesce(v_country_id, v_row.country_id),
    -- Currency still follows the REGISTERED country, matching the separate
    -- isInDifferentCountry/currency-swap flow already handled client-side
    -- (useLiveCurrencyFromLocation) — this RPC isn't the source of truth for
    -- that, so it deliberately doesn't try to re-derive currency from GPS.
    'currencyAr', (select currency_ar from public.countries where id = v_row.country_id),
    'currencyEn', (select currency_en from public.countries where id = v_row.country_id)
  );
end;
$fn$;

REVOKE ALL ON FUNCTION public.get_captain_tariff_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_captain_tariff_context() TO authenticated;

notify pgrst, 'reload schema';
