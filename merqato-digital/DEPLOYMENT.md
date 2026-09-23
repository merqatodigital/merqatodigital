# Merqato.Digital website source

This archive is the editable source for the Merqato.Digital website and universal client template.

## Run locally

- Use Node.js 22.13 or newer.
- Run `npm ci`, then `npm run dev`.
- Set `DATABASE_URL` to the pooled connection string for the intended Neon branch. Never commit a real `.env` file.
- Run `neon-migrations/001_portfolio.sql` once on a fresh Neon branch to create the portfolio table.

The portfolio, site settings, admin users and sessions, and media metadata use Neon Postgres. Media files use Neon Object Storage through the S3 API. Configure the five variables in `.env.example` as secrets for your deployment. `neon.ts` defines Neon Auth, buckets, and a sample Function; `hello.ts` is the Function source. The production Neon project is `noisy-star-45302223`, branch `production`.

## GitHub and Vercel

Push the extracted source to a GitHub repository. The backend data and uploaded media now live in Neon. The current site build uses Vinext and the Sites Cloudflare runtime to expose environment bindings through `cloudflare:workers`; before Vercel deployment, adapt `lib/neon-db.ts` and `lib/media-storage.ts` to read `process.env`, configure the framework build for Vercel, and set the five environment variables in `.env.example` as Vercel secrets. There are no D1 or R2 data dependencies now.

The ZIP contains code and bundled static assets. It does not contain live admin accounts, uploaded media, site settings, Neon database rows, or credentials. Connect the Vercel instance to the same production branch to use the existing content, or run both SQL migrations in `neon-migrations/` on a fresh branch. Change the temporary admin passkey before public launch.
