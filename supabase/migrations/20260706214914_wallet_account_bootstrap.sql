-- Wallet account bootstrap for existing and future profiles.
-- Fixes empty Captain Wallet screens caused by missing public.wallet_accounts rows.

create extension if not exists pgcrypto;

create table if not exists public.wallet_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric not null default 0 check (balance >= 0),
  paid_minutes_remaining numeric not null default 0 check (paid_minutes_remaining >= 0),
  bonus_minutes_remaining numeric not null default 0 check (bonus_minutes_remaining >= 0),
  active_package_name text,
  currency_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallet_accounts add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
alter table public.wallet_accounts add column if not exists balance numeric not null default 0 check (balance >= 0);
alter table public.wallet_accounts add column if not exists paid_minutes_remaining numeric not null default 0 check (paid_minutes_remaining >= 0);
alter table public.wallet_accounts add column if not exists bonus_minutes_remaining numeric not null default 0 check (bonus_minutes_remaining >= 0);
alter table public.wallet_accounts add column if not exists active_package_name text;
alter table public.wallet_accounts add column if not exists currency_code text;
alter table public.wallet_accounts add column if not exists created_at timestamptz not null default now();
alter table public.wallet_accounts add column if not exists updated_at timestamptz not null default now();

insert into public.wallet_accounts (
  profile_id,
  balance,
  paid_minutes_remaining,
  bonus_minutes_remaining,
  active_package_name,
  currency_code
)
select
  p.id,
  0,
  0,
  0,
  null,
  null
from public.profiles p
where not exists (
  select 1
  from public.wallet_accounts wa
  where wa.profile_id = p.id
)
on conflict (profile_id) do nothing;

drop function if exists public.ensure_wallet_account_for_profile() cascade;

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
    active_package_name,
    currency_code
  )
  values (
    new.id,
    0,
    0,
    0,
    null,
    null
  )
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

revoke truncate, update, delete on public.wallet_accounts from anon, authenticated;
grant select on public.wallet_accounts to authenticated;

drop policy if exists wallet_accounts_select_own on public.wallet_accounts;
create policy wallet_accounts_select_own on public.wallet_accounts
for select to authenticated
using (profile_id = (select auth.uid()));
