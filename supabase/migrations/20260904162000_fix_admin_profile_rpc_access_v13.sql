begin;
grant execute on function public.admin_list_profiles() to authenticated;
revoke execute on function public.admin_list_profiles() from anon;
commit;
