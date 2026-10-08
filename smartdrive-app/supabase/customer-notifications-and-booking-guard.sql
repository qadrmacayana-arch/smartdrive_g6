-- Run in the Supabase SQL Editor to enable public active promos, live updates,
-- and server-side prevention of duplicate ongoing vehicle bookings.

drop policy if exists "discount_codes_select_active" on public.discount_codes;
create policy "discount_codes_select_active"
on public.discount_codes for select
using (is_active = true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vehicles'
  ) then
    alter publication supabase_realtime add table public.vehicles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'discount_codes'
  ) then
    alter publication supabase_realtime add table public.discount_codes;
  end if;
end;
$$;

create or replace function public.prevent_duplicate_ongoing_vehicle_booking()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtext(new.user_id::text),
    hashtext(new.vehicle_id::text)
  );

  if exists (
    select 1
    from public.bookings b
    where b.user_id = new.user_id
      and b.vehicle_id = new.vehicle_id
      and b.booking_status = 'ongoing'
  ) then
    raise exception using
      errcode = '23505',
      message = 'You already have an ongoing booking for this vehicle.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_duplicate_ongoing_vehicle_booking on public.bookings;
create trigger prevent_duplicate_ongoing_vehicle_booking
before insert on public.bookings
for each row
execute function public.prevent_duplicate_ongoing_vehicle_booking();
