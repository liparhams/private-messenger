CREATE OR REPLACE FUNCTION public.get_unread_counts(p_conversation_ids uuid[])
RETURNS TABLE(conversation_id uuid, unread_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public','private'
AS $function$
  SELECT m.conversation_id, count(*)::integer
  FROM public.messages m
  WHERE m.conversation_id = ANY(coalesce(p_conversation_ids, '{}'::uuid[]))
    AND m.deleted_at IS NULL
    AND m.sender_id <> auth.uid()
    AND private.is_conversation_member(m.conversation_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.message_reads r
      WHERE r.message_id=m.id AND r.user_id=auth.uid()
    )
  GROUP BY m.conversation_id;
$function$;
REVOKE ALL ON FUNCTION public.get_unread_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_unread_counts(uuid[]) TO authenticated;
