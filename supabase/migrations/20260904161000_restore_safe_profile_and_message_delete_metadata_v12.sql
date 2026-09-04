begin;
create or replace function public.get_public_profiles(p_user_ids uuid[])
returns table(id uuid,username text,display_name text,public_id text,is_verified boolean,verification text,role text)
language sql stable security definer set search_path = ''
as $$ select p.id,p.username,p.display_name,p.public_id,p.is_verified,p.verification,p.role from public.profiles p where (select auth.uid()) is not null and p.id = any(coalesce(p_user_ids,'{}'::uuid[])) order by lower(p.username); $$;
revoke execute on function public.get_public_profiles(uuid[]) from public, anon;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
create or replace function public.update_my_display_name(new_display_name text)
returns boolean language plpgsql security definer set search_path = ''
as $$ declare me uuid := (select auth.uid()); v_name text := trim(coalesce(new_display_name,'')); begin if me is null then raise exception 'not_authenticated'; end if; if length(v_name)<1 or length(v_name)>80 then raise exception 'invalid_display_name'; end if; update public.profiles set display_name=v_name where id=me; if not found then raise exception 'profile_not_found'; end if; return true; end; $$;
revoke execute on function public.update_my_display_name(text) from public, anon;
grant execute on function public.update_my_display_name(text) to authenticated;
create or replace function public.delete_message(message_uuid uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$ declare m public.messages%rowtype; begin select * into m from public.messages where id=message_uuid for update; if not found then raise exception 'message_not_found'; end if; if m.sender_id<>(select auth.uid()) and not private.is_admin() then raise exception 'permission_denied'; end if; update public.messages set content=null,file_url=null,file_name=null,file_type=null,message_type='text',deleted_at=coalesce(deleted_at,now()),deleted_by=(select auth.uid()),edited_at=null where id=message_uuid; return true; end; $$;
revoke execute on function public.delete_message(uuid) from public, anon;
grant execute on function public.delete_message(uuid) to authenticated;
commit;
