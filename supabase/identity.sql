-- Stable public contact ID for users.
alter table public.profiles add column if not exists public_id text;
update public.profiles set public_id = 'm_' || lower(substr(replace(id::text,'-',''),1,10)) where public_id is null;
alter table public.profiles alter column public_id set default ('m_' || lower(substr(replace(gen_random_uuid()::text,'-',''),1,10)));
create unique index if not exists profiles_public_id_idx on public.profiles(public_id);
alter table public.profiles add constraint profiles_public_id_format check (public_id ~ '^m_[a-z0-9]{10}$');
