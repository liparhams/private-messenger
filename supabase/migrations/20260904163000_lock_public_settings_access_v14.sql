begin;
create or replace function public.get_registration_enabled()
returns boolean language sql stable security definer set search_path = ''
as $$ select coalesce(((select s.value from public.app_settings s where s.key='registration_enabled')='true'::jsonb),false); $$;
revoke execute on function public.get_registration_enabled() from public;
grant execute on function public.get_registration_enabled() to anon,authenticated;
revoke select on public.app_settings from anon;
commit;
