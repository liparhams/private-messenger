begin;

drop function if exists public.create_conversation(text,text,text,boolean,text);
drop function if exists public.create_conversation(text,text,text,boolean,text,uuid[]);

create function public.create_conversation(
  p_kind text,
  p_title text,
  p_description text default '',
  p_is_public boolean default false,
  p_username text default null,
  p_member_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid(); v_id uuid; v_kind text := lower(trim(coalesce(p_kind,''))); v_title text := trim(coalesce(p_title,'')); v_description text := trim(coalesce(p_description,'')); v_username text := nullif(lower(trim(coalesce(p_username,''))),''); v_public boolean := coalesce(p_is_public,false); v_invite text; v_member_count integer := coalesce(cardinality(p_member_ids),0); v_distinct_count integer;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if v_kind not in ('group','channel') then raise exception 'invalid_conversation_kind'; end if;
  if length(v_title) < 1 or length(v_title) > 128 then raise exception 'invalid_title'; end if;
  if length(v_description) > 1000 then raise exception 'invalid_description'; end if;
  if v_member_count > 100 then raise exception 'too_many_members'; end if;
  if v_member_count > 0 then
    select count(distinct x) into v_distinct_count from unnest(p_member_ids) as x;
    if v_distinct_count <> v_member_count then raise exception 'duplicate_member'; end if;
    if exists(select 1 from unnest(p_member_ids) as x where x is null or x = v_user) then raise exception 'invalid_member'; end if;
    if (select count(*) from public.profiles p where p.id = any(p_member_ids)) <> v_member_count then raise exception 'user_not_found'; end if;
  end if;
  if v_kind = 'channel' then
    if v_public and v_username is null then raise exception 'username_required_for_public_channel'; end if;
    if not v_public and v_username is not null then raise exception 'private_channel_username_not_allowed'; end if;
    if v_username is not null and v_username !~ '^[a-z0-9_]{3,20}$' then raise exception 'invalid_channel_username'; end if;
    if v_username is not null and (exists(select 1 from public.conversations c where c.is_channel=true and lower(c.channel_username)=v_username) or exists(select 1 from public.channels c where lower(c.username)=v_username)) then raise exception 'channel_username_exists'; end if;
  else
    if v_username is not null then raise exception 'invalid_group_username'; end if;
  end if;
  v_invite := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  insert into public.conversations(type,title,created_by,is_channel,description,channel_username,is_public,discoverable,badge,invite_token)
  values('group',v_title,v_user,v_kind='channel',v_description,v_username,v_public,v_public,'none',case when v_public then null else v_invite end) returning id into v_id;
  insert into public.conversation_members(conversation_id,user_id,role,left_at) values(v_id,v_user,'owner',null);
  if v_member_count > 0 then insert into public.conversation_members(conversation_id,user_id,role,left_at) select v_id,x,'member',null from unnest(p_member_ids) as x; end if;
  if v_kind = 'channel' then
    insert into public.channels(id,owner_id,title,username,description,is_public,badge,invite_token) values(v_id,v_user,v_title,v_username,v_description,v_public,'none',case when v_public then null else v_invite end);
    insert into public.channel_members(channel_id,user_id,role) values(v_id,v_user,'owner');
    if v_member_count > 0 then insert into public.channel_members(channel_id,user_id,role) select v_id,x,'member' from unnest(p_member_ids) as x; end if;
  end if;
  return v_id;
exception when unique_violation then if v_kind='channel' then raise exception 'channel_username_exists'; end if; raise exception 'conversation_create_failed';
end;
$$;
revoke execute on function public.create_conversation(text,text,text,boolean,text,uuid[]) from public, anon;
grant execute on function public.create_conversation(text,text,text,boolean,text,uuid[]) to authenticated;

drop policy if exists chat_files_select on storage.objects;
drop policy if exists chat_files_select_allowed on storage.objects;
drop policy if exists chat_files_insert on storage.objects;
drop policy if exists chat_files_insert_own_folder on storage.objects;
drop policy if exists chat_files_update on storage.objects;
drop policy if exists chat_files_update_owner on storage.objects;
drop policy if exists chat_files_delete on storage.objects;
drop policy if exists chat_files_delete_owner on storage.objects;
create policy chat_files_insert on storage.objects for insert to authenticated with check(bucket_id='chat-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy chat_files_select on storage.objects for select to authenticated using(bucket_id='chat-files' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.messages m where m.file_url=objects.name and m.message_type='file' and m.deleted_at is null and (storage.foldername(objects.name))[1]=m.sender_id::text and m.conversation_id is not null and private.is_conversation_member(m.conversation_id))));
create policy chat_files_update on storage.objects for update to authenticated using(bucket_id='chat-files' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='chat-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy chat_files_delete on storage.objects for delete to authenticated using(bucket_id='chat-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists messages_insert_sender_v5 on public.messages;
create policy messages_insert_sender_v6 on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and conversation_id is not null and private.is_conversation_member(conversation_id) and ((message_type='text' and length(trim(coalesce(content,''))) between 1 and 4000 and file_url is null) or (message_type='file' and file_url is not null and (storage.foldername(file_url))[1]=(select auth.uid())::text and length(trim(coalesce(file_name,''))) between 1 and 120 and file_type is not null)) and ((receiver_id is null) or (sender_id<>receiver_id and exists(select 1 from public.conversation_members cm where cm.conversation_id=messages.conversation_id and cm.user_id=messages.receiver_id and cm.left_at is null))) and not exists(select 1 from public.conversations c where c.id=messages.conversation_id and c.is_channel and c.created_by<>(select auth.uid()));
drop index if exists public.idx_conversation_members_user_active;
drop index if exists public.idx_conversations_public_discoverable;
commit;
