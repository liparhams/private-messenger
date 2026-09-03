# Messenger

A lightweight bilingual messaging platform built with Next.js, Supabase and Cloudflare Workers.

## Stack

- Next.js 15.5.25
- React 19
- Supabase Auth, Postgres, Realtime and Storage
- OpenNext for Cloudflare Workers

## Supabase setup

Run `supabase/schema.sql` once in the Supabase SQL Editor.

For username/password accounts using the internal `@messenger.local` address, disable Supabase Auth email confirmation. No real email is collected by this application.

The SQL migration creates:

- `profiles`
- `messages`
- RLS policies for authenticated users
- automatic profile creation from Auth metadata
- Realtime publication for `messages`
- a private `chat-files` Storage bucket
- Storage RLS for sender/receiver access

## Cloudflare Workers Builds

The project intentionally does not require Supabase variables in Cloudflare Variables & Secrets. The browser uses the Supabase **publishable** key, which is designed to be public. Security comes from Supabase Auth and RLS. Never place a Supabase secret/service-role key in this repository or browser code.

Recommended Workers Builds configuration:

- Production branch: `main`
- Build command: `npm run build` or `bun run build`
- Deploy command: `npm run deploy` or `bun run deploy`
- Root directory: repository root

Do not use the old interactive automatic Next.js migration command. This repository already contains `wrangler.jsonc` and an OpenNext configuration.

## Local commands

```bash
npm install
npm run build
npm run deploy
```

## Security notes

The public Supabase publishable key is not a secret. Do not replace it with a secret key. The database and Storage RLS policies are the security boundary.

Files are stored in a private bucket and the client requests time-limited signed URLs instead of public file URLs.

Messages are not end-to-end encrypted. This project provides authenticated, RLS-protected messaging, not E2EE.
