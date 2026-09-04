BEGIN;
REVOKE EXECUTE ON FUNCTION public.touch_support_chat() FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_support_chats_fn() FROM anon;
COMMIT;
