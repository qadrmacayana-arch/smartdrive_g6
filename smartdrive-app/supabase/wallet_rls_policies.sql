-- Run this once in Supabase SQL Editor for existing SmartDrive databases.
-- It fixes: new row violates row-level security policy for table "wallet_balances".

alter table public.wallet_balances enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_balances_select_own" on public.wallet_balances;
create policy "wallet_balances_select_own"
on public.wallet_balances for select
using (auth.uid() = user_id);

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own"
on public.wallet_transactions for select
using (auth.uid() = user_id);

drop policy if exists "wallet_balances_select_admin" on public.wallet_balances;
create policy "wallet_balances_select_admin"
on public.wallet_balances for select
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists "wallet_transactions_select_admin" on public.wallet_transactions;
create policy "wallet_transactions_select_admin"
on public.wallet_transactions for select
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists "wallet_balances_insert_own" on public.wallet_balances;
drop policy if exists "wallet_balances_update_own" on public.wallet_balances;
drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
