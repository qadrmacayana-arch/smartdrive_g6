-- Run in the Supabase SQL Editor to enable the admin CMS, public announcements,
-- site contact settings, and tamper-resistant administrator audit history.

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

create table if not exists public.cms_content (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  message text not null check (char_length(message) between 5 and 1000),
  route text not null default '/offers' check (route like '/%' and route not like '//%'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists cms_content_publication_idx
  on public.cms_content (status, starts_at, ends_at, created_at desc);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  message text not null check (char_length(message) between 5 and 1000),
  route text not null default '/notifications' check (route like '/%' and route not like '//%'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or published_at is null or expires_at > published_at)
);

create index if not exists admin_notifications_publication_idx
  on public.admin_notifications (status, published_at desc, expires_at);

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value text not null,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (setting_key, setting_value, is_public)
values
  ('support_email', 'smartdriveteam@smartdrive.com', true),
  ('support_phone', '', true)
on conflict (setting_key) do nothing;

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null default '',
  action text not null,
  resource_type text not null,
  resource_id text,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_resource_idx
  on public.admin_audit_logs (resource_type, resource_id, created_at desc);

alter table public.cms_content enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists cms_content_public_select on public.cms_content;
create policy cms_content_public_select on public.cms_content
  for select to anon, authenticated
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );
drop policy if exists cms_content_admin_all on public.cms_content;
create policy cms_content_admin_all on public.cms_content
  for all to authenticated
  using (public.has_admin_access())
  with check (public.has_admin_access());

drop policy if exists admin_notifications_public_select on public.admin_notifications;
create policy admin_notifications_public_select on public.admin_notifications
  for select to anon, authenticated
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
    and (expires_at is null or expires_at > now())
  );
drop policy if exists admin_notifications_admin_all on public.admin_notifications;
create policy admin_notifications_admin_all on public.admin_notifications
  for all to authenticated
  using (public.has_admin_access())
  with check (public.has_admin_access());

drop policy if exists site_settings_public_select on public.site_settings;
create policy site_settings_public_select on public.site_settings
  for select to anon, authenticated
  using (is_public);
drop policy if exists site_settings_admin_all on public.site_settings;
create policy site_settings_admin_all on public.site_settings
  for all to authenticated
  using (public.has_admin_access())
  with check (public.has_admin_access());

drop policy if exists admin_audit_logs_admin_select on public.admin_audit_logs;
create policy admin_audit_logs_admin_select on public.admin_audit_logs
  for select to authenticated
  using (public.has_admin_access());

revoke select on public.cms_content, public.admin_notifications, public.site_settings from anon, authenticated;
grant select (id, title, message, route, status, starts_at, ends_at, created_at)
  on public.cms_content to anon, authenticated;
grant select (id, title, message, route, status, published_at, expires_at, created_at)
  on public.admin_notifications to anon, authenticated;
grant select (setting_key, setting_value, is_public)
  on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.cms_content, public.admin_notifications, public.site_settings to authenticated;
grant select on public.admin_audit_logs to authenticated;

create or replace function public.set_admin_content_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cms_content_set_updated_at on public.cms_content;
create trigger cms_content_set_updated_at
before update on public.cms_content
for each row execute function public.set_admin_content_updated_at();

drop trigger if exists admin_notifications_set_updated_at on public.admin_notifications;
create trigger admin_notifications_set_updated_at
before update on public.admin_notifications
for each row execute function public.set_admin_content_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_admin_content_updated_at();

create or replace function public.record_admin_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_data jsonb;
  new_data jsonb;
  target_data jsonb;
  target_id text;
  changed text[];
begin
  if not public.has_admin_access() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op <> 'INSERT' then old_data := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_data := to_jsonb(new); end if;
  target_data := coalesce(new_data, old_data);
  target_id := coalesce(target_data ->> 'id', target_data ->> 'reference_number', target_data ->> 'setting_key');

  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}')
      into changed
      from jsonb_each(new_data) as field(key, value)
     where old_data -> key is distinct from value;
  elsif tg_op = 'INSERT' then
    changed := array(select key from jsonb_object_keys(new_data) as keys(key) order by key);
  else
    changed := array(select key from jsonb_object_keys(old_data) as keys(key) order by key);
  end if;

  if tg_op = 'UPDATE' and cardinality(changed) = 0 then
    return new;
  end if;

  insert into public.admin_audit_logs (
    actor_id, actor_email, action, resource_type, resource_id, changed_fields
  ) values (
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    lower(tg_op),
    tg_table_name,
    target_id,
    changed
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.record_admin_audit_event() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'bookings', 'profiles', 'vehicles', 'reviews', 'discount_codes',
    'contact_messages', 'support_tickets', 'support_admin_notes', 'cms_content',
    'admin_notifications', 'site_settings'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop trigger if exists admin_audit_change on public.%I', table_name);
      execute format(
        'create trigger admin_audit_change after insert or update or delete on public.%I for each row execute function public.record_admin_audit_event()',
        table_name
      );
    end if;
  end loop;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_notifications'
  ) then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cms_content'
  ) then
    alter publication supabase_realtime add table public.cms_content;
  end if;
end;
$$;
