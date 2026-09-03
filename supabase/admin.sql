-- Secure admin foundation. Safe to run after schema.sql.
create schema if not exists private;

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user','admin','support'));
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_message_id uuid references public.messages(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_logs_created_at_idx on public.admin_logs(created_at desc);
create index if not exists admin_logs_admin_id_idx on public.admin_logs(admin_id);
create index if not exists admin_logs_target_user_id_idx on public.admin_logs(target_user_id);
create index if not exists admin_logs_target_message_id_idx on public.admin_logs(target_message_id);

alter table public.admin_logs enable row level security;
revoke all on public.admin_logs from anon;
revoke all on public.admin_logs from authenticated;
grant select,insert on public.admin_logs to authenticated;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function private.is_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "admins can read admin logs" on public.admin_logs;
drop policy if exists "admins can write admin logs" on public.admin_logs;
drop policy if exists admins_can_read_admin_logs on public.admin_logs;
drop policy if exists admins_can_write_admin_logs on public.admin_logs;
create policy admins_can_read_admin_logs on public.admin_logs for select to authenticated using ((select private.is_admin()));
create policy admins_can_write_admin_logs on public.admin_logs for insert to authenticated with check ((select private.is_admin()) and admin_id=(select auth.uid()));

-- Assign the existing support owner as admin if that account exists.
update public.profiles set role='admin' where lower(username)='parham';
