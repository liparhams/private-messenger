# Admin / identity / support additions

Run `supabase/admin.sql`, then `supabase/identity.sql`, then `supabase/tickets.sql` in Supabase SQL Editor.

The public contact identifier is `m_XXXXXXXXXX` and is separate from the username. Usernames remain unique and searchable.

Important: password reset, user deletion/creation and other Auth admin operations must be implemented in a server-side Supabase Edge Function using a secret key. Never place a service-role/secret key in the browser.
