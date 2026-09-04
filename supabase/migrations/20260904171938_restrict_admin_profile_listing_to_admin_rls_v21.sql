begin;

drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select
on public.profiles
for select
to authenticated
using ((select private.is_admin()));

revoke execute on function public.admin_list_profiles() from anon, authenticated;
grant select on public.profiles to authenticated;

commit;
