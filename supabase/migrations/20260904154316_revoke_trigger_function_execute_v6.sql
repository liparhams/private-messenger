-- Trigger and event-trigger functions are implementation details, never application RPCs.
REVOKE EXECUTE ON FUNCTION public.touch_support_chat() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_support_chats_fn() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_support_ticket() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
