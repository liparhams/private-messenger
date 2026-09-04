create or replace function public.join_via_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path=public,private
as $$
declare me uuid:=auth.uid(); cid uuid; v_channel boolean;
begin
 if me is null then raise exception 'not_authenticated'; end if;
 if length(trim(coalesce(invite_code,'')))<16 or length(trim(invite_code))>128 then raise exception 'invalid_invite'; end if;
 select id,is_channel into cid,v_channel from public.conversations where is_public=false and invite_token=trim(invite_code) limit 1;
 if cid is null then raise exception 'invalid_invite'; end if;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(cid,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null;
 if coalesce(v_channel,false) then insert into public.channel_members(channel_id,user_id,role) values(cid,me,'member') on conflict(channel_id,user_id) do nothing; end if;
 return cid;
end;
$$;
revoke all on function public.join_via_invite(text) from public,anon;
grant execute on function public.join_via_invite(text) to authenticated;
