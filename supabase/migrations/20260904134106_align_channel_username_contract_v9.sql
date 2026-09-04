BEGIN;

CREATE OR REPLACE FUNCTION public.create_conversation(
  p_kind text,
  p_title text,
  p_description text DEFAULT '',
  p_is_public boolean DEFAULT false,
  p_username text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','private'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_id uuid;
  v_kind text := lower(trim(coalesce(p_kind,'')));
  v_title text := trim(coalesce(p_title,''));
  v_description text := trim(coalesce(p_description,''));
  v_username text := nullif(lower(trim(coalesce(p_username,''))),'');
  v_public boolean := coalesce(p_is_public,false);
  v_invite text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF v_kind NOT IN ('group','channel') THEN RAISE EXCEPTION 'invalid_conversation_kind'; END IF;
  IF length(v_title) < 1 OR length(v_title) > 128 THEN RAISE EXCEPTION 'invalid_title'; END IF;
  IF length(v_description) > 1000 THEN RAISE EXCEPTION 'invalid_description'; END IF;

  IF v_kind = 'channel' THEN
    IF v_public AND v_username IS NULL THEN RAISE EXCEPTION 'username_required_for_public_channel'; END IF;
    IF v_username IS NOT NULL AND v_username !~ '^[a-z0-9_]{3,20}$' THEN RAISE EXCEPTION 'invalid_channel_username'; END IF;
    IF v_username IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.conversations c WHERE c.is_channel=true AND lower(c.channel_username)=v_username)
      OR EXISTS (SELECT 1 FROM public.channels c WHERE lower(c.username)=v_username)
    ) THEN RAISE EXCEPTION 'channel_username_exists'; END IF;
  ELSE
    IF v_username IS NOT NULL THEN RAISE EXCEPTION 'invalid_group_username'; END IF;
  END IF;

  v_invite := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');

  INSERT INTO public.conversations(type,title,created_by,is_channel,description,channel_username,is_public,discoverable,badge,invite_token)
  VALUES('group',v_title,v_user,v_kind='channel',v_description,v_username,v_public,v_public,'none',CASE WHEN v_public THEN NULL ELSE v_invite END)
  RETURNING id INTO v_id;

  INSERT INTO public.conversation_members(conversation_id,user_id,role,left_at)
  VALUES(v_id,v_user,'owner',NULL);

  IF v_kind = 'channel' THEN
    INSERT INTO public.channels(id,owner_id,title,username,description,is_public,badge,invite_token)
    VALUES(v_id,v_user,v_title,v_username,v_description,v_public,'none',CASE WHEN v_public THEN NULL ELSE v_invite END);
    INSERT INTO public.channel_members(channel_id,user_id,role)
    VALUES(v_id,v_user,'owner');
  END IF;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    IF v_kind = 'channel' THEN RAISE EXCEPTION 'channel_username_exists'; END IF;
    RAISE EXCEPTION 'conversation_create_failed';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conversation(text,text,text,boolean,text) TO authenticated;
COMMIT;
