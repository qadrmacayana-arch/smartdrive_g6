-- ============================================================
-- SmartDrive™ Supabase Schema
-- Use this in the Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Helper: trigger function to auto-update `updated_at` columns
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 1. Profiles (used by the current app signup/login flow)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  birthday date default null,
  address text default null,
  gender text default 'prefer_not_to_say'
    check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  phone text default null,
  member_type text default 'Premium',
  login_source text default 'web'
    check (login_source in ('web', 'app', 'unknown')),
  registration_date timestamptz default now(),
  last_login timestamptz default null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_member_type on public.profiles (member_type);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_select_admin"
on public.profiles for select
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

create policy "profiles_update_admin"
on public.profiles for update
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

create or replace function public.admin_list_auth_users()
returns table (
  id uuid,
  email text,
  name text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requester_email text;
  requester_is_admin boolean;
begin
  requester_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  requester_is_admin := coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);

  if requester_email <> 'admin@smartrentals.com' and not requester_is_admin then
    raise exception 'Only administrators can view users';
  end if;

  return query
  select
    au.id::uuid,
    au.email::text,
    coalesce(au.raw_user_meta_data ->> 'full_name', split_part(au.email::text, '@', 1))::text,
    coalesce(au.raw_user_meta_data ->> 'full_name', split_part(au.email::text, '@', 1))::text,
    au.created_at::timestamptz,
    au.last_sign_in_at::timestamptz,
    (au.banned_until is null)::boolean
  from auth.users au
  where au.email is not null
  order by au.created_at desc;
end;
$$;

revoke execute on function public.admin_list_auth_users() from public, anon;
grant execute on function public.admin_list_auth_users() to authenticated;

-- Keep the public user directory synchronized with Supabase Auth users.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, birthday, address, gender, phone, login_source, created_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'birthday', '')::date,
    nullif(new.raw_user_meta_data ->> 'address', ''),
    coalesce(new.raw_user_meta_data ->> 'gender', 'prefer_not_to_say'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'login_source', 'web'),
    new.created_at
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill Auth accounts created before the synchronization trigger existed.
insert into public.profiles (id, email, full_name, created_at)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1)),
  au.created_at
from auth.users au
where au.email is not null
on conflict (id) do update
  set email = excluded.email;

-- ------------------------------------------------------------
-- 2. Admins
-- ------------------------------------------------------------
create table if not exists public.admins (
  id bigint generated always as identity primary key,
  email text not null unique,
  password text not null,
  full_name text not null,
  role text default 'super_admin',
  last_login timestamptz default null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_admins_email on public.admins (email);

create trigger trg_admins_updated_at
before update on public.admins
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 3. User Locations
-- ------------------------------------------------------------
create table if not exists public.user_locations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade on update cascade,
  latitude numeric(10,8) not null,
  longitude numeric(11,8) not null,
  accuracy numeric(8,2) default null,
  speed numeric(8,2) default null,
  recorded_at timestamptz default now()
);

create index if not exists idx_user_locations_user_time on public.user_locations (user_id, recorded_at);

-- ------------------------------------------------------------
-- 4. Vehicles
-- ------------------------------------------------------------
create table if not exists public.vehicles (
  id bigint generated always as identity primary key,
  vehicle_id text not null unique,
  name text not null,
  type text not null,
  main_category text not null,
  price numeric(10,2) not null,
  sr_points integer default 0,
  image text default null,
  description text default null,
  features jsonb default null,
  transmission text default 'Automatic',
  fuel text default 'Gasoline',
  seats integer default 5,
  status text default 'available'
    check (status in ('available', 'booked', 'maintenance', 'archived')),
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_vehicles_type on public.vehicles (type);
create index if not exists idx_vehicles_status on public.vehicles (status);
create index if not exists idx_vehicles_main_category on public.vehicles (main_category);
create index if not exists idx_vehicles_featured on public.vehicles (is_featured);

create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Bookings
-- ------------------------------------------------------------
create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  reference_number text not null unique,
  user_id uuid default null references public.profiles(id) on delete set null on update cascade,
  customer_email text not null,
  customer_name text not null,
  customer_phone text default null,
  vehicle_id bigint not null references public.vehicles(id) on delete cascade on update cascade,
  vehicle_name text not null,
  pickup_date date not null,
  return_date date not null,
  pickup_location text default null,
  daily_rate numeric(10,2) not null,
  rental_days integer not null,
  subtotal numeric(10,2) not null,
  insurance numeric(10,2) default 500.00,
  discount numeric(10,2) default 0.00,
  discount_label text default null,
  total_price numeric(10,2) not null,
  payment_method text not null,
  payment_status text default 'pending'
    check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  booking_status text default 'confirmed'
    check (booking_status in ('confirmed', 'ongoing', 'completed', 'cancelled')),
  is_pwd_senior boolean default false,
  rating integer default null,
  notes text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bookings_reference_number on public.bookings (reference_number);
create index if not exists idx_bookings_customer_email on public.bookings (customer_email);
create index if not exists idx_bookings_status on public.bookings (booking_status);
create index if not exists idx_bookings_payment_status on public.bookings (payment_status);
create index if not exists idx_bookings_pickup_date on public.bookings (pickup_date);
create index if not exists idx_bookings_user_id on public.bookings (user_id);

create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6. Reviews and ratings
-- ------------------------------------------------------------
-- Multiple review submissions are allowed for each customer/user.
-- Do not add a unique constraint on user_id or customer_email here.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid default null references public.profiles(id) on delete set null on update cascade,
  booking_id bigint default null references public.bookings(id) on delete set null on update cascade,
  customer_email text not null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_reviews_created_at on public.reviews (created_at desc);
create index if not exists idx_reviews_rating on public.reviews (rating);
create index if not exists idx_reviews_user_id on public.reviews (user_id);

create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
on public.reviews for insert
with check (
  auth.uid() = user_id
  or (user_id is null and auth.uid() is not null)
);

drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own"
on public.reviews for select
using (auth.uid() = user_id);

drop policy if exists "reviews_select_admin" on public.reviews;
create policy "reviews_select_admin"
on public.reviews for select
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists "reviews_update_admin" on public.reviews;
create policy "reviews_update_admin"
on public.reviews for update
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

-- ------------------------------------------------------------
-- 7. Wallet Balances
-- ------------------------------------------------------------
create table if not exists public.wallet_balances (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade on update cascade,
  email text not null,
  balance numeric(12,2) default 0.00,
  total_earned numeric(12,2) default 0.00,
  total_spent numeric(12,2) default 0.00,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_wallet_balances_user on public.wallet_balances (user_id);
create index if not exists idx_wallet_balances_email on public.wallet_balances (email);

create or replace function public.set_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

create trigger trg_wallet_balances_last_updated
before update on public.wallet_balances
for each row execute function public.set_last_updated();

-- ------------------------------------------------------------
-- 7. Wallet Transactions
-- ------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id bigint generated always as identity primary key,
  user_id uuid default null references public.profiles(id) on delete set null on update cascade,
  email text not null,
  type text not null check (type in ('top_up', 'payment', 'reward', 'refund', 'adjustment')),
  description text not null,
  amount numeric(12,2) not null,
  payment_method text default null,
  reference text default null,
  balance_before numeric(12,2) default 0.00,
  balance_after numeric(12,2) default 0.00,
  status text default 'completed' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now()
);

create index if not exists idx_wallet_transactions_user on public.wallet_transactions (user_id);
create index if not exists idx_wallet_transactions_email on public.wallet_transactions (email);
create index if not exists idx_wallet_transactions_type on public.wallet_transactions (type);
create index if not exists idx_wallet_transactions_date on public.wallet_transactions (created_at);

-- ------------------------------------------------------------
-- 8. Contact Messages
-- ------------------------------------------------------------
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text default null,
  subject text default null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_contact_messages_email on public.contact_messages (email);
create index if not exists idx_contact_messages_read on public.contact_messages (is_read);

-- ------------------------------------------------------------
-- 9. Discount Codes
-- ------------------------------------------------------------
create table if not exists public.discount_codes (
  id bigint generated always as identity primary key,
  code text not null unique,
  description text default null,
  discount_percent numeric(5,2) not null,
  max_uses integer default null,
  current_uses integer default 0,
  min_spend numeric(10,2) default 0.00,
  valid_from timestamptz default null,
  valid_until timestamptz default null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_discount_codes_code on public.discount_codes (code);
create index if not exists idx_discount_codes_active on public.discount_codes (is_active);

create trigger trg_discount_codes_updated_at
before update on public.discount_codes
for each row execute function public.set_updated_at();

-- ============================================================
-- Seed Data
-- ============================================================

insert into public.admins (email, password, full_name, role)
values (
  'admin@smartrentals.com',
  '$2y$12$LJ3m4ys3Lg3YOG2e5eK7HOE6XO5F.NiH3Q0sGiHUkNO7WZRVb2/iq',
  'Admin User',
  'super_admin'
)
on conflict (email) do nothing;

-- Optional demo rows for profiles/wallets
-- If you want to seed a sample account, insert it after auth user creation in Supabase Auth.

-- ------------------------------------------------------------
-- 10. Example vehicle seed data
-- ------------------------------------------------------------
insert into public.vehicles (
  vehicle_id, name, type, main_category, price, sr_points, image, description, features, transmission, fuel, seats, status, is_featured
)
values
  ('1', 'Tesla Model 3', 'Electric', 'Cars', 2500, 300, 'https://www.autodeal.com.ph/custom/car-model-photo/original/tesla-model-3-673feb7878492.jpg', null, '[]'::jsonb, 'Automatic', 'Electric', 5, 'available', true),
  ('17', 'Vinfast Limo', 'Electric', 'Cars', 2200, 280, 'https://www.autodeal.com.ph/custom/car-model-photo/original/vinfast-limo-green-69782989082af.jpg', null, '[]'::jsonb, 'Automatic', 'Electric', 5, 'available', true),
  ('18', 'BYD Seagull', 'Electric', 'Cars', 1800, 220, 'https://www.expressway.ph/_next/image?url=https%3A%2F%2Fqyjzqzqqjimittltttph.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fvehicles%2Fcars%2Fbyd-seagull-1.jpg&w=3840&q=75', null, '[]'::jsonb, 'Automatic', 'Electric', 4, 'available', true),
  ('19', 'VinFast VF 3', 'Electric', 'Cars', 1900, 240, 'https://qyjzqzqqjimittltttph.supabase.co/storage/v1/object/public/vehicles/cars/vinfast-vf-3-1.jpg', null, '[]'::jsonb, 'Automatic', 'Electric', 4, 'available', true),
  ('20', 'BYD eMAX 7', 'Electric', 'Cars', 2800, 350, 'https://cdn.prod.website-files.com/679b275acc89c99e5cf128aa/67f3b0881ff49accc6102e7b_BYD-eMAX7-HomePageBanner-1440x900.webp', null, '[]'::jsonb, 'Automatic', 'Electric', 7, 'available', true)
on conflict (vehicle_id) do nothing;

insert into public.discount_codes (
  code, description, discount_percent, max_uses, current_uses, min_spend, valid_from, valid_until, is_active
)
values
  ('FIRST15', '15% off for first-time renters', 15.00, 100, 5, 2000.00, '2026-01-01 00:00:00+00', '2026-12-31 23:59:59+00', true),
  ('SUMMER10', '10% off summer promo', 10.00, 200, 12, 3000.00, '2026-03-01 00:00:00+00', '2026-06-30 23:59:59+00', true),
  ('VIP20', '20% off for VIP members', 20.00, 50, 3, 5000.00, '2026-01-01 00:00:00+00', '2026-12-31 23:59:59+00', true),
  ('LOYALTY5', '5% off for returning customers', 5.00, null, 25, 1000.00, '2026-01-01 00:00:00+00', '2026-12-31 23:59:59+00', true)
on conflict (code) do nothing;

-- ============================================================
-- RLS helpers for admin access (optional)
-- ============================================================

create policy "admins_select_own"
on public.admins for select
using (auth.uid() is not null);

create policy "admins_insert_own"
on public.admins for insert
with check (auth.uid() is not null);

create policy "admins_update_own"
on public.admins for update
using (auth.uid() is not null)
with check (auth.uid() is not null);

alter table public.admins enable row level security;
alter table public.user_locations enable row level security;
alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.discount_codes enable row level security;

drop policy if exists "vehicles_select_public" on public.vehicles;
-- Keep this policy rerunnable so the browser can read fleet rows.
create policy "vehicles_select_public"
on public.vehicles for select
using (true);

drop policy if exists "vehicles_insert_admin" on public.vehicles;
create policy "vehicles_insert_admin"
on public.vehicles for insert
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists "vehicles_update_admin" on public.vehicles;
create policy "vehicles_update_admin"
on public.vehicles for update
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists "vehicles_delete_admin" on public.vehicles;
create policy "vehicles_delete_admin"
on public.vehicles for delete
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

-- If you want stricter admin-only access later, replace the policies above with role checks.


create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  birthday date default null,
  address text default null,
  gender text default 'prefer_not_to_say'
    check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  phone text default null,
  member_type text default 'Premium',
  registration_date timestamptz default now(),
  last_login timestamptz default null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_member_type on public.users (member_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.users enable row level security;

create policy "users_select_own"
on public.users for select
using (auth.uid() = id);

create policy "users_insert_own"
on public.users for insert
with check (auth.uid() = id);

create policy "users_update_own"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users_select_admin"
on public.users for select
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

create policy "users_update_admin"
on public.users for update
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

-- ------------------------------------------------------------
-- Admin user deletion
-- ------------------------------------------------------------
-- The browser client cannot delete from auth.users directly. This
-- guarded function removes the Auth record, which cascades to profiles,
-- users, locations, and wallet data through the foreign keys above.
create or replace function public.admin_delete_user_by_email(target_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  requester_email text;
  requester_is_admin boolean;
begin
  requester_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  requester_is_admin := coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);

  if requester_email <> 'admin@smartrentals.com' and not requester_is_admin then
    raise exception 'Only administrators can delete users';
  end if;

  select id
    into target_id
    from auth.users
   where lower(email) = lower(target_email)
   limit 1;

  if target_id is null then
    return false;
  end if;

  delete from auth.users where id = target_id;
  return found;
end;
$$;

revoke execute on function public.admin_delete_user_by_email(text) from public, anon;
grant execute on function public.admin_delete_user_by_email(text) to authenticated;

-- Allow a signed-in user to permanently delete their own Auth account.
create or replace function public.delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete your account';
  end if;

  delete from auth.users where id = auth.uid();
  return true;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;