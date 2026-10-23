-- Run in the Supabase SQL Editor after the base schema and vehicle-booking-signal.sql.
-- Adds quantity-aware availability and an atomic booking-capacity guard.

alter table public.vehicles
  add column if not exists fleet_quantity integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vehicles_fleet_quantity_check'
      and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles
      add constraint vehicles_fleet_quantity_check check (fleet_quantity > 0);
  end if;
end;
$$;

create or replace function public.vehicle_booking_peak_occupancy(
  p_vehicle_id bigint,
  p_pickup_date date,
  p_return_date date,
  p_exclude_booking_id bigint default null
)
returns integer
language sql
stable
set search_path = public
as $$
  with candidate_days as (
    select p_pickup_date as rental_day
    union
    select b.pickup_date
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.pickup_date >= p_pickup_date
      and b.pickup_date < p_return_date
      and b.return_date > p_pickup_date
      and b.booking_status in ('confirmed', 'ongoing')
      and (
        b.payment_status = 'completed'
        or (
          b.payment_status = 'pending'
          and b.created_at > now() - interval '10 minutes'
        )
      )
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  )
  select coalesce(max((
    select count(*)::integer
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.booking_status in ('confirmed', 'ongoing')
      and (
        b.payment_status = 'completed'
        or (
          b.payment_status = 'pending'
          and b.created_at > now() - interval '10 minutes'
        )
      )
      and b.pickup_date <= candidate_days.rental_day
      and b.return_date > candidate_days.rental_day
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
  )), 0)::integer
  from candidate_days;
$$;

revoke all on function public.vehicle_booking_peak_occupancy(bigint, date, date, bigint) from public, anon, authenticated;

create or replace function public.get_vehicle_booking_signal(
  p_vehicle_id bigint,
  p_pickup_date date,
  p_return_date date
)
returns table (
  has_conflict boolean,
  historical_signal_percent integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_conflict boolean;
  v_similar_pickup_days integer;
  v_fleet_quantity integer;
  v_vehicle_status text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to check booking dates.';
  end if;

  if p_pickup_date is null
    or p_return_date is null
    or p_vehicle_id is null
    or p_pickup_date < current_date
    or p_return_date <= p_pickup_date
    or p_pickup_date > current_date + 365 then
    raise exception 'Choose a valid future rental period within the next year.';
  end if;

  select v.fleet_quantity, v.status
  into v_fleet_quantity, v_vehicle_status
  from public.vehicles v
  where v.id = p_vehicle_id
    and v.status <> 'archived';
  if not found then
    raise exception 'Vehicle not found.';
  end if;

  v_has_conflict := v_vehicle_status <> 'available'
    or public.vehicle_booking_peak_occupancy(p_vehicle_id, p_pickup_date, p_return_date) >= v_fleet_quantity;

  select count(distinct b.pickup_date)::integer
  into v_similar_pickup_days
  from public.bookings b
  where b.vehicle_id = p_vehicle_id
    and b.booking_status in ('confirmed', 'ongoing', 'completed')
    and b.payment_status = 'completed'
    and b.pickup_date >= current_date - 365
    and b.pickup_date < current_date
    and extract(isodow from b.pickup_date) = extract(isodow from p_pickup_date);

  return query
  select
    v_has_conflict,
    case
      when v_similar_pickup_days >= 3
        then least(100, round(v_similar_pickup_days::numeric / 52 * 100)::integer)
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
  v_fleet_quantity integer;
  v_vehicle_status text;
begin
  if auth.uid() is null then
    raise exception 'Sign in to check booking dates.';
  end if;

  if p_pickup_date is null
    or p_return_date is null
    or p_vehicle_id is null
    or p_pickup_date < current_date
    or p_return_date <= p_pickup_date
    or p_pickup_date > current_date + 365 then
    raise exception 'Choose a valid future rental period within the next year.';
  end if;

  select v.fleet_quantity, v.status
  into v_fleet_quantity, v_vehicle_status
  from public.vehicles v
  where v.id = p_vehicle_id
    and v.status <> 'archived';
  if not found then
    raise exception 'Vehicle not found.';
  end if;

  return query
  with candidate_days as (
    select p_pickup_date as rental_day
    union
    select b.pickup_date
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.pickup_date >= p_pickup_date
      and b.pickup_date < p_return_date
      and b.return_date > p_pickup_date
      and b.booking_status in ('confirmed', 'ongoing')
      and (
        b.payment_status = 'completed'
        or (
          b.payment_status = 'pending'
          and b.created_at > now() - interval '10 minutes'
        )
      )
  ),
  counts_by_day as (
    select
      candidate_days.rental_day,
      count(*) filter (
        where b.booking_status = 'ongoing'
          and b.payment_status = 'completed'
      )::integer as using_units,
      count(*) filter (
        where b.booking_status = 'confirmed'
          and b.payment_status = 'completed'
      )::integer as reserved_units,
      count(*) filter (
        where b.booking_status = 'confirmed'
          and b.payment_status = 'pending'
          and b.created_at > now() - interval '10 minutes'
      )::integer as pending_units
    from candidate_days
    left join public.bookings b
      on b.vehicle_id = p_vehicle_id
      and b.booking_status in ('confirmed', 'ongoing')
      and (
        b.payment_status = 'completed'
        or (
          b.payment_status = 'pending'
          and b.created_at > now() - interval '10 minutes'
        )
      )
      and b.pickup_date <= candidate_days.rental_day
      and b.return_date > candidate_days.rental_day
    group by candidate_days.rental_day
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
    v_fleet_quantity,
    case
      when v_vehicle_status = 'available'
        then greatest(v_fleet_quantity - peak_day.using_units - peak_day.reserved_units - peak_day.pending_units, 0)
      else 0
    end
  from peak_day;
end;
$$;

revoke all on function public.get_vehicle_date_availability(bigint, date, date) from public, anon;
grant execute on function public.get_vehicle_date_availability(bigint, date, date) to authenticated;

create or replace function public.get_current_vehicle_availability()
returns table (
  vehicle_id bigint,
  fleet_quantity integer,
  available_quantity integer
)
language sql
security definer
set search_path = public
as $$
  select
    v.id,
    v.fleet_quantity,
    case
      when v.status = 'available'
        then greatest(
          v.fleet_quantity - public.vehicle_booking_peak_occupancy(v.id, current_date, current_date + 1),
          0
        )
      else 0
    end
  from public.vehicles v
  where v.status <> 'archived';
$$;

revoke all on function public.get_current_vehicle_availability() from public;
grant execute on function public.get_current_vehicle_availability() to anon, authenticated;

create or replace function public.guard_vehicle_fleet_quantity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_last_return_date date;
  v_peak_occupancy integer;
begin
  if new.fleet_quantity is not distinct from old.fleet_quantity then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('vehicle-fleet:' || new.id::text, 0));

  select max(b.return_date)
  into v_last_return_date
  from public.bookings b
  where b.vehicle_id = new.id
    and b.return_date > current_date
    and b.booking_status in ('confirmed', 'ongoing')
    and (
      b.payment_status = 'completed'
      or (
        b.payment_status = 'pending'
        and b.created_at > now() - interval '10 minutes'
      )
    );

  if new.fleet_quantity < old.fleet_quantity and v_last_return_date is not null then
    v_peak_occupancy := public.vehicle_booking_peak_occupancy(
      new.id,
      current_date,
      v_last_return_date
    );
    if v_peak_occupancy > new.fleet_quantity then
      raise exception using
        errcode = '23P01',
        message = 'Fleet quantity cannot be reduced below the number of vehicles already reserved.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_vehicle_fleet_quantity on public.vehicles;
create trigger guard_vehicle_fleet_quantity
before update of fleet_quantity on public.vehicles
for each row
execute function public.guard_vehicle_fleet_quantity();

create or replace function public.guard_vehicle_booking_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fleet_quantity integer;
  v_vehicle_status text;
  v_peak_occupancy integer;
begin
  if new.booking_status not in ('confirmed', 'ongoing')
    or new.payment_status = 'failed'
    or new.payment_status = 'refunded'
    or (
      new.payment_status = 'pending'
      and coalesce(new.created_at, now()) <= now() - interval '10 minutes'
    ) then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('vehicle-fleet:' || new.vehicle_id::text, 0));

  select v.fleet_quantity, v.status
  into v_fleet_quantity, v_vehicle_status
  from public.vehicles v
  where v.id = new.vehicle_id;
  if not found then
    raise exception 'Vehicle not found.';
  end if;
  if v_vehicle_status <> 'available' then
    raise exception using errcode = '23P01', message = 'This vehicle is not available for booking.';
  end if;

  v_peak_occupancy := public.vehicle_booking_peak_occupancy(
    new.vehicle_id,
    new.pickup_date,
    new.return_date,
    new.id
  );
  if v_peak_occupancy >= v_fleet_quantity then
    raise exception using
      errcode = '23P01',
      message = 'No vehicles are available for all selected dates. Choose another date range.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_vehicle_booking_capacity on public.bookings;
create trigger guard_vehicle_booking_capacity
before insert or update of vehicle_id, pickup_date, return_date, booking_status, payment_status
on public.bookings
for each row
execute function public.guard_vehicle_booking_capacity();

notify pgrst, 'reload schema';
