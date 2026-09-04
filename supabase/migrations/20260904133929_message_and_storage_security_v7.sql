BEGIN;

DROP POLICY IF EXISTS messages_insert_sender_v4 ON public.messages;
CREATE POLICY messages_insert_sender_v5
ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND conversation_id IS NOT NULL
  AND private.is_conversation_member(conversation_id)
  AND (
    receiver_id IS NULL
    OR (
      sender_id <> receiver_id
      AND EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = messages.conversation_id
          AND cm.user_id = messages.receiver_id
          AND cm.left_at IS NULL
      )
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND c.is_channel
      AND c.created_by <> (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS chat_files_insert ON storage.objects;
DROP POLICY IF EXISTS chat_files_select ON storage.objects;
DROP POLICY IF EXISTS chat_files_update ON storage.objects;
DROP POLICY IF EXISTS chat_files_delete ON storage.objects;

CREATE POLICY chat_files_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY chat_files_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-files' AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.file_url = storage.objects.name
        AND m.deleted_at IS NULL
        AND m.conversation_id IS NOT NULL
        AND private.is_conversation_member(m.conversation_id)
    )
  )
);

CREATE POLICY chat_files_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
WITH CHECK (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY chat_files_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-files' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE INDEX IF NOT EXISTS idx_channels_public_username_lower ON public.channels(lower(username)) WHERE is_public = true;
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_username_format_check;
ALTER TABLE public.channels ADD CONSTRAINT channels_username_format_check CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');

COMMIT;
