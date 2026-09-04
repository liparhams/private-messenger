REVOKE ALL ON TABLE public.channels FROM anon;
REVOKE ALL ON TABLE public.channel_members FROM anon;
REVOKE ALL ON TABLE public.conversations FROM anon;
REVOKE ALL ON TABLE public.conversation_members FROM anon;
REVOKE ALL ON TABLE public.messages FROM anon;
REVOKE ALL ON TABLE public.message_reads FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.support_chats FROM anon;
REVOKE ALL ON TABLE public.support_chat_messages FROM anon;
REVOKE ALL ON TABLE public.support_tickets FROM anon;
REVOKE ALL ON TABLE public.support_ticket_messages FROM anon;
REVOKE ALL ON TABLE public.admin_logs FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.channels FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.channel_members FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.conversations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.conversation_members FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.message_reads FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLE public.admin_logs FROM authenticated;
