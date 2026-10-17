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
  with check (
    user_id = (select auth.uid())
    and payment_status = 'pending'
    and payment_method = 'srpoints'
  );

drop policy if exists "Customers can update their own bookings" on public.bookings;
create policy "Customers can update their own bookings"
  on public.bookings
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Admins can read all bookings" on public.bookings;
create policy "Admins can read all bookings"
  on public.bookings
  for select
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

drop policy if exists "Admins can update all bookings" on public.bookings;
create policy "Admins can update all bookings"
  on public.bookings
  for update
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  )
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );

drop policy if exists "Admins can delete bookings" on public.bookings;
create policy "Admins can delete bookings"
  on public.bookings
  for delete
  to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
  );
