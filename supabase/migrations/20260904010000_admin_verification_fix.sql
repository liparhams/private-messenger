alter table public.profiles
  add column if not exists verification text not null default 'none';

update public.profiles
set verification = case when is_verified then 'blue' else 'none' end
where verification = 'none';

drop constraint if exists profiles_verification_check;
alter table public.profiles
  add constraint profiles_verification_check
  check (verification in ('none','blue','green','orange','red'));

insert into public.app_settings(key,value)
values ('registration_enabled','false'::jsonb)
on conflict (key) do nothing;
