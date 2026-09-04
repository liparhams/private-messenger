-- UTINOCHATV1: canonical group/channel creation contracts and RPC hardening.
-- The legacy channels table is kept synchronized for existing admin tooling.

drop function if exists public.create_group_conversation(text, uuid[]);
drop function if exists public.join_public_conversation(uuid);

create or replace function public.create_group_conversation(group_title text, group_description text, group_public boolean)
returns uuid language plpgsql security definer set search_path=public,private as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_title text:=trim(coalesce(group_title,'')); v_desc text:=trim(coalesce(group_description,'')); v_public boolean:=coalesce(group_public,false); v_invite text;
begin
 if v_user is null then raise exception 'not_authenticated'; end if;
 if length(v_title)<1 or length(v_title)>128 then raise exception 'invalid_title'; end if;
 if length(v_desc)>1000 then raise exception 'invalid_description'; end if;
 v_invite:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.conversations(type,title,created_by,is_channel,description,is_public,discoverable,badge,invite_token)
 values('group',v_title,v_user,false,v_desc,v_public,v_public,'none',case when v_public then null else v_invite end) returning id into v_id;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(v_id,v_user,'owner',null);
 return v_id;
end; $$;
revoke all on function public.create_group_conversation(text,text,boolean) from public,anon;
grant execute on function public.create_group_conversation(text,text,boolean) to authenticated;

create or replace function public.create_channel_conversation(channel_title text, channel_description text, channel_username text, channel_public boolean)
returns uuid language plpgsql security definer set search_path=public,private as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_username text:=nullif(lower(trim(channel_username)),''); v_title text:=trim(coalesce(channel_title,'')); v_desc text:=trim(coalesce(channel_description,'')); v_public boolean:=coalesce(channel_public,false); v_invite text;
begin
 if v_user is null then raise exception 'not_authenticated'; end if;
 if length(v_title)<1 or length(v_title)>128 then raise exception 'invalid_title'; end if;
 if length(v_desc)>1000 then raise exception 'invalid_description'; end if;
 if v_public and v_username is null then raise exception 'username_required_for_public_channel'; end if;
 if v_username is not null and v_username !~ '^[a-z0-9_]{3,32}$' then raise exception 'invalid_channel_username'; end if;
 if v_username is not null and (exists(select 1 from public.conversations c where c.is_channel=true and lower(c.channel_username)=v_username) or exists(select 1 from public.channels c where lower(c.username)=v_username)) then raise exception 'channel_username_exists'; end if;
 v_invite:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.conversations(type,title,created_by,is_channel,description,channel_username,is_public,discoverable,badge,invite_token)
 values('group',v_title,v_user,true,v_desc,v_username,v_public,v_public,'none',case when v_public then null else v_invite end) returning id into v_id;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(v_id,v_user,'owner',null);
 insert into public.channels(id,owner_id,title,username,description,is_public,badge,invite_token)
 values(v_id,v_user,v_title,v_username,v_desc,v_public,'none',case when v_public then null else v_invite end);
 return v_id;
exception when unique_violation then raise exception 'channel_username_exists'; end; $$;
revoke all on function public.create_channel_conversation(text,text,text,boolean) from public,anon;
grant execute on function public.create_channel_conversation(text,text,text,boolean) to authenticated;

create or replace function public.join_public_channel(channel_uuid uuid)
returns uuid language plpgsql security definer set search_path=public,private as $$
declare me uuid:=auth.uid(); v_is_channel boolean;
begin
 if me is null then raise exception 'not_authenticated'; end if;
 select is_channel into v_is_channel from public.conversations where id=channel_uuid and is_public=true and discoverable=true;
 if not found then raise exception 'public_conversation_not_found'; end if;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(channel_uuid,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null;
 if coalesce(v_is_channel,false) then insert into public.channel_members(channel_id,user_id,role) values(channel_uuid,me,'member') on conflict(channel_id,user_id) do nothing; end if;
 return channel_uuid;
end; $$;
revoke all on function public.join_public_channel(uuid) from public,anon;
grant execute on function public.join_public_channel(uuid) to authenticated;

create function public.join_public_conversation(conversation_id_input uuid)
returns uuid language plpgsql security definer set search_path=public,private as $$
declare me uuid:=auth.uid();
begin
 if me is null then raise exception 'not_authenticated'; end if;
 if not exists(select 1 from public.conversations where id=conversation_id_input and is_public=true and discoverable=true) then raise exception 'public_conversation_not_found'; end if;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(conversation_id_input,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null;
 return conversation_id_input;
end; $$;
revoke all on function public.join_public_conversation(uuid) from public,anon;
grant execute on function public.join_public_conversation(uuid) to authenticated;

create or replace function public.join_channel_by_invite(invite_value text)
returns uuid language plpgsql security definer set search_path=public,private as $$
declare me uuid:=auth.uid(); cid uuid;
begin
 if me is null then raise exception 'not_authenticated'; end if;
 if length(trim(coalesce(invite_value,'')))<16 or length(trim(invite_value))>128 then raise exception 'invalid_invite'; end if;
 select id into cid from public.conversations where is_channel=true and is_public=false and invite_token=trim(invite_value) limit 1;
 if cid is null then raise exception 'invalid_invite'; end if;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(cid,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null;
 insert into public.channel_members(channel_id,user_id,role) values(cid,me,'member') on conflict(channel_id,user_id) do nothing;
 return cid;
end; $$;
revoke all on function public.join_channel_by_invite(text) from public,anon;
grant execute on function public.join_channel_by_invite(text) to authenticated;

create or replace function public.join_group_by_invite(invite_value text)
returns uuid language plpgsql security definer set search_path=public,private as $$
declare me uuid:=auth.uid(); cid uuid;
begin
 if me is null then raise exception 'not_authenticated'; end if;
 if length(trim(coalesce(invite_value,'')))<16 or length(trim(invite_value))>128 then raise exception 'invalid_invite'; end if;
 select id into cid from public.conversations where type='group' and coalesce(is_channel,false)=false and is_public=false and invite_token=trim(invite_value) limit 1;
 if cid is null then raise exception 'invalid_invite'; end if;
 insert into public.conversation_members(conversation_id,user_id,role,left_at) values(cid,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null;
 return cid;
end; $$;
revoke all on function public.join_group_by_invite(text) from public,anon;
grant execute on function public.join_group_by_invite(text) to authenticated;

create or replace function public.list_public_communities()
returns table(id uuid,type text,title text,description text,channel_username text,is_channel boolean,is_public boolean,created_by uuid,created_at timestamptz)
language sql stable security definer set search_path=public as $$
 select c.id,c.type,c.title,c.description,c.channel_username,c.is_channel,c.is_public,c.created_by,c.created_at from public.conversations c where c.is_public=true and c.discoverable=true and (c.is_channel=true or c.type='group') order by c.created_at desc limit 100;
$$;
revoke all on function public.list_public_communities() from public,anon;
grant execute on function public.list_public_communities() to authenticated;

create or replace function public.search_public_channels(search_text text)
returns table(id uuid,title text,channel_username text,description text,verification text,member_count bigint)
language sql stable security definer set search_path=public as $$
 select c.id,c.title,c.channel_username,c.description,c.verification,(select count(*) from public.conversation_members cm where cm.conversation_id=c.id and cm.left_at is null) from public.conversations c where c.is_channel=true and c.is_public=true and c.discoverable=true and (coalesce(trim(search_text),'')='' or c.title ilike '%'||trim(search_text)||'%' or c.channel_username ilike '%'||trim(search_text)||'%') order by c.created_at desc limit 100;
$$;
revoke all on function public.search_public_channels(text) from public,anon;
grant execute on function public.search_public_channels(text) to authenticated;

revoke all on function public.admin_add_conversation_member(uuid,uuid) from public,anon; grant execute on function public.admin_add_conversation_member(uuid,uuid) to authenticated;
revoke all on function public.admin_remove_conversation_member(uuid,uuid) from public,anon; grant execute on function public.admin_remove_conversation_member(uuid,uuid) to authenticated;
revoke all on function public.admin_get_conversation_members(uuid) from public,anon; grant execute on function public.admin_get_conversation_members(uuid) to authenticated;
revoke all on function public.admin_regenerate_invite(uuid) from public,anon; grant execute on function public.admin_regenerate_invite(uuid) to authenticated;
revoke all on function public.admin_regenerate_channel_invite(uuid) from public,anon; grant execute on function public.admin_regenerate_channel_invite(uuid) to authenticated;
revoke all on function public.admin_set_conversation_discoverable(uuid,boolean) from public,anon; grant execute on function public.admin_set_conversation_discoverable(uuid,boolean) to authenticated;
revoke all on function public.admin_update_conversation(uuid,text,text,boolean) from public,anon; grant execute on function public.admin_update_conversation(uuid,text,text,boolean) to authenticated;
revoke all on function public.admin_update_channel(uuid,text,text,boolean,text) from public,anon; grant execute on function public.admin_update_channel(uuid,text,text,boolean,text) to authenticated;
revoke all on function public.admin_delete_conversation(uuid) from public,anon; grant execute on function public.admin_delete_conversation(uuid) to authenticated;
revoke all on function public.admin_delete_channel(uuid) from public,anon; grant execute on function public.admin_delete_channel(uuid) to authenticated;
revoke all on function public.set_user_ban(uuid,boolean,timestamptz) from public,anon; grant execute on function public.set_user_ban(uuid,boolean,timestamptz) to authenticated;
revoke all on function public.set_registration_enabled(boolean) from public,anon; grant execute on function public.set_registration_enabled(boolean) to authenticated;
revoke all on function public.delete_message(uuid) from public,anon; grant execute on function public.delete_message(uuid) to authenticated;
revoke all on function public.edit_message(uuid,text) from public,anon; grant execute on function public.edit_message(uuid,text) to authenticated;
revoke all on function public.mark_messages_seen(uuid[]) from public,anon; grant execute on function public.mark_messages_seen(uuid[]) to authenticated;
revoke all on function public.get_or_create_direct_conversation(uuid) from public,anon; grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
revoke all on function public.get_or_create_support_chat() from public,anon; grant execute on function public.get_or_create_support_chat() to authenticated;
revoke all on function public.leave_conversation(uuid) from public,anon; grant execute on function public.leave_conversation(uuid) to authenticated;

drop policy if exists app_settings_select on public.app_settings;
drop policy if exists "ticket messages access" on public.support_ticket_messages;
drop policy if exists "ticket messages insert" on public.support_ticket_messages;
drop policy if exists "ticket owner insert" on public.support_tickets;
drop policy if exists "ticket owner or admin select" on public.support_tickets;
drop policy if exists "ticket owner or admin update" on public.support_tickets;
create policy support_ticket_messages_select on public.support_ticket_messages for select to authenticated using(exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=(select auth.uid()) or private.is_admin())));
create policy support_ticket_messages_insert on public.support_ticket_messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.support_tickets t where t.id=ticket_id and (t.user_id=(select auth.uid()) or private.is_admin())));
create policy support_tickets_insert on public.support_tickets for insert to authenticated with check(user_id=(select auth.uid()));
create policy support_tickets_select on public.support_tickets for select to authenticated using(user_id=(select auth.uid()) or private.is_admin());
create policy support_tickets_update on public.support_tickets for update to authenticated using(user_id=(select auth.uid()) or private.is_admin()) with check(user_id=(select auth.uid()) or private.is_admin());

drop policy if exists support_chats_select on public.support_chats;
drop policy if exists support_chats_insert on public.support_chats;
drop policy if exists support_chats_update on public.support_chats;
create policy support_chats_select on public.support_chats for select to authenticated using(user_id=(select auth.uid()) or private.is_admin());
create policy support_chats_insert on public.support_chats for insert to authenticated with check(user_id=(select auth.uid()));
create policy support_chats_update on public.support_chats for update to authenticated using(user_id=(select auth.uid()) or private.is_admin()) with check(user_id=(select auth.uid()) or private.is_admin());
drop policy if exists support_chat_messages_select on public.support_chat_messages;
drop policy if exists support_chat_messages_insert on public.support_chat_messages;
create policy support_chat_messages_select on public.support_chat_messages for select to authenticated using(exists(select 1 from public.support_chats c where c.id=chat_id and (c.user_id=(select auth.uid()) or private.is_admin())));
create policy support_chat_messages_insert on public.support_chat_messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.support_chats c where c.id=chat_id and (c.user_id=(select auth.uid()) or private.is_admin())));

create or replace function public.touch_support_chat() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;
create or replace function public.touch_support_chats_fn() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end; $$;

create index if not exists conversations_public_discovery_idx on public.conversations(is_public,discoverable,is_channel,created_at desc);
create index if not exists conversation_members_conversation_active_idx on public.conversation_members(conversation_id,left_at,user_id);
create index if not exists conversation_members_user_active_idx on public.conversation_members(user_id,left_at,conversation_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at desc);
create index if not exists messages_sender_created_idx on public.messages(sender_id,created_at desc);
create index if not exists message_reads_reader_idx on public.message_reads(user_id,seen_at desc);
create index if not exists channel_members_user_idx on public.channel_members(user_id,channel_id);
