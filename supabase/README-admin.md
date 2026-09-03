# Admin setup

1. Run `schema.sql` in Supabase SQL Editor.
2. Run `admin.sql` in Supabase SQL Editor.
3. The existing profile whose username is `parham` becomes `role = 'admin'`.
4. Sign in as `parham`, then open `/admin`.

Important: passwords are never stored in `public.profiles` or `admin_logs`. Full account creation/deletion/password reset requires a server-side Supabase Edge Function with the secret key; never put that key in the browser.
