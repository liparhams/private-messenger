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
