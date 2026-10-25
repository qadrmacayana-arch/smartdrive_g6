-- Give every physical fleet unit its own plate and reserve a specific unit per booking.
-- Run after the base schema and vehicle-fleet-quantity.sql in the Supabase SQL Editor.
create table if not exists public.vehicle_units (
  id bigint generated always as identity primary key,
  vehicle_id bigint not null references public.vehicles(id) on delete cascade,
  unit_number integer not null check (unit_number > 0),
  plate_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint vehicle_units_vehicle_number_key unique (vehicle_id, unit_number)
);

create unique index if not exists vehicle_units_plate_number_uidx
  on public.vehicle_units (upper(btrim(plate_number)));
create index if not exists vehicle_units_vehicle_active_idx
  on public.vehicle_units (vehicle_id, is_active, unit_number);

alter table public.vehicles
  add column if not exists plate_number text;
alter table public.vehicles
  alter column plate_number drop not null;

create or replace function public.generate_vehicle_demo_plate()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
  attempts integer := 0;
begin
  perform pg_advisory_xact_lock(hashtextextended('vehicle-unit-plate-generation', 0));
  loop
    attempts := attempts + 1;
    candidate := 'SD-DEMO-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
    exit when not exists (
      select 1 from public.vehicle_units
      where upper(btrim(plate_number)) = candidate
    );
    if attempts >= 100 then
      raise exception 'Could not generate a unique demo plate. Please try again.';
    end if;
  end loop;
  return candidate;
end;
$$;

revoke all on function public.generate_vehicle_demo_plate() from public, anon, authenticated;
grant execute on function public.generate_vehicle_demo_plate() to service_role;

-- Preserve an existing listing plate as unit 1; create separate plates for remaining units.
do $$
declare
  vehicle_row record;
  unit_number integer;
  unit_plate text;
begin
  for vehicle_row in
    select id, fleet_quantity, plate_number
    from public.vehicles
    order by id
  loop
    for unit_number in 1..greatest(vehicle_row.fleet_quantity, 1) loop
      if exists (
        select 1 from public.vehicle_units
        where vehicle_id = vehicle_row.id and vehicle_units.unit_number = unit_number
      ) then
        continue;
      end if;

      unit_plate := case
        when unit_number = 1 and nullif(btrim(vehicle_row.plate_number), '') is not null
          then upper(btrim(vehicle_row.plate_number))
        else public.generate_vehicle_demo_plate()
      end;

      if exists (
        select 1 from public.vehicle_units
        where upper(btrim(plate_number)) = unit_plate
      ) then
        unit_plate := public.generate_vehicle_demo_plate();
      end if;

      insert into public.vehicle_units(vehicle_id, unit_number, plate_number)
      values (vehicle_row.id, unit_number, unit_plate)
      on conflict (vehicle_id, unit_number) do nothing;
    end loop;
  end loop;
end $$;

alter table public.bookings
  add column if not exists vehicle_unit_id bigint
  references public.vehicle_units(id) on delete set null;
alter table public.bookings
  add column if not exists vehicle_plate_number text;

-- Reassign old listing-level snapshots to distinct available physical units.
do $$
declare
  booking_row record;
  unit_row record;
begin
  for booking_row in
    select id, vehicle_id, pickup_date, return_date, booking_status, payment_status
    from public.bookings
    where vehicle_unit_id is null
    order by pickup_date, created_at, id
  loop
    select unit.id, unit.plate_number
    into unit_row
    from public.vehicle_units unit
    where unit.vehicle_id = booking_row.vehicle_id
      and not exists (
        select 1
        from public.bookings other_booking
        where other_booking.vehicle_unit_id = unit.id
          and other_booking.id <> booking_row.id
          and other_booking.booking_status <> 'cancelled'
          and other_booking.payment_status not in ('failed', 'refunded')
          and other_booking.pickup_date < booking_row.return_date
          and other_booking.return_date > booking_row.pickup_date
      )
    order by unit.unit_number
    limit 1;

    if found then
      update public.bookings
      set vehicle_unit_id = unit_row.id,
          vehicle_plate_number = unit_row.plate_number
      where id = booking_row.id;
    end if;
  end loop;
end $$;

create table if not exists public.vehicle_unit_holds (
  reservation_key text primary key,
  vehicle_unit_id bigint not null references public.vehicle_units(id) on delete cascade,
  pickup_date date not null,
  return_date date not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (return_date > pickup_date)
);
create index if not exists vehicle_unit_holds_unit_dates_idx
  on public.vehicle_unit_holds (vehicle_unit_id, pickup_date, return_date, expires_at);

alter table public.vehicle_units enable row level security;
alter table public.vehicle_unit_holds enable row level security;
revoke all on public.vehicle_units, public.vehicle_unit_holds from anon, authenticated;
grant select, update on public.vehicle_units to authenticated;
grant all on public.vehicle_units, public.vehicle_unit_holds to service_role;

drop policy if exists vehicle_units_select_admin on public.vehicle_units;
create policy vehicle_units_select_admin
on public.vehicle_units for select to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
);

drop policy if exists vehicle_units_update_admin on public.vehicle_units;
create policy vehicle_units_update_admin
on public.vehicle_units for update to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or auth.jwt() -> 'app_metadata' ->> 'is_admin' = 'true'
);

create or replace function public.sync_vehicle_units_to_fleet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  unit_row record;
begin
  perform pg_advisory_xact_lock(hashtextextended('vehicle-fleet:' || new.id::text, 0));

  select count(*)::integer into active_count
  from public.vehicle_units
  where vehicle_id = new.id and is_active;

  if active_count < new.fleet_quantity then
    for unit_row in
      select id
      from public.vehicle_units
      where vehicle_id = new.id and not is_active
        and not exists (
          select 1 from public.bookings booking
          where booking.vehicle_unit_id = vehicle_units.id
            and booking.booking_status in ('confirmed', 'ongoing')
            and (
              booking.payment_status = 'completed'
              or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
            )
            and booking.return_date > current_date
        )
      order by unit_number
      limit new.fleet_quantity - active_count
      for update
    loop
      update public.vehicle_units set is_active = true where id = unit_row.id;
      active_count := active_count + 1;
    end loop;

    while active_count < new.fleet_quantity loop
      insert into public.vehicle_units(vehicle_id, unit_number, plate_number, is_active)
      select
        new.id,
        coalesce(max(unit_number), 0) + 1,
        public.generate_vehicle_demo_plate(),
        true
      from public.vehicle_units
      where vehicle_id = new.id;
      active_count := active_count + 1;
    end loop;
  elsif active_count > new.fleet_quantity then
    for unit_row in
      select unit.id
      from public.vehicle_units unit
      where unit.vehicle_id = new.id and unit.is_active
        and not exists (
          select 1 from public.bookings booking
          where booking.vehicle_unit_id = unit.id
            and booking.booking_status in ('confirmed', 'ongoing')
            and (
              booking.payment_status = 'completed'
              or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
            )
            and booking.return_date > current_date
        )
        and not exists (
          select 1 from public.vehicle_unit_holds hold
          where hold.vehicle_unit_id = unit.id and hold.expires_at > now()
        )
      order by unit.unit_number desc
      limit active_count - new.fleet_quantity
      for update
    loop
      update public.vehicle_units set is_active = false where id = unit_row.id;
      active_count := active_count - 1;
    end loop;

    if active_count <> new.fleet_quantity then
      raise exception 'Fleet quantity cannot be reduced because reserved units are still assigned.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_vehicle_units_to_fleet on public.vehicles;
create trigger sync_vehicle_units_to_fleet
after insert or update of fleet_quantity on public.vehicles
for each row execute function public.sync_vehicle_units_to_fleet();

create or replace function public.reserve_vehicle_unit(
  p_vehicle_id bigint,
  p_pickup_date date,
  p_return_date date,
  p_reservation_key text
)
returns table (vehicle_unit_id bigint, plate_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_unit public.vehicle_units%rowtype;
  existing_hold public.vehicle_unit_holds%rowtype;
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Sign in before reserving a vehicle unit.';
  end if;
  if p_vehicle_id is null
    or p_pickup_date is null
    or p_return_date is null
    or p_pickup_date < current_date
    or p_return_date <= p_pickup_date
    or p_pickup_date > current_date + 365
    or p_reservation_key is null
    or length(trim(p_reservation_key)) < 8
    or length(p_reservation_key) > 120 then
    raise exception 'Vehicle unit reservation details are invalid.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('vehicle-fleet:' || p_vehicle_id::text, 0));
  delete from public.vehicle_unit_holds hold
  using public.vehicle_units unit
  where hold.vehicle_unit_id = unit.id
    and unit.vehicle_id = p_vehicle_id
    and hold.expires_at <= now();

  select * into existing_hold
  from public.vehicle_unit_holds
  where reservation_key = p_reservation_key and expires_at > now();
  if found then
    if existing_hold.pickup_date <> p_pickup_date
      or existing_hold.return_date <> p_return_date then
      raise exception 'Reservation key is already in use for different booking dates.';
    end if;
    select unit.* into selected_unit
    from public.vehicle_units unit
    where unit.id = existing_hold.vehicle_unit_id
      and unit.vehicle_id = p_vehicle_id
      and unit.is_active;
    if not found then raise exception 'The reserved fleet unit is no longer active.'; end if;
    return query select selected_unit.id, selected_unit.plate_number;
    return;
  end if;

  if not exists (
    select 1 from public.vehicles vehicle
    where vehicle.id = p_vehicle_id and vehicle.status = 'available'
  ) then
    raise exception 'This vehicle is not available for booking.';
  end if;

  select unit.* into selected_unit
  from public.vehicle_units unit
  where unit.vehicle_id = p_vehicle_id
    and unit.is_active
    and not exists (
      select 1 from public.bookings booking
      where booking.vehicle_unit_id = unit.id
        and booking.booking_status in ('confirmed', 'ongoing')
        and (
          booking.payment_status = 'completed'
          or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
        )
        and booking.pickup_date < p_return_date
        and booking.return_date > p_pickup_date
    )
    and not exists (
      select 1 from public.vehicle_unit_holds hold
      where hold.vehicle_unit_id = unit.id
        and hold.expires_at > now()
        and hold.pickup_date < p_return_date
        and hold.return_date > p_pickup_date
    )
    and not exists (
      select 1 from public.bookings booking
      where booking.vehicle_id = p_vehicle_id
        and booking.vehicle_unit_id is null
        and booking.booking_status in ('confirmed', 'ongoing')
        and (
          booking.payment_status = 'completed'
          or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
        )
        and booking.pickup_date < p_return_date
        and booking.return_date > p_pickup_date
    )
  order by unit.unit_number
  limit 1
  for update;

  if not found then
    raise exception 'No fleet unit is available for the selected dates.';
  end if;

  insert into public.vehicle_unit_holds(
    reservation_key, vehicle_unit_id, pickup_date, return_date, expires_at
  ) values (
    p_reservation_key, selected_unit.id, p_pickup_date, p_return_date, now() + interval '45 minutes'
  );

  return query select selected_unit.id, selected_unit.plate_number;
end;
$$;

revoke all on function public.reserve_vehicle_unit(bigint, date, date, text) from public, anon;
grant execute on function public.reserve_vehicle_unit(bigint, date, date, text) to authenticated, service_role;

create or replace function public.validate_booking_vehicle_unit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_unit public.vehicle_units%rowtype;
  reserved_hold public.vehicle_unit_holds%rowtype;
begin
  if new.vehicle_unit_id is null then
    raise exception 'A specific fleet unit must be reserved before confirming this booking.';
  end if;

  select * into reserved_hold
  from public.vehicle_unit_holds hold
  where hold.reservation_key = new.reference_number
    and hold.vehicle_unit_id = new.vehicle_unit_id
    and hold.pickup_date = new.pickup_date
    and hold.return_date = new.return_date
    and hold.expires_at > now()
  for update;
  if not found then
    raise exception 'The fleet unit reservation expired. Please restart checkout.';
  end if;

  select * into assigned_unit
  from public.vehicle_units unit
  where unit.id = new.vehicle_unit_id
    and unit.vehicle_id = new.vehicle_id
    and unit.is_active;
  if not found then
    raise exception 'The reserved fleet unit is no longer active.';
  end if;

  new.vehicle_plate_number := assigned_unit.plate_number;
  return new;
end;
$$;

create or replace function public.release_booking_vehicle_unit_hold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.vehicle_unit_holds
  where reservation_key = new.reference_number;
  return new;
end;
$$;

drop trigger if exists validate_booking_vehicle_unit on public.bookings;
create trigger validate_booking_vehicle_unit
before insert on public.bookings
for each row execute function public.validate_booking_vehicle_unit();

drop trigger if exists release_booking_vehicle_unit_hold on public.bookings;
create trigger release_booking_vehicle_unit_hold
after insert on public.bookings
for each row execute function public.release_booking_vehicle_unit_hold();

create or replace function public.get_vehicle_booking_signal(
  p_vehicle_id bigint,
  p_pickup_date date,
  p_return_date date
)
returns table (has_conflict boolean, historical_signal_percent integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  vehicle_status text;
  similar_pickup_days integer;
begin
  if auth.uid() is null then raise exception 'Sign in to check booking dates.'; end if;
  if p_pickup_date is null or p_return_date is null or p_vehicle_id is null
    or p_pickup_date < current_date or p_return_date <= p_pickup_date
    or p_pickup_date > current_date + 365 then
    raise exception 'Choose a valid future rental period within the next year.';
  end if;

  select vehicle.status into vehicle_status
  from public.vehicles vehicle
  where vehicle.id = p_vehicle_id and vehicle.status <> 'archived';
  if not found then raise exception 'Vehicle not found.'; end if;

  select count(distinct booking.pickup_date)::integer
  into similar_pickup_days
  from public.bookings booking
  where booking.vehicle_id = p_vehicle_id
    and booking.booking_status in ('confirmed', 'ongoing', 'completed')
    and booking.payment_status = 'completed'
    and booking.pickup_date >= current_date - 365
    and booking.pickup_date < current_date
    and extract(isodow from booking.pickup_date) = extract(isodow from p_pickup_date);

  return query
  select
    vehicle_status <> 'available'
      or not exists (
        select 1
        from public.vehicle_units unit
        where unit.vehicle_id = p_vehicle_id and unit.is_active
          and not exists (
            select 1 from public.bookings unassigned_booking
            where unassigned_booking.vehicle_id = p_vehicle_id
              and unassigned_booking.vehicle_unit_id is null
              and unassigned_booking.booking_status in ('confirmed', 'ongoing')
              and (
                unassigned_booking.payment_status = 'completed'
                or (
                  unassigned_booking.payment_status = 'pending'
                  and unassigned_booking.created_at > now() - interval '10 minutes'
                )
              )
              and unassigned_booking.pickup_date < p_return_date
              and unassigned_booking.return_date > p_pickup_date
          )
          and not exists (
            select 1 from public.bookings booking
            where booking.vehicle_unit_id = unit.id
              and booking.booking_status in ('confirmed', 'ongoing')
              and (
                booking.payment_status = 'completed'
                or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
              )
              and booking.pickup_date < p_return_date
              and booking.return_date > p_pickup_date
          )
          and not exists (
            select 1 from public.vehicle_unit_holds hold
            where hold.vehicle_unit_id = unit.id and hold.expires_at > now()
              and hold.pickup_date < p_return_date and hold.return_date > p_pickup_date
          )
      ),
    case
      when similar_pickup_days >= 3
        then least(100, round(similar_pickup_days::numeric / 52 * 100)::integer)
      else null
    end;
end;
$$;

revoke all on function public.get_vehicle_booking_signal(bigint, date, date) from public, anon;
grant execute on function public.get_vehicle_booking_signal(bigint, date, date) to authenticated;

create or replace function public.get_vehicle_date_availability(
  p_vehicle_id bigint,
  p_pickup_date date,
  p_return_date date
)
returns table (
  using_count integer,
  reserved_count integer,
  pending_count integer,
  total_quantity integer,
  available_quantity integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  vehicle_status text;
  active_units integer;
begin
  if auth.uid() is null then raise exception 'Sign in to check booking dates.'; end if;
  if p_pickup_date is null or p_return_date is null or p_vehicle_id is null
    or p_pickup_date < current_date or p_return_date <= p_pickup_date
    or p_pickup_date > current_date + 365 then
    raise exception 'Choose a valid future rental period within the next year.';
  end if;

  select vehicle.status into vehicle_status
  from public.vehicles vehicle
  where vehicle.id = p_vehicle_id and vehicle.status <> 'archived';
  if not found then raise exception 'Vehicle not found.'; end if;

  select count(*)::integer into active_units
  from public.vehicle_units unit
  where unit.vehicle_id = p_vehicle_id and unit.is_active;

  return query
  with candidate_days as (
    select p_pickup_date as rental_day
    union
    select booking.pickup_date
    from public.bookings booking
    where booking.vehicle_id = p_vehicle_id
      and booking.pickup_date >= p_pickup_date
      and booking.pickup_date < p_return_date
      and booking.return_date > p_pickup_date
      and booking.booking_status in ('confirmed', 'ongoing')
      and (
        booking.payment_status = 'completed'
        or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
      )
    union
    select hold.pickup_date
    from public.vehicle_unit_holds hold
    join public.vehicle_units unit on unit.id = hold.vehicle_unit_id
    where unit.vehicle_id = p_vehicle_id
      and hold.expires_at > now()
      and hold.pickup_date >= p_pickup_date
      and hold.pickup_date < p_return_date
      and hold.return_date > p_pickup_date
  ),
  counts_by_day as (
    select
      day.rental_day,
      count(distinct booking.id) filter (
        where booking.booking_status = 'ongoing' and booking.payment_status = 'completed'
      )::integer as using_units,
      count(distinct booking.id) filter (
        where booking.booking_status = 'confirmed' and booking.payment_status = 'completed'
      )::integer as reserved_units,
      (
        count(distinct booking.id) filter (
          where booking.booking_status = 'confirmed'
            and booking.payment_status = 'pending'
            and booking.created_at > now() - interval '10 minutes'
        )
        + count(distinct hold.reservation_key)
      )::integer as pending_units
    from candidate_days day
    left join public.bookings booking
      on booking.vehicle_id = p_vehicle_id
      and booking.booking_status in ('confirmed', 'ongoing')
      and (
        booking.payment_status = 'completed'
        or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
      )
      and booking.pickup_date <= day.rental_day
      and booking.return_date > day.rental_day
    left join public.vehicle_unit_holds hold
      on hold.expires_at > now()
      and hold.pickup_date <= day.rental_day
      and hold.return_date > day.rental_day
      and exists (
        select 1 from public.vehicle_units unit
        where unit.id = hold.vehicle_unit_id and unit.vehicle_id = p_vehicle_id
      )
    group by day.rental_day
  ),
  peak_day as (
    select *
    from counts_by_day
    order by using_units + reserved_units + pending_units desc, rental_day
    limit 1
  )
  select
    peak_day.using_units,
    peak_day.reserved_units,
    peak_day.pending_units,
    active_units,
    case when vehicle_status = 'available'
      then greatest(active_units - peak_day.using_units - peak_day.reserved_units - peak_day.pending_units, 0)
      else 0
    end
  from peak_day;
end;
$$;

revoke all on function public.get_vehicle_date_availability(bigint, date, date) from public, anon;
grant execute on function public.get_vehicle_date_availability(bigint, date, date) to authenticated;

create or replace function public.get_current_vehicle_availability()
returns table (vehicle_id bigint, fleet_quantity integer, available_quantity integer)
language sql
security definer
set search_path = public
as $$
  select
    vehicle.id,
    count(unit.id)::integer,
    case when vehicle.status = 'available' then count(unit.id) filter (
      where not exists (
        select 1 from public.bookings booking
        where booking.vehicle_unit_id = unit.id
          and booking.booking_status in ('confirmed', 'ongoing')
          and (
            booking.payment_status = 'completed'
            or (booking.payment_status = 'pending' and booking.created_at > now() - interval '10 minutes')
          )
          and booking.pickup_date <= current_date
          and booking.return_date > current_date
      )
      and not exists (
        select 1 from public.bookings unassigned_booking
        where unassigned_booking.vehicle_id = vehicle.id
          and unassigned_booking.vehicle_unit_id is null
          and unassigned_booking.booking_status in ('confirmed', 'ongoing')
          and (
            unassigned_booking.payment_status = 'completed'
            or (
              unassigned_booking.payment_status = 'pending'
              and unassigned_booking.created_at > now() - interval '10 minutes'
            )
          )
          and unassigned_booking.pickup_date <= current_date
          and unassigned_booking.return_date > current_date
      )
      and not exists (
        select 1 from public.vehicle_unit_holds hold
        where hold.vehicle_unit_id = unit.id and hold.expires_at > now()
          and hold.pickup_date <= current_date and hold.return_date > current_date
      )
    )::integer else 0 end
  from public.vehicles vehicle
  left join public.vehicle_units unit
    on unit.vehicle_id = vehicle.id and unit.is_active
  where vehicle.status <> 'archived'
  group by vehicle.id, vehicle.status;
$$;

revoke all on function public.get_current_vehicle_availability() from public;
grant execute on function public.get_current_vehicle_availability() to anon, authenticated;

notify pgrst, 'reload schema';
