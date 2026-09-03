create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  contact_type text,
  contact_value text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists contact_type text;
alter table public.profiles add column if not exists contact_value text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  message_type text not null default 'text',
  file_name text,
  created_at timestamptz not null default now(),
  constraint messages_no_self_message check (sender_id <> receiver_id),
  constraint messages_type_check check (message_type in ('text', 'file'))
);

alter table public.messages add column if not exists message_type text not null default 'text';
alter table public.messages add column if not exists file_name text;
alter table public.messages add column if not exists created_at timestamptz not null default now();

create index if not exists messages_sender_receiver_created_idx
  on public.messages (sender_id, receiver_id, created_at);
create index if not exists messages_receiver_sender_created_idx
  on public.messages (receiver_id, sender_id, created_at);

alter table public.profiles enable row level security;
alter table public.messages enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.messages from anon;
grant select on table public.profiles to authenticated;
grant insert, update on table public.profiles to authenticated;
grant select, insert on table public.messages to authenticated;

-- Remove old policies with the same names so this file can be safely re-run.
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "messages_select_participants" on public.messages;
drop policy if exists "messages_insert_sender" on public.messages;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using ((select auth.uid()) is not null);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "messages_select_participants"
on public.messages
for select
to authenticated
using (
  (select auth.uid()) = sender_id
  or (select auth.uid()) = receiver_id
);

create policy "messages_insert_sender"
on public.messages
for insert
to authenticated
with check (
  (select auth.uid()) = sender_id
  and sender_id <> receiver_id
  and exists (
    select 1
    from auth.users as target_user
    where target_user.id = receiver_id
  )
);

-- Create profiles automatically from the metadata supplied during sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text;
  new_display_name text;
  new_contact_type text;
  new_contact_value text;
begin
  new_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1))));
  new_display_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', new_username));
  new_contact_type := nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_type', '')), '');
  new_contact_value := nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_value', '')), '');

  if new_username is null or new_username = '' then
    raise exception 'username_required';
  end if;

  if new_display_name is null or new_display_name = '' then
    new_display_name := new_username;
  end if;

  insert into public.profiles (id, username, display_name, contact_type, contact_value)
  values (
    new.id,
    new_username,
    left(new_display_name, 80),
    case when new_contact_type in ('telegram', 'instagram', 'email', 'phone', 'other') then new_contact_type else null end,
    case when new_contact_type in ('telegram', 'instagram', 'email', 'phone', 'other') then left(new_contact_value, 160) else null end
  )
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    contact_type = excluded.contact_type,
    contact_value = excluded.contact_value;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Realtime is required by the browser client for live incoming messages.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;

-- Private bucket. Files are never exposed through a public URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files',
  'chat-files',
  false,
  15728640,
  null
)
on conflict (id) do update set
  public = false,
  file_size_limit = 15728640;

create index if not exists messages_content_idx
  on public.messages (content)
  where message_type = 'file';

revoke all on table storage.objects from anon;
grant select, insert, delete on table storage.objects to authenticated;

drop policy if exists "chat_files_insert_own_folder" on storage.objects;
drop policy if exists "chat_files_select_allowed" on storage.objects;
drop policy if exists "chat_files_delete_owner" on storage.objects;

create policy "chat_files_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "chat_files_select_allowed"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-files'
  and (
    owner_id = (select auth.uid()::text)
    or exists (
      select 1
      from public.messages as m
      where m.message_type = 'file'
        and m.content = name
        and m.receiver_id = (select auth.uid())
    )
  )
);

create policy "chat_files_delete_owner"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-files'
  and owner_id = (select auth.uid()::text)
);

-- Helpful hardening constraints for newly created/updated profiles.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username ~ '^[a-z0-9_]{3,20}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_display_name_length'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_display_name_length
      check (char_length(display_name) between 1 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_contact_type_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_contact_type_check
      check (contact_type is null or contact_type in ('telegram', 'instagram', 'email', 'phone', 'other'));
  end if;
end
$$;
