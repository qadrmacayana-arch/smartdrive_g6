-- Admin privileges must come from a server-controlled claim or the named
-- administrator account; user_metadata is editable by the signed-in user.
create or replace function public.has_admin_access()
returns boolean
language sql
stable
set search_path = ''
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false);
$$;

revoke execute on function public.has_admin_access() from public, anon;
grant execute on function public.has_admin_access() to authenticated;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
on public.profiles for select to authenticated
using (public.has_admin_access());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

drop policy if exists "users_select_admin" on public.users;
create policy "users_select_admin"
on public.users for select to authenticated
using (public.has_admin_access());

drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin"
on public.users for update to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

drop policy if exists "reviews_select_admin" on public.reviews;
create policy "reviews_select_admin"
on public.reviews for select to authenticated
using (public.has_admin_access());

drop policy if exists "reviews_update_admin" on public.reviews;
create policy "reviews_update_admin"
on public.reviews for update to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

drop policy if exists "reviews_delete_admin" on public.reviews;
create policy "reviews_delete_admin"
on public.reviews for delete to authenticated
using (public.has_admin_access());

drop policy if exists "vehicles_insert_admin" on public.vehicles;
create policy "vehicles_insert_admin"
on public.vehicles for insert to authenticated
with check (public.has_admin_access());

drop policy if exists "vehicles_update_admin" on public.vehicles;
create policy "vehicles_update_admin"
on public.vehicles for update to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

drop policy if exists "vehicles_delete_admin" on public.vehicles;
create policy "vehicles_delete_admin"
on public.vehicles for delete to authenticated
using (public.has_admin_access());

drop policy if exists discount_codes_admin_all on public.discount_codes;
create policy discount_codes_admin_all
on public.discount_codes for all to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

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
begin
  if not public.has_admin_access() then
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

create or replace function public.admin_delete_user_by_email(target_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
begin
  if not public.has_admin_access() then
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
