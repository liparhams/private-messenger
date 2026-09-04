begin;

-- Ticket ownership and staff workflow: users can create/read their own tickets,
-- but status/priority changes are performed only by staff through the guarded RPC.
drop policy if exists support_tickets_update on public.support_tickets;
create policy support_tickets_update_staff
on public.support_tickets
for update
to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create or replace function public.update_support_ticket(ticket_uuid uuid, new_status text, new_priority text)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
declare
  changed boolean;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not private.is_staff() then raise exception 'permission_denied'; end if;
  if new_status not in ('open','pending','closed') then raise exception 'invalid_ticket_status'; end if;
  if new_priority not in ('low','normal','high','urgent') then raise exception 'invalid_ticket_priority'; end if;

  update public.support_tickets
     set status = new_status,
         priority = new_priority,
         updated_at = now()
   where id = ticket_uuid;
  changed := found;
  if not changed then raise exception 'ticket_not_found'; end if;

  return true;
end;
$$;

revoke execute on function public.update_support_ticket(uuid,text,text) from anon;
grant execute on function public.update_support_ticket(uuid,text,text) to authenticated;

commit;
