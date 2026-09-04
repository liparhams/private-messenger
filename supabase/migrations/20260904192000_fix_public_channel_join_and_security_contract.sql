begin;

create or replace function public.join_conversation(p_conversation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  me uuid := auth.uid();
  target public.conversations%rowtype;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  select c.* into target
  from public.conversations c
  where c.id = p_conversation_id
    and c.is_public = true
    and c.discoverable = true
    and c.type = 'group';

  if not found then
    raise exception 'public_conversation_not_found';
  end if;

  insert into public.conversation_members(conversation_id,user_id,role,left_at)
  values(p_conversation_id,me,'member',null)
  on conflict(conversation_id,user_id)
  do update set left_at = null;

  if target.is_channel then
    insert into public.channel_members(channel_id,user_id,role)
    values(p_conversation_id,me,'member')
    on conflict(channel_id,user_id) do update set role='member';
  end if;

  return p_conversation_id;
end;
$$;

revoke execute on function public.join_conversation(uuid) from anon;
grant execute on function public.join_conversation(uuid) to authenticated;

commit;
