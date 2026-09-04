REVOKE INSERT, DELETE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE(display_name) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_display_name ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.conversations FROM authenticated;
GRANT SELECT ON public.conversations TO authenticated;
DROP POLICY IF EXISTS conversations_member_insert ON public.conversations;
DROP POLICY IF EXISTS conversations_admin_update ON public.conversations;
DROP POLICY IF EXISTS conversations_admin_delete ON public.conversations;

REVOKE INSERT, UPDATE, DELETE ON public.conversation_members FROM authenticated;
GRANT SELECT ON public.conversation_members TO authenticated;
DROP POLICY IF EXISTS conversation_members_insert ON public.conversation_members;
DROP POLICY IF EXISTS conversation_members_update ON public.conversation_members;
DROP POLICY IF EXISTS conversation_members_admin_insert ON public.conversation_members;
DROP POLICY IF EXISTS conversation_members_admin_update ON public.conversation_members;
DROP POLICY IF EXISTS conversation_members_admin_delete ON public.conversation_members;

REVOKE INSERT, UPDATE, DELETE ON public.message_reads FROM authenticated;
GRANT SELECT ON public.message_reads TO authenticated;
DROP POLICY IF EXISTS message_reads_insert ON public.message_reads;
DROP POLICY IF EXISTS message_reads_update ON public.message_reads;
