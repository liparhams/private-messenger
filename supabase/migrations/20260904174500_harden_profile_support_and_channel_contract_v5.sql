-- UTINOCHATV1 security/contract hardening v5

drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists admins_can_write_admin_logs on public.admin_logs;

drop policy if exists support_chats_update on public.support_chats;
create policy support_chats_update_staff on public.support_chats
for update to authenticated
using (private.is_staff())
with check (private.is_staff());

drop policy if exists support_tickets_update on public.support_tickets;
create policy support_tickets_update_staff on public.support_tickets
for update to authenticated
using (private.is_staff())
with check (private.is_staff());

do $$ begin
  if not exists (select 1 from pg_constraint where conname='support_chats_status_check' and conrelid='public.support_chats'::regclass) then
    alter table public.support_chats add constraint support_chats_status_check check (status in ('open','closed'));
  end if;
  if not exists (select 1 from pg_constraint where conname='support_chat_messages_content_length_check' and conrelid='public.support_chat_messages'::regclass) then
    alter table public.support_chat_messages add constraint support_chat_messages_content_length_check check (length(trim(content)) between 1 and 4000);
  end if;
  if not exists (select 1 from pg_constraint where conname='support_tickets_status_check' and conrelid='public.support_tickets'::regclass) then
    alter table public.support_tickets add constraint support_tickets_status_check check (status in ('open','pending','closed'));
  end if;
  if not exists (select 1 from pg_constraint where conname='support_tickets_priority_check' and conrelid='public.support_tickets'::regclass) then
    alter table public.support_tickets add constraint support_tickets_priority_check check (priority in ('low','normal','high','urgent'));
  end if;
  if not exists (select 1 from pg_constraint where conname='support_tickets_subject_length_check' and conrelid='public.support_tickets'::regclass) then
    alter table public.support_tickets add constraint support_tickets_subject_length_check check (length(trim(subject)) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conname='support_ticket_messages_content_length_check' and conrelid='public.support_ticket_messages'::regclass) then
    alter table public.support_ticket_messages add constraint support_ticket_messages_content_length_check check (length(trim(content)) between 1 and 4000);
  end if;
end $$;

create or replace function public.get_or_create_support_chat()
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare cid uuid; me uuid := auth.uid();
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select id into cid from public.support_chats where user_id=me;
  if cid is null then
    insert into public.support_chats(user_id,status,hidden_at) values(me,'open',null) returning id into cid;
  else
    update public.support_chats set status='open', hidden_at=null, updated_at=now() where id=cid and user_id=me;
  end if;
  return cid;
end;
$$;
revoke all on function public.get_or_create_support_chat() from anon;
grant execute on function public.get_or_create_support_chat() to authenticated;

create or replace function public.admin_update_channel(channel_uuid uuid, new_title text, new_description text, new_public boolean, new_username text)
returns boolean
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare v_username text := nullif(lower(trim(coalesce(new_username,''))),''); v_invite text;
begin
  if not private.is_admin() then raise exception 'permission_denied'; end if;
  if length(trim(coalesce(new_title,''))) < 1 or length(trim(new_title)) > 128 then raise exception 'invalid_title'; end if;
  if length(trim(coalesce(new_description,''))) > 1000 then raise exception 'invalid_description'; end if;
  if coalesce(new_public,false) then
    if v_username is null then raise exception 'username_required_for_public_channel'; end if;
    if v_username !~ '^[a-z0-9_]{3,20}$' then raise exception 'invalid_channel_username'; end if;
    if exists(select 1 from public.channels where lower(username)=v_username and id<>channel_uuid)
       or exists(select 1 from public.conversations where is_channel=true and lower(channel_username)=v_username and id<>channel_uuid) then
      raise exception 'channel_username_exists';
    end if;
    update public.conversations set title=trim(new_title),description=trim(coalesce(new_description,'')),is_public=true,discoverable=true,channel_username=v_username,invite_token=null where id=channel_uuid and type='group' and is_channel=true;
    update public.channels set title=trim(new_title),description=trim(coalesce(new_description,'')),is_public=true,username=v_username,invite_token=null where id=channel_uuid;
  else
    v_invite := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
    update public.conversations set title=trim(new_title),description=trim(coalesce(new_description,'')),is_public=false,discoverable=false,channel_username=null,invite_token=v_invite where id=channel_uuid and type='group' and is_channel=true;
    update public.channels set title=trim(new_title),description=trim(coalesce(new_description,'')),is_public=false,username=null,invite_token=v_invite where id=channel_uuid;
  end if;
  return found;
end;
$$;
revoke all on function public.admin_update_channel(uuid,text,text,boolean,text) from anon,authenticated;

revoke insert on public.admin_logs from authenticated,anon;
