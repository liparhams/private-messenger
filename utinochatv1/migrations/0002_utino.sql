create table if not exists profiles (
  user_id text primary key,
  username text not null unique,
  display_name text not null,
  public_id text not null unique,
  role text not null default 'user',
  verified boolean not null default false,
  avatar_hue integer not null default 200,
  banned boolean not null default false,
  banned_until timestamptz,
  bio text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on profiles (username);
create index if not exists profiles_display_name_idx on profiles (lower(display_name));
create index if not exists profiles_public_id_idx on profiles (public_id);

create table if not exists app_settings (
  id integer primary key,
  registration_enabled boolean not null default true
);

insert into app_settings (id, registration_enabled)
values (1, true)
on conflict (id) do nothing;

create table if not exists conversations (
  id text primary key,
  kind text not null,
  title text,
  username text unique,
  description text,
  is_public boolean not null default false,
  discoverable boolean not null default false,
  owner_id text not null,
  pair_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists conversations_kind_idx on conversations (kind);
create index if not exists conversations_username_idx on conversations (username);

create table if not exists conversation_members (
  conversation_id text not null,
  user_id text not null,
  member_role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx on conversation_members (user_id);

create table if not exists messages (
  id text primary key,
  conversation_id text not null,
  sender_id text not null,
  body text not null default '',
  edited_at timestamptz,
  deleted_at timestamptz,
  attachment_name text,
  attachment_mime text,
  attachment_size integer,
  attachment_data text,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);
create index if not exists messages_sender_idx on messages (sender_id);

create table if not exists message_reads (
  message_id text not null,
  reader_id text not null,
  read_at timestamptz not null default now(),
  primary key (message_id, reader_id)
);

create table if not exists invites (
  code text primary key,
  conversation_id text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id text primary key,
  user_id text not null,
  title text not null,
  body text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now()
);

create index if not exists tickets_user_idx on tickets (user_id);

create table if not exists ticket_messages (
  id text primary key,
  ticket_id text not null,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_logs (
  id text primary key,
  actor_id text not null,
  action text not null,
  target text,
  meta text,
  created_at timestamptz not null default now()
);
