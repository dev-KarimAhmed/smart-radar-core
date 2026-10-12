-- Phase 2: server-authoritative captain wallet and time-bundle status.
-- Apply this migration before using the captain radar in production.

begin;

alter table if exists public.wallet_accounts
  add column if not exists time_bundle_expires_at timestamptz;

-- Realtime must publish wallet row changes for the client subscription to run.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'wallet_accounts'
    )
  then
    alter publication supabase_realtime add table public.wallet_accounts;
  end if;
end;
$$;

alter table if exists public.wallet_accounts enable row level security;
grant select on public.wallet_accounts to authenticated;

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy wallet_accounts_select_own
  on public.wallet_accounts
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

drop function if exists public.get_captain_wallet_status() cascade;

create or replace function public.get_captain_wallet_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  wallet_row public.wallet_accounts%rowtype;
  total_minutes integer;
  bundle_active boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select *
  into wallet_row
  from public.wallet_accounts
  where profile_id = auth.uid();

  if not found then
    return jsonb_build_object(
      'profile_id', auth.uid(),
      'balance', 0,
      'paid_minutes_remaining', 0,
      'bonus_minutes_remaining', 0,
      'active_package_name', null,
      'time_bundle_expires_at', null,
      'has_active_bundle', false,
      'status', 'MISSING'
    );
  end if;

  total_minutes := greatest(0, coalesce(wallet_row.paid_minutes_remaining, 0))
    + greatest(0, coalesce(wallet_row.bonus_minutes_remaining, 0));

  -- Existing accounts may have minutes without an expiry because they were
  -- created before time_bundle_expires_at existed. Keep those minutes usable;
  -- every new package or voucher flow should write an explicit expiry.
  bundle_active := total_minutes > 0
    and (
      wallet_row.time_bundle_expires_at is null
      or wallet_row.time_bundle_expires_at > now()
    );

  return jsonb_build_object(
    'profile_id', wallet_row.profile_id,
    'balance', coalesce(wallet_row.balance, 0),
    'paid_minutes_remaining', greatest(0, coalesce(wallet_row.paid_minutes_remaining, 0)),
    'bonus_minutes_remaining', greatest(0, coalesce(wallet_row.bonus_minutes_remaining, 0)),
    'active_package_name', wallet_row.active_package_name,
    'time_bundle_expires_at', wallet_row.time_bundle_expires_at,
    'has_active_bundle', bundle_active,
    'status', case
      when bundle_active then 'ACTIVE'
      when total_minutes > 0 then 'EXPIRED'
      else 'EMPTY'
    end
  );
end;
$$;

revoke all on function public.get_captain_wallet_status() from public;
grant execute on function public.get_captain_wallet_status() to authenticated;

notify pgrst, 'reload schema';

commit;
