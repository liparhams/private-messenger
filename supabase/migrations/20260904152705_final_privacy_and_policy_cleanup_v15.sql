-- UTINOCHATV1 final privacy/policy cleanup
CREATE OR REPLACE FUNCTION public.get_registration_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO ''
AS $function$
  SELECT coalesce(((SELECT s.value FROM public.app_settings AS s WHERE s.key = 'registration_enabled') = 'true'::jsonb), false);
$function$;

DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE(id uuid, username text, display_name text, public_id text, is_verified boolean, verification text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT p.id, p.username, p.display_name, p.public_id, p.is_verified, p.verification
  FROM public.profiles AS p
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND p.id = ANY(coalesce(p_user_ids, '{}'::uuid[]))
  ORDER BY lower(p.username);
$function$;
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

DROP POLICY IF EXISTS support_chats_update_staff ON public.support_chats;
DROP POLICY IF EXISTS support_tickets_update_staff ON public.support_tickets;
