-- Compatibility layer. Legacy RPC names remain temporarily callable so the current UI does not break, but all logic now lives in the canonical contract.
CREATE OR REPLACE FUNCTION public.create_group_conversation(group_title text, group_description text, group_public boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$ BEGIN RETURN public.create_conversation('group',group_title,group_description,group_public,NULL); END; $$;
REVOKE ALL ON FUNCTION public.create_group_conversation(text,text,boolean) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.create_group_conversation(text,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.create_channel_conversation(channel_title text, channel_description text, channel_username text, channel_public boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$ BEGIN RETURN public.create_conversation('channel',channel_title,channel_description,channel_public,channel_username); END; $$;
REVOKE ALL ON FUNCTION public.create_channel_conversation(text,text,text,boolean) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.create_channel_conversation(text,text,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.join_public_conversation(conversation_id_input uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$ BEGIN RETURN public.join_conversation(conversation_id_input); END; $$;
REVOKE ALL ON FUNCTION public.join_public_conversation(uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.join_public_conversation(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.join_public_channel(channel_uuid uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,private AS $$ BEGIN RETURN public.join_conversation(channel_uuid); END; $$;
REVOKE ALL ON FUNCTION public.join_public_channel(uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.join_public_channel(uuid) TO authenticated;
