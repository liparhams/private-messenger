drop function if exists public.create_group_conversation(text,text,boolean);
drop function if exists public.create_channel_conversation(text,text,text,boolean);
drop function if exists public.join_public_channel(uuid);
drop function if exists public.join_public_conversation(uuid);
drop function if exists public.join_channel_by_invite(text);
drop function if exists public.join_group_by_invite(text);
