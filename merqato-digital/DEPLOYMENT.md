# Merqato.Digital website source

This archive is the editable source for the Merqato.Digital website and universal client template.

## Run locally

- Use Node.js 22.13 or newer.
- Run `npm ci`, then `npm run dev`.
- Set `DATABASE_URL` to the pooled connection string for the intended Neon branch. Never commit a real `.env` file.
- Run `neon-migrations/001_portfolio.sql` once on a fresh Neon branch to create the portfolio table.

The portfolio, site settings, admin users and sessions, and media metadata use Neon Postgres. Media files use Neon Object Storage through the S3 API. Configure the five variables in `.env.example` as secrets for your deployment. `neon.ts` defines Neon Auth, buckets, and a sample Function; `hello.ts` is the Function source. The production Neon project is `noisy-star-45302223`, branch `production`.

## GitHub and Vercel

Push the extracted source to a GitHub repository. The backend data and uploaded media now live in Neon.

**Environment configuration is now platform-agnostic.** `lib/neon-db.ts` and `lib/media-storage.ts`
read `process.env` directly, so the same source builds for Vercel and for the Cloudflare Sites
runtime (which populates `process.env` from Worker vars/secrets under `nodejs_compat`).
There are no D1 or R2 data dependencies now.

### Deploying to Vercel

1. Import the repo. Vercel detects Next.js 16 and runs `npm run build` → `next build`.
2. Set **Node.js Version** to `22.x` (the app requires `>=22.13.0`).
3. Add the secrets from `.env.example` under *Project → Settings → Environment Variables*
   (Production + Preview), including the optional `ADMIN_PASSKEY` used only for first-run owner
   bootstrap. See below for where each value comes from.
4. Redeploy. `/`, `/admin`, and all `/api/*` routes come up; no `vercel.json` is needed.

The Cloudflare/Sites build path is preserved under separate scripts: `npm run dev:sites`,
`npm run build:sites`, `npm run start:sites`.

### Environment variables

Pull all five in one step from a directory linked to the Neon project:

```bash
neon env pull --file .env.local
```

| Variable | Where it comes from | Required for |
| --- | --- | --- |
| `DATABASE_URL` | Neon Console → project `noisy-star-45302223` → branch `production` → Connection Details → **pooled** connection string (`postgresql://…-pooler.…neon.tech/…?sslmode=require`) | everything backed by Postgres |
| `AWS_ACCESS_KEY_ID` | Neon Object Storage credential → `token_id` | media upload / download |
| `AWS_SECRET_ACCESS_KEY` | Neon Object Storage credential → `s3_secret_access_key` (printed once) | media upload / download |
| `AWS_ENDPOINT_URL_S3` | Neon Object Storage branch endpoint | media upload / download |
| `AWS_REGION` | Region of the Neon project — copy the injected value, do not assume `ap-southeast-1` | media upload / download |
| `ADMIN_PASSKEY` | A one-time secret you invent yourself (no external source) | first-run owner bootstrap at `/admin` |

**The marketing site renders without any of them.** `app/page.tsx` falls back to `defaultSite`
in `lib/default-site.ts`, and every API route catches the missing-credential throw and returns a
clean `503`. So deploying with no env vars still serves the full homepage; the CMS at `/admin`,
the portfolio, and the media library are what light up once `DATABASE_URL` and the four `AWS_*`
values are present.

### First-run admin setup

The `users` table starts empty, which puts `/admin` into setup mode. Owner bootstrap is gated on
the hardcoded `ownerEmail` in `lib/server.ts` plus a temporary passkey read from the
`ADMIN_PASSKEY` environment variable. If `ADMIN_PASSKEY` is not set, the setup endpoint is
disabled (returns `503`), so you must add `ADMIN_PASSKEY` as a Vercel/Neon environment secret and
give it a long random value before running setup. Once the first owner account exists, setup is
permanently closed and you should sign in with your password, then change it under
Users & security. Remove `ADMIN_PASSKEY` from your deployment env after the first run.

The ZIP contains code and bundled static assets. It does not contain live admin accounts, uploaded media, site settings, Neon database rows, or credentials. Connect the Vercel instance to the same production branch to use the existing content, or run both SQL migrations in `neon-migrations/` on a fresh branch.

