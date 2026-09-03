-- Fix for username-only signup on existing databases.
-- Contact sharing is optional.
alter table public.profiles alter column contact_type drop not null;
alter table public.profiles alter column contact_value drop not null;

create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_username text;
  new_display_name text;
  new_contact_type text;
  new_contact_value text;
begin
  new_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1))));
  new_display_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', new_username, 'User'));
  new_contact_type := nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_type', '')), '');
  new_contact_value := nullif(trim(coalesce(new.raw_user_meta_data ->> 'contact_value', '')), '');
  if new_username is null or new_username = '' then raise exception 'username_required'; end if;
  if new_username !~ '^[a-z0-9_]{3,20}$' then raise exception 'username_invalid'; end if;
  insert into public.profiles (id, username, display_name, contact_type, contact_value)
  values (new.id,new_username,left(new_display_name,80),
    case when new_contact_type in ('telegram','instagram','email','phone','other') then new_contact_type else null end,
    case when new_contact_type in ('telegram','instagram','email','phone','other') then left(new_contact_value,160) else null end)
  on conflict (id) do update set username=excluded.username,display_name=excluded.display_name,contact_type=excluded.contact_type,contact_value=excluded.contact_value;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
