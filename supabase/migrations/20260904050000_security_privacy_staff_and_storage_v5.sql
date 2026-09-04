BEGIN;

CREATE OR REPLACE FUNCTION private.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','support')
  );
$$;
GRANT EXECUTE ON FUNCTION private.is_staff() TO authenticated;

DROP POLICY IF EXISTS support_chats_select ON public.support_chats;
DROP POLICY IF EXISTS support_chats_update ON public.support_chats;
CREATE POLICY support_chats_select ON public.support_chats FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_staff());
CREATE POLICY support_chats_update ON public.support_chats FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR private.is_staff())
WITH CHECK (user_id = auth.uid() OR private.is_staff());

DROP POLICY IF EXISTS support_chat_messages_select ON public.support_chat_messages;
DROP POLICY IF EXISTS support_chat_messages_insert ON public.support_chat_messages;
CREATE POLICY support_chat_messages_select ON public.support_chat_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.support_chats c WHERE c.id = chat_id AND (c.user_id = auth.uid() OR private.is_staff())));
CREATE POLICY support_chat_messages_insert ON public.support_chat_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.support_chats c WHERE c.id = chat_id AND (c.user_id = auth.uid() OR private.is_staff())));

DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
DROP POLICY IF EXISTS users_and_staff_can_read_tickets ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_update ON public.support_tickets;
DROP POLICY IF EXISTS staff_can_update_tickets ON public.support_tickets;
CREATE POLICY support_tickets_select ON public.support_tickets FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_staff());
CREATE POLICY support_tickets_update ON public.support_tickets FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR private.is_staff())
WITH CHECK (user_id = auth.uid() OR private.is_staff());

DROP POLICY IF EXISTS support_ticket_messages_select ON public.support_ticket_messages;
DROP POLICY IF EXISTS support_ticket_messages_insert ON public.support_ticket_messages;
CREATE POLICY support_ticket_messages_select ON public.support_ticket_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR private.is_staff())));
CREATE POLICY support_ticket_messages_insert ON public.support_ticket_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR private.is_staff())));

REVOKE ALL ON TABLE public.profiles FROM anon, public;
REVOKE SELECT ON TABLE public.profiles FROM authenticated;
GRANT SELECT (id,username,display_name,public_id,is_verified,verification,role,is_banned,banned_until) ON TABLE public.profiles TO authenticated;
GRANT UPDATE (display_name) ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE(id uuid,username text,display_name text,public_id text,role text,is_verified boolean,verification text,is_banned boolean,banned_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private'
AS $$ SELECT p.id,p.username,p.display_name,p.public_id,p.role,p.is_verified,p.verification,p.is_banned,p.banned_until FROM public.profiles p WHERE p.id=auth.uid(); $$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM anon, public;

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE(id uuid,username text,display_name text,role text,public_id text,is_verified boolean,is_banned boolean,verification text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public','private'
AS $$ SELECT p.id,p.username,p.display_name,p.role,p.public_id,p.is_verified,p.is_banned,p.verification,p.created_at FROM public.profiles p WHERE private.is_admin() ORDER BY p.created_at DESC; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_list_profiles() FROM anon, public;

REVOKE ALL ON TABLE public.channel_members FROM anon, public;
REVOKE INSERT,UPDATE,DELETE ON TABLE public.channel_members FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON TABLE public.channels FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON TABLE public.app_settings FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON TABLE public.admin_logs FROM authenticated;
REVOKE DELETE,UPDATE ON TABLE public.messages FROM authenticated;
REVOKE DELETE,UPDATE ON TABLE public.message_reads FROM authenticated;
REVOKE ALL ON TABLE public.conversation_members FROM anon, public;
REVOKE ALL ON TABLE public.conversations FROM anon, public;

UPDATE storage.buckets SET file_size_limit=15728640,allowed_mime_types=ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','text/csv','audio/mpeg','audio/ogg','audio/wav','video/mp4','video/webm'] WHERE id='chat-files';

CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON public.profiles(lower(display_name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_id_unique ON public.profiles(public_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(conversation_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at ON public.messages(sender_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created_at ON public.messages(receiver_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_seen_at ON public.message_reads(user_id,seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_left ON public.conversation_members(user_id,left_at,conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_public_discoverable ON public.conversations(is_public,discoverable,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_username_lower ON public.conversations(lower(channel_username)) WHERE is_channel=true;

COMMIT;
