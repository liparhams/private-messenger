-- UTINOCHATV1: one public-join contract and stronger message integrity.
DROP FUNCTION IF EXISTS public.join_public_community(uuid);

CREATE OR REPLACE FUNCTION public.join_conversation(p_conversation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public','private'
AS $$
declare
  me uuid := auth.uid();
  target public.conversations%rowtype;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select c.* into target from public.conversations c
  where c.id = p_conversation_id and c.type = 'group' and c.is_public = true and c.discoverable = true;
  if not found then raise exception 'public_conversation_not_found'; end if;
  if target.is_channel and not exists (select 1 from public.channels ch where ch.id = target.id and ch.is_public = true) then
    raise exception 'public_conversation_not_found';
  end if;
  insert into public.conversation_members(conversation_id,user_id,role,left_at)
  values(target.id,me,'member',null)
  on conflict(conversation_id,user_id) do update set left_at = null;
  if target.is_channel then
    insert into public.channel_members(channel_id,user_id,role)
    values(target.id,me,'member')
    on conflict(channel_id,user_id) do update set role='member';
  end if;
  return target.id;
end;
$$;
GRANT EXECUTE ON FUNCTION public.join_conversation(uuid) TO authenticated;

DROP POLICY IF EXISTS messages_insert_sender_v6 ON public.messages;
CREATE POLICY messages_insert_sender_v7 ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND conversation_id IS NOT NULL
  AND private.is_conversation_member(conversation_id)
  AND ((message_type='text' AND length(trim(coalesce(content,''))) BETWEEN 1 AND 4000 AND file_url IS NULL AND file_name IS NULL AND file_type IS NULL)
    OR (message_type='file' AND file_url IS NOT NULL AND (storage.foldername(file_url))[1]=((SELECT auth.uid())::text) AND length(trim(coalesce(file_name,''))) BETWEEN 1 AND 120 AND file_type IS NOT NULL))
  AND EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id=messages.conversation_id
      AND (((c.type='direct' AND c.is_channel=false AND messages.receiver_id IS NOT NULL AND messages.receiver_id<>(SELECT auth.uid())
             AND EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id=c.id AND cm.user_id=messages.receiver_id AND cm.left_at IS NULL))
           OR (c.type='group' AND messages.receiver_id IS NULL))
          AND (NOT c.is_channel OR c.created_by=(SELECT auth.uid())))
  )
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.profiles'::regclass AND conname='profiles_username_lowercase_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_lowercase_check CHECK (username=lower(username));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(conversation_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_message ON public.message_reads(user_id,message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_active ON public.conversation_members(conversation_id,user_id) WHERE left_at IS NULL;
