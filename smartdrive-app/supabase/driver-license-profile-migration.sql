alter table public.profiles
  add column if not exists renter_type text,
  add column if not exists driver_license_type text,
  add column if not exists driver_license_number text,
  add column if not exists driver_license_country text,
  add column if not exists driver_license_expiry date,
  add column if not exists license_verification_status text not null default 'not_provided',
  add column if not exists license_reviewed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_renter_type_check,
  add constraint profiles_renter_type_check
    check (renter_type is null or renter_type in ('local', 'foreign-tourist')),
  drop constraint if exists profiles_license_verification_status_check,
  add constraint profiles_license_verification_status_check
    check (license_verification_status in ('not_provided', 'pending', 'verified', 'rejected'));

create or replace function public.guard_profile_license_review()
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
  license_details_changed boolean :=
    new.renter_type is distinct from old.renter_type
    or new.driver_license_type is distinct from old.driver_license_type
    or new.driver_license_number is distinct from old.driver_license_number
    or new.driver_license_country is distinct from old.driver_license_country
    or new.driver_license_expiry is distinct from old.driver_license_expiry;
begin
  if is_trusted_role then
    return new;
  end if;

  if not is_admin and (
    new.license_verification_status is distinct from old.license_verification_status
    or new.license_reviewed_at is distinct from old.license_reviewed_at
  ) then
    raise exception 'Only staff can update driver license review status.';
  end if;

  if license_details_changed then
    new.license_verification_status :=
      case
        when new.driver_license_type is null
          and new.driver_license_number is null
          and new.driver_license_country is null
          and new.driver_license_expiry is null
        then 'not_provided'
        else 'pending'
      end;
    new.license_reviewed_at := null;
  elsif is_admin and new.license_verification_status is distinct from old.license_verification_status then
    new.license_reviewed_at :=
      case when new.license_verification_status = 'pending' then null else now() end;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_license_review on public.profiles;
create trigger trg_guard_profile_license_review
  before update on public.profiles
  for each row execute function public.guard_profile_license_review();

notify pgrst, 'reload schema';
