-- Run after vehicle-demo-plates-booking-snapshot.sql.
-- Events expose only vehicle/date availability changes, never booking or customer details.
create table if not exists public.vehicle_availability_events (
  id bigint generated always as identity primary key,
  vehicle_id bigint not null references public.vehicles(id) on delete cascade,
  pickup_date date not null,
  return_date date not null,
  event_type text not null check (event_type in ('reserved', 'released')),
  created_at timestamptz not null default now(),
  check (return_date > pickup_date)
);
create index if not exists vehicle_availability_events_vehicle_created_idx
  on public.vehicle_availability_events (vehicle_id, created_at desc);
create index if not exists vehicle_availability_events_created_idx
  on public.vehicle_availability_events (created_at);

alter table public.vehicle_availability_events enable row level security;
revoke all on public.vehicle_availability_events from anon, authenticated;
grant select on public.vehicle_availability_events to authenticated;

drop policy if exists vehicle_availability_events_select_authenticated
  on public.vehicle_availability_events;
create policy vehicle_availability_events_select_authenticated
on public.vehicle_availability_events for select to authenticated
using (true);

create or replace function public.publish_vehicle_hold_availability_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_vehicle_id bigint;
begin
  select vehicle_id
  into event_vehicle_id
  from public.vehicle_units
  where id = new.vehicle_unit_id;

  if not found then
    raise exception 'Could not find the vehicle for an availability reservation.';
  end if;

  if tg_op = 'UPDATE'
    and row(old.vehicle_unit_id, old.pickup_date, old.return_date, old.expires_at)
      is not distinct from
        row(new.vehicle_unit_id, new.pickup_date, new.return_date, new.expires_at) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    select vehicle_id
    into event_vehicle_id
    from public.vehicle_units
    where id = old.vehicle_unit_id;

    insert into public.vehicle_availability_events (
      vehicle_id, pickup_date, return_date, event_type
    )
    values (event_vehicle_id, old.pickup_date, old.return_date, 'released');

    select vehicle_id
    into event_vehicle_id
    from public.vehicle_units
    where id = new.vehicle_unit_id;
  end if;

  insert into public.vehicle_availability_events (
    vehicle_id, pickup_date, return_date, event_type
  )
  values (event_vehicle_id, new.pickup_date, new.return_date, 'reserved');

  delete from public.vehicle_availability_events
  where created_at < now() - interval '30 days';

  return new;
end;
$$;

revoke all on function public.publish_vehicle_hold_availability_event() from public, anon, authenticated;

drop trigger if exists publish_vehicle_hold_availability_event
  on public.vehicle_unit_holds;
create trigger publish_vehicle_hold_availability_event
after insert or update on public.vehicle_unit_holds
for each row execute function public.publish_vehicle_hold_availability_event();

create or replace function public.publish_booking_availability_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if row(
    old.vehicle_id, old.pickup_date, old.return_date, old.booking_status, old.payment_status
  ) is not distinct from row(
    new.vehicle_id, new.pickup_date, new.return_date, new.booking_status, new.payment_status
  ) then
    return new;
  end if;

  if row(old.vehicle_id, old.pickup_date, old.return_date)
    is distinct from row(new.vehicle_id, new.pickup_date, new.return_date) then
    insert into public.vehicle_availability_events (
      vehicle_id, pickup_date, return_date, event_type
    )
    values (old.vehicle_id, old.pickup_date, old.return_date, 'released');
  end if;

  insert into public.vehicle_availability_events (
    vehicle_id, pickup_date, return_date, event_type
  )
  values (
    new.vehicle_id,
    new.pickup_date,
    new.return_date,
    case
      when new.booking_status in ('confirmed', 'ongoing')
        and new.payment_status in ('completed', 'pending') then 'reserved'
      else 'released'
    end
  );

  delete from public.vehicle_availability_events
  where created_at < now() - interval '30 days';

  return new;
end;
$$;

revoke all on function public.publish_booking_availability_event() from public, anon, authenticated;

drop trigger if exists publish_booking_availability_event on public.bookings;
create trigger publish_booking_availability_event
after update of vehicle_id, pickup_date, return_date, booking_status, payment_status
on public.bookings
for each row execute function public.publish_booking_availability_event();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'vehicle_availability_events'
    ) then
    alter publication supabase_realtime add table public.vehicle_availability_events;
  end if;
end;
$$;
