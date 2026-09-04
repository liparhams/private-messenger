ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT ''
  CHECK (char_length(bio) <= 160);

CREATE OR REPLACE FUNCTION public.update_my_profile(new_display_name text, new_bio text)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result public.profiles;
  clean_name text := btrim(coalesce(new_display_name, ''));
  clean_bio text := btrim(coalesce(new_bio, ''));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF char_length(clean_name) < 1 OR char_length(clean_name) > 80 THEN RAISE EXCEPTION 'invalid_display_name'; END IF;
  IF char_length(clean_bio) > 160 THEN RAISE EXCEPTION 'invalid_bio'; END IF;

  UPDATE public.profiles
  SET display_name = clean_name, bio = clean_bio
  WHERE id = auth.uid()
  RETURNING * INTO result;

  IF result.id IS NULL THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_profile(text,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text,text) TO authenticated;

DROP FUNCTION IF EXISTS public.get_my_profile();
CREATE FUNCTION public.get_my_profile()
RETURNS TABLE(id uuid, username text, display_name text, bio text, public_id text, role text, is_verified boolean, verification text, is_banned boolean, banned_until timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT p.id,p.username,p.display_name,p.bio,p.public_id,p.role,p.is_verified,p.verification,p.is_banned,p.banned_until
  FROM public.profiles p WHERE p.id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE(id uuid, username text, display_name text, bio text, public_id text, is_verified boolean, verification text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT p.id,p.username,p.display_name,p.bio,p.public_id,p.is_verified,p.verification
  FROM public.profiles p
  WHERE (SELECT auth.uid()) IS NOT NULL AND p.id = ANY(coalesce(p_user_ids, '{}'::uuid[]))
  ORDER BY lower(p.username);
$$;
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

DROP FUNCTION IF EXISTS public.search_user_directory(text, integer);
CREATE FUNCTION public.search_user_directory(search_text text DEFAULT '', result_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, username text, display_name text, bio text, public_id text, is_verified boolean, verification text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id,p.username,p.display_name,p.bio,p.public_id,p.is_verified,p.verification
  FROM public.profiles p
  WHERE p.id <> auth.uid() AND auth.uid() IS NOT NULL
    AND (trim(coalesce(search_text,'')) = '' OR lower(p.username) like '%'||lower(trim(search_text))||'%' OR lower(p.display_name) like '%'||lower(trim(search_text))||'%' OR lower(p.public_id) like '%'||lower(trim(search_text))||'%')
  ORDER BY lower(p.username)
  LIMIT least(greatest(coalesce(result_limit,20),1),50);
$$;
REVOKE ALL ON FUNCTION public.search_user_directory(text,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_user_directory(text,integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_user_directory(text,integer) TO authenticated;
