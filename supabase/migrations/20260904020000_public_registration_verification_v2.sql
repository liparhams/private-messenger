alter table public.profiles add column if not exists verification text not null default 'none';
alter table public.profiles drop constraint if exists profiles_verification_check;
alter table public.profiles add constraint profiles_verification_check check (verification in ('none','blue','green','orange','red'));

insert into public.app_settings(key,value)
values('registration_enabled','true'::jsonb)
on conflict(key) do update set value='true'::jsonb,updated_at=now();

drop policy if exists app_settings_public_registration_read on public.app_settings;
create policy app_settings_public_registration_read on public.app_settings
for select to anon,authenticated
using(key='registration_enabled');

drop policy if exists app_settings_admin_update on public.app_settings;
create policy app_settings_admin_update on public.app_settings
for update to authenticated
using(
  (select private.is_admin())
  and key='registration_enabled'
  and exists(select 1 from public.profiles where id=(select auth.uid()) and lower(username)='parham')
)
with check(
  (select private.is_admin())
  and key='registration_enabled'
  and exists(select 1 from public.profiles where id=(select auth.uid()) and lower(username)='parham')
);
