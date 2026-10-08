-- Run this once in Supabase SQL Editor for existing SmartDrive databases.
-- It fixes: new row violates row-level security policy for table "wallet_balances".

alter table public.wallet_balances enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_balances_select_own" on public.wallet_balances;
create policy "wallet_balances_select_own"
on public.wallet_balances for select
using (auth.uid() = user_id);

drop policy if exists "wallet_balances_insert_own" on public.wallet_balances;
create policy "wallet_balances_insert_own"
on public.wallet_balances for insert
with check (auth.uid() = user_id);

drop policy if exists "wallet_balances_update_own" on public.wallet_balances;
create policy "wallet_balances_update_own"
on public.wallet_balances for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own"
on public.wallet_transactions for select
using (auth.uid() = user_id);

drop policy if exists "wallet_transactions_insert_own" on public.wallet_transactions;
create policy "wallet_transactions_insert_own"
on public.wallet_transactions for insert
with check (auth.uid() = user_id);
