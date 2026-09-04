-- UTINOCHATV1 hardening: close anonymous SECURITY DEFINER exposure and establish one creation/join contract.
ALTER FUNCTION private.direct_key_for(uuid,uuid) SET search_path = private, public;
REVOKE ALL ON FUNCTION public.close_support_chat(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.join_public_community(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.set_conversation_badge(uuid,text) FROM anon;
REVOKE ALL ON FUNCTION public.touch_support_ticket() FROM anon;

CREATE OR REPLACE FUNCTION public.create_conversation(p_kind text,p_title text,p_description text DEFAULT '',p_is_public boolean DEFAULT false,p_username text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE v_user uuid:=auth.uid(); v_id uuid; v_kind text:=lower(trim(coalesce(p_kind,''))); v_title text:=trim(coalesce(p_title,'')); v_description text:=trim(coalesce(p_description,'')); v_username text:=nullif(lower(trim(coalesce(p_username,''))),''); v_public boolean:=coalesce(p_is_public,false); v_invite text;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
 IF v_kind NOT IN ('group','channel') THEN RAISE EXCEPTION 'invalid_conversation_kind'; END IF;
 IF length(v_title)<1 OR length(v_title)>128 THEN RAISE EXCEPTION 'invalid_title'; END IF;
 IF length(v_description)>1000 THEN RAISE EXCEPTION 'invalid_description'; END IF;
 IF v_kind='channel' THEN
   IF v_public AND v_username IS NULL THEN RAISE EXCEPTION 'username_required_for_public_channel'; END IF;
   IF v_username IS NOT NULL AND v_username !~ '^[a-z0-9_]{3,32}$' THEN RAISE EXCEPTION 'invalid_channel_username'; END IF;
   IF v_username IS NOT NULL AND (EXISTS(SELECT 1 FROM public.conversations c WHERE c.is_channel=true AND lower(c.channel_username)=v_username) OR EXISTS(SELECT 1 FROM public.channels c WHERE lower(c.username)=v_username)) THEN RAISE EXCEPTION 'channel_username_exists'; END IF;
 ELSE
   IF v_username IS NOT NULL THEN RAISE EXCEPTION 'invalid_group_username'; END IF;
 END IF;
 v_invite:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 INSERT INTO public.conversations(type,title,created_by,is_channel,description,channel_username,is_public,discoverable,badge,invite_token) VALUES('group',v_title,v_user,v_kind='channel',v_description,v_username,v_public,v_public,'none',CASE WHEN v_public THEN NULL ELSE v_invite END) RETURNING id INTO v_id;
 INSERT INTO public.conversation_members(conversation_id,user_id,role,left_at) VALUES(v_id,v_user,'owner',NULL);
 IF v_kind='channel' THEN
   INSERT INTO public.channels(id,owner_id,title,username,description,is_public,badge,invite_token) VALUES(v_id,v_user,v_title,v_username,v_description,v_public,'none',CASE WHEN v_public THEN NULL ELSE v_invite END);
   INSERT INTO public.channel_members(channel_id,user_id,role) VALUES(v_id,v_user,'owner');
 END IF;
 RETURN v_id;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'channel_username_exists';
END; $$;
REVOKE ALL ON FUNCTION public.create_conversation(text,text,text,boolean,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.create_conversation(text,text,text,boolean,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_conversation(p_conversation_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE me uuid:=auth.uid();
BEGIN
 IF me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.conversations c WHERE c.id=p_conversation_id AND c.is_public=true AND c.discoverable=true AND c.type='group') THEN RAISE EXCEPTION 'public_conversation_not_found'; END IF;
 INSERT INTO public.conversation_members(conversation_id,user_id,role,left_at) VALUES(p_conversation_id,me,'member',NULL) ON CONFLICT(conversation_id,user_id) DO UPDATE SET left_at=NULL;
 IF EXISTS(SELECT 1 FROM public.conversations WHERE id=p_conversation_id AND is_channel=true) THEN INSERT INTO public.channel_members(channel_id,user_id,role) VALUES(p_conversation_id,me,'member') ON CONFLICT(channel_id,user_id) DO NOTHING; END IF;
 RETURN p_conversation_id;
END; $$;
REVOKE ALL ON FUNCTION public.join_conversation(uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.join_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.join_via_invite(invite_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$
DECLARE me uuid:=auth.uid(); cid uuid; v_channel boolean;
BEGIN
 IF me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
 IF length(trim(coalesce(invite_code,'')))<32 OR length(trim(invite_code))>128 THEN RAISE EXCEPTION 'invalid_invite'; END IF;
 SELECT id,is_channel INTO cid,v_channel FROM public.conversations WHERE is_public=false AND invite_token=trim(invite_code) LIMIT 1;
 IF cid IS NULL THEN RAISE EXCEPTION 'invalid_invite'; END IF;
 INSERT INTO public.conversation_members(conversation_id,user_id,role,left_at) VALUES(cid,me,'member',NULL) ON CONFLICT(conversation_id,user_id) DO UPDATE SET left_at=NULL;
 IF coalesce(v_channel,false) THEN INSERT INTO public.channel_members(channel_id,user_id,role) VALUES(cid,me,'member') ON CONFLICT(channel_id,user_id) DO NOTHING; END IF;
 RETURN cid;
END; $$;
REVOKE ALL ON FUNCTION public.join_via_invite(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.join_via_invite(text) TO authenticated;

REVOKE ALL ON FUNCTION public.create_group_conversation(text,text,boolean) FROM anon;
REVOKE ALL ON FUNCTION public.create_channel_conversation(text,text,text,boolean) FROM anon;
REVOKE ALL ON FUNCTION public.join_public_channel(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.join_public_conversation(uuid) FROM anon;
CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON public.conversations(created_by);
CREATE INDEX IF NOT EXISTS messages_deleted_by_idx ON public.messages(deleted_by);
CREATE INDEX IF NOT EXISTS support_chat_messages_sender_idx ON public.support_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS support_ticket_messages_sender_idx ON public.support_ticket_messages(sender_id);
