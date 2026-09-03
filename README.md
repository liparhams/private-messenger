# Messenger

A lightweight messaging platform built with Next.js, React, Supabase and Cloudflare Workers.

## Stack

- Next.js App Router
- React
- Supabase Auth, Postgres, Realtime and private Storage
- Cloudflare Workers + OpenNext
- Node.js 22 for the Workers Builds environment

## Supabase setup

1. Open the Supabase project.
2. Go to **SQL Editor → New query**.
3. Copy all of `supabase/schema.sql` from this repository.
4. Paste it and click **Run**.
5. In **Authentication → Providers → Email**, keep **Confirm email disabled**. The app uses an internal username-based email address for Supabase Auth.

The SQL enables RLS, creates participant-only message policies, creates the profile trigger, enables Realtime for messages, and creates the private `chat-files` bucket with a 15 MB limit.

## Cloudflare Workers Builds

Connect the GitHub repository and use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`
- Non-production branch deploy command: leave the Cloudflare default
- Build caching: enabled

The repository includes `.nvmrc` with Node 22. Cloudflare Workers Builds currently defaults to Node 24, while version files can override the build image version. Pinning Node 22 keeps the build environment deterministic for this Next.js/OpenNext project.

Do **not** add Supabase variables to Cloudflare for this version. The browser client uses the Supabase project URL and a Supabase **publishable** key. A publishable key is designed to be exposed to browser code; RLS is what protects the data.

Never put a Supabase secret key or service-role key in `app/page.js`, GitHub, or browser code.

## Security model

- Supabase RLS protects profiles and messages.
- Users can read only messages where they are sender or receiver.
- Users can insert messages only as themselves.
- File storage is private and protected by Storage RLS.
- File paths are stored under the sender's user ID.
- Files are limited to 15 MB by the bucket configuration and the client.
- Message text is limited to 4,000 characters by the client.
- The application does not claim end-to-end encryption. Supabase/database and transport security are not the same thing as E2EE.

## Support

The application includes an in-app support panel and an error-state support action for:

- Telegram: `https://t.me/parhamsoleimanybot`
- Utino support: `https://utino.org/chat/supportusername`
- iParham: `https://iparham.com`
- WDNER: `https://wdner.co`
- Utino: `https://utino.org`

Support username: `parham`
Support display name: `Parham Soleimany`

## Deployment flow

Workers Builds runs the build command first and then the deploy command. The repository's `build` script creates the OpenNext output; `npx wrangler deploy` publishes that already-built Worker. This avoids building the application a second time during the deploy step.

## Important

If a Cloudflare build stays in **Initializing**, **Cloning**, or **Installing dependencies** for an unusually long time, that is a Workers Builds/environment problem rather than a Supabase runtime secret problem. Check the build log for the exact phase before changing application code.
