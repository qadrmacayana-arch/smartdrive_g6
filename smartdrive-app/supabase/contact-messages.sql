-- Run in the Supabase SQL Editor to connect the About page contact form to the admin inbox.

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages
  add column if not exists is_read boolean not null default false;

create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_insert_own on public.contact_messages;
create policy contact_messages_insert_own
on public.contact_messages for insert to authenticated
with check (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and char_length(trim(full_name)) between 2 and 120
  and char_length(trim(email)) between 3 and 254
  and (subject is null or char_length(trim(subject)) between 3 and 120)
  and char_length(trim(message)) between 5 and 2000
  and is_read = false
);

drop policy if exists contact_messages_select_admin on public.contact_messages;
create policy contact_messages_select_admin
on public.contact_messages for select to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists contact_messages_update_admin on public.contact_messages;
create policy contact_messages_update_admin
on public.contact_messages for update to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)
);

notify pgrst, 'reload schema';
