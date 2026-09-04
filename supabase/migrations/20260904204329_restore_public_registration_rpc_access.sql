grant execute on function public.get_registration_enabled() to anon;
grant execute on function public.get_registration_enabled() to authenticated;
update public.app_settings set value='true'::jsonb, updated_at=now() where key='registration_enabled';
