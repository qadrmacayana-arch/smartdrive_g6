-- Add a dedicated license plate field while keeping existing vehicle IDs unchanged.
alter table public.vehicles
  add column if not exists plate_number text;

create unique index if not exists vehicles_plate_number_uidx
  on public.vehicles (upper(btrim(plate_number)))
  where plate_number is not null and btrim(plate_number) <> '';
