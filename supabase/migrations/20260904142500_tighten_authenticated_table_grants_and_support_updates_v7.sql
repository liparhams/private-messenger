-- Defense-in-depth: client roles receive only operations used by the application.
revoke all on table public.profiles, public.conversations, public.conversation_members, public.messages, public.message_reads, public.channels, public.channel_members, public.support_chats, public.support_chat_messages, public.support_tickets, public.support_ticket_messages, public.admin_logs, public.app_settings from anon, authenticated;
grant select on table public.conversations, public.conversation_members, public.message_reads, public.channels, public.channel_members, public.admin_logs, public.app_settings to authenticated;
grant select, insert on table public.messages to authenticated;
grant select, insert on table public.support_chats, public.support_chat_messages, public.support_tickets, public.support_ticket_messages to authenticated;
grant update on table public.profiles to authenticated;

create or replace function public.update_support_ticket(ticket_uuid uuid, new_status text, new_priority text)
returns boolean
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare changed boolean;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not private.is_staff() then raise exception 'permission_denied'; end if;
  if new_status not in ('open','pending','closed') then raise exception 'invalid_ticket_status'; end if;
  if new_priority not in ('low','normal','high','urgent') then raise exception 'invalid_ticket_priority'; end if;
  update public.support_tickets set status=new_status, priority=new_priority, updated_at=now() where id=ticket_uuid;
  changed:=found;
  if not changed then raise exception 'ticket_not_found'; end if;
  return true;
end;
$$;
revoke all on function public.update_support_ticket(uuid,text,text) from public,anon,authenticated;
grant execute on function public.update_support_ticket(uuid,text,text) to authenticated;

alter default privileges in schema public revoke select,insert,update,delete,truncate,references,trigger on tables from anon,authenticated;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated;
alter default privileges in schema public revoke usage,select,update on sequences from anon,authenticated;
