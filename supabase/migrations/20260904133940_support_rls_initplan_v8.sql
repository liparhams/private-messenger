BEGIN;

DROP POLICY IF EXISTS support_chats_select ON public.support_chats;
CREATE POLICY support_chats_select ON public.support_chats FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()));

DROP POLICY IF EXISTS support_chats_update ON public.support_chats;
CREATE POLICY support_chats_update ON public.support_chats FOR UPDATE TO authenticated
USING ((user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()))
WITH CHECK ((user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()));

DROP POLICY IF EXISTS support_chat_messages_select ON public.support_chat_messages;
CREATE POLICY support_chat_messages_select ON public.support_chat_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.support_chats c WHERE c.id = chat_id AND ((c.user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()))));

DROP POLICY IF EXISTS support_chat_messages_insert ON public.support_chat_messages;
CREATE POLICY support_chat_messages_insert ON public.support_chat_messages FOR INSERT TO authenticated
WITH CHECK ((sender_id = (SELECT auth.uid())) AND EXISTS (SELECT 1 FROM public.support_chats c WHERE c.id = chat_id AND ((c.user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()))));

DROP POLICY IF EXISTS support_tickets_select ON public.support_tickets;
CREATE POLICY support_tickets_select ON public.support_tickets FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()));

DROP POLICY IF EXISTS support_tickets_update ON public.support_tickets;
CREATE POLICY support_tickets_update ON public.support_tickets FOR UPDATE TO authenticated
USING ((user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()))
WITH CHECK ((user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()));

DROP POLICY IF EXISTS support_ticket_messages_select ON public.support_ticket_messages;
CREATE POLICY support_ticket_messages_select ON public.support_ticket_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND ((t.user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()))));

DROP POLICY IF EXISTS support_ticket_messages_insert ON public.support_ticket_messages;
CREATE POLICY support_ticket_messages_insert ON public.support_ticket_messages FOR INSERT TO authenticated
WITH CHECK ((sender_id = (SELECT auth.uid())) AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND ((t.user_id = (SELECT auth.uid())) OR (SELECT private.is_staff()))));

DROP POLICY IF EXISTS channels_select ON public.channels;
CREATE POLICY channels_select ON public.channels FOR SELECT TO authenticated
USING ((is_public) OR (owner_id = (SELECT auth.uid())) OR EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channels.id AND cm.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS channel_members_select ON public.channel_members;
CREATE POLICY channel_members_select ON public.channel_members FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_members.channel_id AND c.owner_id = (SELECT auth.uid())));

COMMIT;
