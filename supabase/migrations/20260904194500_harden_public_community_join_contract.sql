create or replace function public.join_public_community(target_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare
  uid uuid := auth.uid();
  target public.conversations;
begin
  if uid is null then raise exception 'not_authenticated'; end if;

  select * into target
  from public.conversations
  where id = target_conversation_id
    and is_public = true
    and discoverable = true
    and type = 'group';

  if target.id is null then raise exception 'public_conversation_not_found'; end if;

  insert into public.conversation_members(conversation_id,user_id,role,left_at)
  values(target.id,uid,'member',null)
  on conflict(conversation_id,user_id) do update set left_at = null;

  if coalesce(target.is_channel,false) then
    insert into public.channel_members(channel_id,user_id,role)
    values(target.id,uid,'member')
    on conflict(channel_id,user_id) do update set role='member';
  end if;

  return true;
end;
$$;
