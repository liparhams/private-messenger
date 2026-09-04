alter table public.profiles add column if not exists verification text not null default 'none';
alter table public.profiles drop constraint if exists profiles_verification_check;
alter table public.profiles add constraint profiles_verification_check check (verification in ('none','blue','green','orange','red'));
update public.profiles set verification = 'blue' where is_verified = true and verification = 'none';

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  status text not null default 'open' check (status in ('open','pending','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets(user_id, updated_at desc);
create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages(ticket_id, created_at);

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

drop policy if exists "ticket owner or admin select" on public.support_tickets;
drop policy if exists "ticket owner insert" on public.support_tickets;
drop policy if exists "ticket owner or admin update" on public.support_tickets;
drop policy if exists "ticket messages access" on public.support_ticket_messages;
drop policy if exists "ticket messages insert" on public.support_ticket_messages;

create policy "ticket owner or admin select" on public.support_tickets for select using (auth.uid() = user_id or private.is_admin());
create policy "ticket owner insert" on public.support_tickets for insert with check (auth.uid() = user_id);
create policy "ticket owner or admin update" on public.support_tickets for update using (auth.uid() = user_id or private.is_admin()) with check (auth.uid() = user_id or private.is_admin());
create policy "ticket messages access" on public.support_ticket_messages for select using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or private.is_admin())));
create policy "ticket messages insert" on public.support_ticket_messages for insert with check (auth.uid() = sender_id and exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or private.is_admin())));

create or replace function public.touch_support_ticket() returns trigger language plpgsql security definer set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists support_ticket_touch on public.support_tickets;
create trigger support_ticket_touch before update on public.support_tickets for each row execute function public.touch_support_ticket();

insert into public.app_settings(key,value) values ('registration_enabled','true'::jsonb) on conflict (key) do update set value='true'::jsonb, updated_at=now();
