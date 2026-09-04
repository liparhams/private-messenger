begin;

create or replace function private.is_support_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('support','admin')
  );
$$;

revoke all on function private.is_support_staff() from public;

drop policy if exists support_chats_select on public.support_chats;
drop policy if exists support_chats_update on public.support_chats;
create policy support_chats_select on public.support_chats for select to authenticated
using (user_id = (select auth.uid()) or private.is_support_staff());
create policy support_chats_update on public.support_chats for update to authenticated
using (user_id = (select auth.uid()) or private.is_support_staff())
with check (user_id = (select auth.uid()) or private.is_support_staff());

drop policy if exists support_chat_messages_select on public.support_chat_messages;
drop policy if exists support_chat_messages_insert on public.support_chat_messages;
create policy support_chat_messages_select on public.support_chat_messages for select to authenticated
using (exists (select 1 from public.support_chats c where c.id = support_chat_messages.chat_id and (c.user_id = (select auth.uid()) or private.is_support_staff())));
create policy support_chat_messages_insert on public.support_chat_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and exists (select 1 from public.support_chats c where c.id = support_chat_messages.chat_id and (c.user_id = (select auth.uid()) or private.is_support_staff())));

drop policy if exists support_tickets_select on public.support_tickets;
drop policy if exists users_and_staff_can_read_tickets on public.support_tickets;
create policy support_tickets_select on public.support_tickets for select to authenticated
using (user_id = (select auth.uid()) or private.is_support_staff());

drop policy if exists support_tickets_update on public.support_tickets;
drop policy if exists staff_can_update_tickets on public.support_tickets;
create policy support_tickets_update on public.support_tickets for update to authenticated
using (user_id = (select auth.uid()) or private.is_support_staff())
with check (user_id = (select auth.uid()) or private.is_support_staff());

drop policy if exists support_ticket_messages_select on public.support_ticket_messages;
create policy support_ticket_messages_select on public.support_ticket_messages for select to authenticated
using (exists (select 1 from public.support_tickets t where t.id = support_ticket_messages.ticket_id and (t.user_id = (select auth.uid()) or private.is_support_staff())));

drop policy if exists support_ticket_messages_insert on public.support_ticket_messages;
create policy support_ticket_messages_insert on public.support_ticket_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and exists (select 1 from public.support_tickets t where t.id = support_ticket_messages.ticket_id and (t.user_id = (select auth.uid()) or private.is_support_staff())));

create or replace function public.update_support_ticket(ticket_uuid uuid, new_status text, new_priority text)
returns boolean language plpgsql security definer set search_path = public, private as $$
declare before_row public.support_tickets; after_row public.support_tickets;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not private.is_support_staff() then raise exception 'forbidden'; end if;
  if new_status not in ('open','pending','closed') then raise exception 'invalid_ticket_status'; end if;
  if new_priority not in ('low','normal','high','urgent') then raise exception 'invalid_ticket_priority'; end if;
  select * into before_row from public.support_tickets where id = ticket_uuid for update;
  if before_row.id is null then raise exception 'ticket_not_found'; end if;
  update public.support_tickets set status = new_status, priority = new_priority, updated_at = now() where id = ticket_uuid returning * into after_row;
  insert into public.admin_logs(admin_id,action,details) values (auth.uid(),'support_ticket_update',jsonb_build_object('ticket_id',ticket_uuid,'status_from',before_row.status,'status_to',after_row.status,'priority_from',before_row.priority,'priority_to',after_row.priority));
  return true;
end;
$$;
revoke all on function public.update_support_ticket(uuid,text,text) from public,anon;
grant execute on function public.update_support_ticket(uuid,text,text) to authenticated;

create or replace function public.close_support_chat(chat_uuid uuid)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not private.is_support_staff() then raise exception 'forbidden'; end if;
  update public.support_chats set status='closed' where id=chat_uuid;
end;
$$;
revoke all on function public.close_support_chat(uuid) from public,anon;
grant execute on function public.close_support_chat(uuid) to authenticated;

commit;
