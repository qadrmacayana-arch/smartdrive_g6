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

  if not exists (
    select 1
    from public.vehicles v
    where v.id = p_vehicle_id
      and v.status <> 'archived'
  ) then
    raise exception 'Vehicle not found.';
  end if;

  select exists (
    select 1
    from public.bookings b
    where b.vehicle_id = p_vehicle_id
      and b.booking_status in ('confirmed', 'ongoing')
      and b.payment_status in ('pending', 'completed')
      and b.pickup_date < p_return_date
      and b.return_date > p_pickup_date
  ) into v_has_conflict;

  select count(distinct b.pickup_date)::integer
  into v_similar_pickup_days
  from public.bookings b
  where b.vehicle_id = p_vehicle_id
    and b.booking_status in ('confirmed', 'ongoing', 'completed')
    and b.payment_status in ('pending', 'completed')
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
