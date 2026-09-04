create or replace function public.admin_regenerate_invite(conversation_uuid uuid)
returns text language plpgsql security definer set search_path=public,private as $$
declare t text;
begin
 if not private.is_admin() then raise exception 'forbidden'; end if;
 t:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 update public.conversations set invite_token=t where id=conversation_uuid and is_public=false;
 if not found then raise exception 'private_conversation_not_found'; end if;
 return t;
end; $$;

create or replace function public.admin_regenerate_channel_invite(channel_uuid uuid)
returns text language plpgsql security definer set search_path=public,private as $$
declare t text;
begin
 if not private.is_admin() then raise exception 'forbidden'; end if;
 t:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 update public.conversations set invite_token=t where id=channel_uuid and is_channel=true and is_public=false;
 if not found then raise exception 'private_channel_not_found'; end if;
 update public.channels set invite_token=t where id=channel_uuid;
 return t;
end; $$;

create or replace function public.admin_update_conversation(conversation_uuid uuid,new_title text,new_description text,new_public boolean)
returns boolean language plpgsql security definer set search_path=public,private as $$
declare t text;
begin
 if not private.is_admin() then raise exception 'forbidden'; end if;
 if length(trim(coalesce(new_title,'')))=0 or length(trim(new_title))>128 then raise exception 'invalid_title'; end if;
 if length(coalesce(new_description,''))>1000 then raise exception 'invalid_description'; end if;
 if new_public then
   update public.conversations set title=trim(new_title),description=trim(coalesce(new_description,'')),is_public=true,discoverable=true,invite_token=null where id=conversation_uuid and type='group' and coalesce(is_channel,false)=false;
 else
   t:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
   update public.conversations set title=trim(new_title),description=trim(coalesce(new_description,'')),is_public=false,discoverable=false,invite_token=t where id=conversation_uuid and type='group' and coalesce(is_channel,false)=false;
 end if;
 return found;
end; $$;

create or replace function public.set_registration_enabled(enabled boolean)
returns boolean language plpgsql security definer set search_path=public,private as $$
begin
 if not private.is_admin() then raise exception 'forbidden'; end if;
 insert into public.app_settings(key,value,updated_at) values('registration_enabled',to_jsonb(enabled),now()) on conflict(key) do update set value=excluded.value,updated_at=now();
 insert into public.admin_logs(admin_id,action,details) values(auth.uid(),'set_registration_enabled',jsonb_build_object('enabled',enabled));
 return true;
end; $$;
