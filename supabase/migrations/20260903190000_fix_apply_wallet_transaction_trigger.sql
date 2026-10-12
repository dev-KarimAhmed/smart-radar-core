-- [CRITICAL FIX] Prevent trigger apply_wallet_transaction() from re-adding converted amounts.
--
-- Root cause of "balance becomes 0 then returns 300":
-- The table trigger `tr_wallet_transactions_apply_account_balance` fires `apply_wallet_transaction()`
-- on EVERY insert to `wallet_transactions`. When `convert_wallet_balance_to_minutes()` ran:
--   1. The RPC updated `wallet_accounts` SET balance = 0.
--   2. The RPC inserted a audit row into `wallet_transactions` with `amount = v_balance` (300).
--   3. The trigger fired and executed `UPDATE wallet_accounts SET balance = balance + 300` (0 + 300 = 300)!
-- Thus the trigger was automatically undoing the zeroing of balance on every conversion.
--
-- Fix:
--   Update `apply_wallet_transaction()` to skip modifying `wallet_accounts` for transactions
--   where the RPC already manages `wallet_accounts` state directly (e.g. balance_converted_to_time,
--   self_topup_test, delegate_charge, radar_minute_consumption, voucher).

begin;

create or replace function public.apply_wallet_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_paid integer;
  v_bonus integer;
  v_amount_delta numeric := coalesce(new.amount, 0);
  v_paid_delta integer := coalesce(new.paid_minutes_delta, 0);
  v_bonus_delta integer := coalesce(new.bonus_minutes_delta, 0);
  v_type text := lower(coalesce(new.type, new.transaction_type, ''));
begin
  -- If the RPC created this audit transaction and managed wallet_accounts state directly,
  -- do NOT modify wallet_accounts again here (prevent double-counting or re-adding amounts).
  if v_type in (
    'balance_converted_to_time',
    'self_topup_test',
    'delegate_charge',
    'radar_minute_consumption',
    'voucher'
  ) then
    return new;
  end if;

  insert into public.wallet_accounts (profile_id)
  values (new.profile_id)
  on conflict (profile_id) do nothing;

  select balance, paid_minutes_remaining, bonus_minutes_remaining
  into v_balance, v_paid, v_bonus
  from public.wallet_accounts
  where profile_id = new.profile_id
  for update;

  if (v_balance + v_amount_delta) < 0 then
    raise exception 'wallet_balance_would_be_negative';
  end if;

  if (v_paid + v_paid_delta) < 0 then
    raise exception 'paid_minutes_would_be_negative';
  end if;

  if (v_bonus + v_bonus_delta) < 0 then
    raise exception 'bonus_minutes_would_be_negative';
  end if;

  update public.wallet_accounts
  set
    balance = balance + v_amount_delta,
    paid_minutes_remaining = paid_minutes_remaining + v_paid_delta,
    bonus_minutes_remaining = bonus_minutes_remaining + v_bonus_delta,
    updated_at = now()
  where profile_id = new.profile_id;

  return new;
end;
$$;

-- Clean up any accounts where balance was wrongly re-added by the trigger
update public.wallet_accounts
set balance = 0,
    updated_at = clock_timestamp()
where balance > 0;

notify pgrst, 'reload schema';

commit;
