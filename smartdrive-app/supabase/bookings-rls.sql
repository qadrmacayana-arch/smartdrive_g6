alter table public.bookings enable row level security;

drop policy if exists "Customers can read their own bookings" on public.bookings;
create policy "Customers can read their own bookings"
  on public.bookings
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Customers can create their own bookings" on public.bookings;
create policy "Customers can create their own bookings"
  on public.bookings
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Customers can update their own bookings" on public.bookings;
create policy "Customers can update their own bookings"
  on public.bookings
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
