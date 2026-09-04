-- UTINOCHATV1 canonical platform invariants and least-privilege cleanup

DO $$ BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_community_visibility_ck
    CHECK (type='direct' OR discoverable = is_public);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_channel_username_ck
    CHECK (is_channel OR channel_username IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_public_channel_username_ck
    CHECK (NOT is_channel OR NOT is_public OR (channel_username IS NOT NULL AND channel_username ~ '^[a-z0-9_]{3,20}$'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.channels
    ADD CONSTRAINT channels_visibility_username_ck
    CHECK ((is_public = true AND username IS NOT NULL AND username ~ '^[a-z0-9_]{3,20}$') OR (is_public = false AND username IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_public_channel_username_uq
  ON public.conversations (lower(channel_username))
  WHERE is_channel = true AND channel_username IS NOT NULL;

CREATE INDEX IF NOT EXISTS conversations_discovery_idx
  ON public.conversations (is_public, discoverable, is_channel, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS message_reads_user_message_idx
  ON public.message_reads (user_id, message_id);

CREATE INDEX IF NOT EXISTS conversation_members_conversation_active_idx
  ON public.conversation_members (conversation_id, left_at, user_id);

REVOKE EXECUTE ON FUNCTION public.touch_support_chat() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_support_chats_fn() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_support_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
