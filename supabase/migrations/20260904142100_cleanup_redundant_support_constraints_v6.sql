-- Keep the original support constraints; remove redundant duplicate checks added by v5.
alter table public.support_chat_messages drop constraint if exists support_chat_messages_content_length_check;
alter table public.support_ticket_messages drop constraint if exists support_ticket_messages_content_length_check;
alter table public.support_tickets drop constraint if exists support_tickets_subject_length_check;
