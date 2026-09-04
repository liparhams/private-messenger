drop function if exists public.add_conversation_member(uuid,uuid);
create function public.add_conversation_member(conversation_uuid uuid,user_uuid uuid)
returns boolean language plpgsql security definer set search_path=public,private as $$
declare me uuid:=auth.uid(); can_manage boolean;
begin
 if me is null then raise exception 'not_authenticated'; end if;
 select exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_uuid and cm.user_id=me and cm.left_at is null and cm.role in ('owner','admin')) or private.is_admin() into can_manage;
 if not can_manage then raise exception 'permission_denied'; end if;
 if not exists(select 1 from public.profiles where id=user_uuid) then raise exception 'user_not_found'; end if;
 if not exists(select 1 from public.conversations where id=conversation_uuid) then raise exception 'conversation_not_found'; end if;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(conversation_uuid,user_uuid,'member',null) on conflict(conversation_id,user_id) do update set left_at=null;
 return true;
end; $$;
revoke all on function public.add_conversation_member(uuid,uuid) from public,anon;
grant execute on function public.add_conversation_member(uuid,uuid) to authenticated;
