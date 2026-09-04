create or replace function public.set_user_ban(user_uuid uuid, ban_state boolean, until_at timestamp with time zone default null)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if not private.is_admin() then raise exception 'permission_denied'; end if;
  if user_uuid=auth.uid() then raise exception 'cannot_ban_self'; end if;
  update public.profiles set is_banned=ban_state,banned_until=case when ban_state then until_at else null end where id=user_uuid;
  if not found then raise exception 'user_not_found'; end if;
  insert into public.admin_logs(admin_id,action,target_user_id,details)
  values(auth.uid(),case when ban_state then 'ban_user' else 'unban_user' end,user_uuid,jsonb_build_object('banned_until',until_at));
end;
$$;
revoke all on function public.set_user_ban(uuid,boolean,timestamptz) from public,anon;
grant execute on function public.set_user_ban(uuid,boolean,timestamptz) to authenticated;
