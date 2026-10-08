alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists surname text,
  add column if not exists suffix text,
  add column if not exists birthday date,
  add column if not exists address text,
  add column if not exists region text,
  add column if not exists region_name text,
  add column if not exists province text,
  add column if not exists province_name text,
  add column if not exists city text,
  add column if not exists city_name text,
  add column if not exists barangay text,
  add column if not exists barangay_name text,
  add column if not exists gender text default 'prefer_not_to_say',
  add column if not exists phone text,
  add column if not exists member_type text default 'Premium',
  add column if not exists login_source text default 'web',
  add column if not exists registration_date timestamptz default now(),
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Google users complete these profile fields after OAuth sign-in.
alter table public.profiles
  alter column first_name drop not null,
  alter column middle_name drop not null,
  alter column surname drop not null,
  alter column suffix drop not null,
  alter column birthday drop not null,
  alter column address drop not null,
  alter column region drop not null,
  alter column region_name drop not null,
  alter column province drop not null,
  alter column province_name drop not null,
  alter column city drop not null,
  alter column city_name drop not null,
  alter column barangay drop not null,
  alter column barangay_name drop not null,
  alter column phone drop not null;

-- Remove any older copies before installing the repaired trigger.
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_gender text;
  metadata_login_source text;
  metadata_birthday date;
begin
  metadata_gender := nullif(new.raw_user_meta_data ->> 'gender', '');
  if metadata_gender is null
    or metadata_gender not in ('male', 'female', 'other', 'prefer_not_to_say') then
    metadata_gender := 'prefer_not_to_say';
  end if;

  metadata_login_source := nullif(new.raw_user_meta_data ->> 'login_source', '');
  if metadata_login_source is null
    or metadata_login_source not in ('web', 'app', 'unknown') then
    metadata_login_source := 'web';
  end if;

  if coalesce(new.raw_user_meta_data ->> 'birthday', '') ~ '^\d{4}-\d{2}-\d{2}$' then
    begin
      metadata_birthday := (new.raw_user_meta_data ->> 'birthday')::date;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        metadata_birthday := null;
    end;
  end if;

  insert into public.profiles (
    id, email, full_name, first_name, middle_name, surname, suffix, birthday, address,
    region, region_name, province, province_name, city, city_name, barangay,
    barangay_name, gender, phone, member_type, login_source, registration_date,
    is_active, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'first_name', ''),
      nullif(new.raw_user_meta_data ->> 'given_name', ''),
      split_part(
        coalesce(
          nullif(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.raw_user_meta_data ->> 'name', ''),
          split_part(coalesce(new.email, ''), '@', 1)
        ),
        ' ',
        1
      )
    ),
    nullif(new.raw_user_meta_data ->> 'middle_name', ''),
    nullif(new.raw_user_meta_data ->> 'surname', ''),
    nullif(new.raw_user_meta_data ->> 'suffix', ''),
    metadata_birthday,
    nullif(new.raw_user_meta_data ->> 'address', ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    nullif(new.raw_user_meta_data ->> 'region_name', ''),
    nullif(new.raw_user_meta_data ->> 'province', ''),
    nullif(new.raw_user_meta_data ->> 'province_name', ''),
    nullif(new.raw_user_meta_data ->> 'city', ''),
    nullif(new.raw_user_meta_data ->> 'city_name', ''),
    nullif(new.raw_user_meta_data ->> 'barangay', ''),
    nullif(new.raw_user_meta_data ->> 'barangay_name', ''),
    metadata_gender,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'memberType', ''), 'Premium'),
    metadata_login_source,
    new.created_at,
    true,
    new.created_at,
    new.created_at
  )
  -- Auth must still be able to create the account if an old profile row
  -- already exists for this user. The app performs the complete profile
  -- upsert after sign-in.
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
