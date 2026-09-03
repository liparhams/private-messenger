-- Production hardening applied to the live Messenger project.
-- Safe to re-run.

alter table public.profiles alter column contact_type drop not null;
alter table public.profiles drop constraint if exists profiles_contact_type_check;
alter table public.profiles add constraint profiles_contact_type_check check (contact_type is null or contact_type = any (array['telegram','instagram','email','phone','other']));
update public.profiles set public_id = 'm_' || lower(substr(replace(gen_random_uuid()::text,'-',''),1,10)) where public_id is null;
alter table public.profiles alter column public_id set not null;

drop policy if exists messages_update_participants on public.messages;

drop function if exists public.redeem_invite(text,text,text,text,text);
drop table if exists public.tokens;
drop table if exists public.users;
drop table if exists public.invites;

drop policy if exists chat_files_delete on storage.objects;
drop policy if exists chat_files_delete_own on storage.objects;
drop policy if exists chat_files_delete_owner on storage.objects;
drop policy if exists chat_files_insert on storage.objects;
drop policy if exists chat_files_insert_own_folder on storage.objects;
drop policy if exists chat_files_select on storage.objects;
drop policy if exists chat_files_select_allowed on storage.objects;
drop policy if exists chat_files_update on storage.objects;
drop policy if exists chat_files_update_owner on storage.objects;
create policy chat_files_insert_own_folder on storage.objects for insert to authenticated with check (bucket_id = 'chat-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy chat_files_select_allowed on storage.objects for select to authenticated using (bucket_id = 'chat-files' and (owner_id = auth.uid()::text or exists (select 1 from public.messages m where m.message_type = 'file' and m.content = storage.objects.name and (m.sender_id = auth.uid() or m.receiver_id = auth.uid()))));
create policy chat_files_delete_owner on storage.objects for delete to authenticated using (bucket_id = 'chat-files' and owner_id = auth.uid()::text);
create policy chat_files_update_owner on storage.objects for update to authenticated using (bucket_id = 'chat-files' and owner_id = auth.uid()::text) with check (bucket_id = 'chat-files' and owner_id = auth.uid()::text);
