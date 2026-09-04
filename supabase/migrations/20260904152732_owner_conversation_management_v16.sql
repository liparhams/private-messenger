-- Owner/admin-safe member removal and private invite management.
GRANT EXECUTE ON FUNCTION public.add_conversation_member(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_conversation_member(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','private'
AS $function$
DECLARE me uuid := auth.uid(); role_to_remove text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id=conversation_uuid AND cm.user_id=me
      AND cm.left_at IS NULL AND cm.role IN ('owner','admin')
  ) AND NOT private.is_admin() THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
  SELECT cm.role INTO role_to_remove
  FROM public.conversation_members cm
  WHERE cm.conversation_id=conversation_uuid AND cm.user_id=user_uuid AND cm.left_at IS NULL;
  IF role_to_remove IS NULL THEN RETURN false; END IF;
  IF role_to_remove='owner' THEN RAISE EXCEPTION 'cannot_remove_owner'; END IF;
  UPDATE public.conversation_members SET left_at=now() WHERE conversation_id=conversation_uuid AND user_id=user_uuid;
  UPDATE public.channel_members SET role='member' WHERE channel_id=conversation_uuid AND user_id=user_uuid;
  RETURN true;
END;
$function$;
REVOKE ALL ON FUNCTION public.remove_conversation_member(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_conversation_member(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_conversation_invite(conversation_uuid uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public','private'
AS $function$
DECLARE me uuid := auth.uid(); token text;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT c.invite_token INTO token
  FROM public.conversations c
  WHERE c.id=conversation_uuid AND c.is_public=false
    AND (c.created_by=me OR private.is_admin() OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id=c.id AND cm.user_id=me AND cm.left_at IS NULL AND cm.role IN ('owner','admin')
    ));
  IF token IS NULL THEN RAISE EXCEPTION 'permission_denied'; END IF;
  RETURN token;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_conversation_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_invite(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.regenerate_conversation_invite(conversation_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','private'
AS $function$
DECLARE me uuid := auth.uid(); token text; is_channel_conversation boolean;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT c.is_channel INTO is_channel_conversation
  FROM public.conversations c
  WHERE c.id=conversation_uuid AND c.is_public=false
    AND (c.created_by=me OR private.is_admin() OR EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id=c.id AND cm.user_id=me AND cm.left_at IS NULL AND cm.role IN ('owner','admin')
    ));
  IF NOT FOUND THEN RAISE EXCEPTION 'permission_denied'; END IF;
  token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  UPDATE public.conversations SET invite_token=token WHERE id=conversation_uuid;
  IF coalesce(is_channel_conversation,false) THEN
    UPDATE public.channels SET invite_token=token WHERE id=conversation_uuid;
  END IF;
  RETURN token;
END;
$function$;
REVOKE ALL ON FUNCTION public.regenerate_conversation_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.regenerate_conversation_invite(uuid) TO authenticated;
