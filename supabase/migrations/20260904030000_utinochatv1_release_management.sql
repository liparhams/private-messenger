alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.conversations add column if not exists is_public boolean not null default false;
alter table public.conversations add column if not exists channel_username text;
alter table public.conversations add column if not exists description text;
alter table public.conversations add column if not exists badge text not null default 'none' check (badge in ('none','blue','green','orange','red'));
alter table public.channels add column if not exists badge text not null default 'none' check (badge in ('none','blue','green','orange','red'));
alter table public.channels add column if not exists invite_token text;
create unique index if not exists channels_invite_token_uidx on public.channels(invite_token) where invite_token is not null;
create index if not exists conversations_channel_username_idx on public.conversations(channel_username) where channel_username is not null;

drop policy if exists conversations_admin_select on public.conversations;
drop policy if exists conversations_admin_update on public.conversations;
drop policy if exists conversations_admin_delete on public.conversations;
create policy conversations_admin_select on public.conversations for select to authenticated using(private.is_admin());
create policy conversations_admin_update on public.conversations for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy conversations_admin_delete on public.conversations for delete to authenticated using(private.is_admin());
drop policy if exists conversation_members_admin_select on public.conversation_members;
drop policy if exists conversation_members_admin_insert on public.conversation_members;
drop policy if exists conversation_members_admin_update on public.conversation_members;
drop policy if exists conversation_members_admin_delete on public.conversation_members;
create policy conversation_members_admin_select on public.conversation_members for select to authenticated using(private.is_admin());
create policy conversation_members_admin_insert on public.conversation_members for insert to authenticated with check(private.is_admin());
create policy conversation_members_admin_update on public.conversation_members for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy conversation_members_admin_delete on public.conversation_members for delete to authenticated using(private.is_admin());
drop policy if exists messages_admin_select on public.messages;
create policy messages_admin_select on public.messages for select to authenticated using(private.is_admin());

create or replace function public.edit_message(message_uuid uuid,new_content text) returns public.messages language plpgsql security definer set search_path=public,private as $$ declare me uuid:=auth.uid(); r public.messages; begin if me is null then raise exception 'not_authenticated'; end if; if coalesce(length(trim(new_content)),0)<1 or length(new_content)>4000 then raise exception 'invalid_message'; end if; if not exists(select 1 from public.messages m where m.id=message_uuid and m.deleted_at is null and (m.sender_id=me or private.is_admin())) then raise exception 'not_allowed'; end if; update public.messages set content=trim(new_content),edited_at=now() where id=message_uuid returning * into r; return r; end; $$;
revoke all on function public.edit_message(uuid,text) from public,anon;
grant execute on function public.edit_message(uuid,text) to authenticated;

create or replace function public.delete_message(message_uuid uuid) returns public.messages language plpgsql security definer set search_path=public,private as $$ declare me uuid:=auth.uid(); r public.messages; begin if me is null then raise exception 'not_authenticated'; end if; if not exists(select 1 from public.messages m where m.id=message_uuid and m.deleted_at is null and (m.sender_id=me or private.is_admin())) then raise exception 'not_allowed'; end if; update public.messages set content=null,file_url=null,file_type=null,file_name=null,message_type='deleted',deleted_at=now(),edited_at=null where id=message_uuid returning * into r; return r; end; $$;
revoke all on function public.delete_message(uuid) from public,anon;
grant execute on function public.delete_message(uuid) to authenticated;

create or replace function public.admin_set_conversation_badge(conversation_uuid uuid,badge_value text) returns boolean language plpgsql security definer set search_path=public,private as $$ begin if not private.is_admin() then raise exception 'forbidden'; end if; if badge_value not in ('none','blue','green','orange','red') then raise exception 'invalid_badge'; end if; update public.conversations set badge=badge_value where id=conversation_uuid; return found; end; $$;
revoke all on function public.admin_set_conversation_badge(uuid,text) from public,anon;
grant execute on function public.admin_set_conversation_badge(uuid,text) to authenticated;

create or replace function public.admin_set_channel_badge(channel_uuid uuid,badge_value text) returns boolean language plpgsql security definer set search_path=public,private as $$ begin if not private.is_admin() then raise exception 'forbidden'; end if; if badge_value not in ('none','blue','green','orange','red') then raise exception 'invalid_badge'; end if; update public.channels set badge=badge_value where id=channel_uuid; update public.conversations set badge=badge_value where id=channel_uuid and is_channel=true; return found; end; $$;
revoke all on function public.admin_set_channel_badge(uuid,text) from public,anon;
grant execute on function public.admin_set_channel_badge(uuid,text) to authenticated;

create or replace function public.admin_update_conversation(conversation_uuid uuid,new_title text,new_description text,new_public boolean) returns boolean language plpgsql security definer set search_path=public,private as $$ begin if not private.is_admin() then raise exception 'forbidden'; end if; if coalesce(length(trim(new_title)),0)<1 or length(trim(new_title))>80 then raise exception 'invalid_title'; end if; update public.conversations set title=trim(new_title),description=left(coalesce(new_description,''),500),is_public=new_public where id=conversation_uuid and type='group'; return found; end; $$;
revoke all on function public.admin_update_conversation(uuid,text,text,boolean) from public,anon;
grant execute on function public.admin_update_conversation(uuid,text,text,boolean) to authenticated;

create or replace function public.admin_delete_conversation(conversation_uuid uuid) returns boolean language plpgsql security definer set search_path=public,private as $$ begin if not private.is_admin() then raise exception 'forbidden'; end if; delete from public.conversations where id=conversation_uuid and type='group' and coalesce(is_channel,false)=false; return found; end; $$;
revoke all on function public.admin_delete_conversation(uuid) from public,anon;
grant execute on function public.admin_delete_conversation(uuid) to authenticated;

create or replace function public.admin_delete_channel(channel_uuid uuid) returns boolean language plpgsql security definer set search_path=public,private as $$ declare n integer; begin if not private.is_admin() then raise exception 'forbidden'; end if; delete from public.channels where id=channel_uuid; get diagnostics n=row_count; delete from public.conversations where id=channel_uuid and is_channel=true; return n>0; end; $$;
revoke all on function public.admin_delete_channel(uuid) from public,anon;
grant execute on function public.admin_delete_channel(uuid) to authenticated;

create or replace function public.join_channel_by_invite(invite_value text) returns uuid language plpgsql security definer set search_path=public,private as $$ declare me uuid:=auth.uid(); cid uuid; begin if me is null then raise exception 'not_authenticated'; end if; select id into cid from public.channels where invite_token=trim(invite_value) limit 1; if cid is null then raise exception 'invalid_invite'; end if; insert into public.channel_members(channel_id,user_id,role) values(cid,me,'member') on conflict(channel_id,user_id) do nothing; insert into public.conversation_members(conversation_id,user_id,role,left_at) values(cid,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null; return cid; end; $$;
revoke all on function public.join_channel_by_invite(text) from public,anon;
grant execute on function public.join_channel_by_invite(text) to authenticated;

create or replace function public.join_public_channel(channel_uuid uuid) returns uuid language plpgsql security definer set search_path=public,private as $$ declare me uuid:=auth.uid(); begin if me is null then raise exception 'not_authenticated'; end if; if not exists(select 1 from public.channels where id=channel_uuid and is_public=true) then raise exception 'channel_not_found'; end if; insert into public.channel_members(channel_id,user_id,role) values(channel_uuid,me,'member') on conflict(channel_id,user_id) do nothing; insert into public.conversation_members(conversation_id,user_id,role,left_at) values(channel_uuid,me,'member',null) on conflict(conversation_id,user_id) do update set left_at=null; return channel_uuid; end; $$;
revoke all on function public.join_public_channel(uuid) from public,anon;
grant execute on function public.join_public_channel(uuid) to authenticated;
