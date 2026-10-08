-- Run in the Supabase SQL Editor to enable persistent SmartDrive support chat.

create sequence if not exists public.support_conversation_number_seq;

create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_number text not null unique default (
    'SDC-' || lpad(nextval('public.support_conversation_number_seq')::text, 8, '0')
  ),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'ended', 'expired')),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists support_conversations_user_activity_idx
  on public.support_conversations (user_id, last_activity_at desc);
create index if not exists support_conversations_status_activity_idx
  on public.support_conversations (status, last_activity_at desc);

create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant')),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists support_messages_conversation_created_idx
  on public.support_messages (conversation_id, created_at);

create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  description text not null check (char_length(description) between 5 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_status_created_idx
  on public.support_tickets (status, created_at desc);

create table if not exists public.support_admin_notes (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.support_conversations(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id),
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists support_admin_notes_conversation_created_idx
  on public.support_admin_notes (conversation_id, created_at);

create or replace function public.touch_support_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_conversations
  set last_activity_at = now()
  where id = new.conversation_id
    and status = 'open';
  return new;
end;
$$;

drop trigger if exists trg_support_messages_touch_conversation on public.support_messages;
create trigger trg_support_messages_touch_conversation
after insert on public.support_messages
for each row execute function public.touch_support_conversation();

create or replace function public.set_support_ticket_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_support_ticket_updated_at();

create or replace function public.start_or_resume_support_conversation()
returns public.support_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  active_conversation public.support_conversations;
begin
  if current_user_id is null then
    raise exception 'Sign in to start a support conversation.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  update public.support_conversations
  set status = 'expired', ended_at = now()
  where user_id = current_user_id
    and status = 'open'
    and last_activity_at <= now() - interval '1 hour';

  select *
  into active_conversation
  from public.support_conversations
  where user_id = current_user_id
    and status = 'open'
  order by created_at desc
  limit 1;

  if not found then
    insert into public.support_conversations (user_id)
    values (current_user_id)
    returning * into active_conversation;
  end if;

  return active_conversation;
end;
$$;

create or replace function public.end_support_conversation(target_conversation_id uuid)
returns public.support_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  ended_conversation public.support_conversations;
begin
  update public.support_conversations
  set status = 'ended', ended_at = now()
  where id = target_conversation_id
    and user_id = auth.uid()
    and status = 'open'
  returning * into ended_conversation;

  if not found then
    raise exception 'This support conversation is no longer open.';
  end if;

  return ended_conversation;
end;
$$;

revoke execute on function public.start_or_resume_support_conversation() from public, anon;
grant execute on function public.start_or_resume_support_conversation() to authenticated;
revoke execute on function public.end_support_conversation(uuid) from public, anon;
grant execute on function public.end_support_conversation(uuid) to authenticated;

alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_admin_notes enable row level security;

drop policy if exists support_conversations_select_owner_or_admin on public.support_conversations;
create policy support_conversations_select_owner_or_admin
on public.support_conversations for select to authenticated
using (
  user_id = auth.uid()
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists support_messages_select_owner_or_admin on public.support_messages;
create policy support_messages_select_owner_or_admin
on public.support_messages for select to authenticated
using (
  exists (
    select 1 from public.support_conversations conversation
    where conversation.id = conversation_id
      and (
        conversation.user_id = auth.uid()
        or lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
        or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
      )
  )
);

drop policy if exists support_messages_insert_owner_active on public.support_messages;
create policy support_messages_insert_owner_active
on public.support_messages for insert to authenticated
with check (
  sender in ('user', 'assistant')
  and exists (
    select 1 from public.support_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
      and conversation.status = 'open'
      and conversation.last_activity_at > now() - interval '1 hour'
  )
);

drop policy if exists support_tickets_select_owner_or_admin on public.support_tickets;
create policy support_tickets_select_owner_or_admin
on public.support_tickets for select to authenticated
using (
  user_id = auth.uid()
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists support_tickets_insert_owner on public.support_tickets;
create policy support_tickets_insert_owner
on public.support_tickets for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.support_conversations conversation
    where conversation.id = conversation_id
      and conversation.user_id = auth.uid()
  )
);

drop policy if exists support_tickets_update_admin on public.support_tickets;
create policy support_tickets_update_admin
on public.support_tickets for update to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists support_admin_notes_select_admin on public.support_admin_notes;
create policy support_admin_notes_select_admin
on public.support_admin_notes for select to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists support_admin_notes_insert_admin on public.support_admin_notes;
create policy support_admin_notes_insert_admin
on public.support_admin_notes for insert to authenticated
with check (
  admin_user_id = auth.uid()
  and (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
  )
);

drop policy if exists discount_codes_admin_all on public.discount_codes;
create policy discount_codes_admin_all
on public.discount_codes for all to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@smartrentals.com'
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
);

drop policy if exists discount_codes_select_active on public.discount_codes;
drop policy if exists "discount_codes_select_active" on public.discount_codes;
create policy "discount_codes_select_active"
on public.discount_codes for select
using (is_active = true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'discount_codes'
  ) then
    alter publication supabase_realtime add table public.discount_codes;
  end if;
end;
$$;

notify pgrst, 'reload schema';
