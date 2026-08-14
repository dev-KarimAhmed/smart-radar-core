-- Bootstrap wallet rows and align captain status values for existing projects.
-- Apply after 20260814_captain_wallet_phase2.sql and
-- 20260814_captain_status_enum_cast.sql.

begin;

alter table if exists public.wallet_accounts
  add column if not exists time_bundle_expires_at timestamptz;

insert into public.wallet_accounts (
  profile_id,
  balance,
  paid_minutes_remaining,
  bonus_minutes_remaining,
  active_package_name,
  currency_code,
  time_bundle_expires_at
)
select
  p.id,
  0,
  0,
  0,
  null,
  null,
  null
from public.profiles p
where not exists (
  select 1
  from public.wallet_accounts w
  where w.profile_id = p.id
)
on conflict (profile_id) do nothing;

create or replace function public.ensure_wallet_account_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallet_accounts (
    profile_id,
    balance,
    paid_minutes_remaining,
    bonus_minutes_remaining,
    time_bundle_expires_at
  )
  values (new.id, 0, 0, 0, null)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_wallet_account_bootstrap on public.profiles;
create trigger profiles_wallet_account_bootstrap
after insert on public.profiles
for each row
execute function public.ensure_wallet_account_for_profile();

alter table public.wallet_accounts enable row level security;
grant select on public.wallet_accounts to authenticated;

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy wallet_accounts_select_own
  on public.wallet_accounts
  for select
  to authenticated
  using (profile_id = (select auth.uid()));

notify pgrst, 'reload schema';

commit;
