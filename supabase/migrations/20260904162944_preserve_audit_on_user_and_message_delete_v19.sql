-- Preserve audit rows when target records are deleted.
ALTER TABLE public.admin_logs
  DROP CONSTRAINT IF EXISTS admin_logs_target_user_id_fkey,
  DROP CONSTRAINT IF EXISTS admin_logs_target_message_id_fkey;
ALTER TABLE public.admin_logs
  ADD CONSTRAINT admin_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT admin_logs_target_message_id_fkey FOREIGN KEY (target_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_deleted_by_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
