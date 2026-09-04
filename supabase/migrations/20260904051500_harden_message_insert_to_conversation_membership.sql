DROP POLICY IF EXISTS messages_insert_sender_v2 ON public.messages;
CREATE POLICY messages_insert_sender_v3 ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND conversation_id IS NOT NULL
  AND private.is_conversation_member(conversation_id, auth.uid())
  AND (receiver_id IS NULL OR receiver_id <> auth.uid())
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.is_channel = true
      AND c.created_by <> auth.uid()
  )
);
