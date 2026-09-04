begin;

drop function if exists public.create_conversation(text,text,text,boolean,text);

create or replace function public.create_conversation(
  p_kind text,
  p_title text,
  p_description text default '',
  p_is_public boolean default false,
  p_username text default null,
  p_member_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_kind text := lower(trim(coalesce(p_kind,'')));
  v_title text := trim(coalesce(p_title,''));
  v_description text := trim(coalesce(p_description,''));
  v_username text := nullif(lower(trim(coalesce(p_username,''))),'');
  v_public boolean := coalesce(p_is_public,false);
  v_invite text;
  v_members uuid[] := coalesce(p_member_ids,'{}'::uuid[]);
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if v_kind not in ('group','channel') then raise exception 'invalid_conversation_kind'; end if;
  if length(v_title) < 1 or length(v_title) > 128 then raise exception 'invalid_title'; end if;
  if length(v_description) > 1000 then raise exception 'invalid_description'; end if;
  if cardinality(v_members) > 100 then raise exception 'too_many_members'; end if;
  if exists(select 1 from unnest(v_members) x group by x having count(*) > 1) then raise exception 'duplicate_member'; end if;
  if exists(select 1 from unnest(v_members) x where x is null) then raise exception 'user_not_found'; end if;
  if exists(select 1 from unnest(v_members) x where not exists(select 1 from public.profiles p where p.id=x)) then raise exception 'user_not_found'; end if;

  if v_kind='channel' then
    if v_public and v_username is null then raise exception 'username_required_for_public_channel'; end if;
    if not v_public and v_username is not null then raise exception 'private_channel_username_not_allowed'; end if;
    if v_username is not null and v_username !~ '^[a-z0-9_]{3,20}$' then raise exception 'invalid_channel_username'; end if;
    if v_username is not null and (
      exists(select 1 from public.conversations c where c.is_channel=true and lower(c.channel_username)=v_username)
      or exists(select 1 from public.channels c where lower(c.username)=v_username)
    ) then raise exception 'channel_username_exists'; end if;
  else
    if v_username is not null then raise exception 'invalid_group_username'; end if;
  end if;

  v_invite := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  insert into public.conversations(type,title,created_by,is_channel,description,channel_username,is_public,discoverable,badge,invite_token)
  values('group',v_title,v_user,v_kind='channel',v_description,v_username,v_public,v_public,'none',case when v_public then null else v_invite end)
  returning id into v_id;

  insert into public.conversation_members(conversation_id,user_id,role,left_at)
  values(v_id,v_user,'owner',null);

  if cardinality(v_members) > 0 then
    insert into public.conversation_members(conversation_id,user_id,role,left_at)
    select v_id,x,'member',null from unnest(v_members) x where x<>v_user
    on conflict(conversation_id,user_id) do update set left_at=null;
  end if;

  if v_kind='channel' then
    insert into public.channels(id,owner_id,title,username,description,is_public,badge,invite_token)
    values(v_id,v_user,v_title,v_username,v_description,v_public,'none',case when v_public then null else v_invite end);
    insert into public.channel_members(channel_id,user_id,role)
    values(v_id,v_user,'owner')
    on conflict(channel_id,user_id) do update set role='owner';
    if cardinality(v_members) > 0 then
      insert into public.channel_members(channel_id,user_id,role)
      select v_id,x,'member' from unnest(v_members) x where x<>v_user
      on conflict(channel_id,user_id) do update set role='member';
    end if;
  end if;

  return v_id;
exception
  when unique_violation then
    raise exception 'channel_username_exists';
end;
$$;

revoke execute on function public.create_conversation(text,text,text,boolean,text,uuid[]) from anon;
grant execute on function public.create_conversation(text,text,text,boolean,text,uuid[]) to authenticated;

commit;
