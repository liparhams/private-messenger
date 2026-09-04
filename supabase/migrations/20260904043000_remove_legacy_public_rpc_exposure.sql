revoke all on function public.close_support_chat(uuid) from public,anon,authenticated;
revoke all on function public.join_public_community(uuid) from public,anon,authenticated;
revoke all on function public.set_conversation_badge(uuid,text) from public,anon,authenticated;
revoke all on function public.set_conversation_verification(uuid,text) from public,anon,authenticated;
revoke all on function public.add_conversation_member(uuid,uuid) from public,anon,authenticated;
revoke all on function public.create_conversation(text,text,text,boolean,text) from public,anon,authenticated;
revoke all on function public.join_conversation(uuid) from public,anon,authenticated;
revoke all on function public.touch_support_ticket() from public,anon,authenticated;
