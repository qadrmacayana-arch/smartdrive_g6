-- Apply in Supabase SQL Editor to let admins view all customer wallet activity.
alter table public.wallet_balances enable row level security;
alter table public.wallet_transactions enable row level security;
grant select on public.wallet_balances, public.wallet_transactions to authenticated;

drop policy if exists "wallet_balances_select_admin" on public.wallet_balances;
create policy "wallet_balances_select_admin"
on public.wallet_balances
for select
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists "wallet_transactions_select_admin" on public.wallet_transactions;
create policy "wallet_transactions_select_admin"
on public.wallet_transactions
for select
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);
