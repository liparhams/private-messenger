# Messenger

A lightweight private messaging platform built with Next.js, React, Supabase and Cloudflare Workers.

## Stack

- Next.js App Router with static export
- React
- Supabase Auth, Postgres, Realtime and private Storage
- Cloudflare Workers with Wrangler static assets
- Node.js 22

## Supabase

The live database is managed through the SQL files in `supabase/` and the applied migration history. For a fresh project, apply the SQL files in dependency order rather than running only one file:

1. `schema.sql`
2. `identity.sql`
3. `admin.sql`
4. `tickets.sql`
5. `fix-auth.sql` when username-only Auth is required
6. `hardening.sql`

Verify the resulting database with `verify.sql` and `verify-admin.sql`.

Keep **Confirm email disabled** in Supabase Authentication → Providers → Email because the application uses an internal username-based email address for Auth.

### Security model

- RLS is enabled on application tables.
- Anonymous database access is revoked for application tables.
- Users can read only messages where they are sender or receiver.
- Users can insert messages only as themselves and cannot message themselves.
- Admin operations are protected by `private.is_admin()` and admin RLS policies.
- File storage is private and protected by Storage RLS.
- File paths are stored under the authenticated user's ID.
- The `chat-files` bucket is limited to 15 MB.
- Message text is limited to 4,000 characters.
- The application does not claim end-to-end encryption. TLS/database security is not E2EE.

Use Supabase's Security Advisor and Auth security settings as an additional production check. Leaked Password Protection is a Pro-plan-and-above feature; enable it if the project plan supports it.

## Browser key and secrets

The browser uses the Supabase **publishable** key. Supabase documents publishable keys as safe to expose in browser code when RLS is correctly configured.

Never put a Supabase secret/service-role key in source code, browser code, GitHub, or Cloudflare static assets.

Cloudflare deployment credentials are stored only as GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Cloudflare

The repository is deployed as a static-export Next.js application using Wrangler:

- Worker name: `private-messenger`
- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Output directory: `out`
- Node.js: 22

`wrangler.jsonc` explicitly enables the `workers.dev` deployment URL and disables Wrangler preview URLs. The GitHub Actions workflow builds and validates the export once, uploads that exact artifact, then deploys the validated artifact. This avoids rebuilding a different artifact during deployment.

## CI checks

Every push to `main` and pull request runs:

- dependency installation
- production build
- static export validation
- required output-file checks
- Cloudflare `wrangler deploy --dry-run`
- validated build-artifact upload
- exact artifact verification before deployment
- Cloudflare deployment on `main`

## Support

The application includes in-app support and a support ticket system.

- Telegram support: `https://t.me/parhamsoleimanybot`
- Utino support: `https://utino.org/chat/supportusername`
- iParham: `https://iparham.com`
- WDNER: `https://wdner.co`
- Utino: `https://utino.org`

## Important

The public interface is login-only. Account creation is handled through support rather than public signup.

The application is designed to be protected by Supabase RLS and authenticated sessions. Do not treat the public Supabase publishable key as a secret, and do not add elevated Supabase credentials to the frontend.
