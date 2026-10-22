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

create or replace function public.guard_booking_status_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  caller_role text := coalesce(auth.role(), current_user);
  is_trusted_role boolean := caller_role in ('service_role', 'postgres', 'supabase_admin');
  is_admin boolean :=
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
begin
  if is_trusted_role or new.booking_status is not distinct from old.booking_status then
    return new;
  end if;

  if is_admin then
    if new.booking_status = 'cancelled' or old.booking_status = 'cancelled' then
      raise exception 'Only the customer can cancel a booking, and customer cancellations cannot be reversed by an admin.';
    end if;
    if old.booking_status is distinct from 'ongoing' or new.booking_status is distinct from 'completed' then
      raise exception 'Admins can only mark an in-progress booking completed after confirming the vehicle was returned.';
    end if;
  elsif auth.uid() = old.user_id then
    if old.booking_status is distinct from 'confirmed' or new.booking_status is distinct from 'cancelled' then
      raise exception 'Customers can only cancel their own confirmed bookings.';
    end if;
  else
    raise exception 'You are not authorized to change this booking status.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_booking_status_changes on public.bookings;
create trigger trg_guard_booking_status_changes
  before update of booking_status on public.bookings
  for each row execute function public.guard_booking_status_changes();

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
