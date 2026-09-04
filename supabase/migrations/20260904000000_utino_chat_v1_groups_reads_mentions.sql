alter table public.conversations add column if not exists direct_key text;
create unique index if not exists conversations_direct_key_uidx on public.conversations(direct_key) where type='direct' and direct_key is not null;

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key(message_id,user_id)
);
create index if not exists message_reads_user_idx on public.message_reads(user_id,seen_at desc);
create index if not exists message_reads_message_idx on public.message_reads(message_id,seen_at desc);
alter table public.message_reads enable row level security;
revoke all on public.message_reads from anon;
grant select,insert,update on public.message_reads to authenticated;

drop policy if exists message_reads_select on public.message_reads;
drop policy if exists message_reads_insert on public.message_reads;
drop policy if exists message_reads_update on public.message_reads;
create policy message_reads_select on public.message_reads for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.messages m where m.id=message_reads.message_id and (m.sender_id=(select auth.uid()) or m.receiver_id=(select auth.uid()) or (m.conversation_id is not null and private.is_conversation_member(m.conversation_id)))));
create policy message_reads_insert on public.message_reads for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.messages m where m.id=message_reads.message_id and (m.sender_id=(select auth.uid()) or m.receiver_id=(select auth.uid()) or (m.conversation_id is not null and private.is_conversation_member(m.conversation_id)))));
create policy message_reads_update on public.message_reads for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create index if not exists conversation_members_user_active_idx on public.conversation_members(user_id,conversation_id) where left_at is null;

create or replace function private.direct_key_for(a uuid,b uuid) returns text language sql immutable as $$ select least(a,b)::text || ':' || greatest(a,b)::text $$;
revoke all on function private.direct_key_for(uuid,uuid) from public,anon;
grant execute on function private.direct_key_for(uuid,uuid) to authenticated;

create or replace function public.get_or_create_direct_conversation(other_user_id uuid) returns uuid language plpgsql security definer set search_path=public,private as $$ declare me uuid:=auth.uid(); cid uuid; begin if me is null then raise exception 'not_authenticated'; end if; if other_user_id is null or other_user_id=me then raise exception 'invalid_recipient'; end if; if not exists(select 1 from public.profiles where id=other_user_id) then raise exception 'user_not_found'; end if; select id into cid from public.conversations where type='direct' and direct_key=private.direct_key_for(me,other_user_id) limit 1; if cid is null then insert into public.conversations(type,title,created_by,direct_key) values('direct',null,me,private.direct_key_for(me,other_user_id)) returning id into cid; insert into public.conversation_members(conversation_id,user_id,role) values(cid,me,'owner'),(cid,other_user_id,'member') on conflict do nothing; else insert into public.conversation_members(conversation_id,user_id,role,left_at) values(cid,me,'member',null),(cid,other_user_id,'member',null) on conflict(conversation_id,user_id) do update set left_at=null; end if; return cid; end; $$;
revoke all on function public.get_or_create_direct_conversation(uuid) from public,anon;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

create or replace function public.create_group_conversation(group_title text,member_ids uuid[]) returns uuid language plpgsql security definer set search_path=public,private as $$ declare me uuid:=auth.uid(); cid uuid; uid uuid; begin if me is null then raise exception 'not_authenticated'; end if; if coalesce(length(trim(group_title)),0)<1 or length(trim(group_title))>80 then raise exception 'invalid_group_title'; end if; insert into public.conversations(type,title,created_by) values('group',trim(group_title),me) returning id into cid; insert into public.conversation_members(conversation_id,user_id,role) values(cid,me,'owner'); if member_ids is not null then foreach uid in array member_ids loop if uid is not null and uid<>me and exists(select 1 from public.profiles where id=uid) then insert into public.conversation_members(conversation_id,user_id,role) values(cid,uid,'member') on conflict do nothing; end if; end loop; end if; return cid; end; $$;
revoke all on function public.create_group_conversation(text,uuid[]) from public,anon;
grant execute on function public.create_group_conversation(text,uuid[]) to authenticated;

create or replace function public.add_conversation_member(conversation_uuid uuid,member_uuid uuid) returns boolean language plpgsql security definer set search_path=public,private as $$ begin if not private.can_manage_conversation(conversation_uuid) then raise exception 'not_allowed'; end if; if not exists(select 1 from public.profiles where id=member_uuid) then raise exception 'user_not_found'; end if; insert into public.conversation_members(conversation_id,user_id,role,left_at) values(conversation_uuid,member_uuid,'member',null) on conflict(conversation_id,user_id) do update set left_at=null; return true; end; $$;
revoke all on function public.add_conversation_member(uuid,uuid) from public,anon;
grant execute on function public.add_conversation_member(uuid,uuid) to authenticated;

create or replace function public.leave_conversation(conversation_uuid uuid) returns boolean language plpgsql security definer set search_path=public,private as $$ begin update public.conversation_members set left_at=now() where conversation_id=conversation_uuid and user_id=auth.uid(); return found; end; $$;
revoke all on function public.leave_conversation(uuid) from public,anon;
grant execute on function public.leave_conversation(uuid) to authenticated;

create or replace function public.mark_messages_seen(message_ids uuid[]) returns integer language plpgsql security definer set search_path=public,private as $$ declare n integer; begin if auth.uid() is null then raise exception 'not_authenticated'; end if; insert into public.message_reads(message_id,user_id,seen_at) select m.id,auth.uid(),now() from public.messages m where m.id=any(message_ids) and (m.sender_id=auth.uid() or m.receiver_id=auth.uid() or (m.conversation_id is not null and private.is_conversation_member(m.conversation_id))) on conflict(message_id,user_id) do update set seen_at=excluded.seen_at; get diagnostics n=row_count; return n; end; $$;
revoke all on function public.mark_messages_seen(uuid[]) from public,anon;
grant execute on function public.mark_messages_seen(uuid[]) to authenticated;

insert into public.conversations(type,created_by,direct_key)
select 'direct',(array_agg(x.sender_id order by x.created_at))[1],private.direct_key_for(x.sender_id,x.receiver_id)
from public.messages x where x.receiver_id is not null and x.sender_id<>x.receiver_id and x.conversation_id is null
and not exists(select 1 from public.conversations c where c.type='direct' and c.direct_key=private.direct_key_for(x.sender_id,x.receiver_id))
group by private.direct_key_for(x.sender_id,x.receiver_id),x.sender_id,x.receiver_id;
insert into public.conversation_members(conversation_id,user_id,role)
select c.id,v.id,case when v.id=c.created_by then 'owner' else 'member' end
from public.conversations c cross join lateral(values(split_part(c.direct_key,':',1)::uuid),(split_part(c.direct_key,':',2)::uuid)) v(id)
where c.type='direct' and c.direct_key is not null on conflict do nothing;
update public.messages m set conversation_id=c.id from public.conversations c where m.conversation_id is null and m.receiver_id is not null and c.type='direct' and c.direct_key=private.direct_key_for(m.sender_id,m.receiver_id);

alter publication supabase_realtime add table public.message_reads;
