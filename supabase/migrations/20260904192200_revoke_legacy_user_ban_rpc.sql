begin;
revoke execute on function public.set_user_ban(uuid, boolean, timestamptz) from anon, authenticated;
commit;
