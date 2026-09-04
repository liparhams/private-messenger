create or replace function public.create_support_ticket(
  p_subject text,
  p_content text
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket_id uuid;
  v_subject text := trim(coalesce(p_subject, ''));
  v_content text := trim(coalesce(p_content, ''));
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if char_length(v_subject) < 3 or char_length(v_subject) > 120 then
    raise exception 'invalid_ticket_subject';
  end if;

  if char_length(v_content) < 1 or char_length(v_content) > 4000 then
    raise exception 'invalid_ticket_message';
  end if;

  insert into public.support_tickets (user_id, subject, status, priority)
  values (v_user_id, v_subject, 'open', 'normal')
  returning id into v_ticket_id;

  insert into public.support_ticket_messages (ticket_id, sender_id, content)
  values (v_ticket_id, v_user_id, v_content);

  return v_ticket_id;
end;
$$;

revoke all on function public.create_support_ticket(text, text) from public;
grant execute on function public.create_support_ticket(text, text) to authenticated;

create or replace function public.touch_support_ticket_from_message()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  update public.support_tickets
  set updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists support_ticket_message_touch on public.support_ticket_messages;
create trigger support_ticket_message_touch
after insert on public.support_ticket_messages
for each row execute function public.touch_support_ticket_from_message();
