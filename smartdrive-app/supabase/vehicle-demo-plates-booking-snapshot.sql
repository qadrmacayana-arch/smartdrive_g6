-- Assign stable fictional demo plates and preserve each booking's plate snapshot.
alter table public.vehicles
  add column if not exists plate_number text;

do $$
declare
  vehicle_row record;
  candidate text;
  attempts integer;
begin
  for vehicle_row in
    select id
    from public.vehicles
    where plate_number is null or btrim(plate_number) = ''
    order by id
  loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      candidate := 'SD-DEMO-' || upper(substr(md5(random()::text || clock_timestamp()::text || vehicle_row.id::text), 1, 7));

      exit when not exists (
        select 1
        from public.vehicles
        where upper(btrim(plate_number)) = candidate
      );

      if attempts >= 100 then
        raise exception 'Could not generate a unique demo plate for vehicle %.', vehicle_row.id;
      end if;
    end loop;

    update public.vehicles
    set plate_number = candidate
    where id = vehicle_row.id;
  end loop;
end $$;

create unique index if not exists vehicles_plate_number_uidx
  on public.vehicles (upper(btrim(plate_number)))
  where plate_number is not null and btrim(plate_number) <> '';

alter table public.bookings
  add column if not exists vehicle_plate_number text;

update public.bookings booking
set vehicle_plate_number = vehicle.plate_number
from public.vehicles vehicle
where booking.vehicle_id = vehicle.id
  and (booking.vehicle_plate_number is null or btrim(booking.vehicle_plate_number) = '');
